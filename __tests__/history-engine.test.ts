import { addDays, startOfDay } from "date-fns";

import { generatePortfolioHistory } from "@/app/lib/history-engine";

describe("Silnik Kalkulacji PnL (history-engine)", () => {
	it("poprawnie wylicza rozkład zysku w czasie i odrzuca wpłaty kapitału z PnL", () => {
		// Ustawiamy "dzisiaj" na północ
		const today = startOfDay(new Date());
		const tenDaysAgo = addDays(today, -10);

		const mockPortfolios = [
			{
				id: "test-portfolio",
				assets: [
					{
						id: "asset-1",
						category: "DEVELOPED",
						investedCapital: 1000,
						currentValue: 1100, // Zysk całkowity: 100 PLN. Przez 10 dni = 10 PLN dziennie.
						purchaseDate: tenDaysAgo,
					},
				],
			},
		];

		// Generujemy historię tylko na 2 dni wstecz, krok = 1 dzień
		const history = generatePortfolioHistory(mockPortfolios, 2, today);

		// Pobieramy konkretne dni z wygenerowanej historii
		const preYesterday = history.find(
			(h) => h.date.getTime() === addDays(today, -2).getTime(),
		);
		const yesterday = history.find(
			(h) => h.date.getTime() === addDays(today, -1).getTime(),
		);
		const current = history.find((h) => h.date.getTime() === today.getTime());

		// 1. TEST WYCENY LINIOWEJ:
		// Dzień 8 od zakupu: 1000 + (10 * 8) = 1080
		expect(preYesterday?.totalValue).toBe(1080);
		// Dzień 9 od zakupu: 1000 + (10 * 9) = 1090
		expect(yesterday?.totalValue).toBe(1090);
		// Dzień 10 (dzisiaj): twarda wartość rynkowa = 1100
		expect(current?.totalValue).toBe(1100);

		// 2. TEST DZIENNEJ ZMIANY (PnL):
		// Skok z 1080 na 1090 bez nowej wpłaty to czysty zysk 10 PLN
		expect(yesterday?.dailyChange).toBe(10);
	});

	it("poprawnie wylicza skumulowane odsetki dla Obligacji (BONDS)", () => {
		const today = startOfDay(new Date());
		const tenDaysAgo = addDays(today, -10);

		const mockPortfolios = [
			{
				id: "bonds-portfolio",
				assets: [
					{
						id: "bond-1",
						category: "BONDS",
						investedCapital: 10000,
						interestRate: 3.65, // 3.65% rocznie to dokładnie 0.01% (1 PLN) dziennie dla 10 000
						purchaseDate: tenDaysAgo,
					},
				],
			},
		];

		const history = generatePortfolioHistory(mockPortfolios, 1, today);
		const yesterday = history.find(
			(h) => h.date.getTime() === addDays(today, -1).getTime(),
		);

		// TEST ODSETEK:
		// Wczoraj to był 9. dzień od zakupu. 9 dni * 1 PLN/dzień = 9 PLN odsetek.
		// Łączna wartość: 10009
		expect(yesterday?.totalValue).toBe(10009);
	});

	it("poprawnie wylicza straty (spadki na giełdzie) i flaguje je jako negatywne", () => {
		const today = startOfDay(new Date());
		const tenDaysAgo = addDays(today, -10);

		const mockPortfolios = [
			{
				id: "loss-portfolio",
				assets: [
					{
						id: "asset-loss",
						category: "CRYPTO",
						investedCapital: 10000,
						currentValue: 8000, // Strata 2000 PLN w 10 dni (-200 PLN dziennie)
						purchaseDate: tenDaysAgo,
					},
				],
			},
		];

		const history = generatePortfolioHistory(mockPortfolios, 2, today);
		const yesterday = history.find(
			(h) => h.date.getTime() === addDays(today, -1).getTime(),
		);

		// Wczoraj był 9. dzień: 10000 wpłacone - (200 * 9 dni straty) = 8200
		expect(yesterday?.totalValue).toBe(8200);

		// Zmiana dzienna musi wynosić równo -200 PLN
		expect(yesterday?.dailyChange).toBe(-200);

		// Silnik musi zgłosić, że to był zły dzień (do pomalowania wykresu na czerwono)
		expect(yesterday?.isPositive).toBe(false);
	});

	it("ignoruje nowo wpłacony kapitał w wyliczeniach dziennego zysku (PnL)", () => {
		const today = startOfDay(new Date());
		const tenDaysAgo = addDays(today, -10);
		const yesterdayDate = addDays(today, -1);

		const mockPortfolios = [
			{
				id: "deposit-portfolio",
				assets: [
					{
						id: "asset-1",
						category: "DEVELOPED",
						investedCapital: 1000,
						currentValue: 1000, // Aktywo nic nie zarobiło (0 zysku)
						purchaseDate: tenDaysAgo,
					},
					{
						id: "asset-2", // Wyobraźmy sobie, że wczoraj użytkownik kupił nowe aktywo
						category: "CASH",
						investedCapital: 5000,
						currentValue: 5000, // Brak zysku
						purchaseDate: yesterdayDate,
					},
				],
			},
		];

		// Generujemy na 3 dni wstecz
		const history = generatePortfolioHistory(mockPortfolios, 3, today);
		const yesterday = history.find(
			(h) => h.date.getTime() === yesterdayDate.getTime(),
		);

		// 1. Całkowita wartość wczoraj podskoczyła do 6000 PLN (1000 ze starego + 5000 nowego)
		expect(yesterday?.totalValue).toBe(6000);

		// 2. NAJWAŻNIEJSZE: dailyChange (Zysk) dla wczoraj musi wynosić 0!
		// Silnik musi zrozumieć, że te 5000 to wpłacony kapitał z własnej kieszeni, a nie zysk z giełdy.
		expect(yesterday?.dailyChange).toBe(0);
	});
});

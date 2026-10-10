"use server";

import YahooFinance from "yahoo-finance2";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatYahooTicker } from "@/lib/market-api";
import { getLiveExchangeRate } from "../exchange-rates";
import { revalidatePath } from "next/cache";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const TICKER_MAP: Record<string, string> = {
	"SP20.NL": "IS20.DE",
	"EIMI.UK": "EIMI.L",
	"ALAG.UK": "ALAG.L",
	BTC: "BTC-USD",
};

const GLOBAL_INDICES: Record<string, string> = {
	SP500: "^GSPC",
	NASDAQ: "^IXIC",
	WIG20: "WIG20.WA",
	DAX: "^GDAXI",
	GOLD: "GC=F",
	BTC: "BTC-USD",
};

export async function refreshPortfolioPrices(portfolioId: string) {
	const session = await auth();
	if (!session?.user?.id) return { error: "Błąd autoryzacji" };

	if (!portfolioId) {
		return { error: "Nie podano ID portfela do aktualizacji." };
	}

	const role = session.user.role;

	try {
		// 1. Pobieramy portfel wraz z aktywami
		const portfolio = await db.portfolio.findUnique({
			where: { id: portfolioId },
			include: { assets: true },
		});

		if (!portfolio) return { error: "Portfel nie istnieje" };

		// 2. WERYFIKACJA LIMITU 6H DLA DARMOWYCH KONT
		if (role === "REGULAR" && portfolio.lastRefreshedAt) {
			const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
			if (portfolio.lastRefreshedAt > sixHoursAgo) {
				return {
					error:
						"Wykorzystano limit. Następna darmowa aktualizacja za kilka godzin.",
				};
			}
		}

		// 3. Zbieramy tylko te aktywa, które mają ticker i NIE są gotówką/obligacjami
		const updatableAssets = portfolio.assets.filter(
			(a) =>
				a.ticker &&
				a.ticker !== "CASH" &&
				a.category !== "BONDS" &&
				a.category !== "CASH",
		);

		let updatedCount = 0;

		// 4. Jeśli są aktywa do zaktualizowania, robimy zoptymalizowane zapytanie
		if (updatableAssets.length > 0) {
			const symbolsToFetch = updatableAssets.map((asset) => {
				const baseTicker = asset.ticker!.split("_")[0];
				return formatYahooTicker(TICKER_MAP[baseTicker] || baseTicker);
			});

			// Zapytanie paczkowe do Yahoo
			const results = await yahooFinance.quote(
				symbolsToFetch,
				{},
				{ validateResult: false },
			);
			const quotesArray = Array.isArray(results) ? results : [results];

			// Przetwarzanie i zapis wyników do bazy
			for (const asset of updatableAssets) {
				const baseTicker = asset.ticker!.split("_")[0];
				const searchSymbol = formatYahooTicker(
					TICKER_MAP[baseTicker] || baseTicker,
				);

				const quote = quotesArray.find((q) => q && q.symbol === searchSymbol);
				if (!quote || quote.regularMarketPrice == null) continue;

				const rawPrice = quote.regularMarketPrice as number;
				const currency = quote.currency || "PLN";
				let priceInPLN = rawPrice;

				if (currency !== "PLN") {
					const searchCurrency = currency === "GBp" ? "GBP" : currency;
					const fxData = await getLiveExchangeRate(searchCurrency);
					if (fxData) {
						const multiplier = currency === "GBp" ? 0.01 : 1;
						priceInPLN = rawPrice * multiplier * fxData.value;
					}
				}

				await db.asset.update({
					where: { id: asset.id },
					data: {
						currentValue: priceInPLN * asset.quantity,
						dailyChange: quote.regularMarketChangePercent || 0,
						name: quote.longName || quote.shortName || asset.name,
						updatedAt: new Date(),
					},
				});
				updatedCount++;
			}
		}

		// 5. Zapisujemy czas odświeżenia portfela
		await db.portfolio.update({
			where: { id: portfolioId },
			data: { lastRefreshedAt: new Date() },
		});

		// === 6. Pobieranie i zapis indeksów globalnych (Twoja zoptymalizowana logika) ===
		try {
			const indexSymbols = Object.values(GLOBAL_INDICES);
			const indexResult = await yahooFinance.quote(
				indexSymbols,
				{},
				{ validateResult: false },
			);
			const indexQuotes = Array.isArray(indexResult)
				? indexResult
				: [indexResult];

			for (const q of indexQuotes) {
				if (q && q.symbol) {
					const originalId = Object.keys(GLOBAL_INDICES).find(
						(key) => GLOBAL_INDICES[key] === q.symbol,
					);

					if (originalId) {
						const marketName = q.longName || q.shortName || originalId;

						await db.marketIndex.upsert({
							where: { symbol: originalId },
							update: {
								price: q.regularMarketPrice || 0,
								dailyChange: q.regularMarketChangePercent || 0,
								updatedAt: new Date(),
							},
							create: {
								symbol: originalId,
								name: marketName,
								price: q.regularMarketPrice || 0,
								dailyChange: q.regularMarketChangePercent || 0,
							},
						});
					}
				}
			}
			console.log("✅ Pomyślnie zaktualizowano indeksy globalne.");
		} catch (error) {
			console.error("❌ Błąd aktualizacji indeksów globalnych:", error);
		}

		revalidatePath("/dashboard");

		if (updatedCount > 0) {
			return { success: `Zaktualizowano ${updatedCount} pozycji rynkowych!` };
		} else {
			return {
				success: `Zaktualizowano indeksy (brak aktywów na giełdzie do odświeżenia).`,
			};
		}
	} catch (error) {
		console.error("Błąd ogólny refreshPrices:", error);
		return { error: "Wystąpił problem z połączeniem do serwera Yahoo." };
	}
}

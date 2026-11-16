import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
	suppressNotices: ["ripHistorical"],
});

// 🚀 Używamy GC=F (Gold Futures) jako głównego źródła dla ceny uncji, z fallbackiem na GLD
const GOLD_INDEX = { id: "GOLD", tickers: ["GC=F", "GLD"] };

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
	console.log("🧹 Czyszczenie starej i wadliwej historii dla złota...");

	// 1. Usuwamy błędne wpisy dla GOLD
	await prisma.indexHistory.deleteMany({
		where: { symbol: "GOLD" },
	});

	const startDate = "2020-01-01";
	// Pobieramy dane do wczoraj lub bezpieczniej: odfiltrowujemy dzisiejszą niepełną sesję
	const endDate = new Date().toISOString().split("T")[0];

	console.log(
		`🌐 Pobieranie stabilnych danych dla złota od ${startDate} do ${endDate}...`,
	);

	let fetchedRecords: { symbol: string; date: Date; closePrice: number }[] = [];

	for (const ticker of GOLD_INDEX.tickers) {
		try {
			console.log(`Próba pobierania: ${GOLD_INDEX.id} (ticker: ${ticker})...`);

			const result = await yahooFinance.chart(ticker, {
				period1: startDate,
				period2: endDate,
				interval: "1d",
			});

			if (result && result.quotes && result.quotes.length > 0) {
				const rawQuotes = result.quotes.filter(
					(q) => q.close != null && q.close > 0,
				);

				let lastValidPrice = 0;
				const cleanedQuotes = [];

				for (const quote of rawQuotes) {
					const currentPrice = quote.close!;
					const quoteDate = new Date(quote.date);

					// 🚀 Zabezpieczenie przed anomaliami (bad tick / spadek o więcej niż 30% w 1 dzień)
					if (lastValidPrice > 0) {
						const changeRatio =
							Math.abs(currentPrice - lastValidPrice) / lastValidPrice;
						if (changeRatio > 0.3) {
							console.warn(
								`⚠️ Odrzucono anomalny punkt cenowy dla ${quoteDate.toISOString().split("T")[0]}: ${currentPrice} (poprzednia: ${lastValidPrice})`,
							);
							continue; // Pomijamy ten punkt
						}
					}

					// Odrzucamy dzisiejszą niekompletną świecę, jeśli ma wartość 0 lub drastycznie odbiega
					const todayStr = new Date().toISOString().split("T")[0];
					const quoteDateStr = quoteDate.toISOString().split("T")[0];
					if (
						quoteDateStr === todayStr &&
						currentPrice < lastValidPrice * 0.7
					) {
						console.warn(
							`⚠️ Pominięto niepełną/błędną świecę z dzisiejszego dnia.`,
						);
						continue;
					}

					lastValidPrice = currentPrice;
					cleanedQuotes.push({
						symbol: GOLD_INDEX.id,
						date: quoteDate,
						closePrice: currentPrice,
					});
				}

				if (cleanedQuotes.length > 0) {
					fetchedRecords = cleanedQuotes;
					console.log(
						`✅ Pobrano i oczyszczono ${fetchedRecords.length} dni dla ${GOLD_INDEX.id} (${ticker}).`,
					);
					break;
				}
			}
		} catch (error) {
			console.warn(
				`⚠️ Ticker ${ticker} nie zwrócił poprawnych danych, próbuję kolejny...`,
			);
		}
		await sleep(500);
	}

	if (fetchedRecords.length > 0) {
		// Zapis oczyszczonej historii do bazy
		await prisma.indexHistory.createMany({
			data: fetchedRecords,
			skipDuplicates: true,
		});

		// Aktualizacja bieżącej ceny w tabeli MarketIndex
		const latestRecord = fetchedRecords[fetchedRecords.length - 1];
		if (latestRecord) {
			await prisma.marketIndex.updateMany({
				where: { symbol: "GOLD" },
				data: {
					price: latestRecord.closePrice,
					updatedAt: new Date(),
				},
			});
			console.log(
				`🔄 Zaktualizowano bieżącą cenę GOLD w MarketIndex na: ${latestRecord.closePrice}`,
			);
		}

		console.log(
			`💾 Zapisano pomyślnie ${fetchedRecords.length} rekordów w bazie.`,
		);
	} else {
		console.error(`❌ Nie udało się pobrać danych dla ${GOLD_INDEX.id}.`);
	}
}

main()
	.catch((e) => {
		console.error("Krytyczny Błąd Skryptu:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

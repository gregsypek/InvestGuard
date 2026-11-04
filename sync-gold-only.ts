import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
	suppressNotices: ["ripHistorical"],
});

// 🚀 Definiujemy TYLKO złoto, używając stabilnego ETF-u (GLD)
const GOLD_INDEX = { id: "GOLD", tickers: ["GLD"] };

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
	console.log("🧹 Czyszczenie starej (i błędnej) historii TYLKO dla złota...");

	// 🚀 Zabezpieczenie: Usuwamy tylko wpisy, gdzie symbol to "GOLD"
	await prisma.indexHistory.deleteMany({
		where: { symbol: "GOLD" },
	});

	const startDate = "2020-01-01";
	const endDate = new Date().toISOString().split("T")[0];

	console.log(
		`🌐 Pobieranie stabilnych danych dla złota (GLD) od ${startDate} do ${endDate}...`,
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
				fetchedRecords = result.quotes
					.filter((q) => q.close != null)
					.map((quote) => ({
						symbol: GOLD_INDEX.id,
						date: new Date(quote.date),
						closePrice: quote.close!,
					}));

				console.log(
					`✅ Pobrano ${fetchedRecords.length} dni dla ${GOLD_INDEX.id} (${ticker}).`,
				);
				break;
			}
		} catch (error) {
			console.warn(
				`⚠️ Ticker ${ticker} nie zwrócił danych dla ${GOLD_INDEX.id}, próbuję kolejny...`,
			);
		}
		await sleep(500);
	}

	if (fetchedRecords.length > 0) {
		// Zapis historii do bazy
		await prisma.indexHistory.createMany({
			data: fetchedRecords,
			skipDuplicates: true,
		});

		// 🚀 Opcjonalnie: Aktualizujemy też główną tabelę MarketIndex,
		// żeby najnowsza cena nie wisiała jako "38 USD"
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
			`💾 Zapisano ${fetchedRecords.length} rekordów w bazie dla ${GOLD_INDEX.id}.`,
		);
	} else {
		console.error(`❌ Nie udało się pobrać danych dla ${GOLD_INDEX.id}.`);
	}

	console.log("🎉 Sukces! Prawidłowa historia złota jest już w bazie.");
}

main()
	.catch((e) => {
		console.error("Krytyczny Błąd Skryptu:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

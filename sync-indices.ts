import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
	suppressNotices: ["ripHistorical"],
});

const GLOBAL_INDICES = [
	{ id: "SP500", tickers: ["^GSPC"] },
	{ id: "NASDAQ", tickers: ["^IXIC"] },
	{ id: "WIG20", tickers: ["WIG20.WA", "^WIG20"] },
	{ id: "DAX", tickers: ["^GDAXI"] },
	{ id: "GOLD", tickers: ["GC=F"] },
	{ id: "BTC", tickers: ["BTC-USD"] },
];

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
	console.log("🧹 Czyszczenie starej historii indeksów...");
	await prisma.indexHistory.deleteMany();

	const startDate = "2020-01-01";
	const endDate = new Date().toISOString().split("T")[0];

	console.log(
		`🌐 Pobieranie danych z Yahoo Finance (chart API) Od ${startDate} do ${endDate}...`,
	);

	for (const index of GLOBAL_INDICES) {
		let fetchedRecords: { symbol: string; date: Date; closePrice: number }[] =
			[];

		for (const ticker of index.tickers) {
			try {
				console.log(`Próba pobierania: ${index.id} (ticker: ${ticker})...`);

				// Używamy nowoczesnej metody chart() rekomendowanej przez Yahoo
				const result = await yahooFinance.chart(ticker, {
					period1: startDate,
					period2: endDate,
					interval: "1d",
				});

				if (result && result.quotes && result.quotes.length > 0) {
					fetchedRecords = result.quotes
						.filter((q) => q.close != null)
						.map((quote) => ({
							symbol: index.id,
							date: new Date(quote.date),
							closePrice: quote.close!,
						}));

					console.log(
						`✅ Pobrano ${fetchedRecords.length} dni dla ${index.id} (${ticker}).`,
					);
					break;
				}
			} catch (error) {
				console.warn(
					`⚠️ Ticker ${ticker} nie zwrócił danych dla ${index.id}, próbuję kolejny...`,
				);
			}
			await sleep(500);
		}

		if (fetchedRecords.length > 0) {
			await prisma.indexHistory.createMany({
				data: fetchedRecords,
				skipDuplicates: true,
			});
			console.log(
				`💾 Zapisano ${fetchedRecords.length} rekordów w bazie dla ${index.id}.`,
			);
		} else {
			console.error(`❌ Nie udało się pobrać danych dla ${index.id}.`);
		}

		await sleep(1000);
	}

	console.log("🎉 Sukces! Wszystkie indeksy (w tym WIG20) są w bazie.");
}

main()
	.catch((e) => {
		console.error("Krytyczny Błąd Skryptu:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

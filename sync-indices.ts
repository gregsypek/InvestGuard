import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
	suppressNotices: ["ripHistorical"],
});

const GLOBAL_INDICES = [
	{ id: "SP500", name: "S&P 500", tickers: ["^GSPC"] },
	{ id: "NASDAQ", name: "NASDAQ 100", tickers: ["^IXIC"] },
	{ id: "WIG20", name: "WIG20", tickers: ["STOOQ:wig20", "EPOL"] },
	{ id: "DAX", name: "DAX", tickers: ["^GDAXI"] },
	{ id: "GOLD", name: "Złoto (GC=F)", tickers: ["GC=F", "GLD"] },
	{ id: "BTC", name: "Bitcoin", tickers: ["BTC-USD"] },
];

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch full daily history from Stooq CSV with browser headers (used for Polish indices like WIG20)
async function fetchFromStooq(
	stooqSymbol: string,
	indexId: string,
	startDate: string,
	endDate: string,
) {
	const urls = [
		`https://stooq.pl/q/d/l/?s=${stooqSymbol}&i=d`,
		`https://stooq.com/q/d/l/?s=${stooqSymbol}&i=d`,
	];

	for (const url of urls) {
		try {
			const res = await fetch(url, {
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
					Accept: "text/csv,text/plain,*/*",
					Referer: "https://stooq.pl/",
				},
			});

			if (!res.ok) continue;

			const csvText = await res.text();
			const lines = csvText.trim().split("\n");

			// Guard against Stooq rate-limit message or HTML response
			if (
				lines.length <= 2 ||
				(!lines[0].toLowerCase().includes("data") &&
					!lines[0].toLowerCase().includes("date"))
			) {
				console.warn(
					`⚠️ Stooq zwrócił nieoczekiwaną odpowiedź (${url}): ${lines[0]?.slice(0, 80)}`,
				);
				continue;
			}

			const records: { symbol: string; date: Date; closePrice: number }[] = [];
			for (let i = 1; i < lines.length; i++) {
				const cols = lines[i].split(",");
				if (cols.length < 5) continue;
				const dateStr = cols[0].trim();
				if (dateStr < startDate || dateStr > endDate) continue;

				const close = parseFloat(cols[4]);
				if (!isNaN(close) && close > 0) {
					records.push({
						symbol: indexId,
						date: new Date(`${dateStr}T00:00:00.000Z`),
						closePrice: close,
					});
				}
			}

			if (records.length > 10) {
				return records;
			}
		} catch {
			// Try next Stooq mirror
		}
	}

	return [];
}

async function main() {
	const defaultStartDate = "2020-01-01";
	const today = new Date();
	const endDate = today.toISOString().split("T")[0];
	const todayStr = endDate;

	console.log(`🌐 Sprawdzanie i aktualizacja indeksów (do ${endDate})...`);

	for (const index of GLOBAL_INDICES) {
		// Check existing records in DB to avoid redundant fetches and writes
		const [existingCount, latestDbRecord] = await Promise.all([
			prisma.indexHistory.count({ where: { symbol: index.id } }),
			prisma.indexHistory.findFirst({
				where: { symbol: index.id },
				orderBy: { date: "desc" },
				select: { date: true },
			}),
		]);

		const isFullBackfill = existingCount <= 50 || !latestDbRecord;
		let fetchStartDate = defaultStartDate;

		if (!isFullBackfill && latestDbRecord) {
			const diffMs = today.getTime() - latestDbRecord.date.getTime();
			const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

			// Skip completely if index already has fresh data (within last 2 days / weekend)
			if (diffDays <= 2) {
				console.log(
					`⏭️ ${index.id} jest już aktualny (${existingCount} dni, ostatni: ${latestDbRecord.date.toISOString().split("T")[0]}). Pomijam.`,
				);
				continue;
			}

			// Incremental sync starting from the last recorded date
			fetchStartDate = latestDbRecord.date.toISOString().split("T")[0];
			console.log(
				`🔄 Przyrostowa aktualizacja ${index.id} od ${fetchStartDate}...`,
			);
		} else if (existingCount > 0) {
			// Wipe incomplete history only for this specific broken symbol (e.g., WIG20 with 1 row)
			console.log(
				`🧹 Czyszczenie niepełnej historii dla ${index.id} (${existingCount} rekordów)...`,
			);
			await prisma.indexHistory.deleteMany({ where: { symbol: index.id } });
		}

		let fetchedRecords: { symbol: string; date: Date; closePrice: number }[] =
			[];
		const minRequiredRecords = isFullBackfill ? 10 : 1;

		for (const ticker of index.tickers) {
			try {
				console.log(
					`Próba pobierania: ${index.id} (źródło: ${ticker}, od ${fetchStartDate})...`,
				);

				// Handle Stooq CSV source
				if (ticker.startsWith("STOOQ:")) {
					const stooqCode = ticker.replace("STOOQ:", "");
					const stooqRecords = await fetchFromStooq(
						stooqCode,
						index.id,
						fetchStartDate,
						endDate,
					);
					if (stooqRecords.length >= minRequiredRecords) {
						fetchedRecords = stooqRecords;
						console.log(
							`✅ Pobrano ${fetchedRecords.length} dni dla ${index.id} ze Stooq.`,
						);
						break;
					}
					continue;
				}

				const result = await yahooFinance.chart(ticker, {
					period1: fetchStartDate,
					period2: endDate,
					interval: "1d",
				});

				if (result && result.quotes && result.quotes.length > 0) {
					const rawQuotes = result.quotes.filter(
						(q) => q.close != null && q.close > 0,
					);

					let lastValidPrice = 0;
					const cleanedQuotes: {
						symbol: string;
						date: Date;
						closePrice: number;
					}[] = [];

					for (const quote of rawQuotes) {
						const currentPrice = quote.close!;
						const quoteDate = new Date(quote.date);
						const quoteDateStr = quoteDate.toISOString().split("T")[0];

						// Guard against anomalous bad ticks on GOLD (>30% single-day jump)
						if (index.id === "GOLD" && lastValidPrice > 0) {
							const changeRatio =
								Math.abs(currentPrice - lastValidPrice) / lastValidPrice;
							if (changeRatio > 0.3) {
								console.warn(
									`⚠️ Odrzucono anomalny punkt cenowy dla ${index.id} (${quoteDateStr}): ${currentPrice}`,
								);
								continue;
							}

							if (
								quoteDateStr === todayStr &&
								currentPrice < lastValidPrice * 0.7
							) {
								console.warn(
									`⚠️ Pominięto niepełną dzisiejszą świecę dla ${index.id}.`,
								);
								continue;
							}
						}

						lastValidPrice = currentPrice;
						cleanedQuotes.push({
							symbol: index.id,
							date: quoteDate,
							closePrice: currentPrice,
						});
					}

					if (cleanedQuotes.length >= minRequiredRecords) {
						fetchedRecords = cleanedQuotes;
						console.log(
							`✅ Pobrano i oczyszczono ${fetchedRecords.length} dni dla ${index.id} (${ticker}).`,
						);
						break;
					}
				}
			} catch (error) {
				console.warn(
					`⚠️ Źródło ${ticker} nie zwróciło danych dla ${index.id}, próbuję kolejny...`,
				);
			}
			await sleep(500);
		}

		if (fetchedRecords.length > 0) {
			await prisma.indexHistory.createMany({
				data: fetchedRecords,
				skipDuplicates: true,
			});

			// Fetch the 2 latest candles from DB to compute accurate dailyChange
			const recentCandles = await prisma.indexHistory.findMany({
				where: { symbol: index.id },
				orderBy: { date: "desc" },
				take: 2,
				select: { closePrice: true },
			});

			const latestCandle = recentCandles[0];
			const prevCandle = recentCandles[1];

			if (latestCandle) {
				const dailyChange =
					prevCandle && prevCandle.closePrice > 0
						? Number(
								(
									((latestCandle.closePrice - prevCandle.closePrice) /
										prevCandle.closePrice) *
									100
								).toFixed(2),
							)
						: 0;

				await prisma.marketIndex.upsert({
					where: { symbol: index.id },
					update: {
						name: index.name,
						price: latestCandle.closePrice,
						dailyChange,
						updatedAt: new Date(),
					},
					create: {
						symbol: index.id,
						name: index.name,
						price: latestCandle.closePrice,
						dailyChange,
						updatedAt: new Date(),
					},
				});

				console.log(
					`💾 Zapisano ${fetchedRecords.length} rekordów w IndexHistory oraz zaktualizowano MarketIndex dla ${index.id} (${latestCandle.closePrice}, ${dailyChange}%).`,
				);
			}
		} else {
			console.error(`❌ Nie udało się pobrać danych dla ${index.id}.`);
		}

		await sleep(500);
	}

	console.log("🎉 Sukces! Synchronizacja zakończona.");
}

main()
	.catch((e) => {
		console.error("Krytyczny Błąd Skryptu:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

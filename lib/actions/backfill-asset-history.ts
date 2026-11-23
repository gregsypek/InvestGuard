"use server";

import YahooFinance from "yahoo-finance2";
import { db } from "@/lib/db";
import { formatYahooTicker } from "@/lib/market-api";
import { revalidateTag } from "next/cache";

const yf = new YahooFinance({ suppressNotices: ["ripHistorical"] });

const TICKER_MAP: Record<string, string> = {
	"SP20.NL": "IS20.DE",
	"EIMI.UK": "EIMI.L",
	"ALAG.UK": "ALAG.L",
	BTC: "BTC-USD",
	"OWL.US": "OWL",
};

export async function backfillObservedAssetHistory(
	rawTicker: string,
	assetName?: string,
) {
	if (!rawTicker || rawTicker === "CASH") return { skipped: true };

	// Skip if IndexHistory already has full historical data for this symbol
	const existingCount = await db.indexHistory.count({
		where: { symbol: rawTicker },
	});
	if (existingCount > 10) {
		return { skipped: true, count: existingCount };
	}

	const baseTicker = rawTicker.split("_")[0];
	const yahooSymbol = formatYahooTicker(TICKER_MAP[baseTicker] || baseTicker);

	const endDate = new Date();
	const startDate = new Date();
	startDate.setFullYear(endDate.getFullYear() - 2);

	try {
		const result = await yf.chart(yahooSymbol, {
			period1: startDate.toISOString().split("T")[0],
			period2: endDate.toISOString().split("T")[0],
			interval: "1d",
		});

		const quotes = (result?.quotes || []).filter(
			(q) => q.close != null && q.close > 0,
		);

		if (quotes.length === 0) {
			return { success: false, error: `Brak historii dla ${yahooSymbol}` };
		}

		const latest = quotes[quotes.length - 1];
		const prev = quotes.length > 1 ? quotes[quotes.length - 2] : null;
		const dailyChange =
			prev && prev.close
				? Number((((latest.close! - prev.close) / prev.close) * 100).toFixed(2))
				: 0;

		// Ensure parent MarketIndex row exists (foreign key requirement for IndexHistory)
		await db.marketIndex.upsert({
			where: { symbol: rawTicker },
			update: {
				price: latest.close!,
				dailyChange,
				updatedAt: new Date(),
			},
			create: {
				symbol: rawTicker,
				name: assetName || rawTicker,
				price: latest.close!,
				dailyChange,
			},
		});

		const records = quotes.map((q) => {
			const d = new Date(q.date);
			d.setUTCHours(0, 0, 0, 0);
			return {
				symbol: rawTicker,
				date: d,
				closePrice: q.close!,
			};
		});

		await db.indexHistory.createMany({
			data: records,
			skipDuplicates: true,
		});

		revalidateTag("indices", "max");

		return { success: true, count: records.length };
	} catch (error) {
		console.error(
			`[BACKFILL] Błąd pobierania historii dla ${rawTicker}:`,
			error,
		);
		return { success: false };
	}
}

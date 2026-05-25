"use server";

import YahooFinance from "yahoo-finance2";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatYahooTicker } from "@/lib/market-api";
import { getLiveExchangeRate } from "../exchange-rates";
import { revalidatePath } from "next/cache";

const yahooFinance = new YahooFinance();

// EN: Simple mapper for problematic tickers between XTB and Yahoo
// PL: Mapowanie tickerów, których Yahoo nie rozumie w formacie XTB
const TICKER_MAP: Record<string, string> = {
	"SP20.NL": "IS20.DE",
	"EIMI.UK": "EIMI.L",
	"ALAG.UK": "ALAG.L",
};
export async function refreshPortfolioPrices(portfolioId: string) {
	const session = await auth();
	if (!session?.user?.id) return { error: "Błąd autoryzacji" };

	const role = session.user.role;
	const now = new Date();
	const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	try {
		const assets = await db.asset.findMany({
			where: {
				portfolioId,
				NOT: { category: "BONDS" },
			},
		});

		let updatedCount = 0;

		for (const asset of assets) {
			if (asset.ticker === "CASH" || asset.category === "CASH") continue;

			// EN: 1. Clean ticker and 2. Map it to Yahoo-friendly symbol
			const baseTicker = asset.ticker?.split("_")[0] || "";
			const symbol = formatYahooTicker(TICKER_MAP[baseTicker] || baseTicker);

			try {
				const result = await yahooFinance.quote(
					symbol,
					{},
					{ validateResult: false },
				);
				const quote = Array.isArray(result) ? result[0] : result;

				// 🚀 CRITICAL FIX: Check if quote exists before accessing properties
				if (!quote || quote.regularMarketPrice == null) {
					console.warn(`⚠️ Yahoo Finance returned no data for: ${symbol}`);
					continue;
				}

				const rawPrice = quote.regularMarketPrice as number;
				const currency = quote.currency || "PLN";
				let priceInPLN = rawPrice;

				// EN: Handle Currency Conversion logic correctly
				if (currency !== "PLN") {
					const searchCurrency = currency === "GBp" ? "GBP" : currency;
					const fxData = await getLiveExchangeRate(searchCurrency);

					if (!fxData) {
						console.error(
							`❌ Missing FX Rate for ${searchCurrency}. Skipping ${symbol}.`,
						);
						continue;
					}

					const multiplier = currency === "GBp" ? 0.01 : 1;
					priceInPLN = rawPrice * multiplier * fxData.value;
				}

				// EN: Final Update - logging AFTER FX calculation for accuracy
				console.log(
					`✅ [${asset.ticker}] -> ${priceInPLN.toFixed(2)} PLN (Raw: ${rawPrice} ${currency})`,
				);

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
			} catch (err) {
				console.error(`❌ Error refreshing ${symbol}:`, err);
			}
		}

		revalidatePath("/dashboard");
		return { success: `Zaktualizowano ${updatedCount} pozycji rynkowych!` };
	} catch (error) {
		console.error("Błąd ogólny refreshPrices:", error);
		return { error: "Błąd serwera." };
	}
}

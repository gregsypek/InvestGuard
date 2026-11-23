"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import YahooFinance from "yahoo-finance2";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatYahooTicker } from "@/lib/market-api";
import { getLiveExchangeRate } from "../exchange-rates";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const TICKER_MAP: Record<string, string> = {
	"SP20.NL": "IS20.DE",
	"EIMI.UK": "EIMI.L",
	"ALAG.UK": "ALAG.L",
	BTC: "BTC-USD",
	"OWL.US": "OWL",
};

// Use EPOL for WIG20 and GC=F for GOLD to match IndexHistory scale
const GLOBAL_INDICES: Record<string, string> = {
	SP500: "^GSPC",
	NASDAQ: "^IXIC",
	WIG20: "EPOL",
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
		// 1. Fetch portfolio with minimal asset fields required for price refresh
		const portfolio = await db.portfolio.findUnique({
			where: { id: portfolioId },
			select: {
				id: true,
				lastRefreshedAt: true,
				assets: {
					select: {
						id: true,
						name: true,
						ticker: true,
						category: true,
						quantity: true,
					},
				},
			},
		});

		if (!portfolio) return { error: "Portfel nie istnieje" };

		// 2. Verify 6h rate limit for REGULAR accounts
		if (role === "REGULAR" && portfolio.lastRefreshedAt) {
			const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
			if (portfolio.lastRefreshedAt > sixHoursAgo) {
				return {
					error:
						"Wykorzystano limit. Następna darmowa aktualizacja za kilka godzin.",
				};
			}
		}

		// 3. Filter market-traded assets (exclude CASH and BONDS)
		const updatableAssets = portfolio.assets.filter(
			(a) =>
				a.ticker &&
				a.ticker !== "CASH" &&
				a.category !== "BONDS" &&
				a.category !== "CASH",
		);

		let updatedCount = 0;
		const dbUpdates: Promise<unknown>[] = [];

		// 4. Batch fetch quotes from Yahoo Finance
		if (updatableAssets.length > 0) {
			const symbolsToFetch = Array.from(
				new Set(
					updatableAssets.map((asset) => {
						const baseTicker = asset.ticker!.split("_")[0];
						return formatYahooTicker(TICKER_MAP[baseTicker] || baseTicker);
					}),
				),
			);

			const results = await yahooFinance.quote(
				symbolsToFetch,
				{},
				{ validateResult: false },
			);
			const quotesArray = Array.isArray(results) ? results : [results];

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

				dbUpdates.push(
					db.asset.update({
						where: { id: asset.id },
						data: {
							currentValue: priceInPLN * asset.quantity,
							dailyChange: quote.regularMarketChangePercent || 0,
							name: quote.longName || quote.shortName || asset.name,
							updatedAt: new Date(),
						},
					}),
				);
				updatedCount++;
			}
		}

		// 5. Update portfolio refresh timestamp
		dbUpdates.push(
			db.portfolio.update({
				where: { id: portfolioId },
				data: { lastRefreshedAt: new Date() },
			}),
		);

		// 6. Fetch and update global market indices
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

					if (originalId && q.regularMarketPrice) {
						const marketName = q.longName || q.shortName || originalId;

						dbUpdates.push(
							db.marketIndex.upsert({
								where: { symbol: originalId },
								update: {
									price: q.regularMarketPrice,
									dailyChange: q.regularMarketChangePercent || 0,
									updatedAt: new Date(),
								},
								create: {
									symbol: originalId,
									name: marketName,
									price: q.regularMarketPrice,
									dailyChange: q.regularMarketChangePercent || 0,
								},
							}),
						);
					}
				}
			}
		} catch (error) {
			console.error("❌ Błąd aktualizacji indeksów globalnych:", error);
		}

		await Promise.all(dbUpdates);

		revalidateTag("indices", { expire: 0 });
		revalidatePath("/");
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

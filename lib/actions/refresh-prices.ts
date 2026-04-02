// actions/refresh-prices.ts
"use server";

import YahooFinance from "yahoo-finance2";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatYahooTicker } from "@/lib/market-api";
import { revalidatePath } from "next/cache";

const yahooFinance = new YahooFinance();

export async function refreshPortfolioPrices(portfolioId: string) {
	const session = await auth();
	if (!session?.user?.id) return { error: "Błąd autoryzacji" };

	const role = session.user.role;
	const now = new Date();
	const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	// Cache na kursy walut w ramach jednego wywołania
	const exchangeRates = new Map<string, number>();

	try {
		const assets = await db.asset.findMany({
			where: { portfolioId, NOT: { category: "BONDS" } },
		});

		let updatedCount = 0;

		for (const asset of assets) {
			if (role === "REGULAR" && asset.updatedAt > oneDayAgo) continue;

			const symbol = formatYahooTicker(asset.ticker || asset.name);

			try {
				const result = await yahooFinance.quote(
					symbol,
					{},
					{ validateResult: false },
				);
				console.log(
					`[${symbol}] result:`,
					JSON.stringify(result).slice(0, 200),
				);

				const quote = Array.isArray(result) ? result[0] : result;

				if (quote?.regularMarketPrice != null) {
					const rawPrice = quote.regularMarketPrice as number;
					const currency = quote.currency || "PLN";
					let priceInPLN = rawPrice;

					// PRZELICZANIE WALUT
					if (currency !== "PLN") {
						// Obsługa pensów brytyjskich (GBp -> GBP)
						const fxSymbol =
							currency === "GBp" ? "GBPPLN=X" : `${currency}PLN=X`;

						if (!exchangeRates.has(fxSymbol)) {
							const fxQuote = await yahooFinance.quote(fxSymbol);
							const fxRate = (Array.isArray(fxQuote) ? fxQuote[0] : fxQuote)
								?.regularMarketPrice;
							if (fxRate) exchangeRates.set(fxSymbol, fxRate);
						}

						const rate = exchangeRates.get(fxSymbol);
						console.log("🚀 ~ refreshPortfolioPrices ~ rate:", rate);
						if (rate) {
							// Jeśli to pensy, dzielimy cenę przez 100 przed pomnożeniem przez kurs GBP
							const multiplier = currency === "GBp" ? 0.01 : 1;
							priceInPLN = rawPrice * multiplier * rate;
						}
					}

					await db.asset.update({
						where: { id: asset.id },
						data: {
							currentValue: priceInPLN * asset.quantity,
							updatedAt: new Date(),
						},
					});
					updatedCount++;
				}
			} catch (err) {
				console.warn(`❌ Błąd dla symbolu: ${symbol}`, err);
			}
		}

		revalidatePath("/dashboard");
		return { success: `Zaktualizowano ${updatedCount} pozycji w PLN! 🇵🇱` };
	} catch {
		return { error: "Błąd serwera podczas odświeżania." };
	}
}

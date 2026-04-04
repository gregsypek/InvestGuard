// actions/refresh-prices.ts
"use server";

import YahooFinance from "yahoo-finance2";
import { auth } from "@/auth";
import { db } from "@/lib/db";
// import { formatYahooTicker } from "../market-api copy";
import { formatYahooTicker } from "@/lib/market-api";
import { getLiveExchangeRate } from "../exchange-rates";
import { revalidatePath } from "next/cache";

const yahooFinance = new YahooFinance();

export async function refreshPortfolioPrices(portfolioId: string) {
	const session = await auth();
	if (!session?.user?.id) return { error: "Błąd autoryzacji" };

	const role = session.user.role;
	const now = new Date();
	const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	try {
		// POBIERAMY WSZYSTKO PRÓCZ OBLIGACJI
		const assets = await db.asset.findMany({
			where: {
				portfolioId,
				NOT: { category: "BONDS" },
			},
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
				const quote = Array.isArray(result) ? result[0] : result;

				if (quote?.regularMarketPrice != null) {
					const rawPrice = quote.regularMarketPrice as number;
					const currency = quote.currency || "PLN";
					let priceInPLN = rawPrice;

					// Przeliczanie walut przez Twój bufor w bazie (ExchangeRate)
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
							updatedAt: new Date(),
						},
					});
					updatedCount++;
				}
			} catch (err) {
				console.error(`Błąd Yahoo dla ${symbol}:`, err);
			}
		}

		revalidatePath("/dashboard");
		return { success: `Zaktualizowano ${updatedCount} pozycji rynkowych!` };
	} catch {
		return { error: "Błąd serwera." };
	}
}

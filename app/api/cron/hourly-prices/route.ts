import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatYahooTicker } from "@/lib/market-api";
import { getLiveExchangeRate } from "@/lib/exchange-rates";
import { revalidateTag } from "next/cache";
import yahooFinance from "yahoo-finance2";

const yf = new yahooFinance({ suppressNotices: ["yahooSurvey"] });

// Use EPOL for WIG20 and GC=F for GOLD to match historical chart scales
const YAHOO_SYMBOLS: Record<string, string> = {
	SP500: "^GSPC",
	NASDAQ: "^IXIC",
	WIG20: "EPOL",
	DAX: "^GDAXI",
	GOLD: "GC=F",
	BTC: "BTC-USD",
};

// Live Forex pairs directly from Yahoo Finance
const FX_SYMBOLS: Record<string, string> = {
	USD: "USDPLN=X",
	EUR: "EURPLN=X",
	GBP: "GBPPLN=X",
};

const TICKER_MAP: Record<string, string> = {
	"SP20.NL": "IS20.DE",
	"EIMI.UK": "EIMI.L",
	"ALAG.UK": "ALAG.L",
	BTC: "BTC-USD",
};

export async function GET(req: Request) {
	try {
		if (
			req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
		) {
			return new Response("Unauthorized", { status: 401 });
		}

		// Fetch only minimal asset fields required for price updates
		const premiumPortfolios = await db.portfolio.findMany({
			where: { user: { role: { in: ["ADMIN", "SUBSCRIBER"] } } },
			select: {
				id: true,
				assets: {
					where: {
						ticker: { not: null },
						category: { notIn: ["BONDS", "CASH"] },
					},
					select: {
						id: true,
						name: true,
						ticker: true,
						quantity: true,
						isObserved: true,
					},
				},
			},
		});

		const symbolsToFetch = new Set<string>([
			...Object.values(YAHOO_SYMBOLS),
			...Object.values(FX_SYMBOLS),
		]);

		premiumPortfolios.forEach((p) =>
			p.assets.forEach((a) => {
				const baseTicker = a.ticker!.split("_")[0];
				symbolsToFetch.add(
					formatYahooTicker(TICKER_MAP[baseTicker] || baseTicker),
				);
			}),
		);

		const results = await yf.quote(
			Array.from(symbolsToFetch),
			{},
			{ validateResult: false },
		);

		const quotesArray = Array.isArray(results) ? results : [results];
		let updatedCount = 0;

		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);

		const dbOperations: Promise<unknown>[] = [];

		// A. Update Yahoo Market Indices
		for (const [appSymbol, yahooSymbol] of Object.entries(YAHOO_SYMBOLS)) {
			const quote = quotesArray.find((q) => q && q.symbol === yahooSymbol);
			if (!quote || !quote.regularMarketPrice) continue;

			dbOperations.push(
				db.marketIndex.upsert({
					where: { symbol: appSymbol },
					update: {
						price: quote.regularMarketPrice,
						dailyChange: quote.regularMarketChangePercent || 0,
						updatedAt: new Date(),
					},
					create: {
						symbol: appSymbol,
						name: quote.shortName || appSymbol,
						price: quote.regularMarketPrice,
						dailyChange: quote.regularMarketChangePercent || 0,
					},
				}),
				db.indexHistory.upsert({
					where: { symbol_date: { symbol: appSymbol, date: today } },
					update: { closePrice: quote.regularMarketPrice },
					create: {
						symbol: appSymbol,
						closePrice: quote.regularMarketPrice,
						date: today,
					},
				}),
			);
		}

		// B. Extract real-time Forex rates
		const getFxRate = (symbol: string, fallback: number) => {
			const q = quotesArray.find((item) => item && item.symbol === symbol);
			return q?.regularMarketPrice || fallback;
		};

		const gbpRate = getFxRate(
			FX_SYMBOLS.GBP,
			(await getLiveExchangeRate("GBP"))?.value || 5.0,
		);
		const usdRate = getFxRate(
			FX_SYMBOLS.USD,
			(await getLiveExchangeRate("USD"))?.value || 4.0,
		);
		const eurRate = getFxRate(
			FX_SYMBOLS.EUR,
			(await getLiveExchangeRate("EUR"))?.value || 4.3,
		);

		const ratesToUpdate = [
			{ code: "USDPLN", value: usdRate },
			{ code: "EURPLN", value: eurRate },
			{ code: "GBPPLN", value: gbpRate },
		];

		for (const rate of ratesToUpdate) {
			dbOperations.push(
				db.exchangeRate.upsert({
					where: { code: rate.code },
					update: { value: rate.value, updatedAt: new Date() },
					create: { code: rate.code, value: rate.value, change: 0 },
				}),
			);
		}

		// C. Update Premium Portfolios
		for (const portfolio of premiumPortfolios) {
			for (const asset of portfolio.assets) {
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
					if (currency === "GBp" || currency === "GBP")
						priceInPLN = rawPrice * (currency === "GBp" ? 0.01 : 1) * gbpRate;
					else if (currency === "USD") priceInPLN = rawPrice * usdRate;
					else if (currency === "EUR") priceInPLN = rawPrice * eurRate;
				}

				dbOperations.push(
					db.asset.update({
						where: { id: asset.id },
						data: {
							currentValue: priceInPLN * asset.quantity,
							dailyChange: quote.regularMarketChangePercent || 0,
							updatedAt: new Date(),
						},
					}),
				);

				// Guard against portfolio assets (e.g., ticker="GOLD") overwriting macro indices
				const isMacroSymbol = Object.prototype.hasOwnProperty.call(
					YAHOO_SYMBOLS,
					asset.ticker!,
				);

				if (asset.isObserved && asset.ticker && !isMacroSymbol) {
					dbOperations.push(
						db.marketIndex.upsert({
							where: { symbol: asset.ticker },
							update: {
								price: rawPrice,
								dailyChange: quote.regularMarketChangePercent || 0,
								updatedAt: new Date(),
							},
							create: {
								symbol: asset.ticker,
								name: asset.name,
								price: rawPrice,
								dailyChange: quote.regularMarketChangePercent || 0,
							},
						}),
						db.indexHistory.upsert({
							where: { symbol_date: { symbol: asset.ticker, date: today } },
							update: { closePrice: rawPrice },
							create: {
								symbol: asset.ticker,
								closePrice: rawPrice,
								date: today,
							},
						}),
					);
				}

				updatedCount++;
			}

			dbOperations.push(
				db.portfolio.update({
					where: { id: portfolio.id },
					data: { lastRefreshedAt: new Date() },
				}),
			);
		}

		// Execute all DB writes in parallel
		await Promise.all(dbOperations);
		revalidateTag("indices", "max");

		return NextResponse.json({
			success: true,
			message: `Pobrano dane dla indeksów i ${updatedCount} aktywów Premium (Kurs USD: ${usdRate.toFixed(4)} PLN).`,
		});
	} catch (error) {
		console.error("[CRON HOURLY] Błąd:", error);
		return NextResponse.json(
			{ success: false, error: "Błąd serwera" },
			{ status: 500 },
		);
	}
}

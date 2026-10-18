import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatYahooTicker } from "@/lib/market-api";
import { getLiveExchangeRate } from "@/lib/exchange-rates";
import yahooFinance from "yahoo-finance2";

const yf = new yahooFinance({ suppressNotices: ["yahooSurvey"] });

const YAHOO_SYMBOLS: Record<string, string> = {
	SP500: "^GSPC",
	NASDAQ: "^IXIC",
	WIG20: "WIG20.WA",
	DAX: "^GDAXI",
	GOLD: "GC=F",
	BTC: "BTC-USD",
};

// EN: Live Forex pairs directly from Yahoo Finance to catch morning currency swings
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

		const premiumPortfolios = await db.portfolio.findMany({
			where: { user: { role: { in: ["ADMIN", "SUBSCRIBER"] } } },
			include: {
				assets: {
					where: {
						ticker: { not: null },
						category: { notIn: ["BONDS", "CASH"] },
					},
				},
			},
		});

		// EN: Include indices AND live forex pairs in the batch request
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

		// A. Update Market Indices
		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);

		for (const [appSymbol, yahooSymbol] of Object.entries(YAHOO_SYMBOLS)) {
			const quote = quotesArray.find((q) => q && q.symbol === yahooSymbol);
			if (!quote || !quote.regularMarketPrice) continue;

			await db.marketIndex.upsert({
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
			});

			await db.indexHistory.upsert({
				where: { symbol_date: { symbol: appSymbol, date: today } },
				update: { closePrice: quote.regularMarketPrice },
				create: {
					symbol: appSymbol,
					closePrice: quote.regularMarketPrice,
					date: today,
				},
			});
		}

		// EN: B. Extract real-time Forex rates from Yahoo Finance results (Fallback to database if API fails)
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
		// 🚀 ZAPISZ KURSY DO BAZY DANYCH DLA FRONTENDU (Wymagane dla wielowalutowości)
		const ratesToUpdate = [
			{ code: "USDPLN", value: usdRate },
			{ code: "EURPLN", value: eurRate },
			{ code: "GBPPLN", value: gbpRate },
		];

		for (const rate of ratesToUpdate) {
			await db.exchangeRate.upsert({
				where: { code: rate.code },
				update: { value: rate.value, updatedAt: new Date() },
				create: { code: rate.code, value: rate.value, change: 0 },
			});
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

				await db.asset.update({
					where: { id: asset.id },
					data: {
						currentValue: priceInPLN * asset.quantity,
						// EN: Store native daily market change percentage
						dailyChange: quote.regularMarketChangePercent || 0,
						updatedAt: new Date(),
					},
				});
				updatedCount++;
			}
			await db.portfolio.update({
				where: { id: portfolio.id },
				data: { lastRefreshedAt: new Date() },
			});
		}

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

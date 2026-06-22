"use server";

import YahooFinance from "yahoo-finance2";
import { formatYahooTicker } from "@/lib/market-api";
import { unstable_cache } from "next/cache";

// Inicjalizacja z wyciszeniem starych, niepotrzebnych ostrzeżeń z konsoli
const yahooFinance = new YahooFinance({ suppressNotices: ["ripHistorical"] });

const TICKER_MAP: Record<string, string> = {
	"SP20.NL": "IS20.DE",
	"EIMI.UK": "EIMI.L",
	"ALAG.UK": "ALAG.L",
};

async function fetchHistoricalData(
	originalTicker: string,
	startDateStr: string,
) {
	let mappedTicker = formatYahooTicker(originalTicker);

	if (TICKER_MAP[originalTicker]) mappedTicker = TICKER_MAP[originalTicker];
	else if (TICKER_MAP[mappedTicker]) mappedTicker = TICKER_MAP[mappedTicker];

	try {
		console.log(`[YAHOO API] Pobieranie wykresu dla: ${mappedTicker}`);

		// ZMIANA: Używamy nowej metody .chart() i podajemy period2 (dzisiaj)
		const result = await yahooFinance.chart(mappedTicker, {
			period1: new Date(startDateStr),
			period2: new Date(), // Wymagane przez nowe API Yahoo!
			interval: "1d",
		});

		// ZMIANA: .chart() zwraca obiekt z polem 'quotes'
		return result.quotes
			.filter((r: any) => r.close !== null && r.close !== undefined) // Pomiń dni wolne od giełdy
			.map((r: any) => ({
				date: new Date(r.date).toISOString().split("T")[0],
				price: Number(r.close),
			}));
	} catch (error) {
		console.error(`[YAHOO ERROR] Błąd dla ${mappedTicker}:`, error);
		return [];
	}
}

export const getCachedHistoricalPrices = unstable_cache(
	async (ticker: string, startDateStr: string) => {
		return await fetchHistoricalData(ticker, startDateStr);
	},
	// ZMIANA KLUCZA CACHE: Wymusza pobranie nowych danych, zamiast brania błędów z pamięci
	["yahoo-chart-prices-v1"],
	{ revalidate: 86400 },
);

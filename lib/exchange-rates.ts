import YahooFinance from "yahoo-finance2";
import { db } from "@/lib/db";

const yahooFinance = new YahooFinance();

// 1. Definiujemy prosty interfejs dla danych, których potrzebujemy
interface YahooExchangeQuote {
	regularMarketPrice?: number;
	regularMarketChangePercent?: number;
}

export async function getLiveExchangeRate(currency: string) {
	const code = `${currency.toUpperCase()}PLN`;
	const symbol = `${currency.toUpperCase()}PLN=X`;

	const cachedRate = await db.exchangeRate.findUnique({ where: { code } });
	const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

	if (cachedRate && cachedRate.updatedAt > fourHoursAgo) {
		return cachedRate;
	}

	try {
		// 2. Dodajemy { validateResult: false }, aby uniknąć problemów z 'never'
		// i rzutujemy wynik na nasz interfejs lub tablicę interfejsów
		const result = await yahooFinance.quote(
			symbol,
			{},
			{ validateResult: false },
		);

		// 3. Bezpiecznie wyciągamy dane sprawdzając czy to tablica
		const quote = (
			Array.isArray(result) ? result[0] : result
		) as YahooExchangeQuote;

		// 4. Sprawdzamy, czy dane istnieją bez użycia 'any'
		if (quote && typeof quote.regularMarketPrice === "number") {
			const rate = quote.regularMarketPrice;
			const changePercent = quote.regularMarketChangePercent ?? 0;

			const updatedRate = await db.exchangeRate.upsert({
				where: { code },
				update: { value: rate, change: changePercent },
				create: { code, value: rate, change: changePercent },
			});

			return updatedRate;
		}

		return cachedRate;
	} catch (error) {
		console.error(`Błąd FX dla ${symbol}:`, error);
		return cachedRate;
	}
}

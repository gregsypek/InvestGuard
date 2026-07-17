import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import yahooFinance from "yahoo-finance2"; // Zostaw import

// INICJALIZACJA: To jest to, czego biblioteka teraz wymaga
const yf = new yahooFinance();

// Mapa: Symbol w Twojej aplikacji -> Symbol w Yahoo Finance
// Naprawiona definicja typu dla mapy symboli
const YAHOO_SYMBOLS: Record<string, string> = {
	SP500: "^GSPC",
	NASDAQ: "^IXIC",
	WIG20: "WIG20.WA",
	DAX: "^GDAXI",
	GOLD: "GC=F",
	BTC: "BTC-USD",
};
export async function GET(req: Request) {
	try {
		// 1. Weryfikacja CRON_SECRET (Zabezpieczenie przed intruzami)
		const authHeader = req.headers.get("authorization");
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return new Response("Unauthorized", { status: 401 });
		}

		let updatedCount = 0;

		// 2. Pobieramy dane dla każdego indeksu zdefiniowanego w mapie
		for (const [appSymbol, yahooSymbol] of Object.entries(YAHOO_SYMBOLS)) {
			try {
				// Strzał do Yahoo Finance
				const quote = (await yf.quote(yahooSymbol)) as any;
				// DODAJ TO DO TESTU:
				console.log(
					`Debug [${appSymbol}]:`,
					quote ? "Dostałem quote" : "Puste dane",
				);
				if (!quote || !quote.regularMarketPrice) continue;

				const currentPrice = quote.regularMarketPrice;
				const dailyChangePct = quote.regularMarketChangePercent || 0;
				// Fallback nazwy, gdyby Yahoo jej nie zwróciło
				const marketName = quote.shortName || appSymbol;

				// A. Aktualizacja głównego widgetu (MarketIndex) na dzisiaj
				await db.marketIndex.upsert({
					where: { symbol: appSymbol },
					update: {
						price: currentPrice,
						dailyChange: dailyChangePct,
						updatedAt: new Date(),
					},
					create: {
						symbol: appSymbol,
						name: marketName,
						price: currentPrice,
						dailyChange: dailyChangePct,
					},
				});

				// B. Zapis do historii (IndexHistory) dla wykresu
				// Ustawiamy sztywno czas na 00:00:00 UTC, żeby unikać duplikatów z tego samego dnia
				const today = new Date();
				today.setUTCHours(0, 0, 0, 0);

				await db.indexHistory.upsert({
					where: {
						symbol_date: { symbol: appSymbol, date: today },
					},
					update: { closePrice: currentPrice }, // Jeśli zaktualizujemy drugi raz tego samego dnia
					create: { symbol: appSymbol, closePrice: currentPrice, date: today },
				});

				updatedCount++;
			} catch (err) {
				console.error(`[CRON] Błąd pobierania danych dla ${yahooSymbol}:`, err);
				// Celowo nie przerywamy pętli throw error, aby błąd jednego indeksu nie zablokował reszty
			}
		}

		return NextResponse.json({
			success: true,
			message: `Pomyślnie zaktualizowano ${updatedCount} indeksów.`,
		});
	} catch (error) {
		console.error("[CRON] Błąd krytyczny:", error);
		return NextResponse.json(
			{ success: false, error: "Błąd serwera" },
			{ status: 500 },
		);
	}
}

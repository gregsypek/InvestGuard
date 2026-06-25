"use server";

import YahooFinance from "yahoo-finance2";
import { auth } from "@/auth";
// Inicjalizacja z wyciszeniem starych ostrzeżeń (choć i tak zmieniamy metodę na nową)
const yahooFinance = new YahooFinance({ suppressNotices: ["ripHistorical"] });

// Inteligentne wykrywanie waluty (nawet z naszymi customowymi końcówkami)
function getCurrencyFromTicker(ticker: string): "PLN" | "USD" | "EUR" | "GBP" {
	const upper = ticker.toUpperCase().trim();
	if (upper.endsWith(".WA")) return "PLN";
	if (upper.endsWith(".DE")) return "EUR";
	if (upper.endsWith(".L") || upper.endsWith(".UK")) return "USD"; // iShares na LSE są zazwyczaj w USD
	if (upper.endsWith(".US") || !upper.includes(".")) return "USD";
	return "EUR";
}

export async function fetchMagicFillData(
	ticker: string,
	dateStr: string,
	quantity: number,
) {
	const session = await auth();

	if (!session?.user || session.user.role === "REGULAR") {
		return {
			success: false,
			message: "Funkcja Auto-Fill dostępna tylko dla subskrybentów Premium. 💎",
		};
	}

	try {
		const targetDate = new Date(dateStr);
		const nextDay = new Date(targetDate);
		nextDay.setDate(nextDay.getDate() + 2);

		// 1. SANITYZACJA TICKERA DLA YAHOO (Naprawa błędu Timeout!)
		let yahooTicker = ticker.toUpperCase().trim();
		if (yahooTicker.endsWith(".US")) {
			yahooTicker = yahooTicker.replace(".US", ""); // Yahoo chce "OWL" zamiast "OWL.US"
		} else if (yahooTicker.endsWith(".UK")) {
			yahooTicker = yahooTicker.replace(".UK", ".L"); // Yahoo chce "EIMI.L" zamiast "EIMI.UK"
		}

		// 2. Używamy nowej, zalecanej metody chart() zamiast historical()
		const chartResult = await yahooFinance.chart(yahooTicker, {
			period1: targetDate,
			period2: nextDay,
			interval: "1d",
		});

		const quotes = chartResult?.quotes || [];

		if (quotes.length === 0) {
			return {
				success: false,
				message: `Nie znaleziono notowań dla ${yahooTicker} w tym dniu.`,
			};
		}

		// Pobieramy cenę zamknięcia z pierwszego dostępnego dnia
		const historicalPrice = quotes[0].close;
		if (!historicalPrice) {
			return {
				success: false,
				message: "Brak ceny zamknięcia dla tej daty na Yahoo.",
			};
		}

		const originalCurrency = getCurrencyFromTicker(ticker);
		let exchangeRate = 1.0;

		// 3. Połączenie z NBP (Pobieranie kursu walut)
		if (originalCurrency !== "PLN") {
			const startDate = new Date(targetDate);
			startDate.setDate(startDate.getDate() - 7);

			const startStr = startDate.toISOString().split("T")[0];
			const endStr = targetDate.toISOString().split("T")[0];

			const nbpResponse = await fetch(
				`http://api.nbp.pl/api/exchangerates/rates/a/${originalCurrency.toLowerCase()}/${startStr}/${endStr}/?format=json`,
			);

			if (nbpResponse.ok) {
				const nbpData = await nbpResponse.json();
				// Bierzemy ostatni znany kurs (mid) z tego przedziału czasowego
				exchangeRate = nbpData.rates[nbpData.rates.length - 1].mid;
			} else {
				return {
					success: false,
					message: `Błąd NBP: Nie udało się pobrać kursu dla ${originalCurrency}.`,
				};
			}
		}

		// 4. Finalna kalkulacja z dokładnością do grosza
		const totalOriginalValue = historicalPrice * quantity;
		const finalPlnValue = totalOriginalValue * exchangeRate;

		return {
			success: true,
			data: {
				originalPrice: historicalPrice,
				originalCurrency,
				exchangeRate,
				investedCapitalPln: Math.abs(finalPlnValue).toFixed(2),
			},
		};
	} catch (error: any) {
		console.error("Magic Fill Error:", error);
		return {
			success: false,
			message: `Błąd połączenia: ${error?.message || "Nieznany błąd"}`,
		};
	}
}

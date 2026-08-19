// lib/bond-calculations.ts

export interface BondConfigDict {
	[seriesCode: string]: { firstYearRate: number; margin: number | null };
}

export interface InflationDict {
	[yearMonth: string]: number; // np. "2026-06": 2.5
}

export function calculateLiveBondValue(
	investedCapital: number,
	fallbackInterestRate: number,
	purchaseDate: string | Date,
	// 🚀 ZABEZPIECZENIE: Domyślne puste wartości.
	seriesCode: string = "UNKNOWN",
	inflationRates: InflationDict = {},
	bondConfigs: BondConfigDict = {},
): { value: number; currentRate: number } {
	const purchase = new Date(purchaseDate);
	const now = new Date();

	// Pobranie konfiguracji (przesunięte wyżej, żeby zabezpieczenia mogły z tego skorzystać)
	const config = bondConfigs[seriesCode];
	const firstYearRate = config ? config.firstYearRate : fallbackInterestRate;

	// 🚀 ZABEZPIECZENIE DATY: Jeśli w bazie zapisano uszkodzoną datę, zwróć obiekt bazowy
	if (isNaN(purchase.getTime())) {
		return { value: investedCapital, currentRate: firstYearRate };
	}

	// Jeśli obligacja jest kupiona w przyszłości
	if (now.getTime() < purchase.getTime()) {
		return { value: investedCapital, currentRate: firstYearRate };
	}

	let currentCapital = investedCapital;

	let currentPeriodStart = new Date(purchase);
	let currentPeriodEnd = new Date(purchase);
	currentPeriodEnd.setFullYear(currentPeriodStart.getFullYear() + 1);

	let yearCounter = 1;
	let currentRate = firstYearRate / 100;

	// 1. Kapitalizacja poprzednich lat
	while (now.getTime() > currentPeriodEnd.getTime()) {
		currentCapital += currentCapital * currentRate;

		currentPeriodStart.setFullYear(currentPeriodStart.getFullYear() + 1);
		currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
		yearCounter++;

		currentRate = determineRateForYear(
			yearCounter,
			currentPeriodStart,
			config,
			inflationRates,
			firstYearRate,
		);
	}

	// 2. Oprocentowanie na BIEŻĄCY rok
	currentRate = determineRateForYear(
		yearCounter,
		currentPeriodStart,
		config,
		inflationRates,
		firstYearRate,
	);

	// 3. Obliczanie odsetek dziennych w aktualnym roku
	const daysInCurrentYear = getDaysBetween(
		currentPeriodStart,
		currentPeriodEnd,
	);
	const elapsedDays = getDaysBetween(currentPeriodStart, now);

	// 🚀 ZABEZPIECZENIE: Unikamy dzielenia przez 0
	if (daysInCurrentYear === 0) {
		return {
			value: Number(currentCapital.toFixed(2)),
			currentRate: Number((currentRate * 100).toFixed(2)),
		};
	}

	const currentInterest =
		currentCapital * currentRate * (elapsedDays / daysInCurrentYear);

	// 🚀 ZWRACAMY OBIEKT: Z wyceną kapitału oraz bieżącym, rzeczywistym oprocentowaniem
	return {
		value: Number((currentCapital + currentInterest).toFixed(2)),
		currentRate: Number((currentRate * 100).toFixed(2)),
	};
}

// Funkcja pomocnicza z zabezpieczeniem danych
function determineRateForYear(
	yearIndex: number,
	anniversaryDate: Date,
	config: { firstYearRate: number; margin: number | null } | undefined,
	inflationRates: InflationDict,
	fallbackRate: number,
): number {
	// Jeśli to pierwszy rok, brak konfiguracji lub obligacja stałoprocentowa
	if (yearIndex === 1 || !config || config.margin === null) {
		return fallbackRate / 100;
	}

	const lookupMonth = getGusInflationMonth(anniversaryDate);

	// 🚀 OCHRONA PRZED BRAKIEM DANYCH:
	// Jeśli Admin  nie wpisał jeszcze wskaźnika inflacji za ten konkretny stary miesiąc,
	// użyjemy domyślnego procentowania z pierwszego roku, żeby nie wygenerować 0% strat!
	if (inflationRates[lookupMonth] === undefined) {
		return fallbackRate / 100;
	}

	const inflation = inflationRates[lookupMonth];
	const calculatedRate = Math.max(0, inflation + config.margin);

	return calculatedRate / 100;
}

function getGusInflationMonth(anniversary: Date): string {
	const d = new Date(anniversary);
	d.setMonth(d.getMonth() - 2);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	return `${yyyy}-${mm}`;
}

function getDaysBetween(date1: Date, date2: Date): number {
	const ONE_DAY = 1000 * 60 * 60 * 24;
	return Math.round(Math.abs((date2.getTime() - date1.getTime()) / ONE_DAY));
}

// lib/bond-calculations.ts

export function calculateLiveBondValue(
	investedCapital: number,
	interestRate: number, // w procentach, np. 6.55
	purchaseDate: string | Date,
): number {
	const purchase = new Date(purchaseDate);
	const now = new Date();

	// Jeśli obligacja jest kupiona w przyszłości (np. wczoraj zaksięgowana z dzisiejszą datą emisji)
	if (now.getTime() < purchase.getTime()) return investedCapital;

	const r = interestRate / 100;

	// 1. Ustalenie dat i rocznic
	let currentPeriodStart = new Date(purchase);
	let currentPeriodEnd = new Date(purchase);
	currentPeriodEnd.setFullYear(currentPeriodStart.getFullYear() + 1);

	let currentCapital = investedCapital;

	// 2. Symulacja kapitalizacji dla poprzednich, zamkniętych lat (dla EDO/ROD)
	// UWAGA: Ten etap na razie zakłada stałe r (dla uproszczenia roku 1).
	// W docelowej wersji dołączymy tu wskaźniki inflacji dla lat 2+.
	while (now.getTime() > currentPeriodEnd.getTime()) {
		// Bank dopisuje odsetki do kapitału w rocznicę
		currentCapital += currentCapital * r;

		// Przesuwamy okno o rok do przodu
		currentPeriodStart.setFullYear(currentPeriodStart.getFullYear() + 1);
		currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
	}

	// 3. Naliczanie bieżące w TRWAJĄCYM roku odsetkowym (liniowo z dnia na dzień)
	const daysInCurrentYear = getDaysBetween(
		currentPeriodStart,
		currentPeriodEnd,
	);
	const elapsedDays = getDaysBetween(currentPeriodStart, now);

	const currentInterest =
		currentCapital * r * (elapsedDays / daysInCurrentYear);

	return Number((currentCapital + currentInterest).toFixed(2));
}

function getDaysBetween(date1: Date, date2: Date): number {
	const ONE_DAY = 1000 * 60 * 60 * 24;
	return Math.round(Math.abs((date2.getTime() - date1.getTime()) / ONE_DAY));
}

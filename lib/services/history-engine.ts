import { PortfolioWithAssets } from "@/lib/types"; // Dopasuj ścieżkę
import { db } from "@/lib/db";
import { generatePortfolioHistory } from "@/app/lib/history-engine"; // Dopasuj ścieżkę

export async function getPortfolioSnapshotsHistory(
	portfolios: PortfolioWithAssets[],
	searchParams: {
		range?: string;
		from?: string;
		to?: string;
		dataMode?: string;
	},
	userId: string,
) {
	// 1. ZACZYNAMY OD POBRANIA NAJSTARSZEJ DATY TYLKO DLA PRZEKAZANYCH PORTFELI
	const oldestSnapshotRecord = await db.portfolioSnapshot.findFirst({
		where: {
			portfolioId: { in: portfolios.map((p) => p.id) }, // 👈 KLUCZOWA ZMIANA
		},
		orderBy: { date: "asc" },
		select: { date: true },
	});

	// Jeśli nie ma zrzutów (np. nowy portfel), ustawiamy dzisiejszą datę
	const oldestRealSnapshotDate = oldestSnapshotRecord?.date || new Date();

	// 2. OBLICZAMY DOSTĘPNE DNI
	const today = new Date();
	const daysAvailable = Math.floor(
		(today.getTime() - oldestRealSnapshotDate.getTime()) /
			(1000 * 60 * 60 * 24),
	);

	// 3. INTELIGENTNY DOMYŚLNY WYBÓR (1W dla > 2 dni, YTD dla reszty)
	const defaultRange = daysAvailable > 2 ? "1W" : "YTD";

	// Jeśli w URL nie ma filtra (np. przy pierwszym wejściu), użyj domyślnego
	const range = searchParams.range || defaultRange;

	const allAssets = portfolios.flatMap((p) => p.assets);
	let daysBack = 30;
	let endDate = new Date();

	const oldestDate = oldestSnapshotRecord?.date;

	// Możesz też wysterować domyślny tryb danych (REAL / SIMULATED)
	// Jeśli zarządzasz trybem przez URL lub stan, przekażesz go analogicznie.

	switch (range) {
		case "1W":
			daysBack = 7;
			break;
		case "1M":
			daysBack = 30;
			break;
		case "3M":
			daysBack = 90;
			break;
		case "YTD":
			const startOfYear = new Date(today.getFullYear(), 0, 1);
			daysBack = Math.ceil(
				(today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
			);
			break;
		case "1Y":
			daysBack = 365;
			break;
		case "3Y":
			daysBack = 1095;
			break;
		case "5Y":
			daysBack = 1825;
			break;
		case "MAX":
			daysBack = daysAvailable > 0 ? daysAvailable + 5 : 30;
			break;
		case "CUSTOM":
			if (searchParams.to) endDate = new Date(searchParams.to);
			if (searchParams.from) {
				const fromDate = new Date(searchParams.from);
				daysBack = Math.ceil(
					(endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
				);
				daysBack = Math.max(1, daysBack);
			}
			break;
	}

	const startDate = new Date(endDate);
	startDate.setDate(endDate.getDate() - daysBack);

	// 1. Symulacja
	const simulatedSnapshots = generatePortfolioHistory(
		portfolios,
		daysBack,
		endDate,
	);

	// 2. Realne zrzuty z bazy
	const realDbSnapshots = await db.portfolioSnapshot.findMany({
		where: {
			portfolioId: { in: portfolios.map((p) => p.id) },
			date: { gte: startDate, lte: endDate },
		},
		orderBy: { date: "asc" },
	});

	const realSnapshots = realDbSnapshots.map((s) => ({
		id: s.id,
		portfolioId: s.portfolioId,
		date: s.date,
		totalValue: Number(s.totalValue),
		investedValue: Number(s.investedValue),
		dailyChange: 0,
		isPositive: true,
	}));

	return {
		simulatedSnapshots,
		realSnapshots,
		startDate,
		endDate,
		daysBack,
		oldestRealSnapshotDate,
	};
}

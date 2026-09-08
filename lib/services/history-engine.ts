import { PortfolioWithAssets } from "@/lib/types"; // Dopasuj ścieżkę
import { db } from "@/lib/db";
import { generatePortfolioHistory } from "@/app/lib/history-engine"; // Dopasuj ścieżkę

export async function getPortfolioSnapshotsHistory(
	portfolios: PortfolioWithAssets[],
	searchParams: { range?: string; from?: string; to?: string },
	userId: string,
) {
	const allAssets = portfolios.flatMap((p) => p.assets);
	const range = searchParams.range || "1M";

	let daysBack = 30;
	let endDate = new Date();
	const today = new Date();

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
			const oldestDate = allAssets.reduce((oldest, asset) => {
				const assetDate = new Date(asset.purchaseDate || asset.createdAt);
				return assetDate < oldest ? assetDate : oldest;
			}, today);
			daysBack = Math.ceil(
				(today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24),
			);
			daysBack = Math.max(30, daysBack + 5);
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

	// 🚀 NOWE: Pobieramy najstarszą datę raz, żeby filtry wszędzie działały
	const oldestSnapshotRecord = await db.portfolioSnapshot.findFirst({
		where: { portfolio: { userId } },
		orderBy: { date: "asc" },
		select: { date: true },
	});
	const oldestRealSnapshotDate = oldestSnapshotRecord?.date || new Date();

	return {
		simulatedSnapshots,
		realSnapshots,
		startDate,
		endDate,
		daysBack,
		oldestRealSnapshotDate,
	};
}

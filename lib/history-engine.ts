import { addDays, differenceInDays, isSameDay, startOfDay } from "date-fns";

import { PortfolioWithAssets } from "@/lib/types";
import { db } from "@/lib/db";

// EN: Output interface for the simulation engine
export interface SimulatedSnapshot {
	id: string;
	portfolioId: string;
	date: Date;
	totalValue: number;
	investedValue: number;
	dailyChange: number;
	isPositive: boolean;
}

// EN: Pure math simulator for generating historical portfolio performance
export function generatePortfolioHistory(
	portfolios: PortfolioWithAssets[],
	daysBack: number = 30,
	customEndDate?: Date,
): SimulatedSnapshot[] {
	const history: SimulatedSnapshot[] = [];
	const actualToday = startOfDay(new Date());
	const chartEndDate = startOfDay(customEndDate || new Date());
	const startDate = addDays(chartEndDate, -daysBack);

	let step = 1;
	if (daysBack > 90) step = 7;
	if (daysBack >= 365) step = 30;

	portfolios.forEach((portfolio) => {
		let prevInvested = 0;
		let prevTotal = 0;

		for (let i = 0; i <= daysBack; i += step) {
			const currentDate = addDays(startDate, i);
			const isCurrentDayActualToday = isSameDay(currentDate, actualToday);

			let dailyInvested = 0;
			let dailyValue = 0;

			portfolio.assets.forEach((asset) => {
				const purchaseDate = startOfDay(
					new Date(asset.purchaseDate || asset.createdAt),
				);

				// EN: Skip if the asset was not yet purchased on the current simulation date
				if (currentDate < purchaseDate) return;

				dailyInvested += asset.investedCapital;

				// EN: Handle BONDS independently using accrued interest logic
				if (
					asset.category === "BONDS" &&
					asset.interestRate &&
					Number(asset.interestRate) > 0
				) {
					const daysOwnedAtCurrentDate = Math.max(
						0,
						differenceInDays(currentDate, purchaseDate),
					);
					const dailyRate = (Number(asset.interestRate) || 0) / 100 / 365;
					const accruedForDay =
						asset.investedCapital * dailyRate * daysOwnedAtCurrentDate;

					dailyValue += asset.investedCapital + accruedForDay;
				} else {
					// EN: Handle standard market assets (Equities, Crypto, Gold)
					if (isCurrentDayActualToday) {
						// EN: Fetch exact current value for today's market price
						dailyValue += asset.currentValue || 0;
					} else {
						// EN: Distribute total profit linearly for historical charts
						const totalDaysOwned = Math.max(
							1,
							differenceInDays(actualToday, purchaseDate),
						);
						const daysOwnedAtCurrentDate = Math.max(
							0,
							differenceInDays(currentDate, purchaseDate),
						);

						const totalProfit =
							(asset.currentValue || 0) - asset.investedCapital;
						const profitPerDay = totalProfit / totalDaysOwned;

						dailyValue +=
							asset.investedCapital + profitPerDay * daysOwnedAtCurrentDate;
					}
				}
			});

			let change = 0;
			let isPositive = true;

			if (i > 0) {
				const addedCapital = dailyInvested - prevInvested;
				change = dailyValue - prevTotal - addedCapital;
				isPositive = change >= 0;
			}

			prevInvested = dailyInvested;
			prevTotal = dailyValue;

			history.push({
				id: `sim-${portfolio.id}-${i}`,
				portfolioId: portfolio.id,
				date: currentDate,
				totalValue: Number(dailyValue.toFixed(2)),
				investedValue: dailyInvested,
				dailyChange: change,
				isPositive,
			});
		}
	});

	return history;
}

// EN: Database orchestrator fetching real data and combining it with the simulation
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
	const oldestSnapshotRecord = await db.portfolioSnapshot.findFirst({
		where: {
			portfolioId: { in: portfolios.map((p) => p.id) },
		},
		orderBy: { date: "asc" },
		select: { date: true },
	});

	const oldestRealSnapshotDate = oldestSnapshotRecord?.date || new Date();
	const today = new Date();
	const daysAvailable = Math.floor(
		(today.getTime() - oldestRealSnapshotDate.getTime()) /
			(1000 * 60 * 60 * 24),
	);

	const defaultRange = daysAvailable > 2 ? "1W" : "YTD";
	const range = searchParams.range || defaultRange;

	let daysBack = 30;
	let endDate = new Date();

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
			const startOfYearDate = new Date(today.getFullYear(), 0, 1);
			daysBack = Math.ceil(
				(today.getTime() - startOfYearDate.getTime()) / (1000 * 60 * 60 * 24),
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

	// EN: Execute internal simulator for fallback or specific UI modes
	const simulatedSnapshots = generatePortfolioHistory(
		portfolios,
		daysBack,
		endDate,
	);

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

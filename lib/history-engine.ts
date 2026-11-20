import { addDays, differenceInDays, isSameDay, startOfDay } from "date-fns";

import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

// Minimal interface required for history simulation and snapshot queries
export interface PortfolioForHistory {
	id: string;
	assets: {
		category: string;
		investedCapital: number;
		currentValue: number | null;
		purchaseDate: Date | string | null;
		createdAt: Date | string;
		interestRate: number | null;
	}[];
}

export interface SimulatedSnapshot {
	id: string;
	portfolioId: string;
	date: Date;
	totalValue: number;
	investedValue: number;
	dailyChange: number;
	isPositive: boolean;
}

// Pure math simulator for generating historical portfolio performance
export function generatePortfolioHistory(
	portfolios: PortfolioForHistory[],
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

				if (currentDate < purchaseDate) return;

				dailyInvested += asset.investedCapital;

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
					if (isCurrentDayActualToday) {
						dailyValue += asset.currentValue || 0;
					} else {
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

// Cached DB query for portfolio snapshots to drastically reduce Neon egress
const getCachedSnapshotsData = unstable_cache(
	async (portfolioIds: string[], startIso: string, endIso: string) => {
		const [oldestRecord, snapshots] = await Promise.all([
			db.portfolioSnapshot.findFirst({
				where: { portfolioId: { in: portfolioIds } },
				orderBy: { date: "asc" },
				select: { date: true },
			}),
			db.portfolioSnapshot.findMany({
				where: {
					portfolioId: { in: portfolioIds },
					date: { gte: new Date(startIso), lte: new Date(endIso) },
				},
				orderBy: { date: "asc" },
				select: {
					portfolioId: true,
					date: true,
					totalValue: true,
					investedValue: true,
				},
			}),
		]);

		return {
			oldestDateIso: oldestRecord?.date
				? oldestRecord.date.toISOString()
				: null,
			snapshots: snapshots.map((s) => ({
				portfolioId: s.portfolioId,
				dateIso: s.date.toISOString(),
				totalValue: Number(s.totalValue),
				investedValue: Number(s.investedValue),
			})),
		};
	},
	["portfolio-snapshots-history"],
	{
		revalidate: 300, // Cache for 5 minutes
		tags: ["snapshots"],
	},
);

export async function getPortfolioSnapshotsHistory(
	portfolios: PortfolioForHistory[],
	searchParams: {
		range?: string;
		from?: string;
		to?: string;
		dataMode?: string;
	},
	userId: string,
) {
	const portfolioIds = portfolios.map((p) => p.id).sort();
	const today = new Date();

	// Resolve preliminary range first so we can fetch snapshots in a single cached call
	let range = searchParams.range;
	let daysBack = 30;
	let endDate = new Date();

	const computeDaysBack = (targetRange: string, oldestDate: Date) => {
		switch (targetRange) {
			case "1W":
				return 7;
			case "1M":
				return 30;
			case "3M":
				return 90;
			case "YTD": {
				const startOfYearDate = new Date(today.getFullYear(), 0, 1);
				return Math.ceil(
					(today.getTime() - startOfYearDate.getTime()) / (1000 * 60 * 60 * 24),
				);
			}
			case "1Y":
				return 365;
			case "3Y":
				return 1095;
			case "5Y":
				return 1825;
			case "MAX": {
				const avail = Math.floor(
					(today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24),
				);
				return avail > 0 ? avail + 5 : 30;
			}
			case "CUSTOM": {
				if (searchParams.to) endDate = new Date(searchParams.to);
				if (searchParams.from) {
					const fromDate = new Date(searchParams.from);
					return Math.max(
						1,
						Math.ceil(
							(endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
						),
					);
				}
				return 30;
			}
			default:
				return 30;
		}
	};

	// For initial query, fetch wide enough window if range isn't explicitly set
	const initialDaysBack = range ? computeDaysBack(range, today) : 365;
	const initialStartDate = new Date(endDate);
	initialStartDate.setDate(endDate.getDate() - initialDaysBack);

	const cached = await getCachedSnapshotsData(
		portfolioIds,
		startOfDay(initialStartDate).toISOString(),
		endDate.toISOString(),
	);

	const oldestRealSnapshotDate = cached.oldestDateIso
		? new Date(cached.oldestDateIso)
		: new Date();

	if (!range) {
		const daysAvailable = Math.floor(
			(today.getTime() - oldestRealSnapshotDate.getTime()) /
				(1000 * 60 * 60 * 24),
		);
		range = daysAvailable > 2 ? "1W" : "YTD";
	}

	daysBack = computeDaysBack(range, oldestRealSnapshotDate);
	const startDate = new Date(endDate);
	startDate.setDate(endDate.getDate() - daysBack);

	// If MAX required an older start date than the initial 365-day window, fetch the full range
	const finalCached =
		startDate < initialStartDate
			? await getCachedSnapshotsData(
					portfolioIds,
					startOfDay(startDate).toISOString(),
					endDate.toISOString(),
				)
			: cached;

	const simulatedSnapshots = generatePortfolioHistory(
		portfolios,
		daysBack,
		endDate,
	);

	const realSnapshots = finalCached.snapshots
		.map((s, idx) => ({
			id: `snap-${s.portfolioId}-${idx}`,
			portfolioId: s.portfolioId,
			date: new Date(s.dateIso),
			totalValue: s.totalValue,
			investedValue: s.investedValue,
			dailyChange: 0,
			isPositive: true,
		}))
		.filter((s) => s.date >= startDate && s.date <= endDate);

	return {
		simulatedSnapshots,
		realSnapshots,
		startDate,
		endDate,
		daysBack,
		oldestRealSnapshotDate,
	};
}

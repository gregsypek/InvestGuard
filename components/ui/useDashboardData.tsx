import {
	differenceInDays,
	endOfMonth,
	endOfWeek,
	format,
	startOfYear,
} from "date-fns";
import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ChartDataPoint } from "../dashboard/PortfolioChart";
import { DateRange } from "react-day-picker";
import { PortfolioWithAssets } from "@/lib/types";

export interface SimulatedSnapshot {
	id: string;
	portfolioId: string;
	date: string | Date;
	totalValue: number;
	investedValue: number;
	dailyChange: number;
	isPositive: boolean;
}

interface UseDashboardDataProps {
	portfolios: PortfolioWithAssets[];
	snapshots: SimulatedSnapshot[];
	realSnapshots?: SimulatedSnapshot[];
	userIndices?: string[];
	indexQuotes?: Record<string, number>;
	indexQuotesHistory?: Record<string, Record<string, number>>;
}

export function useDashboardData({
	portfolios,
	snapshots,
	realSnapshots = [],
	userIndices = [],
	indexQuotes = {},
	indexQuotesHistory = {},
}: UseDashboardDataProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [isPending, startTransition] = useTransition();
	const [dataMode, setDataMode] = useState<"REAL" | "SIMULATED">("SIMULATED");
	const [chartMode, setChartMode] = useState<"VALUE" | "PERCENTAGE">("VALUE");
	const [selectedIds, setSelectedIds] = useState(["ALL"]);

	const activeRange = searchParams.get("range") || "1M";
	const currentFrom = searchParams.get("from") || "";
	const currentTo = searchParams.get("to") || "";
	const fromDate = useMemo(
		() => (currentFrom ? new Date(currentFrom) : undefined),
		[currentFrom],
	);
	const toDate = useMemo(
		() => (currentTo ? new Date(currentTo) : undefined),
		[currentTo],
	);

	const allTransactions = useMemo(() => {
		return portfolios.flatMap((p) => p.transactionHistories || []);
	}, [portfolios]);

	const filteredTransactions = useMemo(() => {
		if (selectedIds.includes("ALL")) return allTransactions;
		return allTransactions.filter((tx) => selectedIds.includes(tx.portfolioId));
	}, [allTransactions, selectedIds]);

	const togglePortfolio = (id: string) => {
		setSelectedIds((prev: string[]) => {
			if (id === "ALL") return ["ALL"];
			const newIds = prev.includes(id)
				? prev.filter((p) => p !== id)
				: [...prev.filter((p) => p !== "ALL"), id];
			return newIds.length === 0 ? ["ALL"] : newIds;
		});
	};

	const handleRangeChange = (range: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("range", range);
		if (range !== "CUSTOM") {
			params.delete("from");
			params.delete("to");
		}
		startTransition(() => {
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		});
	};

	const handleDateRangeSelect = (range: DateRange | undefined) => {
		const params = new URLSearchParams(searchParams.toString());
		if (range?.from) {
			params.set("range", "CUSTOM");
			params.set("from", format(range.from, "yyyy-MM-dd"));
		} else {
			params.delete("from");
		}
		if (range?.to) {
			params.set("to", format(range.to, "yyyy-MM-dd"));
		} else {
			params.delete("to");
		}
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	const selectedPortfolios = selectedIds.includes("ALL")
		? portfolios
		: portfolios.filter((p) => selectedIds.includes(p.id));

	const activePortfolios = selectedPortfolios.map((p) => ({
		id: p.id,
		name: p.name,
	}));

	const totalInvested = selectedPortfolios.reduce(
		(sum, p) =>
			sum +
			p.assets.reduce((assetSum, a) => assetSum + (a.investedCapital || 0), 0),
		0,
	);
	const totalCurrent = selectedPortfolios.reduce(
		(sum, p) =>
			sum +
			p.assets.reduce((assetSum, a) => assetSum + (a.currentValue || 0), 0),
		0,
	);
	const totalPnL = totalCurrent - totalInvested;
	const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

	const observedAssets = useMemo(() => {
		if (!portfolios || portfolios.length === 0) return [];
		const allAssets = portfolios.flatMap((p) => p.assets || []);
		const riskAssets = allAssets.filter(
			(a) =>
				a.category !== "BONDS" &&
				a.category !== "CASH" &&
				a.isObserved === true,
		);
		const uniqueAssets = [];
		const seenIdentifiers = new Set();
		for (const asset of riskAssets) {
			const identifier = asset.name || asset.ticker;
			if (!seenIdentifiers.has(identifier)) {
				seenIdentifiers.add(identifier);
				uniqueAssets.push(asset);
			}
		}
		return uniqueAssets;
	}, [portfolios]);

	const oldestRealSnapshotDate = useMemo(() => {
		if (!realSnapshots || realSnapshots.length === 0) return new Date();
		const oldestTime = realSnapshots.reduce((min, s) => {
			const sDate = new Date(s.date).getTime();
			return sDate < min ? sDate : min;
		}, new Date().getTime());
		return new Date(oldestTime);
	}, [realSnapshots]);

	const isRangeDisabled = (range: string) => {
		if (dataMode === "SIMULATED") return false;
		const daysAvailable = differenceInDays(new Date(), oldestRealSnapshotDate);
		switch (range) {
			case "3M":
				return daysAvailable < 30;
			case "YTD":
				return (
					daysAvailable <
					Math.min(30, differenceInDays(new Date(), startOfYear(new Date())))
				);
			case "1Y":
				return daysAvailable < 90;
			case "3Y":
				return daysAvailable < 365;
			case "5Y":
				return daysAvailable < 1095;
			default:
				return false;
		}
	};

	// --- 🚀 NEW PIPELINE ARCHITECTURE ---

	// STEP 1: Time Filtering (Cutoff Data outside of activeRange)
	const timeFilteredSnapshots = useMemo(() => {
		const activeSnaps = dataMode === "SIMULATED" ? snapshots : realSnapshots;
		if (activeSnaps.length === 0) return [];

		const now = new Date();
		now.setUTCHours(0, 0, 0, 0);
		let cutoff = new Date(0); // Default to MAX

		switch (activeRange) {
			case "1W":
				cutoff = new Date(now.setDate(now.getDate() - 7));
				break;
			case "1M":
				cutoff = new Date(now.setMonth(now.getMonth() - 1));
				break;
			case "3M":
				cutoff = new Date(now.setMonth(now.getMonth() - 3));
				break;
			case "6M":
				cutoff = new Date(now.setMonth(now.getMonth() - 6));
				break;
			case "YTD":
				cutoff = startOfYear(new Date());
				break;
			case "1Y":
				cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
				break;
			case "3Y":
				cutoff = new Date(now.setFullYear(now.getFullYear() - 3));
				break;
			case "5Y":
				cutoff = new Date(now.setFullYear(now.getFullYear() - 5));
				break;
			case "CUSTOM":
				cutoff = fromDate ? new Date(fromDate) : new Date(0);
				break;
		}

		let filtered = activeSnaps.filter(
			(s) => new Date(s.date).getTime() >= cutoff.getTime(),
		);
		if (activeRange === "CUSTOM" && toDate) {
			filtered = filtered.filter(
				(s) => new Date(s.date).getTime() <= new Date(toDate).getTime(),
			);
		}
		return filtered;
	}, [snapshots, realSnapshots, dataMode, activeRange, fromDate, toDate]);

	// STEP 2: Downsampling Compressor
	const compressedSnapshots = useMemo(() => {
		if (timeFilteredSnapshots.length === 0) return [];

		const dates = timeFilteredSnapshots.map((s) => new Date(s.date).getTime());
		const minDate = Math.min(...dates);
		const maxDate = Math.max(...dates);
		const daysDiff = differenceInDays(new Date(maxDate), new Date(minDate));

		// If viewing less than 90 days, return daily raw data
		if (daysDiff < 90) return timeFilteredSnapshots;

		const groupedByPeriod: Record<string, SimulatedSnapshot[]> = {};
		timeFilteredSnapshots.forEach((snap) => {
			const dateObj = new Date(snap.date);
			let periodKey = "";

			// 90 days to 2 years => Weekly Candles
			if (daysDiff >= 90 && daysDiff <= 730) {
				periodKey = format(
					endOfWeek(dateObj, { weekStartsOn: 1 }),
					"yyyy-MM-dd",
				);
			} else {
				// > 2 years => Monthly Candles
				periodKey = format(endOfMonth(dateObj), "yyyy-MM-dd");
			}

			if (!groupedByPeriod[periodKey]) groupedByPeriod[periodKey] = [];
			groupedByPeriod[periodKey].push(snap);
		});

		const downsampledSnapshots: SimulatedSnapshot[] = [];
		Object.values(groupedByPeriod).forEach((periodSnaps) => {
			const portfolioSnaps: Record<string, SimulatedSnapshot> = {};

			// Sort chronologically inside the period
			periodSnaps.sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			);

			periodSnaps.forEach((snap) => {
				const prevSnap = portfolioSnaps[snap.portfolioId];
				// Clone snapshot to prevent mutating database objects
				portfolioSnaps[snap.portfolioId] = { ...snap };

				// Accumulate daily PnL for the bar chart so we don't lose intra-week/month profits
				if (prevSnap) {
					portfolioSnaps[snap.portfolioId].dailyChange += prevSnap.dailyChange;
				}
			});
			downsampledSnapshots.push(...Object.values(portfolioSnaps));
		});

		return downsampledSnapshots;
	}, [timeFilteredSnapshots]);

	// STEP 3: Generate ALL Chart Data arrays using highly optimized data
	const { portfolioChartData, absoluteChartData, benchmarkChartData } =
		useMemo(() => {
			if (compressedSnapshots.length === 0) {
				return {
					portfolioChartData: [],
					absoluteChartData: [],
					benchmarkChartData: [],
				};
			}

			const getDateStr = (d: string | Date) => {
				const dateObj = new Date(d);
				return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
			};

			const sortedSnapshots = [...compressedSnapshots].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			);

			const allDates = Array.from(
				new Set(sortedSnapshots.map((s) => getDateStr(s.date))),
			);
			const activePortfolioIds = selectedIds.includes("ALL")
				? Array.from(new Set(compressedSnapshots.map((s) => s.portfolioId)))
				: selectedIds;

			const lastKnownState: Record<
				string,
				{ value: number; invested: number }
			> = {};
			const seenPortfolios = new Set();
			const baseData: any[] = [];
			const finalAbsoluteData: any[] = [];

			// Build base arrays for charts
			allDates.forEach((dateStr) => {
				const snapsToday = sortedSnapshots.filter(
					(s) =>
						getDateStr(s.date) === dateStr &&
						activePortfolioIds.includes(s.portfolioId),
				);

				let dayTotalValue = 0,
					dayInvestedValue = 0,
					dayDailyChangeFromDB = 0;
				let dayNetCashFlow = 0,
					dayExactChangePLN = 0;

				snapsToday.forEach((snap) => {
					dayDailyChangeFromDB += snap.dailyChange;
					if (!seenPortfolios.has(snap.portfolioId)) {
						seenPortfolios.add(snap.portfolioId);
						dayExactChangePLN += snap.dailyChange || 0;
					} else {
						const prevState = lastKnownState[snap.portfolioId];
						const portfolioCashFlow = snap.investedValue - prevState.invested;
						const portfolioExactChange =
							snap.totalValue - prevState.value - portfolioCashFlow;
						dayNetCashFlow += portfolioCashFlow;
						dayExactChangePLN += portfolioExactChange;
					}
					lastKnownState[snap.portfolioId] = {
						value: snap.totalValue,
						invested: snap.investedValue,
					};
				});

				activePortfolioIds.forEach((pId) => {
					if (lastKnownState[pId]) {
						dayTotalValue += lastKnownState[pId].value;
						dayInvestedValue += lastKnownState[pId].invested;
					}
				});

				baseData.push({
					date: dateStr,
					value: Number(dayTotalValue.toFixed(2)),
					invested: Number(dayInvestedValue.toFixed(2)),
					change: Number(dayDailyChangeFromDB.toFixed(2)),
					isPositive: dayDailyChangeFromDB >= 0,
				});

				finalAbsoluteData.push({
					date: dateStr,
					exactChangePLN: Number(dayExactChangePLN.toFixed(2)),
					totalPortfolioValue: Number(dayTotalValue.toFixed(2)),
					netCashFlow: Number(dayNetCashFlow.toFixed(2)),
				});
			});

			// Build Benchmark arrays
			const mockIndexHistory: Record<string, Record<string, number>> = {};
			userIndices.forEach((idx, i) => {
				mockIndexHistory[idx] = {};
				if (dataMode === "SIMULATED") {
					let fakeBasePrice = 1000;
					allDates.forEach((dateStr, index) => {
						fakeBasePrice += Math.sin(index + i * 2) * 15 + i * 1.5;
						mockIndexHistory[idx][dateStr] = fakeBasePrice;
					});
				} else {
					const normalizedHistory: Record<string, number> = {};
					if (indexQuotesHistory[idx]) {
						Object.keys(indexQuotesHistory[idx]).forEach((fullDate) => {
							normalizedHistory[getDateStr(fullDate)] =
								indexQuotesHistory[idx][fullDate];
						});
					}
					let lastKnownPrice = 100;
					const availableDates = Object.keys(normalizedHistory).sort();
					if (availableDates.length > 0)
						lastKnownPrice = normalizedHistory[availableDates[0]];
					allDates.forEach((dateStr) => {
						if (normalizedHistory[dateStr] !== undefined)
							lastKnownPrice = normalizedHistory[dateStr];
						mockIndexHistory[idx][dateStr] = lastKnownPrice;
					});
				}
			});

			const finalBenchmarkData: any[] = [];
			const firstDay = baseData[0];
			const initialPortfolioValue = firstDay ? firstDay.value : 0;
			const initialPortfolioInvested = firstDay ? firstDay.invested : 0;
			const basePortfolioPct =
				initialPortfolioInvested > 0
					? ((initialPortfolioValue - initialPortfolioInvested) /
							initialPortfolioInvested) *
						100
					: 0;

			const baseIndexValues: Record<string, number> = {};
			userIndices.forEach((idx) => {
				baseIndexValues[idx] =
					firstDay && mockIndexHistory[idx][firstDay.date]
						? mockIndexHistory[idx][firstDay.date]
						: 0;
			});

			for (let i = 0; i < baseData.length; i++) {
				const today = baseData[i];
				let currentPortfolioPct = 0;
				if (today.invested > 0) {
					currentPortfolioPct =
						((today.value - today.invested) / today.invested) * 100 -
						basePortfolioPct;
				}
				const dataPoint: any = {
					date: today.date,
					portfolioPct: Number(currentPortfolioPct.toFixed(2)),
				};
				userIndices.forEach((idx) => {
					let idxPct = 0;
					const todayValue = mockIndexHistory[idx][today.date];
					const baseValue = baseIndexValues[idx];
					if (baseValue > 0)
						idxPct = ((todayValue - baseValue) / baseValue) * 100;
					dataPoint[idx] = Number(idxPct.toFixed(2));
				});
				finalBenchmarkData.push(dataPoint);
			}

			let finalChartData: ChartDataPoint[] = [];
			if (chartMode === "PERCENTAGE") {
				finalChartData = baseData.map((point) => {
					const pct =
						point.invested > 0
							? ((point.value - point.invested) / point.invested) * 100
							: 0;
					return {
						date: point.date,
						value: Number(pct.toFixed(2)),
						invested: 0,
					};
				});
			} else {
				finalChartData = baseData.map((point) => ({
					date: point.date,
					value: point.value,
					invested: point.invested,
				}));
			}

			return {
				portfolioChartData: finalChartData,
				absoluteChartData: finalAbsoluteData,
				benchmarkChartData: finalBenchmarkData,
			};
		}, [
			compressedSnapshots,
			selectedIds,
			chartMode,
			dataMode,
			userIndices,
			indexQuotesHistory,
		]);

	// STEP 4: Comparison Chart Data (uses same compressed snapshots)
	const portfoliosComparisonData = useMemo(() => {
		if (compressedSnapshots.length === 0) return [];
		const dataByDate: Record<string, any> = {};

		compressedSnapshots.forEach((snapshot) => {
			const dateStr = new Date(snapshot.date).toISOString().split("T")[0];
			if (!dataByDate[dateStr]) dataByDate[dateStr] = { date: snapshot.date };

			const pnlValue = snapshot.totalValue - snapshot.investedValue;
			const pnlPercentage =
				snapshot.investedValue > 0
					? (pnlValue / snapshot.investedValue) * 100
					: 0;

			dataByDate[dateStr][snapshot.portfolioId] =
				chartMode === "PERCENTAGE"
					? Number(pnlPercentage.toFixed(2))
					: Number(pnlValue.toFixed(2));
		});

		return (Object.values(dataByDate) as any[]).sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
	}, [compressedSnapshots, chartMode]);

	return {
		isPending,
		dataMode,
		setDataMode,
		chartMode,
		setChartMode,
		selectedIds,
		activeRange,
		fromDate,
		toDate,
		togglePortfolio,
		handleRangeChange,
		handleDateRangeSelect,
		isRangeDisabled,
		filteredTransactions,
		activePortfolios,
		totalInvested,
		totalCurrent,
		totalPnL,
		totalPnLPct,
		observedAssets,
		portfolioChartData,
		absoluteChartData,
		benchmarkChartData,
		portfoliosComparisonData,
	};
}

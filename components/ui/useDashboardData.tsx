import { differenceInDays, format, startOfYear } from "date-fns";
import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ChartDataPoint } from "../dashboard/PortfolioCharts";
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
	const fromDate = currentFrom ? new Date(currentFrom) : undefined;
	const toDate = currentTo ? new Date(currentTo) : undefined;

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

	// 1. Zaznaczone portfele
	const selectedPortfolios = selectedIds.includes("ALL")
		? portfolios
		: portfolios.filter((p) => selectedIds.includes(p.id));

	const activePortfolios = selectedPortfolios.map((p) => ({
		id: p.id,
		name: p.name,
	}));

	// 2. Podsumowanie finansowe (PLN)
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

	// 3. Obserwowane aktywa
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

	// 4. Kalkulacje dostępności zakresów czasowych (isRangeDisabled)
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

	// 5. Złożone generowanie wykresów (Główny silnik, Benchmark, PnL)
	const {
		portfolioChartData,
		pnlChartData,
		absoluteChartData,
		benchmarkChartData,
	} = useMemo(() => {
		const activeSnapshots =
			dataMode === "SIMULATED" ? snapshots : realSnapshots;
		const getDateStr = (d: string | Date) => {
			const dateObj = new Date(d);
			return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
		};

		const sortedSnapshots = [...activeSnapshots].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		const allDates = Array.from(
			new Set(sortedSnapshots.map((s) => getDateStr(s.date))),
		);
		const activePortfolioIds = selectedIds.includes("ALL")
			? Array.from(new Set(activeSnapshots.map((s) => s.portfolioId)))
			: selectedIds;

		const lastKnownState: Record<string, { value: number; invested: number }> =
			{};
		const seenPortfolios = new Set();
		const baseData: any[] = [];
		const finalAbsoluteData: any[] = [];

		// KROK 1: Budujemy bazowe dane (baseData)
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

		// KROK 2: Benchmark
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
				return { date: point.date, value: Number(pct.toFixed(2)), invested: 0 };
			});
		} else {
			finalChartData = baseData.map((point) => ({
				date: point.date,
				value: point.value,
				invested: point.invested,
			}));
		}

		const finalPnlData = baseData.map((point) => ({
			date: point.date,
			change: point.change,
			isPositive: point.isPositive,
		}));

		return {
			portfolioChartData: finalChartData,
			pnlChartData: finalPnlData,
			absoluteChartData: finalAbsoluteData,
			benchmarkChartData: finalBenchmarkData,
		};
	}, [
		snapshots,
		realSnapshots,
		selectedIds,
		chartMode,
		dataMode,
		userIndices,
		indexQuotesHistory,
	]);

	// 6. Generator Danych dla Wyścigu Portfeli (Portfolios Comparison)
	const portfoliosComparisonData = useMemo(() => {
		if (!realSnapshots || realSnapshots.length === 0) return [];

		type CompareDataPoint = { date: string | Date; [key: string]: any };
		const dataByDate: Record = {};

		realSnapshots.forEach((snapshot) => {
			// 🚀 USUNIĘTO FILTROWANIE - teraz generujemy punkty dla każdego portfela!
			const dateStr = new Date(snapshot.date).toISOString().split("T")[0];

			if (!dataByDate[dateStr]) {
				dataByDate[dateStr] = { date: snapshot.date };
			}

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

		return (Object.values(dataByDate) as CompareDataPoint[]).sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
	}, [realSnapshots, chartMode]);

	// Zwracamy wszystko, co będzie potrzebne w widoku
	return {
		// Stany wyciągnięte z hooków
		isPending,
		dataMode,
		setDataMode,
		chartMode,
		setChartMode,
		selectedIds,
		activeRange,
		fromDate,
		toDate,
		// Akcje (Funkcje)
		togglePortfolio,
		handleRangeChange,
		handleDateRangeSelect,
		isRangeDisabled,
		// Obliczone dane
		filteredTransactions,
		activePortfolios,
		totalInvested,
		totalCurrent,
		totalPnL,
		totalPnLPct,
		observedAssets,
		// Dane do wykresów
		portfolioChartData,
		pnlChartData,
		absoluteChartData,
		benchmarkChartData,
		portfoliosComparisonData,
	};
}

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
	const [dataMode, setDataMode] = useState<"REAL" | "SIMULATED">("REAL");
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

	// STEP 1: Time Filtering (Dotyczy tylko snapshotów Portfela)
	const timeFilteredSnapshots = useMemo(() => {
		const activeSnaps = dataMode === "SIMULATED" ? snapshots : realSnapshots;
		if (activeSnaps.length === 0) return [];

		const now = new Date();
		now.setUTCHours(0, 0, 0, 0);
		let cutoff = new Date(0);

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

	// STEP 2: Downsampling Compressor (Dla Portfeli)
	const compressedSnapshots = useMemo(() => {
		if (timeFilteredSnapshots.length === 0) return [];

		const dates = timeFilteredSnapshots.map((s) => new Date(s.date).getTime());
		const minDate = Math.min(...dates);
		const maxDate = Math.max(...dates);
		const daysDiff = differenceInDays(new Date(maxDate), new Date(minDate));

		if (daysDiff < 90) return timeFilteredSnapshots;

		const groupedByPeriod: Record<string, SimulatedSnapshot[]> = {};
		timeFilteredSnapshots.forEach((snap) => {
			const dateObj = new Date(snap.date);
			let periodKey = "";

			if (daysDiff >= 90 && daysDiff <= 730) {
				periodKey = format(
					endOfWeek(dateObj, { weekStartsOn: 1 }),
					"yyyy-MM-dd",
				);
			} else {
				periodKey = format(endOfMonth(dateObj), "yyyy-MM-dd");
			}

			if (!groupedByPeriod[periodKey]) groupedByPeriod[periodKey] = [];
			groupedByPeriod[periodKey].push(snap);
		});

		const downsampledSnapshots: SimulatedSnapshot[] = [];
		Object.values(groupedByPeriod).forEach((periodSnaps) => {
			const portfolioSnaps: Record<string, SimulatedSnapshot> = {};

			periodSnaps.sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			);

			periodSnaps.forEach((snap) => {
				const prevSnap = portfolioSnaps[snap.portfolioId];
				portfolioSnaps[snap.portfolioId] = { ...snap };

				if (prevSnap) {
					portfolioSnaps[snap.portfolioId].dailyChange += prevSnap.dailyChange;
				}
			});
			downsampledSnapshots.push(...Object.values(portfolioSnaps));
		});

		return downsampledSnapshots;
	}, [timeFilteredSnapshots]);

	// STEP 3: Generowanie Danych Wykresów z Oddzielnymi Osiami Czasu
	const { portfolioChartData, absoluteChartData, benchmarkChartData } =
		useMemo(() => {
			if (
				compressedSnapshots.length === 0 &&
				Object.keys(indexQuotesHistory).length === 0
			) {
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

			// ============================================================================
			// CZĘŚĆ 1: ZABEZPIECZENIE STARYCH WYKRESÓW (AbsoluteDailyPnLChart i PortfolioChart)
			// (Ta logika jest Nienaruszona - opiera się WYŁĄCZNIE na istnieniu portfela)
			// ============================================================================
			const portfolioDates = Array.from(
				new Set(sortedSnapshots.map((s) => getDateStr(s.date))),
			).sort();

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

			portfolioDates.forEach((dateStr) => {
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

			// ============================================================================
			// CZĘŚĆ 2: NOWY, NIEZALEŻNY BENCHMARK DLA INDEKSÓW (Rozciąga się na pełne 5 lat)
			// ============================================================================

			// A. Wyznaczamy najwcześniejszą datę dla wykresu z wbudowanych filtrów (np. YTD, 5Y)
			const now = new Date();
			now.setUTCHours(0, 0, 0, 0);
			let cutoff = new Date(0);
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

			// B. Pobieramy daty giełdowe bezpośrednio z prawdzich odczytów Yahoo (indexQuotesHistory)
			let benchmarkDatesSet = new Set<string>();
			userIndices.forEach((idx) => {
				if (indexQuotesHistory[idx]) {
					Object.keys(indexQuotesHistory[idx]).forEach((d) => {
						const dTime = new Date(d).getTime();
						const toTime = toDate
							? new Date(toDate).getTime()
							: new Date().getTime();
						if (dTime >= cutoff.getTime() && dTime <= toTime) {
							benchmarkDatesSet.add(d);
						}
					});
				}
			});
			let benchmarkDates = Array.from(benchmarkDatesSet).sort();
			if (benchmarkDates.length === 0) benchmarkDates = portfolioDates; // Jeśli brak API, fallback na daty portfela

			// C. Przygotowanie Dziennika Wycen dla Portfela (żeby móc go rzucić na długą oś Yahoo)
			const portfolioDailyMap: Record<
				string,
				{
					value: number;
					invested: number;
					pIdStates: Record<string, { value: number; invested: number }>;
				}
			> = {};
			let currentPortTotalValue = 0;
			let currentPortInvested = 0;
			let currentPIdStates: Record<
				string,
				{ value: number; invested: number }
			> = {};
			let portfolioStarted = false;

			const snapsByDate: Record<string, SimulatedSnapshot[]> = {};
			sortedSnapshots.forEach((s) => {
				const d = getDateStr(s.date);
				if (!snapsByDate[d]) snapsByDate[d] = [];
				snapsByDate[d].push(s);
			});

			// Łączymy daty Yahoo z Datami Portfela, żeby przenieść saldo na weekendy
			const allCombinedDates = Array.from(
				new Set([...benchmarkDates, ...portfolioDates]),
			).sort();

			allCombinedDates.forEach((dateStr) => {
				const snapsToday = snapsByDate[dateStr] || [];
				if (snapsToday.length > 0) {
					portfolioStarted = true;
					snapsToday.forEach((snap) => {
						if (activePortfolioIds.includes(snap.portfolioId)) {
							currentPIdStates[snap.portfolioId] = {
								value: snap.totalValue,
								invested: snap.investedValue,
							};
						}
					});
					currentPortTotalValue = 0;
					currentPortInvested = 0;
					activePortfolioIds.forEach((pId) => {
						if (currentPIdStates[pId]) {
							currentPortTotalValue += currentPIdStates[pId].value;
							currentPortInvested += currentPIdStates[pId].invested;
						}
					});
				}

				if (portfolioStarted) {
					portfolioDailyMap[dateStr] = {
						value: currentPortTotalValue,
						invested: currentPortInvested,
						pIdStates: { ...currentPIdStates },
					};
				}
			});

			// D. Baza dla osi Y (Od którego punktu procentowego / pln startujemy)
			const firstBenchmarkDate = benchmarkDates[0];
			const baseIndexValues: Record<string, number> = {};

			userIndices.forEach((idx) => {
				// Znajdź wartość otwarcia z pierwszego dnia giełdowego po wybranym filtrze
				let firstVal = indexQuotesHistory[idx]?.[firstBenchmarkDate];
				if (firstVal === undefined) {
					const availableDates = Object.keys(
						indexQuotesHistory[idx] || {},
					).sort();
					const nextDate = availableDates.find((d) => d >= firstBenchmarkDate);
					firstVal = nextDate ? indexQuotesHistory[idx][nextDate] : 0;
				}
				baseIndexValues[idx] = firstVal || 0;
			});

			// Dla trybu wycen (PLN) indeksy będą udawać kapitał, jaki zainwestowałeś na starcie.
			const firstPortfolioDayWithData = baseData[0];
			const initialPortfolioValue = firstPortfolioDayWithData
				? firstPortfolioDayWithData.value
				: 0;
			const initialPortfolioInvested = firstPortfolioDayWithData
				? firstPortfolioDayWithData.invested
				: 0;
			const anchorValueForIndices =
				initialPortfolioInvested > 0
					? initialPortfolioInvested
					: initialPortfolioValue;

			const basePortMap = portfolioDailyMap[firstBenchmarkDate];
			let baseTotalPct = 0;
			const basePortfolioPcts: Record<string, number> = {};

			if (basePortMap) {
				if (basePortMap.invested > 0) {
					baseTotalPct =
						((basePortMap.value - basePortMap.invested) /
							basePortMap.invested) *
						100;
				}
				activePortfolioIds.forEach((pId) => {
					const st = basePortMap.pIdStates[pId];
					if (st && st.invested > 0) {
						basePortfolioPcts[pId] =
							((st.value - st.invested) / st.invested) * 100;
					} else {
						basePortfolioPcts[pId] = 0;
					}
				});
			}

			// E. GŁÓWNA PĘTLA WYKRESU BENCHMARK (Teraz całkowicie odseparowana od "Sym"!)
			const finalBenchmarkData: any[] = [];
			benchmarkDates.forEach((dateStr) => {
				const dataPoint: any = { date: dateStr };

				// I. Portfele: Jeśli data jest sprzed momentu stworzenia Twojego portfela, zmienna 'portState' jest PUSTA.
				// Recharts ominie ten dzień i nie narysuje tam żadnej linii portfela. Zrobi to dopiero od października.
				const portState = portfolioDailyMap[dateStr];
				if (portState) {
					if (chartMode === "PERCENTAGE") {
						let currentTotalPct =
							portState.invested > 0
								? ((portState.value - portState.invested) /
										portState.invested) *
									100
								: 0;
						dataPoint["TOTAL_CAPITAL"] = Number(
							(currentTotalPct - baseTotalPct).toFixed(2),
						);

						activePortfolioIds.forEach((pId) => {
							const st = portState.pIdStates[pId];
							if (st) {
								let currentPct =
									st.invested > 0
										? ((st.value - st.invested) / st.invested) * 100
										: 0;
								dataPoint[pId] = Number(
									(currentPct - (basePortfolioPcts[pId] || 0)).toFixed(2),
								);
							}
						});
					} else {
						dataPoint["TOTAL_CAPITAL"] = Number(portState.value.toFixed(2));
						activePortfolioIds.forEach((pId) => {
							const st = portState.pIdStates[pId];
							if (st) dataPoint[pId] = Number(st.value.toFixed(2));
						});
					}
				}

				// II. Globalne Indeksy: Narysują się na CAŁEJ długości osi X (np. całe 5 lat)
				userIndices.forEach((idx) => {
					const todayValue = indexQuotesHistory[idx]?.[dateStr];
					const baseValue = baseIndexValues[idx];

					if (todayValue !== undefined && baseValue > 0) {
						if (chartMode === "PERCENTAGE") {
							const idxPct = ((todayValue - baseValue) / baseValue) * 100;
							dataPoint[idx] = Number(idxPct.toFixed(2));
						} else {
							const multiplier = todayValue / baseValue;
							const simulatedValue = anchorValueForIndices * multiplier;
							dataPoint[idx] = Number(simulatedValue.toFixed(2));
						}
					}
				});

				finalBenchmarkData.push(dataPoint);
			});

			return {
				portfolioChartData: finalChartData,
				absoluteChartData: finalAbsoluteData,
				benchmarkChartData: finalBenchmarkData,
			};
		}, [
			compressedSnapshots,
			selectedIds,
			chartMode,
			activeRange, // 🚀 Reaguje na każdą zmianę filtru 1M, YTD, 5Y
			fromDate,
			toDate,
			userIndices,
			indexQuotesHistory,
		]);

	// STEP 4: Comparison Chart Data (Tylko Portfele, bez zmian)
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
		portfolios,
	};
}

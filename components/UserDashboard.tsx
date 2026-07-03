"use client";

import {
	Activity,
	Banknote,
	Briefcase,
	Container,
	Globe,
	LineChart,
	Wallet2,
} from "lucide-react";
import { ChartDataPoint, PortfolioChart } from "./dashboard/PortfolioCharts";
import { cn, getStockLogo } from "@/lib/utils";
import { differenceInDays, startOfYear } from "date-fns";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AbsoluteDailyPnLChart } from "./dashboard/AbsoluteDailyPnLChart";
import { DatePickerWithRange } from "./shared/DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { ExpandableMainChart } from "./dashboard/ExpandableMainChart";
import { FilterBadge } from "./shared/FilterBadge";
import { MarketRow } from "./home/MarketRow";
import { PortfolioBenchmarkChart } from "./dashboard/PortfolioBenchmarkChart";
import { PortfolioWithAssets } from "@/lib/types";
import { SectionLayout } from "./shared/SectionLayout";
import { ValueCard } from "./shared/ValueCard";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const TIME_RANGES = ["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX"];
const GLOBAL_INDICES_MAP: Record<string, string> = {
	SP500: "S&P 500",
	NASDAQ: "NASDAQ 100",
	WIG20: "WIG20",
	DAX: "DAX 40",
	GOLD: "Złoto (XAU/USD)",
	BTC: "Bitcoin",
};

export interface SimulatedSnapshot {
	id: string;
	portfolioId: string;
	date: string | Date;
	totalValue: number;
	investedValue: number;
	dailyChange: number;
	isPositive: boolean;
}
interface UserDashboardProps {
	portfolios: PortfolioWithAssets[];
	snapshots: SimulatedSnapshot[]; // To jest nasza symulacja
	realSnapshots?: SimulatedSnapshot[]; // Gotowość na przyjęcie bazy danych
	userIndices?: string[];
	indexQuotes?: Record<string, number>;
	lastUpdated?: string | null;
	currentRange?: string;
}

export function UserDashboard({
	portfolios,
	snapshots,
	realSnapshots = [], //  Domyślnie pusta tablica
	userIndices = [],
	indexQuotes = {},
	lastUpdated = null,
	currentRange = "1M",
}: UserDashboardProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Pobieramy wszystkie transakcje ze wszystkich portfeli
	const allTransactions = useMemo(() => {
		return portfolios.flatMap((p) => p.transactionHistories || []);
	}, [portfolios]);

	// NATYCHMIASTOWY STAN UI
	const activeRange = searchParams.get("range") || "1M";

	const [dataMode, setDataMode] = useState<"REAL" | "SIMULATED">("SIMULATED");
	const [chartMode, setChartMode] = useState<"VALUE" | "PERCENTAGE">("VALUE");
	const [selectedIds, setSelectedIds] = useState<string[]>(["ALL"]);

	// FILTROWANIE TRANSAKCJI DLA WYKRESU (magia ukrywania kropek)
	const filteredTransactions = useMemo(() => {
		if (selectedIds.includes("ALL")) return allTransactions;
		return allTransactions.filter((tx) => selectedIds.includes(tx.portfolioId));
	}, [allTransactions, selectedIds]);

	// NOWY STAN: Wybór źródła danych (Domyślnie bierzemy prawdziwe z bazy, chyba że ich nie ma)
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
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	const currentFrom = searchParams.get("from") || "";
	const currentTo = searchParams.get("to") || "";

	// Konwertujemy stringi z URL na obiekty Date dla nowego kalendarza
	const fromDate = currentFrom ? new Date(currentFrom) : undefined;
	const toDate = currentTo ? new Date(currentTo) : undefined;

	// Nowa potężna funkcja aktualizująca obie daty naraz
	const handleDateRangeSelect = (range: DateRange | undefined) => {
		const params = new URLSearchParams(searchParams.toString());

		if (range?.from) {
			params.set("range", "CUSTOM");
			// formatujemy do YYYY-MM-DD bezpiecznie dla stref czasowych
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

	const {
		portfolioChartData,
		pnlChartData, // EN: Dodane, żeby uniknąć błędu braku zmiennej, jeśli jej używasz
		absoluteChartData,
		benchmarkChartData, // EN: TUTAJ wyciągamy naszą nową zmienną!
	} = useMemo(() => {
		// EN: SELECT DATA SOURCE
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
		const seenPortfolios = new Set<string>();

		const baseData: any[] = [];
		const finalAbsoluteData: any[] = [];

		// === KROK 1: Najpierw budujemy bazowe dane naszego portfela (baseData) ===
		allDates.forEach((dateStr) => {
			const snapsToday = sortedSnapshots.filter(
				(s) =>
					getDateStr(s.date) === dateStr &&
					activePortfolioIds.includes(s.portfolioId),
			);

			let dayTotalValue = 0;
			let dayInvestedValue = 0;
			let dayDailyChangeFromDB = 0;

			let dayNetCashFlow = 0;
			let dayExactChangePLN = 0;

			snapsToday.forEach((snap) => {
				dayDailyChangeFromDB += snap.dailyChange;

				const isFirstTime = !seenPortfolios.has(snap.portfolioId);

				if (isFirstTime) {
					seenPortfolios.add(snap.portfolioId);
					dayNetCashFlow += 0;
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

		// === KROK 2: Dopiero teraz budujemy wykres Benchmark, gdy baseData jest pełne ===

		// === KROK 2: Dopiero teraz budujemy wykres Benchmark, gdy baseData jest pełne ===

		// EN: Simulated historical data for ALL dynamic user indices
		const mockIndexHistory: Record<string, Record<string, number>> = {};
		const fakePrices: Record<string, number> = {};

		// EN: Initialize starting values for whatever indices the user has (BTC, GOLD, etc.)
		userIndices.forEach((idx) => {
			fakePrices[idx] = 1000;
			mockIndexHistory[idx] = {};
		});

		allDates.forEach((date, index) => {
			userIndices.forEach((idx, i) => {
				// EN: Generate a unique fake wave for each index so they don't overlap on the chart
				fakePrices[idx] += Math.sin(index + i * 2) * 15 + i * 1.5;
				mockIndexHistory[idx][date] = fakePrices[idx];
			});
		});

		const finalBenchmarkData = [];

		const firstDay = baseData[0];
		const initialPortfolioValue = firstDay ? firstDay.value : 0;
		const initialPortfolioInvested = firstDay ? firstDay.invested : 0;

		const basePortfolioPct =
			initialPortfolioInvested > 0
				? ((initialPortfolioValue - initialPortfolioInvested) /
						initialPortfolioInvested) *
					100
				: 0;

		// EN: Get base values for all indices on day 1
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
				const rawPct = ((today.value - today.invested) / today.invested) * 100;
				currentPortfolioPct = rawPct - basePortfolioPct;
			}

			// EN: Create the base data point with the portfolio's performance
			const dataPoint: any = {
				date: today.date,
				portfolioPct: Number(currentPortfolioPct.toFixed(2)),
			};

			// EN: Loop through each index and calculate its relative performance
			userIndices.forEach((idx) => {
				let idxPct = 0;
				const todayValue = mockIndexHistory[idx][today.date];
				const baseValue = baseIndexValues[idx];

				if (baseValue > 0) {
					idxPct = ((todayValue - baseValue) / baseValue) * 100;
				}
				// EN: Add the dynamic key (e.g., BTC: 2.45) to the object
				dataPoint[idx] = Number(idxPct.toFixed(2));
			});

			finalBenchmarkData.push(dataPoint);
		}

		// === KROK 3: Mapowanie pozostałych wykresów i zwracanie danych ===
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

		const finalPnlData = baseData.map((point) => ({
			date: point.date,
			change: point.change,
			isPositive: point.isPositive,
		}));

		return {
			portfolioChartData: finalChartData,
			pnlChartData: finalPnlData,
			absoluteChartData: finalAbsoluteData,
			benchmarkChartData: finalBenchmarkData, // EN: Zwracamy zmienną z hooka!
		};
	}, [snapshots, realSnapshots, selectedIds, chartMode, dataMode, userIndices]);

	const selectedPortfolios = selectedIds.includes("ALL")
		? portfolios
		: portfolios.filter((p) => selectedIds.includes(p.id));

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
	// EN: Extract unique assets for the "Observed Markets" widget
	const observedAssets = useMemo(() => {
		if (!portfolios || portfolios.length === 0) return [];

		const allAssets = portfolios.flatMap((p) => p.assets || []);

		// EN: Filter out bonds and cash, and strictly include only observed assets
		const riskAssets = allAssets.filter(
			(a) =>
				a.category !== "BONDS" &&
				a.category !== "CASH" &&
				a.isObserved === true,
		);

		const uniqueAssets = [];
		const seenIdentifiers = new Set();

		for (const asset of riskAssets) {
			// EN: Prioritize name over ticker
			const identifier = asset.name || asset.ticker;

			if (!seenIdentifiers.has(identifier)) {
				seenIdentifiers.add(identifier);
				uniqueAssets.push(asset);
			}
		}

		// EN: Return all unique observed assets since limits are handled in Settings
		return uniqueAssets;
	}, [portfolios]);

	// SZUKAMY DATY NAJSTARSZEGO SNAPSHOTU RZECZYWISTEGO
	const oldestRealSnapshotDate = useMemo(() => {
		if (!realSnapshots || realSnapshots.length === 0) return new Date();
		const oldestTime = realSnapshots.reduce((min, s) => {
			const sDate = new Date(s.date).getTime();
			return sDate < min ? sDate : min;
		}, new Date().getTime());
		return new Date(oldestTime);
	}, [realSnapshots]);

	// FUNKCJA BLOKUJĄCA PRZYCISKI CZASU
	const isRangeDisabled = (range: string) => {
		// W trybie SYMULACJI pozwalamy na wszystko (silnik sobie policzy wstecz)
		if (dataMode === "SIMULATED") return false;

		const daysAvailable = differenceInDays(new Date(), oldestRealSnapshotDate);

		switch (range) {
			case "3M":
				return daysAvailable < 30; // Wyłącz 3M, jeśli mamy mniej niż miesiąc historii
			case "YTD": {
				const daysYtd = differenceInDays(new Date(), startOfYear(new Date()));
				return daysAvailable < Math.min(30, daysYtd);
			}
			case "1Y":
				return daysAvailable < 90; // Wyłącz 1Y, jeśli nie mamy chociaż 3 miesięcy
			case "3Y":
				return daysAvailable < 365;
			case "5Y":
				return daysAvailable < 1095;
			default:
				return false; // 1W, 1M oraz MAX zostawiamy zawsze włączone (żeby coś się wyświetlało)
		}
	};

	return (
		<div className="space-y-8">
			{/* 1. SEKCJA:  HEADER  */}
			<header className="relative overflow-hidden flex flex-col gap-8 w-full border-b border-white/10 bg-slate-900 dark:border-t-border rounded-b-2xl text-slate-100 p-6 md:p-8 transition-colors shadow-lg">
				{/* TEKSTURA SVG */}
				<div
					className="absolute inset-0 z-0 pointer-events-none opacity-40 transition-opacity"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%2310b981' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%2310b981' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%233b82f6' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%233b82f6' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
						WebkitMaskImage:
							"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
						maskImage:
							"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
					}}
				/>

				{/* GÓRA: Tytuł i FILTRY PORTFELI */}
				<div className="relative z-10">
					<h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-sm mb-3 bg-slate-900 w-fit">
						Przegląd Inwestycji
					</h1>

					{/* Interaktywne filtry */}
					<div className="flex flex-wrap items-center gap-2 mt-2">
						<span className="text-xs font-bold text-slate-400 uppercase flex-1 md:grow tracking-wider mr-2">
							Analizowane portfele (Wybierz, aby porównać):
						</span>
						<div className="flex gap-3 flex-wrap">
							<FilterBadge
								id="ALL"
								label="Wszystkie Portfele"
								isSelected={selectedIds.includes("ALL")}
								onToggle={togglePortfolio}
								className="text-blue-300"
							/>
							{portfolios.map((p) => (
								<FilterBadge
									key={p.id}
									id={p.id}
									label={p.name}
									isSelected={selectedIds.includes(p.id)}
									onToggle={togglePortfolio}
									className="text-blue-300"
								/>
							))}
						</div>
					</div>
				</div>

				{/* DÓŁ: Statystyki dynamiczne */}
				<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pt-4">
					<div className="space-y-1">
						<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[10px] uppercase mb-1">
							<Wallet2 className="w-3.5 h-3.5" />
							<span>Wartość Zaznaczonych Portfeli</span>
						</div>
						<div className="flex items-baseline gap-2">
							<h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm">
								{totalCurrent.toLocaleString("pl-PL", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</h2>
							<span className="text-xl md:text-2xl text-slate-500 font-bold">
								PLN
							</span>
						</div>
					</div>

					<div className="flex self-start sm:justify-end flex-wrap gap-8 md:gap-12 overflow-x-auto no-scrollbar">
						<ValueCard
							label="Zainwestowany kapitał"
							icon={Container}
							value={totalInvested}
							formatString
							suffix="PLN"
						/>
						<ValueCard label="Całkowity Wynik (P&L)">
							<div className="flex items-center gap-2 font-mono">
								<span
									className={cn(
										"text-xl font-bold tracking-tight transition-colors",
										totalPnL > 0
											? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
											: totalPnL < 0
												? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
												: "text-slate-400",
									)}
								>
									{totalPnL > 0 ? "+" : ""}
									{totalPnL.toLocaleString("pl-PL", {
										minimumFractionDigits: 2,
									})}
								</span>

								<span
									className={cn(
										"flex items-center text-xs font-bold px-2 py-0.5 rounded-sm transition-colors",
										totalPnLPct > 0
											? "bg-emerald-500/10 text-emerald-400"
											: totalPnLPct < 0
												? "bg-rose-500/10 text-rose-500"
												: "bg-white/10 text-slate-300",
									)}
								>
									{totalPnLPct > 0 ? "+" : ""}
									{totalPnLPct.toFixed(2)}%
								</span>
							</div>
						</ValueCard>
					</div>
				</div>
			</header>

			<SectionLayout
				title="Radar Rynkowy"
				titleIcon={Activity}
				subtitle="Śledź kluczowe wskaźniki i wybrane aktywa."
				description="Zestawienie globalnych indeksów makroekonomicznych oraz wytypowanych walorów z Twojego portfela."
			>
				<div className="flex flex-col md:flex-row gap-6  ">
					{/* SEKCJA 2: AKTYWA Z PORTFELA */}
					<div className="bg-t-bg-sticky border border-t-border rounded-3xl p-5 shadow-sm  flex-1">
						<div className="flex items-center justify-between mb-4">
							<h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500  flex items-center gap-2">
								<Briefcase className="w-4 h-4 text-blue-500" /> Z Twojego
								Portfela
							</h4>
							{/* ZNACZNIK CZASU AKTUALIZACJI */}
							{lastUpdated && (
								<span className="text-[9px] font-bold text-slate-400 bg-t-bg-sticky px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700/50">
									<div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse " />
									{format(new Date(lastUpdated), "HH:mm, dd MMM", {
										locale: pl,
									})}
								</span>
							)}
						</div>

						<div className="space-y-4">
							{observedAssets.length > 0 ? (
								observedAssets.map((asset) => {
									const changeValue = asset.dailyChange || 0;
									const isPositive = changeValue >= 0;
									const displayValue =
										changeValue !== 0
											? `${isPositive ? "+" : ""}${changeValue.toFixed(2)}%`
											: "0.00%";

									return (
										<MarketRow
											key={asset.id}
											name={asset.name}
											value={displayValue}
											isPositive={isPositive}
											logo={getStockLogo(asset.ticker ?? "")} // <--- Pobieramy logo dla aktywów z portfela
										/>
									);
								})
							) : (
								<div className="flex flex-col items-center justify-center py-6 opacity-50 text-center space-y-2">
									<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
										Brak aktywów
									</p>
									<p className="text-[10px] text-t-text-tertiary px-4 leading-relaxed">
										Przejdź do ustawień, aby wybrać walory do obserwacji.
									</p>
								</div>
							)}
						</div>
					</div>
					<div className="flex-1">
						{/* SEKCJA 1: GLOBALNE INDEKSY */}
						{userIndices && userIndices.length > 0 && (
							<div className="bg-t-bg-sticky border border-t-border rounded-3xl p-5 shadow-sm">
								<div className="flex items-center justify-between mb-4">
									<h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
										<Globe className="w-4 h-4 text-amber-500" /> Wskaźniki Makro
									</h4>

									{/* ZNACZNIK CZASU AKTUALIZACJI */}
									{lastUpdated && (
										<span className="text-[9px] font-bold text-slate-400 bg-t-bg-sticky px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700/50">
											<div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
											{format(new Date(lastUpdated), "HH:mm, dd MMM", {
												locale: pl,
											})}
										</span>
									)}
								</div>

								<div className="space-y-4">
									{userIndices.map((indexId) => {
										const indexName = GLOBAL_INDICES_MAP[indexId] || indexId;
										const changeValue = indexQuotes[indexId] || 0;
										const isPositive = changeValue >= 0;
										const displayValue =
											changeValue !== 0
												? `${isPositive ? "+" : ""}${changeValue.toFixed(2)}%`
												: "0.00%";

										// Wygenerowanie ikony z Favicon dla indeksów globalnych
										const logoUrl = `https://www.google.com/s2/favicons?domain=${
											indexId === "SP500"
												? "spglobal.com"
												: indexId === "NASDAQ"
													? "nasdaq.com"
													: indexId === "BTC"
														? "bitcoin.org"
														: "finance.yahoo.com"
										}&sz=128`;

										return (
											<MarketRow
												key={indexId}
												name={indexName}
												value={displayValue}
												isPositive={isPositive}
												logo={logoUrl} // <--- PRZEKAZUJEMY LOGO
											/>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>
			</SectionLayout>

			{/* 2. SEKCJA: WYKRES GŁÓWNY Z FILTRAMI */}

			<SectionLayout
				title="Analiza Wykresowa"
				titleIcon={LineChart}
				subtitle="Sprawdź wyniki swoich inwestycji w czasie"
				description="Ten wykres przedstawia zmianę wartości Twoich inwestycji w czasie. Linia przerywana oznacza fizycznie wpłacony kapitał. Możesz płynnie przełączać się między klasycznym widokiem kwotowym (PLN), a widokiem procentowym (%), który najlepiej oddaje faktyczną wydajność (stopę zwrotu) Twojego portfela."
			>
				<div className="flex flex-col gap-4 mb-6 mt-4">
					<div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
						{/* LEWA STRONA (Filtry walut i ŹRÓDŁO DANYCH) */}
						<div className="flex flex-wrap items-center gap-4">
							<div className="flex items-center gap-2">
								<FilterBadge
									id="VALUE"
									label="Wartość (PLN)"
									isSelected={chartMode === "VALUE"}
									onToggle={() => setChartMode("VALUE")}
								/>
								<FilterBadge
									id="PERCENTAGE"
									label="Zwrot (%)"
									isSelected={chartMode === "PERCENTAGE"}
									onToggle={() => setChartMode("PERCENTAGE")}
								/>
							</div>
							{/* NOWY PRZEŁĄCZNIK ŹRÓDŁA */}
							<div className="hidden md:block w-px h-6 bg-slate-700/50" />

							<div className="flex items-center gap-2">
								<span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mr-1">
									Dane:
								</span>
								<FilterBadge
									id="REAL"
									label="Rzeczywiste"
									isSelected={dataMode === "REAL"}
									onToggle={() => setDataMode("REAL")}
									className={
										dataMode === "REAL"
											? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
											: ""
									}
								/>
								<FilterBadge
									id="SIMULATED"
									label="Symulacja"
									isSelected={dataMode === "SIMULATED"}
									onToggle={() => setDataMode("SIMULATED")}
									className={
										dataMode === "SIMULATED"
											? "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
											: ""
									}
								/>
							</div>
						</div>

						<div className="flex flex-col md:flex-row items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full xl:w-auto scrollbar-hide justify-end">
							<div>
								{TIME_RANGES.map((range) => {
									const disabled = isRangeDisabled(range);

									return (
										<button
											key={range}
											onClick={() => !disabled && handleRangeChange(range)}
											disabled={disabled}
											title={
												disabled
													? "Zbyt mało danych rzeczywistych dla tego okresu"
													: ""
											}
											className={cn(
												"px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wider transition-all duration-300 border whitespace-nowrap",
												disabled
													? "opacity-30 cursor-not-allowed bg-transparent text-slate-600 border-transparent"
													: activeRange === range
														? "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-sm hover:cursor-pointer"
														: "bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50 hover:cursor-pointer",
											)}
										>
											{range}
										</button>
									);
								})}
							</div>
							<div className="hidden md:block w-px h-6 bg-slate-700/50" />

							{/* === NOWOCZESNY KALENDARZ SHADCN OD-DO === */}
							{/* <div> */}
							<DatePickerWithRange
								from={fromDate}
								to={toDate}
								onSelect={handleDateRangeSelect}
							/>
							{/* </div> */}
						</div>
					</div>

					<div className="h-96 w-full">
						<PortfolioChart data={portfolioChartData} mode={chartMode} />
					</div>
				</div>
			</SectionLayout>
			<div className="h-64 mt-6">
				<ExpandableMainChart
					data={portfolioChartData}
					transactions={filteredTransactions} // <--- TO JEST WAŻNE
					chartMode={chartMode}
				/>
			</div>
			<SectionLayout
				title="Nominalny Wynik Dzienny"
				titleIcon={Banknote} // EN: You can import Banknote from lucide-react
				subtitle="Faktyczna kwota wypracowana na rynku"
				description="Wykres przedstawia dokładną kwotę w PLN, o jaką zmieniła się wartość Twoich aktywów danego dnia. Obliczenia ignorują Twoje wpłaty i wypłaty z tego dnia, pokazując czystą skuteczność portfela."
			>
				<div className="h-64 mt-6">
					<AbsoluteDailyPnLChart data={absoluteChartData} />
					{/* <AbsoluteDailyPnLChart data={dummyChartData} /> */}
				</div>
			</SectionLayout>
			{/* NOWA SEKCJA BENCHMARK */}
			<SectionLayout
				title="Porównanie z Rynkiem"
				titleIcon={Globe}
				subtitle="Portfel vs Indeksy"
				description="Wykres przedstawia skumulowaną stopę zwrotu Twojego portfela w wybranym czasie, porównaną z wybranymi przez Ciebie indeksami światowymi. Wszystkie wartości startują od zera, co pozwala na obiektywną ocenę siły Twoich inwestycji względem szerokiego rynku."
			>
				<div className="h-72 mt-6">
					<PortfolioBenchmarkChart
						data={benchmarkChartData}
						userIndices={userIndices} // EN: Replace with the actual prop from dbUser
					/>
				</div>
			</SectionLayout>
		</div>
	);
}

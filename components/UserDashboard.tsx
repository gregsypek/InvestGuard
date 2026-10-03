"use client";

import {
	Activity,
	Banknote,
	Briefcase,
	Calendar,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Container,
	Globe,
	LineChart,
	Loader2,
	Maximize2,
	Minimize2,
	Plus,
	RefreshCw,
	Settings,
	Wallet2,
	WalletCards,
} from "lucide-react";
import { SimulatedSnapshot, useDashboardData } from "./ui/useDashboardData";
import { cn, getStockLogo } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

import { AbsoluteDailyPnLChart } from "./dashboard/AbsoluteDailyPnLChart";
import { DatePickerWithRange } from "./shared/DatePickerWithRange";
import { FilterBadge } from "./shared/FilterBadge";
import Link from "next/link";
import { MarketRow } from "./home/MarketRow";
import { PortfolioBenchmarkChart } from "./dashboard/PortfolioBenchmarkChart";
// Komponenty UI
import { PortfolioChart } from "./dashboard/PortfolioCharts";
// IMPORT HOOKA LOGIKI
import { PortfolioWithAssets } from "@/lib/types";
import { PortfoliosComparisonChart } from "./dashboard/PortfoliosComparisonChart";
import { PremiumMarketCard } from "./home/PremiumMarketCard";
import { SafeActionButton } from "./ui/SafeActionButton";
import { SectionLayout } from "./shared/SectionLayout";
import { ValueCard } from "./shared/ValueCard";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils/format-currency";
import { pl } from "date-fns/locale";
import { refreshPortfolioPrices } from "@/lib/actions/refresh-prices";
import { toast } from "sonner";

const TIME_RANGES = ["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX"];
const GLOBAL_INDICES_MAP: Record<string, string> = {
	SP500: "S&P 500",
	NASDAQ: "NASDAQ 100",
	WIG20: "WIG20",
	DAX: "DAX 40",
	GOLD: "Złoto (XAU/USD)",
	BTC: "Bitcoin",
};

// 🚀 ZAKTUALIZUJ INTERFEJS (Dodano 'role')
interface UserDashboardProps {
	portfolios: PortfolioWithAssets[];
	snapshots: SimulatedSnapshot[];
	realSnapshots?: SimulatedSnapshot[];
	userIndices?: string[];
	indexQuotes?: Record<string, number>;
	lastUpdated?: string | null;
	currentRange?: string;
	indexQuotesHistory?: Record<string, Record<string, number>>;
	role?: string; // <-- DODANE
}

export function UserDashboard(props: UserDashboardProps) {
	// 1. ZACIĄGAMY CAŁĄ LOGIKĘ Z HOOKA
	const {
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
	} = useDashboardData(props);

	const [showAdvancedToolbar, setShowAdvancedToolbar] = useState(true);

	// 🚀 NOWE: Paginacja portfeli (Responsywna: 3 na mobile, 6 na PC)
	const [portfolioPage, setPortfolioPage] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(3); // Domyślnie 3 dla SSR/Mobile
	// 🚀 NOWE: Logika globalnego odświeżania kursów
	const [isRefreshing, setIsRefreshing] = useState(false);
	const isPremium = props.role === "ADMIN" || props.role === "SUBSCRIBER";
	const [isMobileTimeOpen, setIsMobileTimeOpen] = useState(false);
	const [visibleAssetsCount, setVisibleAssetsCount] = useState(6);
	const handleGlobalRefresh = async () => {
		setIsRefreshing(true);
		let successCount = 0;

		try {
			// Aktualizujemy wszystkie portfele po kolei
			for (const portfolio of props.portfolios) {
				const result = await refreshPortfolioPrices(portfolio.id);
				if (result.success) successCount++;
			}

			if (successCount > 0) {
				toast.success("Zaktualizowano kursy dla wszystkich portfeli.");
				if (!isPremium) {
					toast.info(
						"Pamiętaj: Aktualizacja na koncie darmowym działa raz na 24h.",
					);
				}
			} else {
				toast.error("Wykorzystano dzienny limit lub wystąpił błąd.");
			}
		} catch (error) {
			toast.error("Wystąpił problem z połączeniem.");
		} finally {
			setIsRefreshing(false);
		}
	};
	// Śledzimy rozmiar okna, by dostosować liczbę pigułek
	useEffect(() => {
		const handleResize = () => {
			// Jeśli ekran ma min. 1028px (Tailwind 'md'), pokazujemy 6 portfeli. Inaczej 3.
			setItemsPerPage(window.innerWidth >= 1028 ? 6 : 3);
		};

		// Wywołaj od razu po załadowaniu
		handleResize();

		// Nasłuchuj zmian rozmiaru okna (np. obrót telefonu)
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Łączymy "Wszystkie" z resztą portfeli w jedną listę
	const allPortfolioOptions = useMemo(() => {
		return [
			{ id: "ALL", name: "Wszystkie" },
			...props.portfolios.map((p) => ({ id: p.id, name: p.name })),
		];
	}, [props.portfolios]);

	const totalPages = Math.ceil(allPortfolioOptions.length / itemsPerPage);
	// Jeśli portfolioPage wykracza poza zakres, React po prostu użyje poprawnej wartości.
	const safePortfolioPage =
		totalPages > 0 ? Math.min(portfolioPage, totalPages - 1) : 0;

	// Wycinamy odpowiednią ilość sztuk dla aktualnej (bezpiecznej) strony
	const visiblePortfolios = allPortfolioOptions.slice(
		safePortfolioPage * itemsPerPage,
		(safePortfolioPage + 1) * itemsPerPage,
	);

	// 3. RENDEROWANIE WIDOKU
	return (
		<div className="space-y-8">
			{/* HEADER */}
			<header className="relative overflow-hidden flex flex-col gap-6 md:gap-8 w-full bg-slate-950 bg-gradient-to-r from-blue-500/10 dark:from-blue-500/10 via-slate-900 to-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors shadow-lg">
				{/* --- TEKSTURA SVG --- */}
				<div
					className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%233b82f6' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%233b82f6' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%2310b981' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%2310b981' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
						WebkitMaskImage:
							"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
						maskImage:
							"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
					}}
				/>

				<div className="relative z-10 flex flex-col gap-2">
					<div>
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-sm">
							Przegląd Inwestycji
						</h1>
						<p className="text-slate-400 font-medium mt-1 text-[11px] sm:text-sm md:text-base leading-tight">
							Holistyczne spojrzenie na wszystkie Twoje strategie
						</p>
					</div>

					{/* 🚀 NOWOŚĆ: Poziomo przewijany pasek portfeli dostosowany z DashboardHeader */}
					<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-4 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-inner w-full min-w-0">
						<span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
							<Wallet2 className="w-3 h-3 text-theme-primary" /> Analiza dla:
						</span>
						<div className="flex gap-1.5 sm:gap-2 flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible pb-1 sm:pb-0 w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
							<FilterBadge
								id="ALL"
								label="Wszystkie Portfele"
								isSelected={selectedIds.includes("ALL")}
								onToggle={togglePortfolio}
								className={cn(
									"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0",
									selectedIds.includes("ALL")
										? "bg-blue-500 text-white border-transparent"
										: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
								)}
							/>
							{props.portfolios.map((p) => (
								<FilterBadge
									key={p.id}
									id={p.id}
									label={p.name}
									isSelected={selectedIds.includes(p.id)}
									onToggle={togglePortfolio}
									className={cn(
										"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0",
										selectedIds.includes(p.id)
											? "bg-theme-soft text-theme-primary border-theme-primary/30"
											: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
									)}
								/>
							))}
						</div>
					</div>
				</div>

				<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-8 pb-1">
					{/* OGROMNA Całkowita Wartość */}
					<div className="space-y-1 w-full md:w-auto shrink-0">
						<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase mb-1">
							<Wallet2 className="w-3.5 h-3.5 text-slate-300" />
							<span>
								{selectedIds.includes("ALL")
									? "Wartość Całkowita"
									: "Wartość Zaznaczonych"}
							</span>
						</div>
						<div className="flex items-baseline gap-1.5 sm:gap-2">
							<h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm truncate">
								{formatCurrency(totalCurrent)}
							</h2>
							<span className="text-lg sm:text-xl md:text-2xl text-slate-500 font-bold">
								PLN
							</span>
						</div>
					</div>

					{/* PRAWA STRONA: Mniejsze statystyki (Kapitał, P&L) */}
					<div className="flex self-start sm:justify-end flex-wrap gap-4 sm:gap-6 md:gap-10 w-full md:w-auto">
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
										"text-lg sm:text-xl font-bold tracking-tight transition-colors",
										totalPnL > 0
											? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
											: totalPnL < 0
												? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
												: "text-slate-400",
									)}
								>
									{totalPnL > 0 ? "+" : ""}
									{formatCurrency(totalPnL)}
								</span>
								<span
									className={cn(
										"flex items-center text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-sm transition-colors",
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
			{/* RADAR RYNKOWY */}
			<SectionLayout
				title="Radar Rynkowy"
				titleIcon={Activity}
				subtitle="Śledź kluczowe wskaźniki"
				description="Zestawienie indeksów i walorów z Twojego portfela."
				action={
					<div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto">
						{/* 🚀 ZMIANA 1: Wskaźnik daty układa się ładnie nad przyciskami na mobile */}
						{props.lastUpdated && (
							<span className="text-[9px] text-t-text-tertiary font-bold tracking-widest uppercase mb-1 sm:mb-0 mr-1">
								Stan z: {format(new Date(props.lastUpdated), "HH:mm")}
							</span>
						)}

						{/* 🚀 ZMIANA 2: Kontener dostaje w-full na mobile */}
						<div className="flex items-center gap-2 w-full sm:w-auto">
							<button
								onClick={handleGlobalRefresh}
								disabled={isRefreshing}
								title={
									isPremium
										? "Odśwież wyceny (Brak limitu)"
										: "Odśwież wyceny (Limit: 1x na dobę)"
								}
								className={cn(
									// 🚀 ZMIANA 3: flex-1 wymusza podział 50/50 na mobile, ujednolicono też wysokość (h-9 do h-10)
									"flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 h-9 sm:h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-[10px] font-bold uppercase tracking-widest transition-colors w-full sm:w-auto",
									isRefreshing && "opacity-50 cursor-not-allowed",
								)}
							>
								<RefreshCw
									className={cn(
										"w-3.5 h-3.5 shrink-0",
										isRefreshing && "animate-spin",
									)}
								/>
								<span className="hidden sm:inline">Odśwież</span>
							</button>

							<SafeActionButton
								label="Konfiguruj"
								icon={Settings}
								variant="outline"
								// 🚀 ZMIANA 4: Dodane flex-1 aby dzielił się miejscem z "Odśwież"
								className="flex-1 sm:flex-none w-full sm:w-auto border-t-border bg-t-bg-base text-t-text-secondary hover:text-t-text-primary"
								href="/settings?from=dashboard"
							/>
						</div>
					</div>
				}
			>
				<div className="flex flex-col gap-4 lg:gap-6">
					{/* MACRO INDICATORS COLUMN */}
					{props.userIndices && props.userIndices.length > 0 && (
						<div className="flex-1 rounded-2xl ">
							{/* <div className="flex justify-between items-center mb-4">
								<h4 className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary flex items-center gap-2">
									<Globe className="w-4 h-4 text-amber-500" /> Wskaźniki Makro
								</h4>
							</div> */}

							<div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
								{props.userIndices.map((indexId) => {
									const changeValue = props.indexQuotes?.[indexId] || 0;
									const historyObject =
										props.indexQuotesHistory?.[indexId] || {};
									const historyArray = Object.keys(historyObject)
										.sort()
										.map((dateKey) => historyObject[dateKey]);

									return (
										<PremiumMarketCard
											key={indexId}
											name={GLOBAL_INDICES_MAP[indexId] || indexId}
											change={changeValue}
											historyData={historyArray}
											logo={getStockLogo(indexId)}
										/>
									);
								})}
							</div>
						</div>
					)}
					{/* PORTFOLIO ASSETS COLUMN */}
					<div className="flex-1">
						{/* <div className="flex items-center mb-4">
							<h4 className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary flex items-center gap-2">
								<Briefcase className="w-4 h-4 text-blue-500" /> Z Portfela (
								{observedAssets.length})
							</h4>
						</div> */}

						<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
							{observedAssets.length > 0 ? (
								// 🚀 Paginacja: Wyświetlamy tylko określoną liczbę aktywów
								observedAssets
									.slice(0, visibleAssetsCount)
									.map((asset) => (
										<PremiumMarketCard
											key={asset.id}
											name={asset.name}
											ticker={asset.ticker}
											change={asset.dailyChange || 0}
											logo={getStockLogo(asset.ticker ?? "")}
										/>
									))
							) : (
								<div className="col-span-full flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed rounded-xl border-t-border bg-t-bg-base/50">
									<p className="text-xs font-bold text-t-text-secondary mb-1">
										Brak aktywów na radarze
									</p>
									<p className="text-[10px] text-t-text-tertiary mb-3">
										Wybierz walory, które chcesz na bieżąco śledzić.
									</p>
									<SafeActionButton
										label="Wybierz Aktywa"
										icon={Settings}
										variant="outline"
										className="h-9 text-[10px] border-t-border bg-t-bg-base text-t-text-secondary hover:text-t-text-primary"
										href="/settings"
									/>
								</div>
							)}
						</div>

						{/* 🚀 Przycisk "Pokaż więcej / Pokaż mniej" */}
						{observedAssets.length > 6 && (
							<div className="flex justify-center mt-4 pt-3 border-t border-t-border-subtle">
								{visibleAssetsCount < observedAssets.length ? (
									<button
										onClick={() => setVisibleAssetsCount((prev) => prev + 6)}
										className="px-4 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-t-border text-t-text-secondary hover:text-t-text-primary text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
									>
										Pokaż więcej ({observedAssets.length - visibleAssetsCount}{" "}
										kolejnych)
									</button>
								) : (
									<button
										onClick={() => setVisibleAssetsCount(6)}
										className="px-4 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-t-border text-t-text-tertiary hover:text-t-text-primary text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
									>
										Zwiń listę
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			</SectionLayout>
			{/* === STICKY HEADER (Zawsze na górze, stała szerokość) === */}
			<div className="sticky top-0 z-50 bg-t-bg-base transition-all duration-300 w-full pt-1 pb-2">
				<div className="flex flex-col gap-1.5 max-w-7xl mx-auto w-full">
					{/* 1. ZWIJANY PANEL ZAAWANSOWANY (Teraz ZAWSZE w 1 linii na mobile) */}
					{showAdvancedToolbar && (
						<div className="flex flex-row items-center justify-between gap-1 w-full animate-in fade-in slide-in-from-top-1 pb-1.5 border-b border-t-border-subtle">
							{/* Kwota i PnL */}
							<div className="flex flex-col xs:flex-row items-center gap-1.5 shrink-0">
								<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest hidden sm:block">
									Zaznaczone:
								</span>
								<div className="flex items-baseline gap-0.5 sm:gap-1">
									{/* 🚀 ZMIANA: Mniejszy font kwoty na smartfonach, by zmieścić paginację w jednym rzędzie */}
									<span className="text-xs sm:text-sm font-black text-t-text-primary tracking-tight">
										{formatCurrency(totalCurrent)}
									</span>
									<span className="text-[8px] sm:text-[9px] text-t-text-secondary font-bold hidden xs:inline-block">
										PLN
									</span>
								</div>
								<div
									className={cn(
										"px-1 py-0.5 rounded text-[9px] font-black transition-colors",
										totalPnLPct > 0
											? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
											: totalPnLPct < 0
												? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
												: "bg-black/5 dark:bg-white/5 text-t-text-secondary",
									)}
								>
									{totalPnLPct > 0 ? "+" : ""}
									{totalPnLPct.toFixed(2)}%
								</div>
							</div>

							{/* Wybór portfeli (Paginacja) */}
							<div className="flex items-center justify-end min-w-0">
								{totalPages > 1 && (
									<button
										onClick={() => setPortfolioPage(safePortfolioPage - 1)}
										disabled={safePortfolioPage === 0}
										className={cn(
											"shrink-0 p-0.5 rounded-full transition-all",
											safePortfolioPage === 0
												? "opacity-30 cursor-not-allowed text-t-text-tertiary"
												: "text-t-text-secondary hover:text-t-text-primary",
										)}
									>
										<ChevronLeft className="w-3.5 h-3.5" />
									</button>
								)}

								<div className="flex flex-wrap items-center gap-0.5 overflow-hidden">
									{visiblePortfolios.map((opt) => (
										<FilterBadge
											key={opt.id}
											id={opt.id}
											label={opt.name}
											isSelected={selectedIds.includes(opt.id)}
											onToggle={togglePortfolio}
											className={cn(
												"py-0.5 px-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest rounded-md transition-all border shrink-0",
												selectedIds.includes(opt.id)
													? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
													: "bg-transparent text-t-text-secondary border-transparent hover:border-t-border-subtle",
											)}
										/>
									))}
								</div>

								{totalPages > 1 && (
									<button
										onClick={() => setPortfolioPage(safePortfolioPage + 1)}
										disabled={safePortfolioPage === totalPages - 1}
										className={cn(
											"shrink-0 p-0.5 rounded-full transition-all",
											safePortfolioPage === totalPages - 1
												? "opacity-30 cursor-not-allowed text-t-text-tertiary"
												: "text-t-text-secondary hover:text-t-text-primary",
										)}
									>
										<ChevronRight className="w-3.5 h-3.5" />
									</button>
								)}
							</div>
						</div>
					)}

					{/* 2. GŁÓWNY PASEK NARZĘDZI */}
					{/* 🚀 ZMIANA: flex-wrap dla mobile, ale od 'md' (768px) wymuszamy jedną linię (md:flex-nowrap) */}
					<div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 w-full">
						{/* LEWA STRONA: Filtry */}
						{/* 🚀 ZMIANA: w-full znika od 'sm' (sm:w-auto), pozwalając prawej stronie wejść do tego samego rzędu */}
						<div className="flex flex-row items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto shrink-0">
							{/* Grupa PLN / % */}
							<div className="flex items-center gap-1.5 flex-1 sm:flex-none">
								<FilterBadge
									id="VALUE"
									label="PLN"
									isSelected={chartMode === "VALUE"}
									onToggle={() => setChartMode("VALUE")}
									className={cn(
										"py-1.5 px-3 flex-1 sm:flex-none flex justify-center text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all border",
										chartMode === "VALUE"
											? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm"
											: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
									)}
								/>
								<FilterBadge
									id="PERCENTAGE"
									label="%"
									isSelected={chartMode === "PERCENTAGE"}
									onToggle={() => setChartMode("PERCENTAGE")}
									className={cn(
										"py-1.5 px-3 flex-1 sm:flex-none flex justify-center text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all border",
										chartMode === "PERCENTAGE"
											? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm"
											: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
									)}
								/>
							</div>

							{/* Separator widoczny od 'sm' */}
							<div className="w-px h-5 bg-t-border mx-1 hidden sm:block" />

							{/* Grupa Real / Sym */}
							<div className="flex items-center gap-1.5 flex-1 sm:flex-none">
								<FilterBadge
									id="REAL"
									label="Real"
									isSelected={dataMode === "REAL"}
									onToggle={() => setDataMode("REAL")}
									className={cn(
										"py-1.5 px-3 flex-1 sm:flex-none flex justify-center text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all border",
										dataMode === "REAL"
											? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm"
											: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
									)}
								/>
								<FilterBadge
									id="SIMULATED"
									label="Sym"
									isSelected={dataMode === "SIMULATED"}
									onToggle={() => setDataMode("SIMULATED")}
									className={cn(
										"py-1.5 px-3 flex-1 sm:flex-none flex justify-center text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all border",
										dataMode === "SIMULATED"
											? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm"
											: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
									)}
								/>
							</div>
						</div>

						{/* PRAWA STRONA: Czas, Data, Zwijanie */}
						{/* 🚀 ZMIANA: Od 'sm' element zajmuje tylko potrzebną szerokość i dokleja się do lewej strony w jednym rzędzie */}
						<div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
							{/* Kontener czasu */}
							<div className="relative shrink-0">
								{/* Pełny pasek czasu pokazujemy dopiero od 'lg' (1024px), bo inaczej zabrakłoby miejsca na kalendarz obok filtrów */}
								<div className="hidden lg:flex items-center gap-1.5">
									{TIME_RANGES.map((range) => (
										<button
											key={range}
											onClick={() =>
												!isRangeDisabled(range) && handleRangeChange(range)
											}
											disabled={isRangeDisabled(range)}
											className={cn(
												"py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border",
												isRangeDisabled(range)
													? "opacity-30 cursor-not-allowed text-t-text-tertiary border-transparent"
													: activeRange === range
														? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm"
														: "bg-transparent text-t-text-secondary border-t-border hover:border-t-border-subtle",
											)}
										>
											{range}
										</button>
									))}
								</div>

								{/* Kompaktowy przycisk dla telefonów i tabletów (do 'lg') */}
								<div className="lg:hidden">
									<button
										onClick={() => setIsMobileTimeOpen(!isMobileTimeOpen)}
										className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-t-border text-[10px] font-bold uppercase tracking-widest text-t-text-primary shadow-sm hover:border-t-border-subtle bg-t-bg-base"
									>
										<Calendar className="w-3.5 h-3.5 text-blue-500" />
										<span>{activeRange}</span>
										<ChevronDown
											className={cn(
												"w-3.5 h-3.5 transition-transform text-t-text-tertiary",
												isMobileTimeOpen && "rotate-180",
											)}
										/>
									</button>

									{isMobileTimeOpen && (
										<div className="absolute left-0 lg:right-0 top-full mt-1.5 z-50 flex flex-col bg-t-bg-panel border border-t-border rounded-xl shadow-xl p-1.5 min-w-[90px] animate-in fade-in zoom-in-95 duration-200">
											{TIME_RANGES.map((range) => (
												<button
													key={range}
													onClick={() => {
														if (!isRangeDisabled(range)) {
															handleRangeChange(range);
															setIsMobileTimeOpen(false);
														}
													}}
													disabled={isRangeDisabled(range)}
													className={cn(
														"px-3 py-2 text-left rounded-lg text-[10px] font-bold tracking-wide transition-all uppercase",
														isRangeDisabled(range)
															? "opacity-30 cursor-not-allowed text-t-text-tertiary"
															: activeRange === range
																? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
																: "text-t-text-secondary hover:bg-black/5 dark:hover:bg-white/5",
													)}
												>
													{range}
												</button>
											))}
										</div>
									)}
								</div>
							</div>

							{/* Wybór daty */}
							<div className="flex-1 sm:flex-none min-w-0">
								<DatePickerWithRange
									from={fromDate}
									to={toDate}
									onSelect={handleDateRangeSelect}
								/>
							</div>

							{/* Zwijanie panelu */}
							<button
								onClick={() => setShowAdvancedToolbar(!showAdvancedToolbar)}
								className="p-1.5 rounded-lg border border-t-border text-t-text-secondary hover:text-t-text-primary transition-all shrink-0 ml-auto sm:ml-0 shadow-sm bg-t-bg-base"
								title={
									showAdvancedToolbar
										? "Zwiń podsumowanie"
										: "Rozwiń podsumowanie"
								}
							>
								{showAdvancedToolbar ? (
									<Minimize2 className="w-4 h-4" />
								) : (
									<Maximize2 className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
			{/* WYKRESY */}
			<div className="relative space-y-8">
				{isPending && (
					<div className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] rounded-3xl transition-all duration-300">
						<div className="sticky top-[40vh] flex items-center justify-center">
							<div className="flex flex-col items-center gap-3 bg-slate-900/90 border border-slate-700/50 p-4 rounded-2xl shadow-2xl">
								<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
								<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
									Przeliczanie...
								</span>
							</div>
						</div>
					</div>
				)}

				<SectionLayout
					title="Analiza Wykresowa"
					titleIcon={LineChart}
					subtitle="Sprawdź wyniki swoich inwestycji w czasie"
					description="Ten wykres przedstawia zmianę wartości Twoich inwestycji w czasie. Linia przerywana oznacza fizycznie wpłacony kapitał. Możesz płynnie przełączać się między klasycznym widokiem kwotowym (PLN), a widokiem procentowym (%), który najlepiej oddaje faktyczną wydajność (stopę zwrotu) Twojego portfela. Punkty na linii wykresu to dokonane w tym czasie transakcje."
				>
					<div className="h-[400px] w-full mt-6">
						<PortfolioChart
							data={portfolioChartData}
							transactions={filteredTransactions}
							mode={chartMode}
						/>
					</div>
				</SectionLayout>

				<SectionLayout
					title="Nominalny Wynik Dzienny"
					titleIcon={Banknote}
					subtitle="Faktyczna kwota wypracowana na rynku"
					description="Wykres przedstawia dokładną kwotę w PLN, o jaką zmieniła się wartość Twoich aktywów danego dnia. Obliczenia ignorują Twoje wpłaty i wypłaty z tego dnia, pokazując czystą skuteczność portfela."
				>
					<div className="h-96 mt-6">
						<AbsoluteDailyPnLChart key={chartMode} data={absoluteChartData} />
					</div>
				</SectionLayout>

				<SectionLayout
					title="Wyścig Portfeli"
					titleIcon={WalletCards}
					subtitle="Porównanie Strategii"
					description={`Wykres przedstawiający zestawienie wyników poszczególnych portfeli. Użyj przycisków na górnym pasku, aby przełączyć się między trybem procentowym a wartością w PLN.`}
				>
					<div className="h-96 mt-6">
						<PortfoliosComparisonChart
							key={`compare-${chartMode}`}
							data={portfoliosComparisonData}
							portfolios={props.portfolios}
							activeIds={selectedIds}
							chartMode={chartMode}
						/>
					</div>
				</SectionLayout>

				<SectionLayout
					title="Porównanie z Rynkiem"
					titleIcon={Globe}
					subtitle="Portfel vs Indeksy"
					description="Wykres przedstawia skumulowaną stopę zwrotu Twojego portfela w wybranym czasie, porównaną z wybranymi przez Ciebie indeksami światowymi. Wszystkie wartości startują od zera, co pozwala na obiektywną ocenę siły Twoich inwestycji względem szerokiego rynku."
				>
					<div className="h-96 mt-6">
						<PortfolioBenchmarkChart
							key={chartMode}
							data={benchmarkChartData}
							userIndices={props.userIndices || []}
						/>
					</div>
				</SectionLayout>
			</div>
		</div>
	);
}

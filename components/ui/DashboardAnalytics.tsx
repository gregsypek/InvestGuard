"use client";

import {
	ArrowRightCircle,
	ChartArea,
	History,
	ListOrdered,
	Pencil,
	PieChart,
	Plus,
	TableProperties,
	TrendingUp,
} from "lucide-react";
import { CategoryStatus, PortfolioWithAssets, Transaction } from "@/lib/types";
import { useMemo, useState } from "react";

import { AssetFilterPanel } from "../shared/AssetFilterPanel";
import AssetLedger from "../AssetLedgerTable";
import { InteractiveChartSection } from "../InteractiveChartSection";
import PortfolioCharts from "../PortfolioCharts";
import RecentActivityCard from "./assets/RecentActivityCard";
import { SafeActionButton } from "./SafeActionButton";
import { SectionLayout } from "../shared/SectionLayout";
import StrategyHealthTable from "@/app/portfel/components/StrategyHealthTable";
import { useSearchParams } from "next/navigation";
import { useSortedAssets } from "@/lib/hooks/useSortedAssets";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
	transactions: Transaction[];
	allPortfoliosWithCash: { id: string; name: string }[];
	isDemo?: boolean;
}

const DashboardAnalytics = ({
	portfolio,
	portfolioStatus,
	transactions,
	allPortfoliosWithCash,
	isDemo,
}: Props) => {
	const { assets } = portfolio;
	const searchParams = useSearchParams();
	const highlightedId = searchParams.get("newAssetId");

	// 🚀 ZMIANA 1: Stany dla nowych filtrów i paginacji
	const [hideClosed, setHideClosed] = useState(true);
	const [sortBy, setSortBy] = useState("ACTIVITY");
	const [visibleCount, setVisibleCount] = useState(6);

	const filteredAndSortedAssets = useSortedAssets(
		assets,
		transactions,
		hideClosed,
		sortBy,
	);

	const visibleAssets = filteredAndSortedAssets.slice(0, visibleCount);
	const hasMore = visibleCount < filteredAndSortedAssets.length;
	const canCollapse = visibleCount > 6;

	if (!portfolio || !portfolio.assets) {
		return (
			<div className="flex flex-col items-center justify-center p-20 border border-white/5 rounded-2xl bg-slate-900/20 ">
				<div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
				<p className="text-slate-400 font-medium tracking-wide text-sm">
					Wczytywanie danych portfela...
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			{/* 1. SEKCJA: REBALANSOWANIE */}
			<SectionLayout
				title="Przewodnik rebalansowania"
				titleIcon={ArrowRightCircle}
				subtitle="Kondycja i Rebalancing"
				description="Porównanie obecnej struktury portfela z Twoim celem inwestycyjnym."
				subtitleIcon={PieChart}
			>
				<StrategyHealthTable data={portfolioStatus} />
			</SectionLayout>

			{/* 2. SEKCJA: OSTATNIE AKTYWA */}
			{/* 2. SEKCJA: KARTY AKTYWÓW */}
			<SectionLayout
				title="Karty Aktywów"
				titleIcon={History}
				subtitle="Twoje pozycje"
				description="Błyskawiczny podgląd na aktualny stan posiadania, posortowany według ostatniej aktywności na rynku."
				subtitleIcon={ListOrdered}
				action={
					<SafeActionButton
						label="Dodaj Aktywo"
						icon={Plus}
						isDemo={isDemo}
						variant="outline"
						className="border-slate-800 bg-slate-800 text-slate-300"
						href={`/dashboard/${portfolio.id}/add-asset`}
					/>
				}
			>
				<div className="flex flex-col gap-4">
					{/* 🚀 ZMIANA 3: Nasz nowy uniwersalny panel */}
					<AssetFilterPanel
						hideClosed={hideClosed}
						onToggleHideClosed={() => setHideClosed(!hideClosed)}
						sortBy={sortBy}
						onSortChange={setSortBy}
						sortOptions={[
							{ id: "ACTIVITY", label: "Ostatnia aktywność" },
							{ id: "ALPHA", label: "A-Z" },
							{ id: "VALUE", label: "Wartość" },
						]}
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
						{filteredAndSortedAssets.length === 0 ? (
							<div className="col-span-full flex flex-col items-center justify-center p-8 border border-white/5 rounded-xl bg-slate-900/30 text-center w-full">
								<p className="text-sm font-medium text-slate-300">
									Brak wyników
								</p>
								<p className="text-xs text-slate-500 mt-2">
									Nie znaleziono aktywów spełniających te filtry.
								</p>
							</div>
						) : (
							visibleAssets.map((asset) => (
								<RecentActivityCard
									asset={asset}
									isHighlighted={asset.id === highlightedId}
									key={asset.id}
									isDemo={isDemo}
									// 🚀 Przekazujemy naszą wyliczoną datę!
									activityDate={asset.lastActivityDate}
								/>
							))
						)}
					</div>

					{/* 🚀 ZMIANA 4: Przyciski pokazujące więcej lub zwijające widok */}
					{(hasMore || canCollapse) && (
						<div className="flex gap-2 w-full mt-2">
							{hasMore && (
								<button
									onClick={() => setVisibleCount((prev) => prev + 6)}
									className="flex-1 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-[10px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 transition-all flex items-center justify-center"
								>
									Pokaż więcej ({filteredAndSortedAssets.length - visibleCount})
								</button>
							)}
							{canCollapse && (
								<button
									onClick={() => setVisibleCount(6)}
									className="px-6 h-12 rounded-xl bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border hover:bg-t-hover text-[10px] font-bold uppercase tracking-widest text-t-text-secondary transition-all flex items-center justify-center"
								>
									Zwiń widok
								</button>
							)}
						</div>
					)}
				</div>
			</SectionLayout>

			{/* 3. SEKCJA: WYKRESY ALOKACJI */}
			<SectionLayout
				title="Strategia Alokacji"
				titleIcon={PieChart}
				subtitle="Wizualizacja portfela"
				description="Modelowa alokacja w zestawieniu z rzeczywistym stanem posiadania."
				subtitleIcon={ChartArea}
				action={
					<SafeActionButton
						label="Edytuj Cele"
						icon={Pencil}
						variant="outline"
						isDemo={isDemo}
						className="border-slate-800 bg-slate-800 text-slate-300"
						href={`/portfolios/edit/${portfolio.id}`}
					/>
				}
			>
				<PortfolioCharts data={portfolioStatus} />
			</SectionLayout>

			{/* 4. SEKCJA: WYKRES WZROSTU */}
			<SectionLayout
				title="Analiza Wzrostu i Depozytów"
				titleIcon={ChartArea}
				subtitle="Wydajność kapitału"
				description="Skumulowany wkład vs bieżąca wycena oraz historia wpłat."
				subtitleIcon={TrendingUp}
			>
				<InteractiveChartSection
					transactions={transactions}
					assets={portfolio.assets.filter((a) => a.category !== "CASH")}
				/>
			</SectionLayout>

			{/* 5. SEKCJA: TABELA AKTYWÓW */}
			<SectionLayout
				title="Szczegółowy Rejestr Aktywów"
				titleIcon={ListOrdered}
				subtitle="Lista pozycji z portfela"
				description="Zestawienie średniej ceny zakupu, liczby jednostek i wyniku P&L."
				subtitleIcon={TableProperties}
				action={
					<SafeActionButton
						label="Nowe Aktywo"
						icon={Plus}
						isDemo={isDemo}
						variant="outline"
						className="border-slate-800 bg-slate-800 text-slate-300"
						href={`/dashboard/${portfolio.id}/add-asset`}
					/>
				}
			>
				<AssetLedger
					portfolio={portfolio}
					allPortfoliosWithCash={allPortfoliosWithCash}
					isDemo={isDemo}
				/>
			</SectionLayout>
		</div>
	);
};

export default DashboardAnalytics;

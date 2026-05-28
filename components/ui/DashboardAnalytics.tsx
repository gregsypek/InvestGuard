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

import AssetLedger from "../AssetLedgerTable";
import { InteractiveChartSection } from "../InteractiveChartSection";
import PortfolioCharts from "../PortfolioCharts";
import RecentActivityCard from "./assets/RecentActivityCard";
import { SafeActionButton } from "./SafeActionButton";
import { SectionLayout } from "../shared/SectionLayout";
import StrategyHealthTable from "@/app/portfel/components/StrategyHealthTable";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

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

	const recentAssets = useMemo(
		() => [...assets].reverse().slice(0, 6),
		[assets],
	);

	if (!portfolio || !portfolio.assets) {
		return (
			<div className="flex flex-col items-center justify-center p-20 border border-white/5 rounded-2xl bg-slate-900/20">
				<div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
				<p className="text-slate-400 font-medium tracking-wide text-sm">
					Wczytywanie danych portfela...
				</p>
			</div>
		);
	}

	return (
		// Główny kontener całej dolnej strony (flex-col zdejmuje potrzebę układania gridu)
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

			{/* 2. SEKCJA: OSTATNIE AKTYWA (Pionowo, pod tabelą) */}
			<SectionLayout
				title="Historia Aktywności"
				titleIcon={History}
				subtitle="Ostatnie aktywa"
				description="Lista ostatnio dodanych pozycji z możliwością szybkiego usunięcia."
				subtitleIcon={ListOrdered}
				action={
					<SafeActionButton
						label="Dodaj Aktywo"
						icon={Plus}
						isDemo={isDemo}
						variant="outline"
						className="border-slate-800 hover:bg-slate-800 text-slate-300"
						href={`/dashboard/${portfolio.id}/add-asset`}
					/>
				}
			>
				<div className="flex flex-wrap gap-3">
					{assets.length === 0 ? (
						<div className="flex flex-col items-center justify-center p-8 border border-white/5 rounded-xl bg-slate-900/30 text-center w-full">
							<p className="text-sm font-medium text-slate-300">Brak aktywów</p>
							<p className="text-xs text-slate-500 mt-2">
								Twój portfel jest pusty. Dodaj pierwsze aktywo.
							</p>
						</div>
					) : (
						recentAssets.map((asset) => (
							<RecentActivityCard
								asset={asset}
								isHighlighted={asset.id === highlightedId}
								key={asset.id}
								isDemo={isDemo}
							/>
						))
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
						className="border-slate-800 hover:bg-slate-800 text-slate-300"
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
						className="border-slate-800 hover:bg-slate-800 text-slate-300"
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

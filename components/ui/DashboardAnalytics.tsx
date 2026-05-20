"use client";

import {
	ArrowRightCircle,
	ChartArea,
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
import { SectionHeader } from "../shared/SectionHeader";
import StrategyHealthTable from "@/app/portfel/components/StrategyHealthTable";
import { SubHeader } from "../shared/SubHeader";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
	transactions: Transaction[]; // Dodaj to
	// EN: Add the new prop to the interface
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
	// EN:  Reverse to get latest, then slice
	// UI:  Odwracamy, by dostać najnowsze, potem tniemy
	const recentAssets = useMemo(
		() => [...assets].reverse().slice(0, 5),
		[assets],
	);

	if (!portfolio || !portfolio.assets) {
		return (
			<div className="flex flex-col items-center justify-center p-20 border border-dashed rounded-2xl">
				<p className="text-muted-foreground">
					Ładowanie portfela lub brak danych...
				</p>
			</div>
		);
	}
	return (
		<div className="space-y-10 ">
			{/* --- TOP SECTION: CHARTS & SIDEBAR --- */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
				<div className="lg:col-span-2 space-y-10">
					<section>
						<SectionHeader
							title="Przewodnik rebalansowania"
							icon={ArrowRightCircle}
						/>
						<StrategyHealthTable data={portfolioStatus} />
					</section>
				</div>

				{/* SIDEBAR: Recent Assets (Minimalist style) */}
				<aside className="space-y-6 bg-background">
					<div className="flex justify-between items-center px-1">
						<h3 className="text-md font-bold flex items-center gap-2">
							Ostatnie aktywa
						</h3>

						<SafeActionButton
							label="Dodaj Aktywo"
							icon={Plus}
							isDemo={isDemo}
							variant="outline"
							href={`/dashboard/${portfolio.id}/add-asset`}
						/>
					</div>

					<div className="space-y-3">
						{/* EN: Check if there are any assets to display */}
						{/* UI: Sprawdzenie, czy lista aktywów nie jest pusta */}
						{assets.length === 0 ? (
							<div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl bg-card/30 text-center space-y-3">
								<div className="space-y-4">
									<p className="text-sm font-medium">Brak aktywów</p>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Twój portfel jest pusty. Dodaj pierwsze aktywo, aby zacząć
										śledzić alokację.
									</p>
								</div>
							</div>
						) : (
							recentAssets.map((asset) => {
								const isHighlighted = asset.id === highlightedId;
								return (
									<RecentActivityCard
										asset={asset}
										isHighlighted={isHighlighted}
										key={asset.id}
										isDemo={isDemo}
									/>
								);
							})
						)}
					</div>
				</aside>
			</div>
			<section className="pt-8 border-t border-border">
				<div className="flex justify-between">
					<SectionHeader icon={ChartArea} title="Strategia Alokacji" />
					<SafeActionButton
						label="Edytuj Cele"
						icon={Pencil}
						variant="outline"
						isDemo={isDemo}
						href={`/portfolios/edit/${portfolio.id}`}
					/>
				</div>
				<SubHeader
					title="Wykresy kołowe"
					description="Wizualizacja modelowego portfela  w zestawieniu z rzeczywistym stanem posiadania."
					icon={PieChart}
				/>
				<div className="mx-6 py-2">
					<PortfolioCharts data={portfolioStatus} />
				</div>
			</section>

			<section className="pt-8 border-t border-border pb-6">
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
					<div>
						<SectionHeader
							icon={ChartArea}
							title="Analiza Wzrostu i Depozytów"
						/>
						<SubHeader
							title="Wydajność kapitału"
							description="Porównanie skumulowanego wkładu z bieżącą wyceną rynkową oraz historia miesięcznych dopłat."
							icon={TrendingUp}
						/>
					</div>
				</div>
				<div className="mx-6 py-4">
					<InteractiveChartSection
						transactions={transactions}
						assets={portfolio.assets}
					/>
				</div>
			</section>
			{/* --- BOTTOM SECTION: RICH ASSET TABLE --- */}
			<section className="pt-8 border-t border-border">
				<div className="flex justify-between">
					<SectionHeader
						icon={ListOrdered}
						title="Szczegółowy Rejestr
					Aktywów"
					/>

					<SafeActionButton
						label="Nowe Aktywo"
						icon={Plus}
						isDemo={isDemo}
						variant="outline"
						href={`/dashboard/${portfolio.id}/add-asset`}
					/>
				</div>
				<SubHeader
					title="Lista pozycji z portfela"
					description="Lista pozycji z uwzględnieniem średniej ceny zakupu, liczby jednostek oraz skumulowanego wyniku P&L."
					icon={TableProperties}
				/>
				<div className="mx-6 py-2">
					<AssetLedger
						portfolio={portfolio}
						allPortfoliosWithCash={allPortfoliosWithCash}
						isDemo={isDemo}
					/>
				</div>
			</section>
		</div>
	);
};

export default DashboardAnalytics;

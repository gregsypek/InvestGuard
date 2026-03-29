"use client";

import {
	ArrowRightCircle,
	ChartArea,
	ListOrdered,
	Lock,
	PieChart,
	Plus,
	TableProperties,
} from "lucide-react";
import { CategoryStatus, PortfolioWithAssets } from "@/lib/types";

import AddButton from "./AddButton";
import AssetLedger from "../AssetLedgerTable";
import Link from "next/link";
import PortfolioCharts from "../PortfolioCharts";
import React from "react";
import RecentActivityCard from "./assets/RecentActivityCard";
import { SectionHeader } from "../shared/SectionHeader";
import StrategyHealthTable from "@/app/portfel/components/StrategyHealthTable";
import { SubHeader } from "../shared/SubHeader";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
	// EN: Add the new prop to the interface
	allPortfoliosWithCash: { id: string; name: string }[];
	isDemo?: boolean;
}

const DashboardAnalytics = ({
	portfolio,
	portfolioStatus,
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
		<div className="space-y-12 pb-20">
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

						<AddButton
							// Poprawiona składnia cn - wszystkie klasy wewnątrz jednej funkcji
							className={cn(
								"h-8 px-3 text-xs transition-all ",
								isDemo &&
									"opacity-70 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-50 hover:cursor-not-allowed",
							)}
							disabled={isDemo}
						>
							{isDemo ? (
								// W trybie demo renderujemy div, żeby Link nie był aktywny
								<div className="flex items-center gap-1">
									<Lock className="h-3.5 w-3.5 text-emerald-600" />
									<span>Dodaj nowe</span>
								</div>
							) : (
								// Normalny link dla zalogowanego użytkownika
								<Link
									href={`/dashboard/${portfolio.id}/add-asset`}
									className="flex items-center gap-1 hover:cursor-pointer"
								>
									<Plus className="h-3.5 w-3.5" />
									<span>Dodaj nowe</span>
								</Link>
							)}
						</AddButton>
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

					<AddButton
						className={cn(
							isDemo &&
								"opacity-70 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-50 hover:cursor-not-allowed",
						)}
						disabled={isDemo}
					>
						{isDemo ? (
							// W trybie demo renderujemy div, żeby Link nie był aktywny
							<div className="flex items-center gap-1">
								<Lock className="h-3.5 w-3.5 text-emerald-600" />
								<span>Edytuj cele</span>
							</div>
						) : (
							<Link
								href={`/portfolios/edit/${portfolio.id}`}
								className={cn("flex items-center gap-2", isDemo && "")}
							>
								Edytuj cele
							</Link>
						)}
					</AddButton>
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
			{/* --- BOTTOM SECTION: RICH ASSET TABLE --- */}
			<section className="pt-8 border-t border-border">
				<div className="flex justify-between">
					<SectionHeader
						icon={ListOrdered}
						title="Szczegółowy Rejestr
					Aktywów"
					/>

			
						<AddButton
							className={cn(
								isDemo &&
									"opacity-70 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-50 hover:cursor-not-allowed",
							)}
							disabled={isDemo}
						>
							{isDemo ? (
								// W trybie demo renderujemy div, żeby Link nie był aktywny
								<div className="flex items-center gap-1">
									<Lock className="h-3.5 w-3.5 text-emerald-600" />
									<span>Nowe Aktywo</span>
								</div>
							) : (
								<Link
									href={`/dashboard/${portfolio.id}/add-asset`}
									className="flex items-center gap-2"
								>
									<Plus className="h-4 w-4" /> Nowe Aktywo
								</Link>
							)}
						</AddButton>
			
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
					/>
				</div>
			</section>
		</div>
	);
};

export default DashboardAnalytics;

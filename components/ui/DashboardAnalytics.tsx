"use client";

import { ArrowRightCircle, ChartArea, Plus } from "lucide-react";
import { CategoryStatus, PortfolioWithAssets } from "@/lib/types";

import AddButton from "./AddButton";
import AssetLedger from "../AssetLedgerTable";
import Link from "next/link";
import PortfolioCharts from "../PortfolioCharts";
import React from "react";
import RecentActivityCard from "./assets/RecentActivityCard";
import StrategyHealthTable from "@/app/portfel/components/StrategyHealthTable";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
	// EN: Add the new prop to the interface
	allPortfoliosWithCash: { id: string; name: string }[];
}

const DashboardAnalytics = ({
	portfolio,
	portfolioStatus,
	allPortfoliosWithCash,
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
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-xl font-bold tracking-tight  flex items-center gap-2">
								<ArrowRightCircle className="h-5 w-5 text-primary" />
								Przewodnik rebalansowania
							</h2>
						</div>
						<StrategyHealthTable data={portfolioStatus} />
					</section>
				</div>

				{/* SIDEBAR: Recent Assets (Minimalist style) */}
				<aside className="space-y-6">
					<div className="flex justify-between items-center px-1">
						<h2 className="text-lg font-bold flex items-center gap-2">
							Ostatnie aktywa
						</h2>
						<AddButton className="h-8 px-3 text-xs">
							<Link
								href={`/dashboard/${portfolio.id}/add-asset`}
								className="flex items-center gap-1"
							>
								<Plus className="h-3.5 w-3.5" /> Dodaj
							</Link>
						</AddButton>
					</div>

					<div className="space-y-3">
						{/* EN: Check if there are any assets to display */}
						{/* UI: Sprawdzenie, czy lista aktywów nie jest pusta */}
						{assets.length === 0 ? (
							<div className="flex flex-col items-center justify-center p-8 border border-dashed border-border2 rounded-xl bg-card/30 text-center space-y-3">
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
			<section>
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-bold tracking-tight  flex items-center gap-2">
						<ChartArea className="h-5 w-5 text-primary" />
						Strategia Alokacji
					</h2>
				</div>
				<PortfolioCharts data={portfolioStatus} />
			</section>
			{/* --- BOTTOM SECTION: RICH ASSET TABLE --- */}
			<AssetLedger
				portfolio={portfolio}
				allPortfoliosWithCash={allPortfoliosWithCash}
			/>
		</div>
	);
};

export default DashboardAnalytics;

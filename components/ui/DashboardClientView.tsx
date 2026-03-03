"use client";

import { CategoryStatus, PortfolioWithAssets } from "@/lib/types";
import { useEffect, useState } from "react";

import DashboardAnalytics from "./DashboardAnalytics";
import DashboardGoal from "../DashboardGoal";
import { DashboardHeader } from "../DashboardHeader";
import { getPortfolioStats } from "@/lib/calculations";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
	// EN: Add the new prop here to receive data from the Server Component
	allPortfoliosWithCash: { id: string; name: string }[];
	userName?: string | null;
}

export default function DashboardClientView({
	portfolio,
	portfolioStatus,
	allPortfoliosWithCash,
}: Props) {
	const { name, totalValue, progress, remaining, goal } =
		getPortfolioStats(portfolio);
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setHasMounted(true), 0);
		return () => clearTimeout(t);
	}, []);

	if (!hasMounted) return null;
	return (
		<div className="space-y-10 pb-20">
			{/* 1. NAGŁÓWEK I PODSUMOWANIE */}
			<DashboardHeader
				portfolio={portfolio}
				name={name}
				totalValue={totalValue}
			/>

			{/* 2. PASEK POSTĘPU DO CELU */}
			{goal && goal > 0 && (
				<DashboardGoal progress={progress} remaining={remaining} goal={goal} />
			)}

			{/* 3. REBALANCING & CHARTS (Sekcja analityczna) */}
			<DashboardAnalytics
				portfolio={portfolio}
				portfolioStatus={portfolioStatus}
				allPortfoliosWithCash={allPortfoliosWithCash}
			/>
		</div>
	);
}

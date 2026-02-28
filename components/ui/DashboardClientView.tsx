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
	userName?: string | null; // EN: New prop for user name / PL: Nowy prop na imię
}

export default function DashboardClientView({
	portfolio,
	portfolioStatus,
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
			/>
		</div>
	);
}

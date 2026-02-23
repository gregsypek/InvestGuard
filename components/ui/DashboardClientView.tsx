"use client";

import { CategoryStatus, PortfolioWithAssets } from "@/lib/types";
import { useEffect, useState } from "react";
import DashboardGoal from "../DashboardGoal";
import { getPortfolioStats } from "@/lib/calculations";
import { DashboardHeader } from "../DashboardHeader";
import DashboardAnalitics from "./DashboardAnalitics";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
	userName?: string | null; // EN: New prop for user name / PL: Nowy prop na imię
}

export default function DashboardClientView({
	portfolio,
	portfolioStatus,
	userName,
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
				name={name}
				totalValue={totalValue}
				userName={userName}
			/>

			{/* 2. PASEK POSTĘPU DO CELU */}
			{goal && goal > 0 && (
				<DashboardGoal progress={progress} remaining={remaining} goal={goal} />
			)}

			{/* 3. REBALANCING & CHARTS (Sekcja analityczna) */}
			<DashboardAnalitics
				portfolio={portfolio}
				portfolioStatus={portfolioStatus}
			/>
		</div>
	);
}

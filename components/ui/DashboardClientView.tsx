"use client";

import { CategoryStatus, PortfolioWithAssets } from "@/lib/types";
import { useEffect, useState } from "react";
import DashboardAnalitics from "./DashboardAnalitics";
import DashboardGoal from "../DashboardGoal";
import { getPortfolioStats } from "@/lib/calculations";
import { DashboardHeader } from "../DashboardHeader";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
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
			<DashboardHeader name={name} totalValue={totalValue} />

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

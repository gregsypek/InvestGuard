"use client";

import { CategoryStatus, PortfolioWithAssets } from "@/lib/types";
import { useEffect, useState } from "react";
import DashboardAnalitics from "./DashboardAnalitics";
import { DashboardHeader } from "../DashboardHeader";
import DashboardGoal from "../DashboardGoal";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
}

export default function DashboardClientView({
	portfolio,
	portfolioStatus,
}: Props) {
	// Obliczamy dane do nagłówka
	const { goal, name } = portfolio;
	const totalValue = portfolio.assets.reduce((sum, a) => sum + a.value, 0);

	const progress = goal ? (goal > 0 ? (totalValue * 100) / goal : 0) : 0;
	const remaining = goal ? goal - totalValue : 0;
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

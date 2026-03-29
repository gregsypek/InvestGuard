"use client";

import { CategoryStatus, PortfolioWithAssets } from "@/lib/types";
import { useEffect, useState } from "react";

import DashboardAnalytics from "./DashboardAnalytics";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
	// EN: Add the new prop here to receive data from the Server Component
	allPortfoliosWithCash: { id: string; name: string }[];
	userName?: string | null;
	isDemo?: boolean;
}

export default function DashboardClientView({
	portfolio,
	portfolioStatus,
	allPortfoliosWithCash,
	isDemo,
}: Props) {
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setHasMounted(true), 0);
		return () => clearTimeout(t);
	}, []);

	if (!hasMounted) return null;
	return (
		<div className="space-y-10 pb-20">
			{/* 3. REBALANCING & CHARTS (Sekcja analityczna) */}
			<DashboardAnalytics
				portfolio={portfolio}
				portfolioStatus={portfolioStatus}
				allPortfoliosWithCash={allPortfoliosWithCash}
				isDemo={isDemo}
			/>
		</div>
	);
}

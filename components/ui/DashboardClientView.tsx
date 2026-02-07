"use client";

import PortfolioTableBeauty from "@/app/portfel/components/PortfolioTableBeauty";
import { CategoryStatus, PortfolioWithAssets } from "@/lib/types";
import PortfolioCharts from "../PortfolioCharts";
import { DeleteButton } from "../DeleteButton";
import { deleteAsset } from "@/lib/actions/portfolio.actions";
import { ArrowRightCircle, Plus, Target, Wallet2 } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import AddAssetForm from "./assets/AddAssetForm";
import { useEffect, useState } from "react";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
}

export default function DashboardClientView({
	portfolio,
	portfolioStatus,
}: Props) {
	// Obliczamy dane do nagłówka
	const { goal, assets, name } = portfolio;
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
			<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<nav className="text-sm text-muted-foreground mb-1">
						Portfolios / {name}
					</nav>
					<h1 className="h1-bold text-3xl">{name.toUpperCase()} Dashboard</h1>
				</div>

				<div className="flex gap-3 ">
					<div className="bg-card  border-border2 p-3 rounded-xl flex items-center gap-3  text-blue-500 border ">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Wallet2 className="text-primary h-5 w-5" />
						</div>
						<div className="">
							<p className="text-[10px] uppercase text-muted-foreground font-bold">
								Total Value
							</p>
							<p className="text-lg font-bold ">
								{totalValue.toLocaleString()} PLN
							</p>
						</div>
					</div>
				</div>
			</header>

			{/* 2. PASEK POSTĘPU DO CELU */}
			{goal && goal > 0 && (
				<section className="bg-card border border-border2 p-6 rounded-2xl shadow-sm">
					<div className="flex justify-between items-end mb-4">
						<div>
							<div className="flex items-center gap-2 text-primary mb-1">
								<Target className="h-4 w-4" />
								<span className="text-sm font-bold uppercase tracking-wider">
									Goal Progress
								</span>
							</div>
							<p className="text-2xl font-black">{progress.toFixed(1)}%</p>
						</div>
						<div className="text-right">
							<p className="text-sm text-muted-foreground italic">
								{remaining > 0
									? `Only ${remaining.toLocaleString()} PLN to reach your goal!`
									: "Goal achieved! 🚀"}
							</p>
							<p className="text-xs font-medium text-muted-foreground">
								Target: {goal.toLocaleString()} PLN
							</p>
						</div>
					</div>
					<Progress
						value={Math.min(progress, 100)}
						className={cn(
							"h-3 shadow-inner",
							progress > 100 && "bg-blue-500/50",
						)}
					/>
				</section>
			)}

			{/* 3. REBALANCING & CHARTS (Sekcja analityczna) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 space-y-8">
					<section>
						<div className="flex justify-between items-center mb-4">
							<h2 className="h2-bold flex items-center gap-2">
								<ArrowRightCircle className="h-5 w-5 text-primary" />{" "}
								Rebalancing Guide
							</h2>
						</div>
						<PortfolioTableBeauty data={portfolioStatus} />
					</section>

					<section>
						<h2 className="h2-bold mb-4">Allocation Strategy</h2>
						<PortfolioCharts data={portfolioStatus} />
					</section>
				</div>

				{/* 4. ASSET LIST (Boczna lista z zarządzaniem) */}
				<aside className="space-y-6">
					<div className="flex justify-between items-center">
						<h2 className="text-xl font-bold">Your Assets</h2>
						<Button size="sm" variant="outline" className="h-8 gap-1" asChild>
							<Link href={`/portfolios/${portfolio.id}/add-asset`}>
								<Plus className="h-4 w-4" /> Add
							</Link>
						</Button>
					</div>

					<div className="space-y-3">
						{assets.map((asset) => (
							<div
								key={asset.id}
								className="bg-card border border-border2 p-3 rounded-lg flex justify-between items-center group"
							>
								<div>
									<p className="font-bold text-sm">{asset.name}</p>
									<p className="text-xs text-muted-foreground">
										{asset.category}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<p className="font-semibold text-sm">
										{asset.value.toLocaleString()} PLN
									</p>
									<DeleteButton
										id={asset.id}
										onDelete={deleteAsset}
										confirmMsg={`Delete ${asset.name}?`}
									/>
								</div>
							</div>
						))}
					</div>
				</aside>
			</div>
			{/* Form to add new EDO, ETF or Gold */}
			<AddAssetForm />
		</div>
	);
}

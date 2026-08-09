"use client";

import { BriefcaseBusiness, Lock, Pencil, Wallet2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Asset } from "@prisma/client";
import { Button } from "./ui/button";
import { DeleteButton } from "./DeleteButton";
import Link from "next/link";
import { PortfolioWithAssets } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import React from "react";
import { cn } from "@/lib/utils";
import { deletePortfolio } from "@/lib/actions/portfolio.actions";

interface PortfolioCardProps {
	portfolio: PortfolioWithAssets;
	isDemo?: boolean;
}

// EN: Premium Fintech Color Palettes for the "Wallet" look with stronger left-to-right gradients
const PALETTES = [
	{
		name: "emerald",
		borderLeft: "border-l-emerald-500",
		text: "text-emerald-600 dark:text-emerald-400",
		bgHover:
			"hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]",
		progress: "[&>div]:bg-emerald-600 dark:[&>div]:bg-emerald-500",
		gradient: "from-emerald-500/30 via-emerald-500/5 to-transparent",
		watermark: "text-emerald-500",
	},
	{
		name: "blue",
		borderLeft: "border-l-blue-500",
		text: "text-blue-600 dark:text-blue-400",
		bgHover:
			"hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]",
		progress: "[&>div]:bg-blue-600 dark:[&>div]:bg-blue-500",
		gradient: "from-blue-500/30 via-blue-500/5 to-transparent",
		watermark: "text-blue-500",
	},
	{
		name: "violet",
		borderLeft: "border-l-violet-500",
		text: "text-violet-600 dark:text-violet-400",
		bgHover:
			"hover:border-violet-500/40 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)]",
		progress: "[&>div]:bg-violet-600 dark:[&>div]:bg-violet-500",
		gradient: "from-violet-500/30 via-violet-500/5 to-transparent",
		watermark: "text-violet-500",
	},
	{
		name: "amber",
		borderLeft: "border-l-amber-500",
		text: "text-amber-600 dark:text-amber-400",
		bgHover:
			"hover:border-amber-500/40 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]",
		progress: "[&>div]:bg-amber-600 dark:[&>div]:bg-amber-500",
		gradient: "from-amber-500/30 via-amber-500/5 to-transparent",
		watermark: "text-amber-500",
	},
	{
		name: "rose",
		borderLeft: "border-l-rose-500",
		text: "text-rose-600 dark:text-rose-400",
		bgHover:
			"hover:border-rose-500/40 hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)]",
		progress: "[&>div]:bg-rose-600 dark:[&>div]:bg-rose-500",
		gradient: "from-rose-500/30 via-rose-500/5 to-transparent",
		watermark: "text-rose-500",
	},
];

// EN: Simple hash function to always assign the same color to the same portfolio ID
const getPaletteForId = (id: string, isDemo?: boolean) => {
	if (isDemo) return PALETTES[0]; // Demo is always Emerald

	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash);
	}
	return PALETTES[Math.abs(hash) % PALETTES.length];
};

const PortfolioCard = ({ portfolio: p, isDemo }: PortfolioCardProps) => {
	const { id, name, goal, assets } = p;
	const palette = getPaletteForId(id, isDemo);

	const totalValue = assets.reduce(
		(sum: number, asset: Asset) => sum + asset.currentValue,
		0,
	);
	const progress = p.goal ? (totalValue / p.goal) * 100 : 0;

	// EN: URL mapping
	const getDemoHref = (id: string) => {
		if (id === "demo-dalio") return "/demo?s=dalio";
		if (id === "demo-yale") return "/demo?s=yale";
		return "/demo?s=classic";
	};

	const mainHref = isDemo ? getDemoHref(id) : `/dashboard?portfolioId=${id}`;

	return (
		<Card
			key={id}
			className={cn(
				"relative overflow-hidden transition-all duration-300 flex flex-col h-full w-full",
				"bg-t-bg-panel border border-t-border",
				// ZMIANA: Gruby, "fizyczny" pasek z LEWEJ strony (border-l-[6px])
				"border-l-[2px]",
				palette.borderLeft,
				palette.bgHover,
			)}
		>
			{/* ZMIANA: Gradient idący od lewej do prawej (bg-gradient-to-r) i znacznie mocniejszy */}
			<div
				className={cn(
					"absolute inset-0 bg-gradient-to-r opacity-100 dark:opacity-[0.35] pointer-events-none transition-opacity",
					palette.gradient,
				)}
			/>

			{/* Znak wodny w rogu */}
			<div
				className={cn(
					"absolute -bottom-6 -right-6 opacity-[0.04] dark:opacity-[0.02] pointer-events-none",
					palette.watermark,
				)}
			>
				<Wallet2 className="w-40 h-40" />
			</div>

			<CardHeader className="pb-2 relative z-10">
				<CardTitle className="flex justify-between items-start gap-2">
					<div className="flex items-center gap-2 overflow-hidden">
						<BriefcaseBusiness
							className={cn("w-5 h-5 shrink-0", palette.text)}
						/>
						<Link
							href={mainHref}
							className={cn(
								"truncate hover:underline font-bold tracking-tight transition-colors",
								palette.text,
							)}
						>
							{name}
						</Link>
					</div>

					<div className="flex gap-1 shrink-0">
						{isDemo ? (
							<div className="p-2 text-t-text-tertiary/50">
								<Lock className="h-3.5 w-3.5" />
							</div>
						) : (
							<>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-t-text-tertiary hover:bg-t-border hover:text-blue-600 dark:hover:text-blue-400 group"
									asChild
									onClick={(e) => e.stopPropagation()}
								>
									<Link href={`/portfolios/edit/${id}`}>
										<Pencil className="h-4 w-4 group-hover:scale-110 transition-transform" />
									</Link>
								</Button>
								<DeleteButton
									id={id}
									onDelete={deletePortfolio}
									confirmMsg="Czy na pewno chcesz usunąć ten portfel?"
								/>
							</>
						)}
					</div>
				</CardTitle>
			</CardHeader>

			<CardContent className="space-y-4 flex flex-col flex-1 pt-0 relative z-10">
				{/* ZMIANA: Dodano gap-2 i flex-1 z min-w-0 dla obsługi długich kwot */}
				<div className="flex justify-between items-end gap-2">
					<div className="min-w-0 flex-1">
						<p className="text-[10px] text-t-text-tertiary uppercase tracking-widest font-bold mb-1">
							Wartość Portfela
						</p>
						<p
							className="text-2xl font-black text-t-text-primary tracking-tighter truncate"
							title={`${totalValue.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} PLN`}
						>
							{totalValue.toLocaleString("pl-PL", {
								minimumFractionDigits: 2,
							})}
							<span className="text-[10px] font-bold text-t-text-tertiary tracking-normal ml-1">
								PLN
							</span>
						</p>
					</div>
					<div className="text-[10px] font-bold px-2 py-1 bg-black/5 dark:bg-white/5 border border-t-border rounded text-t-text-secondary uppercase tracking-widest backdrop-blur-sm shrink-0">
						{assets.length} {assets.length === 1 ? "składnik" : "skł."}
					</div>
				</div>

				{goal ? (
					<div className="space-y-2 mt-auto">
						<div className="flex justify-between text-[10px] uppercase tracking-wide font-bold">
							<span className="text-t-text-tertiary">
								Cel:{" "}
								{goal.toLocaleString("pl-PL", {
									minimumFractionDigits: 2,
								})}{" "}
								PLN
							</span>
							<span className={palette.text}>{progress.toFixed(1)}%</span>
						</div>

						<Progress
							value={Math.min(progress, 100)}
							className={cn(
								"h-1.5 bg-slate-200 dark:bg-slate-800/80 shadow-inner",
								palette.progress,
							)}
						/>

						{progress > 100 && (
							<p
								className={cn(
									"text-[10px] font-bold uppercase tracking-widest",
									palette.text,
								)}
							>
								Cel osiągnięty! 🚀
							</p>
						)}
						{p.description && (
							<p className="text-sm text-t-text-secondary italic line-clamp-2 pt-3 border-t border-t-border-subtle mt-auto">
								{p.description}
							</p>
						)}
					</div>
				) : (
					<div className="mt-auto pt-4 text-[10px] text-t-text-tertiary uppercase tracking-widest font-bold border-t border-dashed border-t-border">
						Brak wyznaczonego celu
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default PortfolioCard;

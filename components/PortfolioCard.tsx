"use client";

import { Asset, PortfolioWithAssets } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Pencil, Trash2 } from "lucide-react";

import { Button } from "./ui/button";
import { DeleteButton } from "./DeleteButton";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import React from "react";
import { cn } from "@/lib/utils";
import { deletePortfolio } from "@/lib/actions/portfolio.actions";

interface PortfolioCardProps {
	portfolio: PortfolioWithAssets;
	isDemo?: boolean;
}

// 1. POPRAWKA: Dodajemy isDemo do destrukturyzacji!
const PortfolioCard = ({ portfolio: p, isDemo }: PortfolioCardProps) => {
	const { id, name, goal, assets } = p;

	const totalValue = assets.reduce(
		(sum: number, asset: Asset) => sum + asset.currentValue,
		0,
	);
	const progress = p.goal ? (totalValue / p.goal) * 100 : 0;

	// 2. LOGIKA LINKÓW: Mapujemy ID demo na klucz strategii dla URL
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
				"transition-all duration-300 border-border2 flex flex-col h-full w-full",
				isDemo &&
					"hover:border-emerald-500/50 shadow-sm hover:shadow-emerald-500/10",
			)}
		>
			<CardHeader className="pb-2">
				<CardTitle className="flex justify-between items-start gap-2">
					<Link
						href={mainHref}
						className={cn(
							"truncate hover:underline font-bold tracking-tight",
							isDemo ? "text-emerald-600" : "text-primary",
						)}
					>
						{name}
					</Link>

					<div className="flex gap-1">
						{isDemo ? (
							<div className="p-2 text-muted-foreground/40">
								<Lock className="h-3.5 w-3.5" />
							</div>
						) : (
							<>
								{/* Przycisk Edycji */}
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-muted-foreground hover:text-blue-600 group"
									asChild
									onClick={(e) => e.stopPropagation()} // Zapobiega przejściu do dashboardu
								>
									<Link href={`/portfolios/edit/${id}`}>
										<Pencil className="h-4 w-4 group-hover:scale-110" />
									</Link>
								</Button>
								<DeleteButton
									id={id}
									onDelete={deletePortfolio}
									confirmMsg="Are you sure you want to delete this portfolio?"
								/>
							</>
						)}
					</div>
				</CardTitle>
			</CardHeader>

			<CardContent className="space-y-4 flex flex-col flex-1 pt-0">
				<div className="flex justify-between items-end">
					<div>
						<p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">
							Wartość Całkowita
						</p>
						<p className="text-xl font-black text-foreground">
							{totalValue.toLocaleString()}{" "}
							<span className="text-xs font-normal text-muted-foreground">
								PLN
							</span>
						</p>
					</div>
					<div className="text-[10px] font-medium px-2 py-1 bg-muted rounded text-muted-foreground">
						{assets.length} {assets.length === 1 ? "składnik" : "składniki"}
					</div>
				</div>

				{goal ? (
					<div className="space-y-2 mt-auto">
						<div className="flex justify-between text-[10px] uppercase tracking-wide font-bold">
							<span className="text-muted-foreground">
								Cel: {goal.toLocaleString()} PLN
							</span>
							<span className={isDemo ? "text-emerald-600" : "text-primary"}>
								{progress.toFixed(1)}%
							</span>
						</div>
						<Progress
							value={Math.min(progress, 100)}
							className={cn("h-1.5", isDemo && "[&>div]:bg-emerald-500")}
						/>
						{progress > 100 && (
							<p className="text-[10px] text-green-500 font-bold uppercase">
								Cel osiągnięty! 🚀
							</p>
						)}
						{p.description && (
							<p className="text-sm text-muted-foreground italic line-clamp-2 pt-2 border-t border-border2 mt-auto">
								{p.description}
							</p>
						)}
					</div>
				) : (
					<div className="mt-auto pt-4 text-[10px] text-muted-foreground italic border-t border-dashed">
						Brak wyznaczonego celu finansowego.
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default PortfolioCard;

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { DeleteButton } from "./DeleteButton";
import { deletePortfolio } from "@/lib/actions/portfolio.actions";
import { Asset, Portfolio } from "@/lib/types";
// Definiujemy typy dla danych portfela

interface PortfolioCardProps {
	portfolio: Portfolio;
}
const PortfolioCard = ({ portfolio: p }: PortfolioCardProps) => {
	const { id, name, goal } = p;

	const totalValue = p.assets.reduce(
		(sum: number, asset: Asset) => sum + asset.value,
		0,
	);
	const progress = p.goal ? (totalValue / p.goal) * 100 : 0;

	return (
		<Card key={id} className=" transition-colors cursor-pointer border-border2">
			<CardHeader>
				<CardTitle className="flex justify-between items-center ">
					<Link
						href={`/dashboard?portfolioId=${id}`}
						className="truncate hover:underline text-primary "
					>
						{name}
					</Link>

					<div className="flex gap-2">
						{/* Przycisk Edycji */}
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground hover:text-primary"
							asChild
							onClick={(e) => e.stopPropagation()} // Zapobiega przejściu do dashboardu
						>
							<Link href={`/portfolios/edit/${id}`}>
								<Pencil className="h-4 w-4" />
							</Link>
						</Button>
						<DeleteButton
							id={id}
							onDelete={deletePortfolio}
							confirmMsg="Are you sure you want to delete this portfolio?"
						/>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 flex flex-col flex-1">
				<div>
					<div className="text-xs flex grow justify-end">
						<span className="text-muted-foreground ">
							{p.assets.length === 0
								? "no assets"
								: `${p.assets.length} ${p.assets.length === 1 ? "asset" : "assets"}`}
						</span>
					</div>
					<p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
						Total Value
					</p>
					<p className="text-2xl font-bold text-primary">
						{totalValue.toLocaleString()} PLN
					</p>
				</div>

				{goal ? (
					<div className="space-y-2">
						<div className="flex justify-between text-xs">
							<span className="text-muted-foreground">
								Progress to goal ({goal.toLocaleString()} PLN)
							</span>
							<span className="font-bold">{progress.toFixed(1)}%</span>
						</div>
						<Progress value={Math.min(progress, 100)} className="h-2" />
						{progress > 100 && (
							<p className="text-[10px] text-green-500 font-bold uppercase">
								Goal Exceeded! 🚀
							</p>
						)}
					</div>
				) : (
					<div className="text-xs flex grow ">
						<span className="text-muted-foreground ">
							No progress goal set.
						</span>
					</div>
				)}

				{p.description && (
					<p className="text-sm text-muted-foreground italic line-clamp-2 pt-2 border-t border-border2">
						{p.description}
					</p>
				)}
			</CardContent>
		</Card>
	);
};

export default PortfolioCard;

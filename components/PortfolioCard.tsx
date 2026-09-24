"use client";

import { BriefcaseBusiness, Lock, Pencil, Wallet2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useState } from "react";

import { Asset } from "@prisma/client";
import { Button } from "./ui/button";
import Cookies from "js-cookie";
import { DeleteButton } from "./DeleteButton";
import Link from "next/link";
import { PortfolioWithAssets } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { deletePortfolio } from "@/lib/actions/portfolio.actions";
import { formatCurrency } from "@/lib/utils/format-currency";

interface PortfolioCardProps {
	portfolio: PortfolioWithAssets & { colorTheme?: string };
	isDemo?: boolean;
}

const PortfolioCard = ({ portfolio: p, isDemo }: PortfolioCardProps) => {
	const { id, name, goal, assets, colorTheme } = p;
	console.log("🚀 ~ PortfolioCard ~ colorTheme:", colorTheme);
	// 🚀 Pobieramy ID z ciasteczka i sprawdzamy, czy to ten portfel
	// const isActive = Cookies.get("selectedPortfolioId") === id;
	// const isActive = p.id === Cookies.get("selectedPortfolioId");
	// console.log("🚀 ~ PortfolioCard ~ isActive:", isActive);

	// Tryb Demo zawsze wymusza "emerald", w przeciwnym razie bierzemy kolor z bazy
	const theme = isDemo ? "emerald" : colorTheme || "blue";

	const totalValue = assets.reduce(
		(sum: number, asset: Asset) => sum + asset.currentValue,
		0,
	);
	const progress = p.goal ? (totalValue / p.goal) * 100 : 0;

	const getDemoHref = (id: string) => {
		if (id === "demo-dalio") return "/demo?s=dalio";
		if (id === "demo-yale") return "/demo?s=yale";
		return "/demo?s=classic";
	};

	const mainHref = isDemo ? getDemoHref(id) : `/dashboard?portfolioId=${id}`;

	// 1. Stan przechowuje TYLKO informację o tym, czy komponent jest już w przeglądarce
	const [isMounted, setIsMounted] = useState(false);

	// 2. Prosty efekt, bez żadnych zależności i obliczeń
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsMounted(true);
		}, 0);

		return () => clearTimeout(timer);
	}, []);

	// 3. Zmienna obliczana w locie podczas renderowania
	const isActive = isMounted
		? p.id === Cookies.get("selectedPortfolioId")
		: false;
	return (
		<Card
			key={id}
			className={cn(
				"relative overflow-hidden transition-all duration-300 flex flex-col h-full w-full",
				"bg-t-bg-panel border border-t-border",

				// Zastosowanie !important gwarantuje, że lewa ramka przebije się przez domyślny 'border'
				isActive && "!border-l-[2px] !border-l-theme-primary",

				"hover:border-theme-border hover:shadow-[0_8px_30px_var(--theme-soft)]",
			)}
		>
			{/* Tło Gradientu */}
			{/* <div className="absolute inset-0  via-transparent to-transparent opacity-100 dark:opacity-50 pointer-events-none transition-opacity" /> */}

			{/* Znak wodny */}
			<div className="absolute -bottom-6 -right-6 opacity-[0.04] dark:opacity-[0.02] pointer-events-none text-theme-primary">
				<Wallet2 className="w-40 h-40" />
			</div>

			<CardHeader className="pb-2 relative z-10">
				<CardTitle className="flex justify-between items-start gap-2">
					{/* 🚀 DODANO data-theme TYLKO TUTAJ: Tytuł i ikona otrzymują unikalny, przypisany z bazy kolor */}
					{/* TUTAJ DODAŁEM: data-theme={theme} */}
					<div
						className="flex items-center gap-2 overflow-hidden"
						data-theme={theme}
					>
						<BriefcaseBusiness className="w-5 h-5 shrink-0 text-theme-primary" />
						<Link
							href={mainHref}
							className="truncate hover:underline font-bold tracking-tight transition-colors "
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
				<div className="flex justify-between items-end gap-2">
					<div className="min-w-0 flex-1">
						<p className="text-[10px] text-t-text-tertiary uppercase tracking-widest font-bold mb-1">
							Wartość Portfela
						</p>
						<p
							className="text-2xl font-black text-t-text-primary tracking-tighter truncate"
							title={`${formatCurrency(totalValue)} PLN`}
						>
							{formatCurrency(totalValue)}
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
								Cel: {formatCurrency(goal)} PLN
							</span>
							<span className="text-theme-primary">{progress.toFixed(1)}%</span>
						</div>

						<Progress
							value={Math.min(progress, 100)}
							className="h-1.5 bg-slate-200 dark:bg-slate-800/80 shadow-inner [&>div]:bg-theme-primary opacity-40"
						/>

						{progress > 100 && (
							<p className="text-[10px] font-bold uppercase tracking-widest text-theme-primary">
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

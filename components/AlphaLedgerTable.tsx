import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { BoosterActionsClient } from "./alpha/BoosterActionsClient";
import type { Category } from "@prisma/client";
import { Progress } from "./ui/progress";
import React from "react";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AlphaLedgerTable({
	portfolioId,
}: {
	portfolioId?: string;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	// 1. FETCH DATA: Get only Booster assets for this user
	const boosterAssets = await db.asset.findMany({
		where: {
			category: "BOOSTER" as Category,
			portfolioId: portfolioId || undefined, //  Filtruje rekordy po aktywnym portfelu
			portfolio: { userId: session.user.id },
		},
		include: { portfolio: true },
		orderBy: { conviction: "desc" },
	});

	const activeBoosterAssets = boosterAssets.filter((a) => a.quantity > 0);

	return (
		<Table className="w-full min-w-[900px]">
			<TableHeader>
				<TableRow className="border-b border-t-border-subtle hover:bg-transparent">
					{/* 1. AKTYWO (Sticky) */}
					<TableHead className="sticky left-0 z-20 bg-t-bg-sticky text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pl-6 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
						Aktywo
					</TableHead>
					<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
						Ryzyko
					</TableHead>
					<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 w-48">
						Przekonanie
					</TableHead>
					<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
						Teza (Skrót)
					</TableHead>
					<TableHead className=" text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
						Wartość
					</TableHead>
					<TableHead className=" text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
						Wynik (ROI)
					</TableHead>
					<TableHead className=" w-12 border-none py-4 pr-6 text-right"></TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{/* ZMIANA: Zbieramy index do pasków zebry */}
				{activeBoosterAssets.map((asset, index) => {
					const individualRoi =
						asset.investedCapital > 0
							? ((asset.currentValue - asset.investedCapital) /
									asset.investedCapital) *
								100
							: 0;

					// Obliczamy logikę wiersza
					const isEven = index % 2 === 1;
					const isHighConviction = asset.conviction && asset.conviction > 70;
					const convictionColor = isHighConviction
						? "bg-emerald-500"
						: "bg-amber-500";

					return (
						<TableRow
							key={asset.id}
							className={cn(
								"border-b border-t-border-subtle hover:bg-t-hover transition-colors group",
								isEven && "bg-t-bg-base/50 dark:bg-t-bg-base/30", // Paski zebry
							)}
						>
							{/* 1. AKTYWO (Sticky przy scrollu) */}
							<TableCell className="sticky left-0 z-10 pl-6 py-4 border-none bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
								<div className="font-bold text-sm text-t-text-primary whitespace-nowrap">
									{asset.name}
								</div>
								{asset.ticker && (
									<div className="text-[10px] text-t-text-secondary font-mono bg-black/5 dark:bg-white/5 inline-block px-1.5 py-0.5 rounded border border-t-border mt-1 uppercase">
										{asset.ticker}
									</div>
								)}
							</TableCell>

							{/* 2. RYZYKO */}
							<TableCell className="py-4 border-none">
								<div className="flex items-center gap-2">
									<div
										className={cn(
											"h-1.5 w-1.5 rounded-full border border-t-border-subtle shadow-sm",
											convictionColor,
										)}
									/>
									<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary whitespace-nowrap">
										{isHighConviction ? "Niskie" : "Średnie"}
									</span>
								</div>
							</TableCell>

							{/* 3. PRZEKONANIE */}
							<TableCell className="py-4 border-none">
								<div className="space-y-1.5 pr-4">
									<div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
										<span>Pewność</span>
										<span className="text-t-text-secondary">
											{asset.conviction}%
										</span>
									</div>
									<Progress
										value={asset.conviction || 0}
										className="h-1.5 bg-black/5 dark:bg-white/5 border border-t-border-subtle"
										indicatorColor={convictionColor}
									/>
								</div>
							</TableCell>

							{/* 4. TEZA */}
							<TableCell className="max-w-40 xl:max-w-64 py-4 border-none">
								<p className="text-xs text-t-text-tertiary italic truncate">
									&quot;{asset.rationale || "Brak opisanej tezy..."}&quot;
								</p>
							</TableCell>

							{/* 5. WARTOŚĆ */}
							<TableCell className="text-right py-4 border-none">
								<div className="text-sm font-bold font-mono text-t-text-primary whitespace-nowrap">
									{asset.currentValue.toLocaleString("pl-PL", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
									<span className="text-[10px] text-t-text-tertiary ml-1">
										PLN
									</span>
								</div>
								<div className="text-[9px] text-t-text-tertiary font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap">
									Wkład:{" "}
									{asset.investedCapital.toLocaleString("pl-PL", {
										maximumFractionDigits: 0,
									})}
								</div>
							</TableCell>

							{/* 6. ROI */}
							<TableCell
								className={cn(
									"text-right font-mono font-bold text-sm py-4 border-none whitespace-nowrap",
									individualRoi >= 0
										? "text-emerald-600 dark:text-emerald-400"
										: "text-rose-600 dark:text-rose-500", // Zmodyfikowany kolor na róże/rubin dla minusa
								)}
							>
								{individualRoi > 0 && "+"}
								{individualRoi.toFixed(1)}%
							</TableCell>

							{/* 7. AKCJE */}
							<TableCell className="text-right py-4 pr-6 border-none">
								<BoosterActionsClient asset={asset} />
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

"use client";

import { ArrowDownAZ, Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { BoosterActionsClient } from "./alpha/BoosterActionsClient";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";

interface AlphaLedgerTableProps {
	activeBoosterAssets: any[];
}

export default function AlphaLedgerTable({
	activeBoosterAssets = [],
}: AlphaLedgerTableProps) {
	const [search, setSearch] = useState("");
	const [sortBy, setSortBy] = useState("value_desc");

	// Całkowita wycena portfela (do obliczania wagi/udziału)
	const totalPortfolioValue = useMemo(() => {
		return (
			activeBoosterAssets.reduce(
				(sum, a) => sum + (a.quantity > 0 ? a.currentValue : 0),
				0,
			) || 1
		);
	}, [activeBoosterAssets]);

	const filteredAndSortedAssets = useMemo(() => {
		let result = activeBoosterAssets.filter((a) => a.quantity > 0);

		if (search) {
			const searchLower = search.toLowerCase();
			result = result.filter(
				(a) =>
					a.name.toLowerCase().includes(searchLower) ||
					(a.ticker && a.ticker.toLowerCase().includes(searchLower)),
			);
		}

		return result.sort((a, b) => {
			const roiA =
				a.investedCapital > 0
					? (a.currentValue - a.investedCapital) / a.investedCapital
					: 0;
			const roiB =
				b.investedCapital > 0
					? (b.currentValue - b.investedCapital) / b.investedCapital
					: 0;

			if (sortBy === "roi_desc") return roiB - roiA;
			if (sortBy === "roi_asc") return roiA - roiB;
			if (sortBy === "value_desc") return b.currentValue - a.currentValue;
			return (b.conviction || 0) - (a.conviction || 0);
		});
	}, [activeBoosterAssets, search, sortBy]);

	if (activeBoosterAssets.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-40 bg-t-bg-panel border-none rounded-2xl">
				<span className="font-bold text-t-text-primary text-sm">
					Brak aktywów w tej sekcji.
				</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full">
			{/* LOKALNE FILTRY TABELI */}
			<div className="flex flex-col sm:flex-row justify-between gap-3 p-4 border-b border-t-border-subtle bg-black/5 dark:bg-white/5 rounded-t-2xl">
				<div className="relative w-full sm:max-w-xs h-10">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<input
						type="text"
						placeholder="Szukaj w portfelu Booster..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full h-full bg-white dark:bg-slate-900 border border-t-border-subtle rounded-lg pl-10 pr-4 text-[11px] font-bold text-t-text-primary outline-none focus:border-blue-500/50 transition-colors"
					/>
				</div>
				<div className="flex w-full sm:w-48 items-center gap-2 bg-white dark:bg-slate-900 border border-t-border-subtle rounded-lg px-3 h-10 focus-within:border-t-border transition-colors">
					<ArrowDownAZ className="w-4 h-4 text-slate-400 shrink-0" />
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className="w-full h-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer"
					>
						<option value="value_desc" className="bg-t-bg-panel">
							Największa wartość
						</option>
						<option value="conviction_desc" className="bg-t-bg-panel">
							Najwyższa pewność
						</option>
						<option value="roi_desc" className="bg-t-bg-panel">
							Największy zysk (ROI)
						</option>
						<option value="roi_asc" className="bg-t-bg-panel">
							Największa strata
						</option>
					</select>
				</div>
			</div>

			{/* WERSJA DESKTOP */}
			<div className="hidden md:block">
				<Table className="w-full min-w-[1000px]">
					<TableHeader>
						<TableRow className="border-b border-t-border-subtle hover:bg-transparent">
							<TableHead className="sticky left-0 z-20 bg-t-bg-sticky text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pl-6 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
								Aktywo
							</TableHead>
							<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
								Ryzyko
							</TableHead>
							<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 w-32">
								Przekonanie
							</TableHead>
							<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 w-32">
								Waga (Udział)
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
						{filteredAndSortedAssets.length === 0 ? (
							<TableRow className="hover:bg-transparent">
								<TableCell colSpan={8} className="h-32 text-center border-none">
									<span className="font-bold text-t-text-tertiary text-sm">
										Brak wyników wyszukiwania
									</span>
								</TableCell>
							</TableRow>
						) : (
							filteredAndSortedAssets.map((asset, index) => {
								const individualRoi =
									asset.investedCapital > 0
										? ((asset.currentValue - asset.investedCapital) /
												asset.investedCapital) *
											100
										: 0;
								const sharePercent =
									(asset.currentValue / totalPortfolioValue) * 100;

								const isEven = index % 2 === 1;
								const isHighConviction =
									asset.conviction && asset.conviction > 70;
								const convictionColor = isHighConviction
									? "bg-emerald-500"
									: "bg-amber-500";

								return (
									<TableRow
										key={asset.id}
										className={cn(
											"border-b border-t-border-subtle hover:bg-t-hover transition-colors group",
											isEven && "bg-t-bg-base/50 dark:bg-t-bg-base/30",
										)}
									>
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
										{/* NOWA KOLUMNA: WAGA (UDZIAŁ) */}
										<TableCell className="py-4 border-none">
											<div className="space-y-1.5 pr-4">
												<div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
													<span>Udział</span>
													<span className="text-blue-500 font-black">
														{sharePercent.toFixed(1)}%
													</span>
												</div>
												<Progress
													value={sharePercent}
													className="h-1.5 bg-black/5 dark:bg-white/5 border border-t-border-subtle"
													indicatorColor="bg-blue-500"
												/>
											</div>
										</TableCell>
										<TableCell className="max-w-40 xl:max-w-48 py-4 border-none">
											<p className="text-xs text-t-text-tertiary italic truncate">
												&quot;{asset.rationale || "Brak opisanej tezy..."}&quot;
											</p>
										</TableCell>
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
										<TableCell
											className={cn(
												"text-right font-mono font-bold text-sm py-4 border-none whitespace-nowrap",
												individualRoi >= 0
													? "text-emerald-600 dark:text-emerald-400"
													: "text-rose-600 dark:text-rose-500",
											)}
										>
											{individualRoi > 0 && "+"}
											{individualRoi.toFixed(1)}%
										</TableCell>
										<TableCell className="text-right py-4 pr-6 border-none">
											<BoosterActionsClient asset={asset} />
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			{/* WERSJA MOBILE (KARTY) */}
			<div className="flex flex-col gap-3 p-3 md:hidden">
				{/* Kod mobilny identyczny z poprzednim (dla zwięzłości), tu również dodano 'sharePercent' */}
				{filteredAndSortedAssets.map((asset) => {
					const individualRoi =
						asset.investedCapital > 0
							? ((asset.currentValue - asset.investedCapital) /
									asset.investedCapital) *
								100
							: 0;
					const sharePercent = (asset.currentValue / totalPortfolioValue) * 100;
					const isHighConviction = asset.conviction && asset.conviction > 70;
					const convictionColor = isHighConviction
						? "bg-emerald-500"
						: "bg-amber-500";

					return (
						<div
							key={`mobile-${asset.id}`}
							className="flex flex-col bg-t-bg-base border border-t-border-subtle rounded-xl p-4 shadow-sm relative"
						>
							<div className="absolute top-4 right-4">
								<BoosterActionsClient asset={asset} />
							</div>
							<div className="mb-4 pr-8">
								<h3 className="font-bold text-sm text-t-text-primary truncate">
									{asset.name}
								</h3>
								<div className="flex items-center gap-2 mt-1">
									{asset.ticker && (
										<span className="text-[9px] font-mono bg-black/5 dark:bg-white/5 text-t-text-secondary px-1.5 py-0.5 rounded border border-t-border inline-block uppercase">
											{asset.ticker}
										</span>
									)}
									<span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 rounded">
										Waga: {sharePercent.toFixed(1)}%
									</span>
								</div>
							</div>

							<div className="flex justify-between items-end mb-4 pb-4 border-b border-t-border-subtle">
								<div className="flex flex-col">
									<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-1">
										Wycena / Wkład
									</span>
									<span className="text-sm font-black text-t-text-primary">
										{asset.currentValue.toLocaleString("pl-PL", {
											maximumFractionDigits: 0,
										})}{" "}
										PLN
									</span>
								</div>
								<div className="flex flex-col items-end">
									<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-1">
										ROI
									</span>
									<span
										className={cn(
											"text-lg font-black tracking-tight",
											individualRoi >= 0 ? "text-emerald-500" : "text-rose-500",
										)}
									>
										{individualRoi > 0 && "+"}
										{individualRoi.toFixed(1)}%
									</span>
								</div>
							</div>
							<div className="flex flex-col">
								<div className="flex justify-between items-center mb-1.5">
									<span className="text-[10px] font-bold text-t-text-secondary uppercase tracking-widest">
										Pewność: {asset.conviction}%
									</span>
								</div>
								<Progress
									value={asset.conviction || 0}
									className="h-1.5 bg-black/5 dark:bg-white/5"
									indicatorColor={convictionColor}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

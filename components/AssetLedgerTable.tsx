"use client";

import { CATEGORY_LABELS, COLORS, PAGE_ITEMS } from "@/lib/constants";
import {
	ChevronDown,
	ListOrdered,
	Plus,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import AddButton from "./ui/AddButton";
import BulbTip from "./shared/BulbTip";
import { DeleteButton } from "./DeleteButton";
import Link from "next/link";
import PaginatedBar from "./shared/PaginatedBar";
import { PortfolioWithAssets } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import QuickAdjustCell from "./QuickAdjustCell";
import { calculateAssetPL } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { deleteAsset } from "@/lib/actions/portfolio.actions";
import { updateAssetValues } from "@/lib/actions/asset.actions";
import { useSearchParams } from "next/navigation";

interface Props {
	portfolio: PortfolioWithAssets;
}

const AssetLedgerTable = ({ portfolio }: Props) => {
	const { assets } = portfolio;
	const searchParams = useSearchParams();
	const highlightedId = searchParams.get("newAssetId");

	// EN: State for UI interactions
	const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);

	// EN: Calculate individual asset P&L based on current portfolio data
	const assetsWithPL = useMemo(() => {
		return assets.map((asset) => {
			const { profitAmount, profitPercent } = calculateAssetPL(asset);
			return {
				...asset,
				profitAmount,
				profitPercent,
			};
		});
	}, [assets]);

	// EN: Prepare data for the current page
	const paginatedAssets = assetsWithPL.slice(
		(currentPage - 1) * PAGE_ITEMS,
		currentPage * PAGE_ITEMS,
	);

	// EN: Total portfolio value for share calculations
	const totalPortfolioValue = useMemo(
		() => assets.reduce((sum, asset) => sum + asset.currentValue, 0),
		[assets],
	);

	return (
		<section className="pt-8 border-t border-border">
			{/* --- HEADER SECTION --- */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1 mb-8">
				<div className="space-y-1">
					<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
						<ListOrdered className="h-6 w-6 text-primary" /> Szczegółowy Rejestr
						Aktywów
					</h2>
					<div className="hidden sm:block">
						<BulbTip
							title="Zasada:"
							content="Utrzymuj odchylenia poniżej 5%. Rebalansuj tylko gdy strategia tego wymaga."
						/>
					</div>
				</div>

				<AddButton>
					<Link
						href={`/dashboard/${portfolio.id}/add-asset`}
						className="flex items-center gap-2"
					>
						<Plus className="h-4 w-4" /> Nowe Aktywo
					</Link>
				</AddButton>
			</div>

			<div className="w-full">
				<Table>
					<TableHeader className="bg-muted/30">
						<TableRow className="border-border">
							<TableHead className="w-50 font-bold py-4">Aktywo</TableHead>
							<TableHead className="w-37.5 font-bold">Kategoria</TableHead>
							<TableHead className="w-50 font-bold text-center">
								Alokacja (%)
							</TableHead>
							<TableHead className="w-45 font-bold text-center">
								Korekta
							</TableHead>
							<TableHead className="text-right font-bold w-32">
								Zysk / Strata
							</TableHead>
							<TableHead className="text-right font-bold">
								Wartość Rynkowa
							</TableHead>
							<TableHead className="w-12"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedAssets.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="text-center py-12 text-muted-foreground"
								>
									Portfel jest pusty. Zacznij dodawać aktywa.
								</TableCell>
							</TableRow>
						) : (
							paginatedAssets.map((asset) => {
								// EN: Filter transaction history for this specific asset
								const assetHistory = portfolio.transactionHistories.filter(
									(tx) =>
										(tx.ticker && tx.ticker === asset.ticker) ||
										tx.assetName === asset.name,
								);

								const hasHistory = assetHistory.length > 0;
								const isExpanded = expandedAssetId === asset.id && hasHistory;
								const isHighlighted = asset.id === highlightedId;

								// EN: Calculate current market price per unit
								const currentUnitPrice =
									asset.quantity > 0 ? asset.currentValue / asset.quantity : 0;
								const share = Number(
									((asset.currentValue / totalPortfolioValue) * 100).toFixed(1),
								);
								const categoryColor =
									COLORS[asset.category as keyof typeof COLORS] || "#ccc";

								return (
									<React.Fragment key={asset.id}>
										<TableRow
											className={cn(
												"border-border transition-colors group",
												hasHistory
													? "cursor-pointer hover:bg-muted/20"
													: "opacity-90",
												isExpanded && "bg-muted/30",
												isHighlighted && "bg-primary/5",
											)}
											onClick={() =>
												hasHistory &&
												setExpandedAssetId(isExpanded ? null : asset.id)
											}
										>
											{/* KOLUMNA 1: Nazwa + Ticker + Ilość + Ikona rozwijania */}
											<TableCell className="relative py-2">
												<div className="flex items-center gap-2">
													{hasHistory && (
														<ChevronDown
															className={cn(
																"h-3 w-3 text-primary transition-transform duration-200",
																isExpanded ? "rotate-180" : "rotate-0",
															)}
														/>
													)}
													<div className="font-bold text-sm">{asset.name}</div>
												</div>
												<div className="flex items-center gap-2 mt-1">
													<span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded uppercase">
														{asset.ticker || "ASSET"}
													</span>
													<span className="text-[10px] text-blue-500 font-bold">
														{asset.quantity.toFixed(2)} szt.
													</span>
												</div>
											</TableCell>

											<TableCell>
												<div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
													<div
														className="w-2 h-2 rounded-full"
														style={{ backgroundColor: categoryColor }}
													/>
													{CATEGORY_LABELS[asset.category]}
												</div>
											</TableCell>

											<TableCell>
												<div className="space-y-1 pr-4">
													<div className="flex justify-between text-[10px] font-bold">
														<span className="text-muted-foreground uppercase">
															Udział
														</span>
														<span>{share}%</span>
													</div>
													<Progress
														value={share}
														indicatorColor={categoryColor}
														className="h-1"
													/>
												</div>
											</TableCell>

											<TableCell>
												<QuickAdjustCell
													assetId={asset.id}
													currentValue={asset.currentValue}
													onUpdate={updateAssetValues}
												/>
											</TableCell>

											<TableCell className="text-right">
												<div
													className={cn(
														"text-xs font-bold font-mono",
														asset.profitAmount >= 0
															? "text-emerald-500"
															: "text-red-500",
													)}
												>
													<div>
														{asset.profitAmount > 0 ? "+" : ""}
														{asset.profitAmount.toLocaleString()} PLN
													</div>
													<div className="text-[10px] opacity-70">
														{asset.profitPercent.toFixed(2)}%
													</div>
												</div>
											</TableCell>

											<TableCell className="text-right font-bold font-mono text-sm tabular-nums">
												{asset.currentValue.toLocaleString()}{" "}
												<span className="text-[10px] font-normal opacity-50">
													PLN
												</span>
											</TableCell>

											<TableCell className="text-right">
												<DeleteButton
													id={asset.id}
													onDelete={deleteAsset}
													confirmMsg={`Usunąć ${asset.name}?`}
												/>
											</TableCell>
										</TableRow>

										{/* --- EXPANDED TRANSACTION HISTORY --- */}
										{isExpanded && (
											<TableRow className="bg-muted/10 border-none hover:bg-muted/10">
												<TableCell colSpan={7} className="p-0">
													<div className="px-10 py-4 animate-in fade-in slide-in-from-top-1 duration-200">
														<div className="space-y-3">
															{assetHistory.map((tx: any) => {
																// EN: Calculate specific performance for this individual trade
																{
																	/* txUnitPrice: To cena jednostkowa tej konkretnej transakcji (ile zapłaciłeś za sztukę w tamtym dniu). */
																}
																const txUnitPrice =
																	tx.quantity !== 0
																		? tx.executedValue / tx.quantity
																		: 0;
																// txProfitPercent: To wynik tej konkretnej „paczki” akcji. Pozwala Ci to zobaczyć, że np. akcje kupione w styczniu zarabiają 10%, a te z marca są 2% na minusie.
																const txProfitPercent =
																	txUnitPrice > 0
																		? ((currentUnitPrice - txUnitPrice) /
																				txUnitPrice) *
																			100
																		: 0;
																const isBuy = tx.quantity > 0;

																return (
																	<div
																		key={tx.id}
																		className="flex items-center justify-between text-[11px] border-b border-border/40 pb-2 last:border-none"
																	>
																		{/* Data & Transaction Type */}
																		<div className="flex items-center gap-4">
																			<span className="text-muted-foreground font-medium">
																				{new Date(
																					tx.executedAt,
																				).toLocaleDateString()}
																			</span>
																			<span
																				className={cn(
																					"px-1.5 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-tighter",
																					isBuy
																						? "bg-emerald-500/10 text-emerald-600"
																						: "bg-orange-500/10 text-orange-600",
																				)}
																			>
																				{isBuy ? "Kupno" : "Sprzedaż"}
																			</span>
																		</div>

																		{/* Position performance (current vs buy price) */}
																		<div className="flex items-center gap-2">
																			<span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">
																				Wynik paczki:
																			</span>
																			<div
																				className={cn(
																					"flex items-center gap-1 font-bold font-mono",
																					txProfitPercent >= 0
																						? "text-emerald-500"
																						: "text-red-500",
																				)}
																			>
																				{txProfitPercent >= 0 ? (
																					<TrendingUp className="h-3 w-3" />
																				) : (
																					<TrendingDown className="h-3 w-3" />
																				)}
																				{txProfitPercent > 0 ? "+" : ""}
																				{txProfitPercent.toFixed(2)}%
																			</div>
																		</div>

																		{/* Values and Volume */}
																		<div className="flex gap-6 font-mono text-right">
																			<div className="flex flex-col">
																				<span className="font-bold">
																					{tx.executedValue.toLocaleString()}{" "}
																					PLN
																				</span>
																				<span className="text-[9px] text-muted-foreground">
																					@ {txUnitPrice.toFixed(2)} / szt.
																				</span>
																			</div>
																			<span className="min-w-[70px] font-bold text-muted-foreground">
																				{tx.quantity.toFixed(4)} szt.
																			</span>
																		</div>
																	</div>
																);
															})}
														</div>
													</div>
												</TableCell>
											</TableRow>
										)}
									</React.Fragment>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			<PaginatedBar
				items={assets}
				currentPage={currentPage}
				onClick={setCurrentPage}
			/>
		</section>
	);
};

export default AssetLedgerTable;

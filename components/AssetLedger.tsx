"use client";

import { CATEGORY_LABELS, COLORS, PAGE_ITEMS } from "@/lib/constants";
import { History, ListOrdered, Plus } from "lucide-react";
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
const AssetLedger = ({ portfolio }: Props) => {
	const { assets } = portfolio;
	const searchParams = useSearchParams();
	const highlightedId = searchParams.get("newAssetId");
	const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);

	const assetsWithPL = useMemo(() => {
		return assets.map((asset) => {
			// Tu wywołujemy Twoją funkcję z calculations.ts
			const { profitAmount, profitPercent } = calculateAssetPL(asset);

			return {
				...asset,
				profitAmount,
				profitPercent,
			};
		});
	}, [assets]);

	// Teraz tniemy listę, która ma już policzone zyski!
	const paginatedAssets = assetsWithPL.slice(
		(currentPage - 1) * PAGE_ITEMS,
		currentPage * PAGE_ITEMS,
	);

	// EN: Calculate total value for share percentage
	// UI: Obliczanie całkowitej wartości dla procentowego udziału
	const totalPortfolioValue = useMemo(
		() => assets.reduce((sum, asset) => sum + asset.currentValue, 0),
		[assets],
	);
	return (
		<section className="pt-8 border-t border-border">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1 mb-8">
				<div className="space-y-1">
					<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
						<ListOrdered className="h-6 w-6 text-primary" /> Szczegółowy Rejestr
						Aktywów
					</h2>
					{/* <BulbTip
							title="Zasada:"
							content="Utrzymuj odchylenia poniżej 5%. Rebalansuj tylko gdy strategia tego wymaga, by unikać zbędnych kosztów."
						/> */}
					<div className="hidden sm:block">
						<BulbTip
							title="Zasada:"
							content="Utrzymuj odchylenia poniżej 5%. Rebalansuj tylko gdy strategia tego wymaga."
						/>
					</div>
					<div className="sm:hidden">
						{/* Wersja mobilna: tylko ikona lub krótszy tekst */}
						<p className="text-[10px] text-muted-foreground italic">
							💡 Cel: odchylenie &lt; 5%
						</p>
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
				{/* EN: Table with Alpha-inspired visual density */}
				{/* UI: Tabela inspirowana stylem Alpha z większą gęstością wizualną */}
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
									colSpan={6}
									className="text-center py-12 text-muted-foreground "
								>
									Portfel jest pusty. Zacznij dodawać aktywa.
								</TableCell>
							</TableRow>
						) : (
							paginatedAssets.map((asset) => {
								// Filtrujemy historię dla tego konkretnego aktywa
								const assetHistory = portfolio.transactionHistories.filter(
									(tx) =>
										(tx.ticker && tx.ticker === asset.ticker) ||
										tx.assetName === asset.name,
								);

								const isExpanded = expandedAssetId === asset.id;
								const isHighlighted = asset.id === highlightedId;
								const share = Number(
									((asset.currentValue / totalPortfolioValue) * 100).toFixed(1),
								);
								const categoryColor =
									COLORS[asset.category as keyof typeof COLORS] || "#ccc";
								return (
									<React.Fragment key={asset.id}>
										<TableRow
											className={cn(
												"border-border hover:bg-muted/20 transition-colors group cursor-pointer",
												isExpanded && "bg-muted/30",
												isHighlighted && "bg-primary/5",
											)}
											onClick={() =>
												setExpandedAssetId(isExpanded ? null : asset.id)
											}
										>
											{/* KOLUMNA 1: Nazwa, Ticker i Ilość */}
											<TableCell className="relative py-2">
												<div className="font-bold text-sm">{asset.name}</div>
												<div className="flex items-center gap-2 mt-1">
													<span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded uppercase">
														{asset.ticker || "ASSET"}
													</span>
													<span className="text-[10px] text-blue-500 font-bold uppercase">
														{asset.quantity.toFixed(2)} szt.
													</span>
												</div>
											</TableCell>

											{/* KOLUMNA 2: Kategoria */}
											<TableCell>
												<div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
													<div
														className="w-2 h-2 rounded-full"
														style={{ backgroundColor: categoryColor }}
													/>
													{CATEGORY_LABELS[asset.category]}
												</div>
											</TableCell>

											{/* KOLUMNA 3: Alokacja (Progress Bar) */}
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

											{/* KOLUMNA 4: Korekta (QuickAdjust) */}
											<TableCell>
												<QuickAdjustCell
													assetId={asset.id}
													currentValue={asset.currentValue}
													onUpdate={updateAssetValues}
												/>
											</TableCell>

											{/* KOLUMNA 5: P&L */}
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

											{/* KOLUMNA 6: Wartość Rynkowa */}
											<TableCell className="text-right font-bold font-mono text-sm tabular-nums">
												{asset.currentValue.toLocaleString()}{" "}
												<span className="text-[10px] font-normal opacity-50">
													PLN
												</span>
											</TableCell>

											{/* KOLUMNA 7: Akcje (Usuwanie) */}
											<TableCell className="text-right">
												<DeleteButton
													id={asset.id}
													onDelete={deleteAsset}
													confirmMsg={`Usunąć ${asset.name}?`}
												/>
											</TableCell>
										</TableRow>
										{/* --- ROZWIJANA HISTORIA TRANSFAKCJI --- */}
										{isExpanded && (
											<TableRow className="bg-muted/10 hover:bg-muted/10 border-none">
												<TableCell colSpan={7} className="p-0">
													<div className="px-6 py-4 animate-in fade-in slide-in-from-top-2 duration-300">
														<div className="flex items-center gap-2 mb-3">
															<History className="h-4 w-4 text-primary" />
															<h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
																Historia zakupów dla {asset.name}
															</h4>
														</div>

														<div className="space-y-2">
															{/* Tutaj mapujemy historię. Zakładam, że dociągniesz relację transactions */}
															{assetHistory?.length > 0 ? (
																assetHistory.map((tx: any) => (
																	<div
																		key={tx.id}
																		className="flex items-center justify-between text-[11px] border-b border-border/50 pb-2 last:border-none"
																	>
																		<div className="flex flex-col">
																			<span className="font-bold">
																				{new Date(
																					tx.executedAt,
																				).toLocaleDateString()}
																			</span>
																			<span className="text-muted-foreground italic max-w-md truncate">
																				&quot;{tx.rationale || "Brak notatki"}
																				&quot;
																			</span>
																		</div>
																		{/* <div className="flex gap-4 font-mono">
																			<span>{tx.quantity.toFixed(4)} szt.</span>
																			<span className="font-bold">
																				{tx.executedValue.toLocaleString()} PLN
																			</span>
																		</div> */}
																		<div className="flex gap-4 font-mono text-right">
																			<div className="flex flex-col">
																				<span className="font-bold">
																					{tx.executedValue.toLocaleString()}{" "}
																					PLN
																				</span>
																				{/* EN: Show unit price for that specific buy / UI: Pokaż cenę jednostkową tego zakupu */}
																				<span className="text-[9px] text-muted-foreground">
																					@{" "}
																					{(
																						tx.executedValue / tx.quantity
																					).toFixed(2)}{" "}
																					/ szt.
																				</span>
																			</div>
																			<span className="min-w-[70px]">
																				{tx.quantity.toFixed(4)} szt.
																			</span>
																		</div>
																	</div>
																))
															) : (
																<p className="text-[10px] text-muted-foreground italic">
																	Brak szczegółowej historii dla tego aktywa.
																</p>
															)}
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

			{/* Pagination */}
			<PaginatedBar
				items={assets}
				currentPage={currentPage}
				onClick={setCurrentPage}
			/>
		</section>
	);
};

export default AssetLedger;

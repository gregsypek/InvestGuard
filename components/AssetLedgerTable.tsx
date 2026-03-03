"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_LABELS, COLORS, PAGE_ITEMS } from "@/lib/constants";
import {
	ChevronDown,
	ListOrdered,
	MoreHorizontal,
	Plus,
	Scale,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HandCoins, Trash2 } from "lucide-react"; // Ikonki do menu (opcjonalnie)
import React, { useMemo, useState, useTransition } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { adjustAssetAction, sellAssetAction } from "@/app/actions";

import AddButton from "./ui/AddButton";
import { AdjustAssetModal } from "./AdjustAssetModal";
import BulbTip from "./shared/BulbTip";
import { DeleteButton } from "./DeleteButton";
import Link from "next/link";
import PaginatedBar from "./shared/PaginatedBar";
import { PortfolioWithAssets } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import QuickAdjustCell from "./QuickAdjustCell";
import { SellAssetModal } from "./SellAssetModal";
import { calculateAssetPL } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { deleteAsset } from "@/lib/actions/portfolio.actions";
import { toast } from "sonner";
import { updateAssetValues } from "@/lib/actions/asset.actions";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

interface Props {
	portfolio: PortfolioWithAssets;
	allPortfoliosWithCash: { id: string; name: string }[]; // EN: Passed from the server component
}

const AssetLedgerTable = ({ portfolio, allPortfoliosWithCash }: Props) => {
	const router = useRouter();
	const { assets } = portfolio;
	const searchParams = useSearchParams();
	const highlightedId = searchParams.get("newAssetId");

	// EN: State for UI interactions
	const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	// EN: Define state with generic 'any' or proper Asset type to allow objects
	const [assetToSell, setAssetToSell] = useState<any>(null);
	// EN: State to control the Adjust Asset modal
	const [assetToAdjust, setAssetToAdjust] = useState<any>(null);
	const [isPending, startTransition] = useTransition();
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

	// EN: Function to bridge the Modal data with the Server Action
	// 4. Funkcja obsługująca potwierdzenie sprzedaży:
	const handleConfirmSell = (data: {
		quantity: number;
		price: number;
		targetId: string;
		note?: string;
	}) => {
		// EN: Guard clause to satisfy TypeScript that assetToSell is not null
		if (!assetToSell) return;
		const formData = new FormData();
		formData.append("assetId", assetToSell.id);
		formData.append("quantity", data.quantity.toString());
		formData.append("sellPrice", data.price.toString());
		formData.append("targetPortfolioId", data.targetId);
		formData.append("executedAt", new Date().toISOString());
		// EN: Append note to formData if it exists
		if (data.note) {
			formData.append("note", data.note);
		}
		startTransition(async () => {
			try {
				const response = await sellAssetAction(formData);
				if (response.success) {
					toast.success(`Sprzedano ${assetToSell.ticker}!`);
					setAssetToSell(null); // Zamknij modal
					router.refresh();
				}
			} catch {
				toast.error("Błąd podczas realizacji sprzedaży");
			}
		});
	};
	const handleConfirmAdjust = async (data: {
		newQuantity: number;
		newInvestedCapital: number;
		newCurrentValue: number;
		note: string;
	}) => {
		if (!assetToAdjust) return;

		const formData = new FormData();
		formData.append("assetId", assetToAdjust.id);
		formData.append("newQuantity", data.newQuantity.toString());
		formData.append("newInvestedCapital", data.newInvestedCapital.toString());
		formData.append("newCurrentValue", data.newCurrentValue.toString());
		if (data.note) formData.append("note", data.note);

		startTransition(async () => {
			const response = await adjustAssetAction(formData);
			if (response.success) {
				toast.success(
					`Zaktualizowano stan dla ${assetToAdjust.ticker || assetToAdjust.name}!`,
				);
				setAssetToAdjust(null);
				router.refresh();
			} else {
				toast.error(response.message || "Wystąpił błąd");
			}
		});
	};

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

								// 2. EN: Calculate cumulative data using reduce (Safe from "Reassigning variable" error)
								// PL: Obliczamy sumę skumulowaną za pomocą reduce (bezpieczne i stabilne)
								const chartData = [...assetHistory]
									.sort(
										(a, b) =>
											new Date(a.executedAt).getTime() -
											new Date(b.executedAt).getTime(),
									)
									.reduce((acc: any[], tx) => {
										const lastAmount =
											acc.length > 0 ? acc[acc.length - 1].amount : 0;
										acc.push({
											date: new Date(tx.executedAt).toLocaleDateString(),
											amount: lastAmount + tx.quantity,
										});
										return acc;
									}, []);

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

											{/* <TableCell className="text-right">
												<DeleteButton
													id={asset.id}
													onDelete={deleteAsset}
													confirmMsg={`Usunąć ${asset.name}?`}
												/>
													</TableCell> */}
											<TableCell
												className="text-right"
												onClick={(e) => e.stopPropagation()}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<button className="p-2 hover:bg-muted rounded-full transition-colors outline-none focus:ring-2 focus:ring-ring">
															<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
														</button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-40">
														{/* EN: Sell Action */}
														<DropdownMenuItem
															className="cursor-pointer font-medium"
															onClick={(e) => {
																e.stopPropagation();
																setAssetToSell(asset);
															}}
														>
															<HandCoins className="mr-2 h-4 w-4 text-emerald-500" />
															Sprzedaj aktywo
														</DropdownMenuItem>

														{/* EN: Adjust Action */}
														<DropdownMenuItem
															className="cursor-pointer font-medium"
															onClick={(e) => {
																e.stopPropagation();
																setAssetToAdjust(asset);
															}}
														>
															<Scale className="mr-2 h-4 w-4 text-blue-500" />
															Korekta stanu
														</DropdownMenuItem>

														<DropdownMenuSeparator />

														{/* EN: Hard Delete Action */}
														<div
															className="flex w-full items-center px-2 py-1.5 text-sm"
															onClick={(e) => e.stopPropagation()}
														>
															<DeleteButton
																id={asset.id}
																onDelete={deleteAsset}
																confirmMsg={`Usunąć całkowicie ${asset.name} i jego historię z tego portfela?`}
															/>
														</div>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>

										{/* --- EXPANDED TRANSACTION HISTORY --- */}
										{isExpanded && (
											<TableRow className="bg-muted/5 border-none hover:bg-muted/5">
												<TableCell colSpan={7} className="p-0 border-none">
													<div className="animate-in fade-in slide-in-from-top-1 duration-200">
														<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
															{/* LEWA STRONA: Wykres akumulacji (3/12 szerokości) */}
															<div className="lg:col-span-3 h-48 lg:h-full bg-background/50 rounded-xl border border-border/50 p-4">
																<p className="text-[10px] font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
																	<TrendingUp className="h-3 w-3" /> Historia
																	budowania stosu
																</p>
																<ResponsiveContainer width="100%" height="80%">
																	<AreaChart data={chartData}>
																		<defs>
																			<linearGradient
																				id="colorAmount"
																				x1="0"
																				y1="0"
																				x2="0"
																				y2="1"
																			>
																				<stop
																					offset="5%"
																					stopColor={categoryColor}
																					stopOpacity={0.3}
																				/>
																				<stop
																					offset="95%"
																					stopColor={categoryColor}
																					stopOpacity={0}
																				/>
																			</linearGradient>
																		</defs>
																		<Tooltip
																			contentStyle={{
																				fontSize: "10px",
																				borderRadius: "8px",
																				backgroundColor: "#fff",
																			}}
																		/>
																		<Area
																			type="stepAfter"
																			dataKey="amount"
																			stroke={categoryColor}
																			fillOpacity={1}
																			fill="url(#colorAmount)"
																			strokeWidth={2}
																			dot={{ r: 2, fill: categoryColor }}
																		/>
																	</AreaChart>
																</ResponsiveContainer>
															</div>

															{/* PRAWA STRONA: Twoja logika listy transakcji (9/12 szerokości) */}
															<div className="lg:col-span-9 space-y-3">
																<p className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1">
																	Ostatnie operacje i obligacje
																</p>
																<div className="max-h-96 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
																	{assetHistory.map((t: any) => {
																		// EN: Your original logic for transaction type and stats
																		const isBuy = t.quantity > 0;
																		const isCorrection =
																			t.rationale?.includes("[KOREKTA STANU]");
																		const txUnitPrice =
																			t.quantity !== 0
																				? Math.abs(t.executedValue / t.quantity)
																				: 0;
																		const txProfitPercent =
																			isBuy && txUnitPrice > 0 && !isCorrection
																				? ((currentUnitPrice - txUnitPrice) /
																						txUnitPrice) *
																					100
																				: 0;

																		return (
																			<div
																				key={t.id}
																				className="flex items-center justify-between text-[11px] bg-background/50 border border-border/40 p-3 rounded-lg hover:border-border transition-colors"
																			>
																				{/* 1. Data i Typ (Badge) */}
																				<div className="flex items-center gap-4">
																					<span className="text-muted-foreground font-medium">
																						{new Date(
																							t.executedAt,
																						).toLocaleDateString()}
																					</span>
																					<span
																						className={cn(
																							"px-1.5 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-tighter",
																							isCorrection
																								? "bg-blue-500/10 text-blue-600"
																								: isBuy
																									? "bg-emerald-500/10 text-emerald-600"
																									: "bg-orange-500/10 text-orange-600",
																						)}
																					>
																						{isCorrection
																							? "Korekta"
																							: isBuy
																								? "Kupno"
																								: "Sprzedaż"}
																					</span>
																				</div>

																				{/* 2. Wynik paczki (Profit %) */}
																				<div className="flex items-center gap-2">
																					{isBuy && !isCorrection ? (
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
																					) : (
																						<span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">
																							{isCorrection
																								? "Wyrównanie"
																								: "Zrealizowano"}
																						</span>
																					)}
																				</div>

																				{/* 3. Wartości liczbowe (PLN i Sztuki) - Z FIXEM na -0.00 */}
																				<div className="flex gap-6 font-mono text-right">
																					<div className="flex flex-col">
																						<span
																							className={cn(
																								"font-bold",
																								isCorrection
																									? "text-blue-600"
																									: !isBuy && "text-orange-600",
																							)}
																						>
																							{/* FIX dla -0.00: Jeśli wartość jest niemal zerowa, nie pokazuj minusa */}
																							{isBuy
																								? "+"
																								: Math.abs(t.executedValue) <
																									  0.01
																									? ""
																									: "-"}
																							{Math.abs(
																								t.executedValue,
																							).toLocaleString(undefined, {
																								minimumFractionDigits: 2,
																							})}{" "}
																							PLN
																						</span>
																						<span className="text-[9px] text-muted-foreground">
																							@ {txUnitPrice.toFixed(2)} / szt.
																						</span>
																					</div>
																					<span className="min-w-18 font-bold text-muted-foreground">
																						{t.quantity > 0 && isCorrection
																							? "+"
																							: ""}
																						{t.quantity.toFixed(4)} szt.
																					</span>
																				</div>
																			</div>
																		);
																	})}
																</div>
															</div>
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

			{/* EN: Temporary test display to verify data flow */}
			{/* EN: Final Sale Modal Integration */}
			{assetToSell && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<SellAssetModal
						asset={assetToSell}
						portfoliosWithCash={allPortfoliosWithCash}
						currentPortfolioId={portfolio.id}
						onConfirm={handleConfirmSell}
						onClose={() => setAssetToSell(null)}
						isLoading={isPending}
					/>
				</div>
			)}

			{/* EN: Adjustment Modal Integration */}
			{assetToAdjust && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<AdjustAssetModal
						asset={assetToAdjust}
						onConfirm={handleConfirmAdjust}
						onClose={() => setAssetToAdjust(null)}
						isLoading={isPending}
					/>
				</div>
			)}
		</section>
	);
};

export default AssetLedgerTable;

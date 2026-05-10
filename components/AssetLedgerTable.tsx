"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { Asset, TransactionHistory } from "@prisma/client";
import { CATEGORY_LABELS, COLORS, PAGE_ITEMS } from "@/lib/constants";
import {
	ChevronDown,
	ExternalLink,
	HandCoins,
	Lock,
	MoreHorizontal,
	Scale,
	TrendingUp,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useMemo, useState, useTransition } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	adjustAssetAction,
	sellAssetAction,
	updateAssetValues,
} from "@/lib/actions/asset-actions";

import { AdjustAssetModal } from "./AdjustAssetModal";
import { AssetLogo } from "./shared/AssetLogo";
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
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

interface Props {
	portfolio: PortfolioWithAssets;
	isDemo?: boolean;
	allPortfoliosWithCash: { id: string; name: string }[];
}

// 1. Definiujemy prosty typ dla wykresu
type ChartPoint = { date: string; amount: number };

const AssetLedgerTable = ({
	portfolio,
	allPortfoliosWithCash,
	isDemo,
}: Props) => {
	const router = useRouter();
	const { assets } = portfolio;
	const searchParams = useSearchParams();
	const highlightedId = searchParams.get("newAssetId");
	const [showFullHistory, setShowFullHistory] = useState(false);
	const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [assetToSell, setAssetToSell] = useState<Asset | null>(null);
	const [assetToAdjust, setAssetToAdjust] = useState<Asset | null>(null);
	const [isPending, startTransition] = useTransition();

	// --- LOGIKA AGREGACJI (HUB & SPOKE) ---
	const assetsWithPL = useMemo(() => {
		// console.log("🚀 ~ AssetLedgerTable ~ assets:", assets);
		// 1. Oddzielamy zwykłe aktywa od obligacji
		const standardAssets = assets.filter((a) => a.category !== "BONDS");
		const bondAssets = assets.filter((a) => a.category === "BONDS");
		// console.log("🚀 ~ AssetLedgerTable ~ bondAssets:", bondAssets);

		// 2. Budujemy jeden wiersz agregujący wszystkie transze obligacji
		let aggregatedBonds: Asset | null = null;
		if (bondAssets.length > 0) {
			aggregatedBonds = {
				id: "bonds-summary-id",
				name: "Portfel Obligacji Skarbowych",
				ticker: "OBLIGACJE",
				category: "BONDS",
				quantity: bondAssets.length,
				investedCapital: bondAssets.reduce(
					(sum, b) => sum + (b.investedCapital || 0),
					0,
				),
				currentValue: bondAssets.reduce(
					(sum, b) => sum + (b.currentValue || 0),
					0,
				),
				dailyChange: bondAssets.reduce(
					(sum, b) => sum + (b.dailyChange || 0),
					0,
				),
				targetPercentage: 55,

				// --- POPRAWKA: Dodajemy brakujące pola techniczne ---
				portfolioId: portfolio.id, // ID portfela, w którym jesteśmy
				createdAt: new Date(), // Data utworzenia (wirtualna)
				updatedAt: new Date(), // Data aktualizacji (wirtualna)

				// Reszta pól opcjonalnych (może być null/0)
				purchaseDate: new Date(),
				nominalValue: null,
				interestRate: null,
				rateType: null,
				timeHorizon: null,
				expectedRoi: null,
				maturityDate: null,
				rationale: "Podsumowanie zbiorcze obligacji",
				conviction: null,
				riskLevel: null,
			};
			// console.log("🚀 ~ AssetLedgerTable ~ aggregatedBonds:", aggregatedBonds);
		}

		// 3. Łączymy w jedną tablicę
		const combined = aggregatedBonds
			? [...standardAssets, aggregatedBonds]
			: standardAssets;
		// console.log("🚀 ~ AssetLedgerTable ~ combined:", combined);

		return combined.map((asset) => {
			console.log("🚀 ~ AssetLedgerTable ~ asset:", asset);
			const { profitAmount, profitPercent } = calculateAssetPL({
				investedCapital: asset.investedCapital ?? 0,
				currentValue: asset.currentValue ?? 0,
			});
			// EN: Clean the ticker (remove _1772815... hack) for display
			const cleanTicker = asset.ticker ? asset.ticker.split("_")[0] : "ASSET";

			// console.log("🚀 ~ AssetLedgerTable ~ aggregatedBonds:", combined);
			return {
				...asset,
				profitAmount,
				profitPercent,
				cleanTicker,
			};
		});
	}, [assets, portfolio]);
	// console.log("🚀 ~ AssetLedgerTable ~ assetsWithPL:", assetsWithPL);

	const paginatedAssets = assetsWithPL.slice(
		(currentPage - 1) * PAGE_ITEMS,
		currentPage * PAGE_ITEMS,
	);

	const totalPortfolioValue = useMemo(
		() => assets.reduce((sum, asset) => sum + asset.currentValue, 0),
		[assets],
	);

	// --- HANDLERY (Bez zmian) ---
	const handleConfirmSell = (data: {
		quantity: number;
		price: number;
		targetId: string;
		note?: string;
	}) => {
		if (!assetToSell) return;
		const formData = new FormData();
		formData.append("assetId", assetToSell.id);
		formData.append("quantity", data.quantity.toString());
		formData.append("sellPrice", data.price.toString());
		formData.append("targetPortfolioId", data.targetId);
		formData.append("executedAt", new Date().toISOString());
		if (data.note) formData.append("note", data.note);
		startTransition(async () => {
			try {
				const response = await sellAssetAction(formData);
				if (response.success) {
					toast.success(`Sprzedano ${assetToSell.ticker}!`);
					setAssetToSell(null);
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
		<>
			<div className="w-full">
				<Table>
					<TableHeader className="">
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
								console.log("🚀 ~ AssetLedgerTable ~ asset:", asset);
								const isAggregatedBond = asset.id === "bonds-summary-id";

								// // EN: Smart filtering: If it's the aggregated bond row, show ALL bond history.
								// // Otherwise, show specific asset history by clean ticker.
								// const assetHistory = isAggregatedBond
								// 	? portfolio.transactionHistories.filter(
								// 			(tx) => tx.category === "BONDS",
								// 		)
								// 	: portfolio.transactionHistories.filter(
								// 			(tx) =>
								// 				(tx.ticker &&
								// 					tx.ticker.split("_")[0] === asset.cleanTicker) ||
								// 				tx.assetName === asset.name,
								// 		);
								// EN: Smart filtering: Ensure history is isolated by technical ticker AND category
								const assetHistory = isAggregatedBond
									? portfolio.transactionHistories.filter(
											(tx) => tx.category === "BONDS",
										)
									: portfolio.transactionHistories.filter(
											(tx) =>
												// KLUCZ: Porównujemy pełny techniczny ticker (np. CASH_BOOSTER)
												// oraz kategorię, aby uniknąć wycieku historii między wierszami
												tx.ticker === asset.ticker &&
												tx.category === asset.category,
										);

								const chartData = [...assetHistory]
									.sort(
										(a, b) =>
											new Date(a.executedAt).getTime() -
											new Date(b.executedAt).getTime(),
									)
									.reduce((acc: ChartPoint[], tx) => {
										let valueToAdd = 0;

										if (isAggregatedBond) {
											// Logika dla obligacji (operujemy na PLN)
											valueToAdd =
												tx.type === "SELL"
													? -Math.abs(tx.executedValue)
													: Math.abs(tx.executedValue);
										} else {
											// Logika dla akcji/ETF (operujemy na sztukach)
											// EN: If it's a BUY or DEPOSIT, value is positive. If SELL, it's negative.
											// PL: Jeśli KUPNO/WPŁATA - dodatnie. Jeśli SPRZEDAŻ - ujemne.
											const isNegative = tx.type === "SELL";
											valueToAdd = isNegative
												? -Math.abs(tx.quantity)
												: Math.abs(tx.quantity);
										}

										const lastAmount =
											acc.length > 0 ? acc[acc.length - 1].amount : 0;

										acc.push({
											date: new Date(tx.executedAt).toLocaleDateString(),
											amount: lastAmount + valueToAdd,
										});
										return acc;
									}, []);

								const hasHistory = assetHistory.length > 0;
								const isExpanded = expandedAssetId === asset.id && hasHistory;
								const isHighlighted = asset.id === highlightedId;

								// EN: Logic for slicing history based on toggle
								const visibleHistory = showFullHistory
									? assetHistory
									: assetHistory.slice(0, 3);

								// const currentUnitPrice =
								// 	asset.quantity > 0 && !isAggregatedBond
								// 		? asset.currentValue / asset.quantity
								// 		: 0;
								const share = Number(
									(
										((asset.currentValue ?? 0) / totalPortfolioValue) *
										100
									).toFixed(1),
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
												// isAggregatedBond && "bg-primary/5", // EN: Subtle highlight for the summary row
												asset.quantity === 0 &&
													!isAggregatedBond &&
													"opacity-50 grayscale-[0.5]",
											)}
											onClick={() => {
												if (hasHistory) {
													setExpandedAssetId(
														isExpanded ? null : (asset.id as string),
													);
													setShowFullHistory(false); // Resetujemy widok przy zmianie wiersza
												}
											}}
										>
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
													{/* EN: Using our optimized component | PL: Użycie zoptymalizowanego komponentu */}
													<AssetLogo
														ticker={asset.ticker || ""}
														className="w-4 h-4"
													/>
													<div className="font-bold text-sm truncate max-w-60">
														{asset.name}
													</div>
												</div>
												<div className="flex items-center gap-2 mt-1">
													<span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded uppercase">
														{asset.cleanTicker}
													</span>
													<span className="text-[10px] text-blue-500 font-bold">
														{isAggregatedBond ||
															`${(asset.quantity ?? 0).toLocaleString(
																undefined,
																{
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																},
															)} szt`}
													</span>
												</div>
											</TableCell>

											<TableCell>
												<div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
													<div
														className="w-2 h-2 rounded-full"
														style={{ backgroundColor: categoryColor }}
													/>
													{asset.category
														? CATEGORY_LABELS[asset.category]
														: ""}
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
												{isAggregatedBond ? (
													<span className="text-[10px] text-muted-foreground uppercase tracking-widest block text-center opacity-50 ">
														Auto-kalkulacja
													</span>
												) : asset.quantity === 0 ? (
													<span className="text-[10px] text-muted-foreground block text-center opacity-30">
														—
													</span>
												) : (
													<div className="flex justify-center">
														<QuickAdjustCell
															assetId={asset.id}
															currentValue={asset.currentValue}
															onUpdate={updateAssetValues}
															isDemo={isDemo}
														/>
													</div>
												)}
											</TableCell>

											<TableCell className="text-right">
												{asset.quantity === 0 && !isAggregatedBond ? (
													<div className="inline-flex items-center px-1.5 py-0.5 rounded border border-dashed border-muted-foreground/30 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
														ZAMKNIĘTA POZYCJA
													</div>
												) : (
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
															{asset.profitAmount.toLocaleString(undefined, {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}{" "}
															PLN
														</div>
														<div className="text-[10px] opacity-70">
															{asset.profitPercent.toFixed(2)}%
														</div>
													</div>
												)}
											</TableCell>

											<TableCell className="text-right font-bold font-mono text-sm tabular-nums">
												{asset.currentValue
													? asset.currentValue.toLocaleString("pl-PL", {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})
													: 0}{" "}
												<span className="text-[10px] font-normal opacity-50">
													PLN
												</span>
											</TableCell>

											<TableCell
												className="text-right"
												onClick={(e) => e.stopPropagation()}
											>
												{isAggregatedBond ? (
													!isDemo && (
														<Link
															href="/bond-reports"
															className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase text-primary hover:text-blue-600 transition-colors  px-2 py-1.5 rounded-md"
														>
															Szczegóły <ExternalLink size={12} />
														</Link>
													)
												) : (
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<button className="p-2 hover:bg-muted rounded-full transition-colors outline-none focus:ring-2 focus:ring-ring">
																<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
															</button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end" className="w-40">
															<DropdownMenuItem
																className="cursor-pointer font-medium"
																disabled={asset.quantity === 0}
																onClick={(e) => {
																	e.stopPropagation();

																	// BLOKADA DEMO
																	if (isDemo) {
																		toast.error("Akcja zablokowana", {
																			description:
																				"Sprzedaż aktywów jest wyłączona w trybie demo.",
																			icon: <Lock className="h-4 w-4" />,
																		});
																		return;
																	}
																	setAssetToSell(asset as unknown as Asset); // 👈 Informujemy TS, że to nadal jest Asset
																}}
															>
																<HandCoins className="mr-2 h-4 w-4 text-emerald-500" />{" "}
																Sprzedaj
															</DropdownMenuItem>
															<DropdownMenuItem
																className="cursor-pointer font-medium"
																disabled={asset.quantity === 0} // 🚀 BLOKADA: Korekta zera jest zbędna
																onClick={(e) => {
																	e.stopPropagation();

																	// BLOKADA DEMO
																	if (isDemo) {
																		toast.error("Akcja zablokowana", {
																			description:
																				"Korekta wyceny jest wyłączona w trybie demo.",
																			icon: <Lock className="h-4 w-4" />,
																		});
																		return;
																	}

																	// Wyciągamy pola UI, zostawiając resztę (czysty Asset) w zmiennej baseAsset
																	setAssetToAdjust(asset as unknown as Asset);
																}}
															>
																<Scale className="mr-2 h-4 w-4 text-blue-500" />{" "}
																Korekta
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<div onClick={(e) => e.stopPropagation()}>
																<DeleteButton
																	id={asset.id}
																	onDelete={deleteAsset}
																	confirmMsg={`Usunąć całkowicie ${asset.name}?`}
																	isDemo={isDemo}
																	className="flex w-full items-center gap-4 px-2 py-1.5 cursor-pointer font-medium text-sm text-destructive hover:bg-destructive/10 transition-colors"
																	label="Usuń "
																/>
															</div>
														</DropdownMenuContent>
													</DropdownMenu>
												)}
											</TableCell>
										</TableRow>

										{/* --- EXPANDED TRANSACTION HISTORY --- */}
										{isExpanded && (
											<TableRow className="bg-muted/5 border-none hover:bg-muted/5">
												<TableCell colSpan={7} className="p-0 border-none">
													<div className="animate-in fade-in slide-in-from-top-1 duration-200">
														<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
															{/* LEWA STRONA: Wykres (3/12) */}
															<div className="lg:col-span-3 h-48 lg:h-full bg-background/50 rounded-xl border border-border/50 p-4">
																<p className="text-[10px] font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
																	<TrendingUp className="h-3 w-3" /> Wzrost
																	kapitału
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

															{/* PRAWA STRONA: Lista transakcji (9/12) */}
															<div className="lg:col-span-9 space-y-3">
																<div className="flex justify-between items-center px-2 mb-1">
																	<p className="text-[10px] font-bold text-muted-foreground uppercase">
																		{isAggregatedBond
																			? "Historia wszystkich transz obligacji"
																			: "Ostatnie operacje"}
																	</p>

																	{/* --- PRZEŁĄCZNIK WIDOKU --- */}
																	{assetHistory.length > 3 && (
																		<label className="flex items-center gap-2 cursor-pointer group">
																			<input
																				type="checkbox"
																				checked={showFullHistory}
																				onChange={() =>
																					setShowFullHistory(!showFullHistory)
																				}
																				className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
																			/>
																			<span className="text-[9px] font-bold text-muted-foreground uppercase group-hover:text-primary transition-colors">
																				Pokaż całą historię (
																				{assetHistory.length})
																			</span>
																		</label>
																	)}
																</div>

																<div className="max-h-96 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
																	{/* EN: We map ONLY over visibleHistory to respect the toggle/slice logic */}
																	{visibleHistory.map(
																		(t: TransactionHistory) => {
																			// ZMIANA 1: Polegamy na typie z bazy (Enum)
																			const isBuy = t.type === "BUY";
																			// const isSell = t.type === "SELL";
																			const isCorrection = t.type === "UPDATE";

																			// Obliczamy cenę jednostkową tylko dla kupna/sprzedaży
																			const txUnitPrice =
																				t.quantity !== 0
																					? Math.abs(
																							t.executedValue / t.quantity,
																						)
																					: 0;

																			return (
																				<div
																					key={t.id}
																					className="flex items-center justify-between text-[11px] bg-background/50 border border-border/40 p-3 rounded-lg hover:border-border transition-colors"
																				>
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
																									? "bg-blue-500/10 text-blue-600" // Niebieski dla UPDATE
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
																						{isAggregatedBond && (
																							<span className="font-bold text-[10px] text-slate-500 uppercase">
																								{t.assetName || "Seria"}
																							</span>
																						)}
																					</div>

																					<div className="flex gap-6 font-mono text-right">
																						<div className="flex flex-col">
																							<span
																								className={cn(
																									"font-bold",
																									isCorrection
																										? t.executedValue >= 0
																											? "text-blue-600"
																											: "text-red-500" // Niebieski zysk, czerwona strata korekty
																										: isBuy
																											? "text-emerald-500"
																											: "text-orange-600",
																								)}
																							>
																								{/* Pokazujemy +/- na podstawie kierunku */}
																								{isCorrection
																									? t.executedValue > 0
																										? "+"
																										: ""
																									: isBuy
																										? "+"
																										: "-"}
																								{Math.abs(
																									t.executedValue,
																								).toLocaleString(undefined, {
																									minimumFractionDigits: 2,
																									maximumFractionDigits: 2,
																								})}{" "}
																								PLN
																							</span>
																							{!isCorrection && (
																								<span className="text-[9px] text-muted-foreground">
																									@ {txUnitPrice.toFixed(2)} /
																									szt.
																								</span>
																							)}
																						</div>
																						<span className="min-w-18 font-bold text-muted-foreground">
																							{/* ZMIANA: Znak ilości sztuk zależy od kierunku transakcji (Kupno: +, Sprzedaż: -) */}
																							{isCorrection
																								? "0.0000"
																								: (isBuy ? "+" : "-") +
																									Math.abs(t.quantity).toFixed(
																										4,
																									)}{" "}
																							szt.
																						</span>
																					</div>
																				</div>
																			);
																		},
																	)}

																	{!showFullHistory &&
																		assetHistory.length > 3 && (
																			<p className="text-[10px] text-center text-muted-foreground italic pt-2 opacity-50">
																				... i {assetHistory.length - 3} więcej
																				operacji.
																			</p>
																		)}
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
				items={assetsWithPL}
				currentPage={currentPage}
				onClick={setCurrentPage}
			/>

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
		</>
	);
};

export default AssetLedgerTable;

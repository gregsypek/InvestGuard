"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { Asset, TransactionHistory } from "@prisma/client";
import { AssetWithUI, PortfolioWithAssets } from "@/lib/types";
import { CATEGORY_LABELS, COLORS, PAGE_ITEMS } from "@/lib/constants";
import {
	ChevronDown,
	ExternalLink,
	HandCoins,
	Lock,
	MoreHorizontal,
	PlusCircle,
	Scale,
	Trash2,
	TrendingUp,
	X,
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
import { AssetFilterPanel } from "./shared/AssetFilterPanel";
import { AssetHistoryChart } from "./history/AssetHistoryChart";
import { AssetLogo } from "./shared/AssetLogo";
import { FilterBadge } from "./shared/FilterBadge";
import Link from "next/link";
import PaginatedBar from "./shared/PaginatedBar";
import PremiumDeleteModal from "./shared/PremiumDeleteModal";
import { Progress } from "@/components/ui/progress";
import QuickAdjustCell from "./QuickAdjustCell";
import { QuickDepositForm } from "./ui/QuickDepositForm";
import { SellAssetModal } from "./SellAssetModal";
import { calculateAssetPL } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { deleteAsset } from "@/lib/actions/portfolio.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useSortedAssets } from "@/lib/hooks/useSortedAssets";

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

	const [assetToSell, setAssetToSell] = useState<AssetWithUI | null>(null);
	const [assetToAdjust, setAssetToAdjust] = useState<AssetWithUI | null>(null);
	const [assetToDelete, setAssetToDelete] = useState<AssetWithUI | null>(null);

	// EN: State to control the Quick Deposit Modal visibility
	const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

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
				isObserved: false,
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
	// EN: 1. State for controlling filters and sorting
	const [hideClosed, setHideClosed] = useState(true);
	const [sortBy, setSortBy] = useState("ACTIVITY");

	// 2. NAJPIERW FILTRUJEMY I SORTUJEMY (zanim potniemy na strony!)

	const filteredAndSortedAssets = useSortedAssets(
		assetsWithPL,
		portfolio.transactionHistories,
		hideClosed,
		sortBy,
	);

	const startIndex = (currentPage - 1) * PAGE_ITEMS;
	const endIndex = startIndex + PAGE_ITEMS;

	// 4. WYCINAMY ELEMENTY NA OBECNĄ STRONĘ (korzystając z przefiltrowanej listy)
	const paginatedAssets = filteredAndSortedAssets.slice(startIndex, endIndex);

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
			{/* EN: 4. The Controls Panel (FilterBadges) added above the table */}

			<AssetFilterPanel
				hideClosed={hideClosed}
				onToggleHideClosed={() => setHideClosed(!hideClosed)}
				sortBy={sortBy}
				onSortChange={setSortBy}
				sortOptions={[
					{ id: "ACTIVITY", label: "Ostatnia aktywność" },
					{ id: "PROFIT", label: "Zysk PLN" },
							{ id: "PROFIT_PCT", label: "Zysk %" },
					{ id: "ALPHA", label: "A-Z" },
					{ id: "VALUE", label: "Wartość" },
				]}
			/>

			<div className="w-full overflow-x-auto no-scrollbar pb-4">
				<Table className="min-w-[700px] sm:min-w-[800px]">
					<TableHeader>
						<TableRow className="border-b border-t-border-subtle hover:bg-transparent">
							<TableHead className="sticky left-0 rounded-tl-2xl  z-20 bg-t-bg-sticky w-48 sm:w-56 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary py-4 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)] border-none">
								Aktywo
							</TableHead>
							<TableHead className="hidden sm:table-cell w-32 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none">
								Kategoria
							</TableHead>
							<TableHead className="w-32 sm:w-40 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary text-center border-none">
								Alokacja (%)
							</TableHead>
							<TableHead className="w-32 sm:w-40 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary text-center border-none">
								Korekta
							</TableHead>
							<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary w-28 sm:w-32 border-none">
								Zysk / Strata
							</TableHead>
							<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none pr-2">
								Wartość Rynkowa
							</TableHead>
							<TableHead className="w-8 border-none px-0"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedAssets.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="text-center py-16 text-t-text-tertiary font-medium border-none"
								>
									Portfel jest pusty. Zacznij dodawać aktywa.
								</TableCell>
							</TableRow>
						) : (
							paginatedAssets.map((asset, index) => {
								const isLastRow = index === paginatedAssets.length - 1;
								const isAggregatedBond = asset.id === "bonds-summary-id";

								const assetHistory = (
									isAggregatedBond
										? portfolio.transactionHistories.filter(
												(tx) => tx.category === "BONDS",
											)
										: portfolio.transactionHistories.filter(
												(tx) =>
													tx.ticker === asset.ticker &&
													tx.category === asset.category,
											)
								).sort(
									(a, b) =>
										new Date(b.executedAt).getTime() -
										new Date(a.executedAt).getTime(),
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
											valueToAdd =
												tx.type === "SELL"
													? -Math.abs(tx.executedValue)
													: Math.abs(tx.executedValue);
										} else {
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

								const visibleHistory = showFullHistory
									? assetHistory
									: assetHistory.slice(0, 3);

								const share =
									totalPortfolioValue <= 0
										? 0
										: Number(
												(
													((asset.currentValue ?? 0) / totalPortfolioValue) *
													100
												).toFixed(1),
											);
								const categoryColor =
									COLORS[asset.category as keyof typeof COLORS] || "#64748b";

								return (
									<React.Fragment key={asset.id}>
										<TableRow
											className={cn(
												"border-b border-t-border-subtle transition-colors group",
												hasHistory
													? "cursor-pointer hover:bg-t-hover"
													: "opacity-90",
												isExpanded && "bg-t-bg-base",
												isHighlighted && "bg-blue-500/5",
												// 🚀 ZMIANA: Gotówka (CASH) nigdy nie staje się szara i wyciszona!
												asset.quantity === 0 &&
													!isAggregatedBond &&
													asset.category !== "CASH" &&
													"opacity-50 grayscale",
											)}
											onClick={() => {
												if (hasHistory) {
													setExpandedAssetId(
														isExpanded ? null : (asset.id as string),
													);
													setShowFullHistory(false);
												}
											}}
										>
											<TableCell
												className={cn(
													"sticky left-0 z-10 py-3 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)] border-none transition-colors",
													isExpanded
														? "bg-t-bg-sticky-hover"
														: "bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover",
													// NOWA LINIJKA: Zaokrągla lewy dół tylko dla ostatniego, nierozwiniętego elementu
													isLastRow && !isExpanded && "rounded-bl-xl",
												)}
											>
												<div className="flex items-center gap-2 md:gap-3 pl-1">
													{hasHistory && (
														<ChevronDown
															className={cn(
																"h-4 w-4 shrink-0 text-t-text-tertiary group-hover:text-t-text-secondary transition-all duration-200",
																isExpanded ? "rotate-180" : "rotate-0",
															)}
														/>
													)}
													<AssetLogo
														ticker={asset.ticker || ""}
														className="w-5 h-5 md:w-6 md:h-6 drop-shadow-sm shrink-0"
													/>
													<div className="flex flex-col justify-center">
														<div className="hidden sm:block font-bold text-xs md:text-sm text-t-text-primary truncate max-w-[140px] md:max-w-[180px] xl:max-w-[240px] tracking-tight">
															{asset.name}
														</div>
														<div className="flex items-center gap-1.5 md:mt-0.5">
															<div
																className="w-1.5 h-1.5 rounded-full opacity-80 shrink-0 sm:hidden block"
																style={{ backgroundColor: categoryColor }}
															/>
															<span className="text-[10px] md:text-[9px] font-bold text-t-text-secondary font-mono sm:bg-black/5 dark:sm:bg-white/5 sm:border sm:border-black/10 dark:sm:border-white/10 px-0 sm:px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
																{asset.cleanTicker}
															</span>
															<span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-wide">
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
													</div>
												</div>
											</TableCell>

											<TableCell className="border-none hidden sm:table-cell">
												<div className="flex items-center gap-2 text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest">
													<div
														className="w-1.5 h-1.5 rounded-full opacity-80 shrink-0"
														style={{ backgroundColor: categoryColor }}
													/>
													<span className="truncate max-w-[100px]">
														{asset.category
															? CATEGORY_LABELS[asset.category]
															: ""}
													</span>
												</div>
											</TableCell>

											<TableCell className="border-none">
												<div className="space-y-1.5 pr-2 sm:pr-4">
													<div className="flex justify-center text-[10px] font-bold">
														<span className="text-t-text-primary font-mono">
															{share}%
														</span>
													</div>
													<Progress
														value={share}
														indicatorColor={categoryColor}
														className="h-1 bg-slate-200 dark:bg-slate-800"
													/>
												</div>
											</TableCell>

											<TableCell className="border-none">
												{isAggregatedBond ? (
													<span className="text-[9px] text-t-text-tertiary uppercase tracking-widest block text-center font-bold">
														Auto-kalkulacja
													</span>
												) : // 🚀 ZMIANA: Gotówka (CASH) zawsze ma przycisk korekty, nawet przy 0.00
												asset.quantity === 0 && asset.category !== "CASH" ? (
													<span className="text-sm text-t-text-tertiary block text-center font-bold">
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

											<TableCell className="text-right border-none">
												{/* 🚀 ZMIANA: Gotówka nigdy nie wyświetla napisu "Zamknięta" */}
												{asset.quantity === 0 &&
												!isAggregatedBond &&
												asset.category !== "CASH" ? (
													<div className="inline-flex items-center px-2 py-0.5 rounded-sm border border-t-border bg-t-hover text-[8px] font-bold text-t-text-tertiary uppercase tracking-widest">
														Zamknięta
													</div>
												) : (
													<div
														className={cn(
															"text-xs md:text-sm font-bold font-mono tracking-tight",
															asset.profitAmount >= 0
																? "text-emerald-600 dark:text-emerald-400 drop-shadow-none dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]"
																: "text-rose-600 dark:text-rose-500 drop-shadow-none dark:drop-shadow-[0_0_8px_rgba(244,63,94,0.2)]",
														)}
													>
														<div>
															{asset.profitAmount > 0 ? "+" : ""}
															{asset.profitAmount.toLocaleString(undefined, {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}
														</div>
														<div className="text-[9px] md:text-[10px] opacity-80 mt-0.5">
															{asset.profitPercent > 0 ? "+" : ""}
															{asset.profitPercent.toFixed(2)}%
														</div>
													</div>
												)}
											</TableCell>

											<TableCell className="text-right font-mono tabular-nums border-none pr-2">
												<div className="flex flex-col items-end justify-center">
													<span className="text-xs md:text-sm font-bold text-t-text-primary">
														{asset.currentValue
															? asset.currentValue.toLocaleString("pl-PL", {
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																})
															: 0}
													</span>
													<span className="text-[9px] font-bold text-t-text-tertiary uppercase tracking-widest mt-0.5">
														PLN
													</span>
												</div>
											</TableCell>

											<TableCell
												className="text-right border-none px-0 pr-2"
												onClick={(e) => e.stopPropagation()}
											>
												{isAggregatedBond ? (
													!isDemo && (
														<Link
															href="/bond-reports"
															className="inline-flex items-center justify-center text-t-text-tertiary hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-all p-1.5 rounded-md"
															title="Szczegóły"
														>
															<ExternalLink size={14} />
														</Link>
													)
												) : (
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<button className="p-1.5 hover:bg-t-hover rounded-md transition-colors outline-none focus:ring-2 focus:ring-blue-500">
																<MoreHorizontal className="h-4 w-4 text-t-text-tertiary" />
															</button>
														</DropdownMenuTrigger>

														<DropdownMenuContent
															align="end"
															className="w-40 bg-t-bg-panel border-t-border text-t-text-primary"
														>
															{/* 1. ZASIL PORTFEL (TYLKO DLA GOTÓWKI) */}
															{asset.category === "CASH" && (
																<DropdownMenuItem
																	className="cursor-pointer font-medium hover:bg-t-hover focus:bg-t-hover text-emerald-600 dark:text-emerald-400"
																	onClick={(e) => {
																		e.stopPropagation();
																		if (isDemo) {
																			toast.error("Akcja zablokowana", {
																				description:
																					"Wpłaty są wyłączone w trybie demo.",
																				icon: <Lock className="h-4 w-4" />,
																			});
																			return;
																		}
																		setIsDepositModalOpen(true);
																	}}
																>
																	<PlusCircle className="mr-2 h-4 w-4" />
																	Zasil portfel
																</DropdownMenuItem>
															)}

															{/* 2. SPRZEDAJ / WYPŁAĆ (DLA WSZYSTKICH) */}
															<DropdownMenuItem
																className="cursor-pointer font-medium hover:bg-t-hover focus:bg-t-hover"
																disabled={
																	asset.quantity === 0 &&
																	asset.category !== "CASH"
																}
																onClick={(e) => {
																	e.stopPropagation();
																	if (isDemo) {
																		toast.error("Akcja zablokowana", {
																			description:
																				"Sprzedaż aktywów jest wyłączona w trybie demo.",
																			icon: <Lock className="h-4 w-4" />,
																		});
																		return;
																	}
																	setAssetToSell(asset);
																}}
															>
																<HandCoins className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
																{asset.category === "CASH"
																	? "Wypłać gotówkę"
																	: "Sprzedaj"}
															</DropdownMenuItem>

															{/* 3. KOREKTA (UKRYTA DLA GOTÓWKI) */}
															{asset.category !== "CASH" && (
																<DropdownMenuItem
																	className="cursor-pointer font-medium hover:bg-t-hover focus:bg-t-hover"
																	disabled={asset.quantity === 0}
																	onClick={(e) => {
																		e.stopPropagation();
																		if (isDemo) {
																			toast.error("Akcja zablokowana", {
																				description:
																					"Korekta wyceny jest wyłączona w trybie demo.",
																				icon: <Lock className="h-4 w-4" />,
																			});
																			return;
																		}
																		setAssetToAdjust(asset);
																	}}
																>
																	<Scale className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
																	Korekta
																</DropdownMenuItem>
															)}

															{/* 4. USUŃ (UKRYTE DLA GOTÓWKI) */}
															{asset.category !== "CASH" && (
																<>
																	<DropdownMenuSeparator className="bg-t-border" />
																	<div
																		onClick={(e) => {
																			e.stopPropagation();
																			setAssetToDelete(asset);
																		}}
																		className="flex w-full items-center gap-2 px-2 py-1.5 cursor-pointer font-medium text-sm text-rose-600 dark:text-rose-500 hover:bg-rose-500/10 transition-colors rounded-sm outline-none"
																	>
																		<Trash2 className="mr-2 w-4 h-4" />
																		<span>Usuń</span>
																	</div>
																</>
															)}
														</DropdownMenuContent>
													</DropdownMenu>
												)}
											</TableCell>
										</TableRow>

										{/* SEKCJA Z HISTORIĄ */}
										{isExpanded && (
											<TableRow className="bg-t-bg-base border-b border-t-border-subtle hover:bg-t-bg-base">
												<TableCell
													colSpan={7}
													className={cn(
														"p-0 border-none",
														isLastRow && "rounded-b-xl",
													)}
												>
													<div
														className={cn(
															"animate-in fade-in slide-in-from-top-2 duration-300",
															isLastRow && "rounded-b-xl overflow-hidden",
														)}
													>
														<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 bg-gradient-to-b from-black/5 dark:from-black/20 to-transparent shadow-inner">
															<div className="lg:col-span-4 h-48 lg:h-full bg-t-bg-panel rounded-xl border border-t-border p-4 flex flex-col">
																<p className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-4 flex items-center gap-2">
																	<TrendingUp className="h-3.5 w-3.5" /> Wzrost
																	kapitału
																</p>
																<div className="flex-1 w-full min-h-[150px]">
																	<ResponsiveContainer
																		width="100%"
																		height="100%"
																	>
																		<AreaChart data={chartData}>
																			<defs>
																				<linearGradient
																					id={`colorAmount-${asset.id}`}
																					x1="0"
																					y1="0"
																					x2="0"
																					y2="1"
																				>
																					<stop
																						offset="5%"
																						stopColor={categoryColor}
																						stopOpacity={0.4}
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
																					backgroundColor: "var(--t-bg-panel)",
																					border: "1px solid var(--t-border)",
																					borderRadius: "8px",
																					fontSize: "11px",
																					fontWeight: "600",
																					color: "var(--t-text-primary)",
																				}}
																				itemStyle={{ color: categoryColor }}
																			/>
																			<Area
																				type="stepAfter"
																				dataKey="amount"
																				stroke={categoryColor}
																				fillOpacity={1}
																				fill={`url(#colorAmount-${asset.id})`}
																				strokeWidth={2}
																				dot={{
																					r: 3,
																					fill: categoryColor,
																					stroke: "var(--t-bg-panel)",
																					strokeWidth: 2,
																				}}
																			/>
																		</AreaChart>
																	</ResponsiveContainer>
																</div>
															</div>

															<div className="lg:col-span-8 space-y-3">
																<div className="flex justify-between items-center px-1 mb-2">
																	<p className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest">
																		{isAggregatedBond
																			? "Historia transz obligacji"
																			: "Rejestr Zleceń"}
																	</p>

																	{assetHistory.length > 3 && (
																		<label className="flex items-center gap-2 cursor-pointer group">
																			<input
																				type="checkbox"
																				checked={showFullHistory}
																				onChange={() =>
																					setShowFullHistory(!showFullHistory)
																				}
																				className="w-3 h-3 rounded bg-t-bg-panel border-t-border text-blue-600 dark:text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
																			/>
																			<span className="text-[9px] font-bold text-t-text-tertiary uppercase tracking-widest group-hover:text-t-text-primary transition-colors">
																				Cała historia ({assetHistory.length})
																			</span>
																		</label>
																	)}
																</div>

																<div className="max-h-64 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
																	{visibleHistory.map(
																		(t: TransactionHistory) => {
																			const isBuy = t.type === "BUY";
																			const isCorrection = t.type === "UPDATE";
																			const isInterest = t.type === "INTEREST";
																			const txUnitPrice =
																				t.quantity !== 0
																					? Math.abs(
																							t.executedValue / t.quantity,
																						)
																					: 0;

																			return (
																				<div
																					key={t.id}
																					className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] bg-t-bg-panel border border-t-border p-3 rounded-lg hover:bg-t-hover transition-colors"
																				>
																					<div className="flex items-center gap-3 md:gap-4">
																						<span className="text-t-text-secondary font-mono tracking-tighter">
																							{new Date(
																								t.executedAt,
																							).toLocaleDateString()}
																						</span>
																						<span
																							className={cn(
																								"px-2 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-widest border whitespace-nowrap",
																								isCorrection
																									? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
																									: isBuy
																										? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
																										: isInterest
																											? t.executedValue > 0
																												? "bg-purple-500/10 text-purple-600 border-purple-500/20"
																												: "bg-orange-500/10 text-orange-600 border-orange-500/20"
																											: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
																							)}
																						>
																							{isCorrection
																								? "Korekta"
																								: isBuy
																									? "Kupno"
																									: isInterest
																										? t.executedValue > 0
																											? "Dywidenda"
																											: "Podatek"
																										: "Sprzedaż"}
																						</span>
																						{isAggregatedBond && (
																							<span className="font-bold text-[10px] text-t-text-tertiary uppercase tracking-widest">
																								{t.assetName || "Seria"}
																							</span>
																						)}
																					</div>

																					<div className="flex justify-between sm:justify-end gap-6 font-mono text-right items-center">
																						<div className="flex flex-col">
																							<span
																								className={cn(
																									"font-bold text-xs tracking-tight",
																									isCorrection
																										? t.executedValue >= 0
																											? "text-blue-600 dark:text-blue-400"
																											: "text-rose-600 dark:text-rose-400"
																										: isBuy
																											? "text-emerald-600 dark:text-emerald-400"
																											: isInterest
																												? t.executedValue > 0
																													? "text-purple-600"
																													: "text-orange-600"
																												: "text-rose-600 dark:text-rose-400",
																								)}
																							>
																								{isCorrection
																									? t.executedValue > 0
																										? "+"
																										: ""
																									: isBuy
																										? "+"
																										: isInterest
																											? t.executedValue > 0
																												? "+"
																												: "-"
																											: "-"}
																								{Math.abs(
																									t.executedValue,
																								).toLocaleString(undefined, {
																									minimumFractionDigits: 2,
																									maximumFractionDigits: 2,
																								})}{" "}
																								PLN
																							</span>
																							{!isCorrection && !isInterest && (
																								<span className="text-[9px] text-t-text-tertiary font-medium tracking-tighter">
																									{/* @ {txUnitPrice.toFixed(2)} /
																									szt. */}
																									{!isCorrection &&
																										!isInterest && (
																											<span className="text-[9px] text-t-text-tertiary font-medium tracking-tighter block mt-0.5">
																												@{" "}
																												{(
																													t.originalPrice ?? 0
																												).toLocaleString(
																													undefined,
																													{
																														minimumFractionDigits: 2,
																														maximumFractionDigits: 4,
																													},
																												)}{" "}
																												{t.originalCurrency ||
																													"PLN"}{" "}
																												/ szt.
																												{/* Jeśli transakcja była w walucie obcej, doklejamy historyczny kurs */}
																												{t.originalCurrency &&
																													t.originalCurrency !==
																														"PLN" &&
																													t.exchangeRate &&
																													t.exchangeRate !==
																														1 && (
																														<span className="ml-1 text-blue-500/90 dark:text-blue-400/70 font-semibold">
																															(Kurs:{" "}
																															{(
																																t.exchangeRate ??
																																1
																															).toLocaleString(
																																undefined,
																																{
																																	minimumFractionDigits: 4,
																																	maximumFractionDigits: 4,
																																},
																															)}{" "}
																															PLN)
																														</span>
																													)}
																											</span>
																										)}
																								</span>
																							)}
																						</div>

																						{/* Ukrywamy ilość sztuk dla dywidend, bo wynosi 0 */}
																						{!isInterest && (
																							<span className="min-w-[70px] font-bold text-t-text-secondary text-xs">
																								{isCorrection
																									? "0.0000"
																									: (isBuy ? "+" : "-") +
																										Math.abs(
																											t.quantity,
																										).toFixed(4)}{" "}
																								<span className="text-[9px] text-t-text-tertiary ml-1">
																									szt.
																								</span>
																							</span>
																						)}
																					</div>
																				</div>
																			);
																		},
																	)}

																	{!showFullHistory &&
																		assetHistory.length > 3 && (
																			<p className="text-[10px] text-center text-t-text-tertiary font-bold tracking-widest uppercase py-3">
																				... i {assetHistory.length - 3} więcej
																			</p>
																		)}
																</div>
															</div>
														</div>
													</div>
												</TableCell>
											</TableRow>
										)}
										{/* ========================================================= */}
										{/* ROZWIJANY WYKRES Z HISTORIĄ DLA AKTYWA  */}
										{/* ========================================================= */}
										{expandedAssetId === asset.id &&
											asset.ticker &&
											asset.category !== "BONDS" &&
											asset.category !== "CASH" && (
												<TableRow className="bg-t-bg-base/80 dark:bg-t-bg-base/50 border-b border-t-border-subtle hover:bg-t-bg-base/80">
													<TableCell colSpan={7} className="p-0 border-none">
														<div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 md:p-6 bg-gradient-to-b from-black/5 dark:from-black/20 to-transparent shadow-inner">
															<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pl-4 md:pl-10 gap-3">
																<div>
																	<h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
																		Zaawansowana Analiza Techniczna:{" "}
																		<span className="text-blue-400">
																			{asset.ticker}
																		</span>
																	</h4>
																	<p className="text-xs text-slate-400 mt-1">
																		Wykres rynkowy z naniesionymi punktami
																		wejścia/wyjścia (z Twojej bazy)
																	</p>
																</div>
															</div>

															<div className="pl-2 pr-4 md:pl-8 md:pr-8">
																<AssetHistoryChart
																	ticker={asset.ticker}
																	transactions={assetHistory.map((tx) => ({
																		date: new Date(tx.executedAt)
																			.toISOString()
																			.split("T")[0],
																		// W tabeli głównej mapujemy Wpłaty/Kupno jako BUY, żeby wykres wiedział o zielonej kropce
																		type:
																			tx.type === "BUY" || tx.type === "DEPOSIT"
																				? "BUY"
																				: "SELL",
																		// Wyliczamy cenę jednostkową na moment wykonania transakcji
																		price:
																			tx.quantity !== 0
																				? Math.abs(
																						tx.executedValue / tx.quantity,
																					)
																				: 0,
																	}))}
																/>
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

			{/* EN: 5. Update the PaginatedBar to use the newly filtered array so the page count is correct */}
			<PaginatedBar
				items={filteredAndSortedAssets}
				currentPage={currentPage}
				onClick={setCurrentPage}
			/>

			{assetToSell && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-t-bg-base/80 backdrop-blur-sm p-4">
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
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-t-bg-base/80 backdrop-blur-sm p-4">
					<AdjustAssetModal
						asset={assetToAdjust}
						onConfirm={handleConfirmAdjust}
						onClose={() => setAssetToAdjust(null)}
						isLoading={isPending}
					/>
				</div>
			)}

			{/* ======================================================== */}
			{/* MODAL USUWANIA Z TABELI (Zawsze na samym dole komponentu)*/}
			{/* ======================================================== */}
			{assetToDelete && (
				<PremiumDeleteModal
					isOpen={!!assetToDelete}
					onClose={() => setAssetToDelete(null)}
					isDemo={isDemo}
					title="Usuwanie Aktywa"
					description={`Czy na pewno chcesz bezpowrotnie usunąć aktywo ${assetToDelete?.name}?`}
					onConfirm={async () => {
						const result = await deleteAsset(assetToDelete.id);

						if (result && result.success) {
							toast.success("Usunięto pomyślnie!");
							setAssetToDelete(null);
						} else {
							// Rzucamy błąd, żeby Modal przestał kręcić kółkiem ładowania
							throw new Error(result?.error || "Nie można usunąć aktywa");
						}
					}}
				/>
			)}

			{/* ======================================================== */}
			{/* EN: QUICK DEPOSIT MODAL WRAPPER */}
			{/* ======================================================== */}
			{isDepositModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-t-bg-base/80 backdrop-blur-sm p-4">
					<div className="bg-t-bg-panel border border-t-border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
						{/* EN: Modal Header with Close Button */}
						<div className="flex items-center justify-between p-6 border-b border-t-border-subtle bg-t-bg-panel">
							<div>
								<h2 className="text-lg font-black text-t-text-primary tracking-tight">
									Zasilenie gotówkowe
								</h2>
								<p className="text-[11px] text-t-text-tertiary uppercase tracking-widest font-bold mt-0.5">
									{portfolio.name}
								</p>
							</div>
							<button
								onClick={() => setIsDepositModalOpen(false)}
								className="p-2 text-t-text-tertiary hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* EN: The existing QuickDepositForm component seamlessly embedded */}
						<div className="p-2 sm:p-4 bg-t-bg-base/30 dark:bg-black/20">
							<QuickDepositForm portfolioId={portfolio.id} />
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default AssetLedgerTable;

"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { Asset, TransactionHistory } from "@prisma/client";
import { AssetWithUI, PortfolioWithAssets } from "@/lib/types";
import { CATEGORY_LABELS, COLORS, PAGE_ITEMS } from "@/lib/constants";
import {
	ChevronDown,
	ExternalLink,
	HandCoins,
	LayoutGrid,
	LayoutList,
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
import React, { useEffect, useMemo, useState, useTransition } from "react";
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
import { ChartContainer } from "./shared/ChartContainer";
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
import { formatCurrency } from "@/lib/utils/format-currency";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useSortedAssets } from "@/lib/hooks/useSortedAssets";

interface Props {
	portfolio: PortfolioWithAssets;
	isDemo?: boolean;
	allPortfoliosWithCash: { id: string; name: string }[];
}

type ChartPoint = { date: string; amount: number };

// EN: Helper function to clean up messy ETF/Asset names into a premium, readable format
function formatAssetName(rawName: string) {
	let cleanName = rawName || "Nieznane Aktywo";
	let isETF = false;
	let provider = null;

	// 1. Check if it's an ETF
	if (cleanName.includes("ETF") || cleanName.includes("UCITS")) {
		isETF = true;
	}

	// 2. Extract provider names
	const providers = [
		"iShares",
		"Vanguard",
		"Amundi",
		"Xtrackers",
		"Invesco",
		"Lyxor",
	];
	for (const p of providers) {
		if (cleanName.startsWith(p)) {
			provider = p;
			cleanName = cleanName.replace(p, "").trim();
			break;
		}
	}

	// 3. Remove typical ETF clutter and currency tags
	cleanName = cleanName
		.replace(/UCITS/g, "")
		.replace(/ETF/g, "")
		.replace(/USD/g, "")
		.replace(/EUR/g, "")
		.replace(/GBP/g, "")
		.replace(/\(Acc\)/gi, "")
		.replace(/\(Dist\)/gi, "")
		.replace(/\(PLN Hedged\)/gi, "")
		.replace(/\s+/g, " ")
		.trim();

	// 4. Fallback if the name was entirely composed of removed tags
	if (cleanName.length === 0) {
		cleanName = rawName;
	}

	return { cleanName, isETF, provider };
}

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
	const [filterCategory, setFilterCategory] = useState("ALL");

	// 🚀 EN: Premium UX - View Mode State (Table vs Mobile Cards)
	const [viewMode, setViewMode] = useState<"table" | "cards">("table");

	const [assetToSell, setAssetToSell] = useState<AssetWithUI | null>(null);
	const [assetToAdjust, setAssetToAdjust] = useState<AssetWithUI | null>(null);
	const [assetToDelete, setAssetToDelete] = useState<AssetWithUI | null>(null);
	const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	// --- LOGIC AGGREGATION & DATA ENRICHMENT ---
	const assetsWithPL = useMemo(() => {
		const standardAssets = assets.filter((a) => a.category !== "BONDS");
		const bondAssets = assets.filter((a) => a.category === "BONDS");

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
				portfolioId: portfolio.id,
				createdAt: new Date(),
				updatedAt: new Date(),
				isObserved: false,
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
		}

		const combined = aggregatedBonds
			? [...standardAssets, aggregatedBonds]
			: standardAssets;

		return combined.map((asset) => {
			const { profitAmount, profitPercent } = calculateAssetPL({
				investedCapital: asset.investedCapital ?? 0,
				currentValue: asset.currentValue ?? 0,
			});
			const cleanTicker = asset.ticker ? asset.ticker.split("_")[0] : "ASSET";

			// EN: Clean up names via the new formatter function
			const { cleanName, isETF, provider } = formatAssetName(asset.name || "");

			// 🚀 EN: Advanced analytics calculations (PLN - 4 decimals precision)
			const avgPrice =
				asset.quantity > 0 ? (asset.investedCapital ?? 0) / asset.quantity : 0;
			const currentPrice =
				asset.quantity > 0 ? (asset.currentValue ?? 0) / asset.quantity : 0;

			// 🚀 FIX: Usunięto "* 100", zakładając że API zapisuje odchylenie bezpośrednio (np. 4.17 jako 4.17%)
			const dailyChangePct = asset.dailyChange ?? 0;

			return {
				...asset,
				profitAmount,
				profitPercent,
				cleanTicker,
				cleanName,
				isETF,
				provider,
				avgPrice,
				currentPrice,
				dailyChangePct,
			};
		});
	}, [assets, portfolio]);

	const [hideClosed, setHideClosed] = useState(true);
	const [sortBy, setSortBy] = useState("ACTIVITY");

	const filteredAndSortedAssets = useSortedAssets(
		assetsWithPL,
		portfolio.transactionHistories,
		hideClosed,
		sortBy,
		filterCategory,
	);

	const startIndex = (currentPage - 1) * PAGE_ITEMS;
	const endIndex = startIndex + PAGE_ITEMS;
	const paginatedAssets = filteredAndSortedAssets.slice(startIndex, endIndex);

	const totalPortfolioValue = useMemo(
		() => assets.reduce((sum, asset) => sum + asset.currentValue, 0),
		[assets],
	);

	// --- HANDLERS ---
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
				toast.success(`Zaktualizowano stan dla ${assetToAdjust.cleanTicker}!`);
				setAssetToAdjust(null);
				router.refresh();
			} else {
				toast.error(response.message || "Wystąpił błąd");
			}
		});
	};

	const activeCategories = useMemo(() => {
		const uniqueCats = Array.from(
			new Set(assets.map((a) => a.category).filter(Boolean)),
		) as string[];

		return uniqueCats.map((cat) => ({
			id: cat,
			label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
		}));
	}, [assets]);

	return (
		<>
			{/* EN: Premium Toolbar: Filters + View Mode Toggles */}
			<div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between mb-4 w-full">
				<div className="flex-1 w-full overflow-x-auto no-scrollbar">
					<AssetFilterPanel
						hideClosed={hideClosed}
						onToggleHideClosed={() => setHideClosed(!hideClosed)}
						sortBy={sortBy}
						onSortChange={setSortBy}
						sortOptions={[
							{ id: "ACTIVITY", label: "Ostatnia aktywność" },
							{ id: "PROFIT", label: "Zysk PLN" },
							{ id: "PROFIT_PCT", label: "Zysk %" },
							{ id: "CATEGORY", label: "Kategoria" },
							{ id: "ALPHA", label: "A-Z" },
							{ id: "VALUE", label: "Wartość" },
						]}
						filterCategory={filterCategory}
						onCategoryChange={setFilterCategory}
						availableCategories={activeCategories}
					/>
				</div>

				{/* EN: View Mode Toggles (Desktop & Mobile) */}
				<div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-t-border-subtle shrink-0">
					<button
						onClick={() => setViewMode("table")}
						className={cn(
							"p-1.5 rounded-md transition-all flex items-center justify-center",
							viewMode === "table"
								? "bg-t-bg-panel text-theme-primary shadow-sm"
								: "text-t-text-tertiary hover:text-t-text-primary",
						)}
						title="Widok Tabeli"
					>
						<LayoutList size={16} />
					</button>
					<button
						onClick={() => setViewMode("cards")}
						className={cn(
							"p-1.5 rounded-md transition-all flex items-center justify-center",
							viewMode === "cards"
								? "bg-t-bg-panel text-theme-primary shadow-sm"
								: "text-t-text-tertiary hover:text-t-text-primary",
						)}
						title="Widok Kafelków"
					>
						<LayoutGrid size={16} />
					</button>
				</div>
			</div>

			{/* ========================================= */}
			{/* VIEW MODE 1: TRADITIONAL TABLE */}
			{/* ========================================= */}
			{viewMode === "table" && (
				<div className="w-full overflow-x-auto no-scrollbar pb-4 animate-in fade-in duration-300">
					<Table className="min-w-[600px] lg:min-w-[900px] xl:min-w-full">
						<TableHeader>
							<TableRow className="border-b border-t-border-subtle hover:bg-transparent ">
								<TableHead className="sticky left-0 rounded-tl-2xl z-20 bg-t-bg-sticky min-w-[160px] sm:min-w-[220px]  text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary py-4 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)] border-none">
									Aktywo
								</TableHead>
								<TableHead className="hidden lg:table-cell w-32 xl:w-36 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none">
									Cena (Śr. / Akt.)
								</TableHead>
								<TableHead className="hidden sm:table-cell w-28 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none text-center">
									24h Zmiana
								</TableHead>
								<TableHead className="w-28 sm:w-32 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary text-center border-none">
									Alokacja (%)
								</TableHead>
								<TableHead className="w-28 sm:w-32 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary text-center border-none">
									Korekta
								</TableHead>
								<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary w-32 border-none">
									Zysk / Strata
								</TableHead>

								<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary w-32 sm:w-36 border-none pr-2">
									Wartość{" "}
									<span className="hidden lg:inline-table">Rynkowa</span>
								</TableHead>
								<TableHead className="w-10 border-none px-0"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{paginatedAssets.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={8}
										className="text-center py-16 text-t-text-tertiary font-medium border-none"
									>
										Portfel jest pusty lub brak wyników filtrowania.
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
														"sticky left-0 z-10 py-2 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)] border-none transition-colors w-min-width",
														isExpanded
															? "bg-t-bg-sticky-hover"
															: "bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover",
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
															className="w-6 h-6 md:w-8 md:h-8 drop-shadow-sm shrink-0"
														/>

														<div className="flex flex-col justify-center min-w-0">
															{/* <div
																className="font-bold text-xs md:text-sm text-t-text-primary truncate max-w-[120px] md:max-w-[160px] xl:max-w-[220px] tracking-tight flex items-center gap-1.5"
																title={asset.cleanName}
															>
																{asset.cleanName}
															</div> */}
															{/* 🚀 FIX: Zwiększone limity max-w dla dużych ekranów (lg, xl), aby w pełni wykorzystać nowe miejsce */}
															<div
																className="font-bold text-xs md:text-sm text-t-text-primary truncate max-w-[140px] sm:max-w-[180px] md:max-w-[240px] lg:max-w-[320px] xl:max-w-[400px] tracking-tight flex items-center gap-1.5"
																title={asset.cleanName}
															>
																{asset.cleanName}
															</div>
															<div className="flex items-center gap-1.5 md:mt-0.5 truncate">
																{/* 🚀 FIX: Kropka zawsze widoczna (usunięto klasę ukrywającą) */}
																<div
																	className="w-1.5 h-1.5 rounded-full opacity-80 shrink-0"
																	style={{ backgroundColor: categoryColor }}
																/>
																{asset.provider && (
																	<span className="hidden xl:inline text-[9px] font-bold text-t-text-tertiary tracking-wider uppercase border border-t-border-subtle rounded-sm px-1.5">
																		{asset.provider}
																	</span>
																)}
																<span className="text-[10px] md:text-[9px] font-bold text-t-text-secondary font-mono sm:bg-black/5 dark:sm:bg-white/5 sm:border sm:border-black/10 dark:sm:border-white/10 px-0 sm:px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
																	{asset.cleanTicker}
																</span>
																<span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-wide">
																	{isAggregatedBond ||
																		`${formatCurrency(asset.quantity ?? 0, 2)} szt`}
																</span>
															</div>
														</div>
													</div>
												</TableCell>

												{/* <TableCell className="border-none hidden md:table-cell">
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
												</TableCell> */}

												<TableCell className="border-none hidden lg:table-cell">
													{isAggregatedBond || asset.category === "CASH" ? (
														<span className="text-sm text-t-text-tertiary font-bold text-center block">
															—
														</span>
													) : (
														<div className="flex flex-col gap-0.5 min-w-max">
															<span className="text-[10px] text-t-text-tertiary font-mono tracking-tight flex justify-center gap-3">
																<span>Śr:</span>
																<span className="text-t-text-secondary">
																	{formatCurrency(asset.avgPrice as number, 2)}{" "}
																	PLN
																</span>
															</span>
															<span className="text-[11px] text-t-text-primary font-mono font-bold flex  justify-center border-t border-t-border-subtle pt-0.5 mt-0.5 gap-3">
																<span>Akt:</span>
																<span className="text-blue-500 dark:text-blue-400">
																	{formatCurrency(
																		asset.currentPrice as number,
																		2,
																	)}{" "}
																	PLN
																</span>
															</span>
														</div>
													)}
												</TableCell>

												{/* 🚀 NOWA KOLUMNA: 24h Daily Change */}
												<TableCell className="border-none hidden sm:table-cell text-center">
													{isAggregatedBond || asset.category === "CASH" ? (
														<span className="text-sm text-t-text-tertiary font-bold">
															—
														</span>
													) : (
														<span
															className={cn(
																"px-2 py-1 rounded border font-bold text-[10px] font-mono tracking-wider whitespace-nowrap",
																(asset.dailyChangePct as number) > 0
																	? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
																	: (asset.dailyChangePct as number) < 0
																		? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
																		: "bg-black/5 dark:bg-white/5 text-t-text-secondary border-t-border-subtle",
															)}
														>
															{(asset.dailyChangePct as number) > 0 ? "+" : ""}
															{(asset.dailyChangePct as number).toFixed(2)}%
														</span>
													)}
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
															className="h-2 bg-slate-200 dark:bg-slate-800"
														/>
													</div>
												</TableCell>

												<TableCell className="border-none">
													{isAggregatedBond ? (
														<span className="text-[9px] text-t-text-tertiary uppercase tracking-widest block text-center font-bold">
															Auto-kalkulacja
														</span>
													) : asset.quantity === 0 &&
													  asset.category !== "CASH" ? (
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
																{formatCurrency(asset.profitAmount)}
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
																? formatCurrency(asset.currentValue)
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
																{asset.category === "CASH" && (
																	<DropdownMenuItem
																		className="cursor-pointer font-medium hover:bg-t-hover focus:bg-t-hover text-emerald-600 dark:text-emerald-400"
																		onClick={(e) => {
																			e.stopPropagation();
																			if (isDemo)
																				return toast.error("Akcja zablokowana");
																			setIsDepositModalOpen(true);
																		}}
																	>
																		<PlusCircle className="mr-2 h-4 w-4" />
																		Zasil portfel
																	</DropdownMenuItem>
																)}

																<DropdownMenuItem
																	className="cursor-pointer font-medium hover:bg-t-hover focus:bg-t-hover"
																	disabled={
																		asset.quantity === 0 &&
																		asset.category !== "CASH"
																	}
																	onClick={(e) => {
																		e.stopPropagation();
																		if (isDemo)
																			return toast.error("Akcja zablokowana");
																		setAssetToSell(asset);
																	}}
																>
																	<HandCoins className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
																	{asset.category === "CASH"
																		? "Wypłać gotówkę"
																		: "Sprzedaj"}
																</DropdownMenuItem>

																{asset.category !== "CASH" && (
																	<DropdownMenuItem
																		className="cursor-pointer font-medium hover:bg-t-hover focus:bg-t-hover"
																		disabled={asset.quantity === 0}
																		onClick={(e) => {
																			e.stopPropagation();
																			if (isDemo)
																				return toast.error("Akcja zablokowana");
																			setAssetToAdjust(asset);
																		}}
																	>
																		<Scale className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
																		Korekta
																	</DropdownMenuItem>
																)}

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

											{/* EN: EXPANDED ROW (HISTORY & CHARTS) */}
											{isExpanded && (
												<TableRow className="bg-t-bg-base border-b border-t-border-subtle hover:bg-t-bg-base">
													<TableCell
														colSpan={8} // 🚀 FIX: Updated colspan for new columns
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
																		<TrendingUp className="h-3.5 w-3.5" />{" "}
																		Wzrost kapitału
																	</p>
																	<div className="flex flex-col flex-1 w-full min-h-[150px]">
																		<ChartContainer className="flex-1 w-full">
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
																							backgroundColor:
																								"var(--t-bg-panel)",
																							border:
																								"1px solid var(--t-border)",
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
																		</ChartContainer>
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
																				const isCorrection =
																					t.type === "UPDATE";
																				const isInterest =
																					t.type === "INTEREST";

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
																									{formatCurrency(
																										Math.abs(t.executedValue),
																									)}{" "}
																									PLN
																								</span>
																								{!isCorrection &&
																									!isInterest && (
																										<span className="text-[9px] text-t-text-tertiary font-medium tracking-tighter mt-0.5 block">
																											@{" "}
																											{formatCurrency(
																												t.originalPrice ?? 0,
																												4,
																											)}{" "}
																											{t.originalCurrency ||
																												"PLN"}{" "}
																											/ szt.
																											{t.originalCurrency &&
																												t.originalCurrency !==
																													"PLN" &&
																												t.exchangeRate &&
																												t.exchangeRate !==
																													1 && (
																													<span className="ml-1 text-blue-500/90 dark:text-blue-400/70 font-semibold">
																														(Kurs:{" "}
																														{formatCurrency(
																															t.exchangeRate ??
																																1,
																															4,
																														)}{" "}
																														PLN)
																													</span>
																												)}
																										</span>
																									)}
																							</div>
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

											{/* ZAAWANSOWANY WYKRES GIEŁDOWY */}
											{expandedAssetId === asset.id &&
												asset.ticker &&
												asset.category !== "BONDS" &&
												asset.category !== "CASH" && (
													<TableRow className="bg-t-bg-base/80 dark:bg-t-bg-base/50 border-b border-t-border-subtle hover:bg-t-bg-base/80">
														<TableCell colSpan={8} className="p-0 border-none">
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
																			type:
																				tx.type === "BUY" ||
																				tx.type === "DEPOSIT"
																					? "BUY"
																					: "SELL",
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

					{/* 🚀 PREMIUM UX: Legenda Kategorii */}
					<div className="flex flex-wrap items-center gap-4 mt-5 px-4 animate-in fade-in">
						<span className="text-[9px] font-black text-t-text-tertiary uppercase tracking-widest">
							Legenda Kategorii:
						</span>
						{activeCategories.map((cat) => (
							<div key={cat.id} className="flex items-center gap-1.5">
								<div
									className="w-1.5 h-1.5 rounded-full shadow-sm"
									style={{
										backgroundColor:
											COLORS[cat.id as keyof typeof COLORS] || "#64748b",
									}}
								/>
								<span className="text-[10px] font-bold text-t-text-secondary uppercase tracking-wider">
									{cat.label}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* ========================================= */}
			{/* VIEW MODE 2: RESPONSIVE GRID CARDS (MOBILE OPTIMIZED) */}
			{/* ========================================= */}
			{viewMode === "cards" && (
				<div className="flex flex-col gap-4 w-full animate-in fade-in duration-300">
					{paginatedAssets.length === 0 && (
						<div className="py-16 text-center text-t-text-tertiary font-medium">
							Portfel jest pusty lub brak wyników filtrowania.
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{paginatedAssets.map((asset) => {
							const isAggregatedBond = asset.id === "bonds-summary-id";
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
								<div
									key={asset.id}
									className={cn(
										"flex flex-col bg-t-bg-panel border border-t-border rounded-2xl shadow-sm overflow-hidden hover:border-blue-500/50 transition-colors group cursor-pointer",
										asset.quantity === 0 &&
											!isAggregatedBond &&
											asset.category !== "CASH" &&
											"opacity-60 grayscale",
									)}
									onClick={() => {
										// EN: Minimalist expansion for cards - toggle main history view
										if (asset.category !== "BONDS") {
											setExpandedAssetId(
												expandedAssetId === asset.id
													? null
													: (asset.id as string),
											);
										}
									}}
								>
									{/* CARD TOP: Identity & Actions */}
									<div className="flex justify-between items-start p-4 border-b border-t-border-subtle bg-black/5 dark:bg-white/5">
										<div className="flex items-start gap-3 min-w-0">
											<AssetLogo
												ticker={asset.ticker || ""}
												className="w-8 h-8 drop-shadow-sm shrink-0"
											/>
											<div className="flex flex-col min-w-0">
												<span
													className="font-bold text-sm text-t-text-primary truncate"
													title={asset.cleanName}
												>
													{asset.cleanName}
												</span>
												<div className="flex items-center gap-1.5 mt-1 flex-wrap">
													{asset.provider && (
														<span className="text-[8px] font-bold text-t-text-tertiary tracking-wider uppercase border border-t-border-subtle rounded-sm px-1.5 bg-t-bg-base">
															{asset.provider}
														</span>
													)}
													<span className="text-[10px] font-bold text-t-text-secondary font-mono uppercase tracking-wider">
														{asset.cleanTicker}
													</span>
												</div>
											</div>
										</div>

										{/* EN: Dropdown Actions inside card */}
										<div onClick={(e) => e.stopPropagation()}>
											{!isAggregatedBond && (
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<button className="p-1.5 hover:bg-t-hover rounded-md transition-colors">
															<MoreHorizontal className="h-5 w-5 text-t-text-tertiary" />
														</button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														className="w-40 bg-t-bg-panel border-t-border text-t-text-primary"
													>
														{asset.category === "CASH" && (
															<DropdownMenuItem
																className="cursor-pointer font-medium hover:bg-t-hover text-emerald-600"
																onClick={() => {
																	if (isDemo)
																		return toast.error("Akcja zablokowana");
																	setIsDepositModalOpen(true);
																}}
															>
																<PlusCircle className="mr-2 h-4 w-4" /> Zasil
																portfel
															</DropdownMenuItem>
														)}
														<DropdownMenuItem
															className="cursor-pointer font-medium hover:bg-t-hover"
															disabled={
																asset.quantity === 0 &&
																asset.category !== "CASH"
															}
															onClick={() => {
																if (isDemo)
																	return toast.error("Akcja zablokowana");
																setAssetToSell(asset);
															}}
														>
															<HandCoins className="mr-2 h-4 w-4 text-emerald-600" />
															{asset.category === "CASH"
																? "Wypłać gotówkę"
																: "Sprzedaj"}
														</DropdownMenuItem>
														{asset.category !== "CASH" && (
															<DropdownMenuItem
																className="cursor-pointer font-medium hover:bg-t-hover"
																disabled={asset.quantity === 0}
																onClick={() => {
																	if (isDemo)
																		return toast.error("Akcja zablokowana");
																	setAssetToAdjust(asset);
																}}
															>
																<Scale className="mr-2 h-4 w-4 text-blue-600" />{" "}
																Korekta
															</DropdownMenuItem>
														)}
														{asset.category !== "CASH" && (
															<>
																<DropdownMenuSeparator className="bg-t-border" />
																<div
																	onClick={() => setAssetToDelete(asset)}
																	className="flex w-full items-center gap-2 px-2 py-1.5 cursor-pointer font-medium text-sm text-rose-600 hover:bg-rose-500/10 rounded-sm"
																>
																	<Trash2 className="mr-2 w-4 h-4" />{" "}
																	<span>Usuń</span>
																</div>
															</>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											)}
										</div>
									</div>

									{/* CARD MIDDLE: Stats & Allocations */}
									<div className="p-4 flex flex-col gap-4 flex-1">
										<div className="flex justify-between items-end gap-2">
											<div className="flex flex-col gap-1">
												<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest flex items-center gap-1.5">
													<div
														className="w-1.5 h-1.5 rounded-full"
														style={{ backgroundColor: categoryColor }}
													/>
													{asset.category
														? CATEGORY_LABELS[asset.category]
														: ""}
												</span>
												<span className="text-xs font-black text-blue-500 font-mono">
													{isAggregatedBond
														? "MULTIPLE"
														: `${formatCurrency(asset.quantity ?? 0, 4)} szt`}
												</span>
											</div>

											{/* Price info for cards */}
											{!isAggregatedBond && asset.category !== "CASH" && (
												<div className="flex flex-col items-end gap-0.5">
													<span className="text-[10px] text-t-text-tertiary font-mono tracking-tight flex items-center gap-1">
														Śr:{" "}
														<span className="text-t-text-secondary">
															{formatCurrency(asset.avgPrice as number)}
														</span>
													</span>
													<span className="text-[11px] text-blue-500 dark:text-blue-400 font-mono font-bold flex items-center gap-1">
														Akt:{" "}
														<span>
															{formatCurrency(asset.currentPrice as number)} PLN
														</span>
													</span>
												</div>
											)}
										</div>

										<div className="flex flex-col gap-1.5">
											<div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
												<span className="text-t-text-tertiary">Alokacja</span>
												<span className="text-t-text-primary font-mono">
													{share}%
												</span>
											</div>
											<Progress
												value={share}
												indicatorColor={categoryColor}
												className="h-1.5 bg-slate-200 dark:bg-slate-800"
											/>
										</div>
									</div>

									{/* CARD BOTTOM: Value, Daily Change & Profit */}
									<div className="p-4 bg-t-bg-base/30 dark:bg-black/20 border-t border-t-border-subtle flex justify-between items-end gap-2">
										<div className="flex flex-col gap-1">
											{isAggregatedBond || asset.category === "CASH" ? (
												<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest">
													—
												</span>
											) : (
												<div className="flex items-center gap-2">
													<span
														className={cn(
															"px-1.5 py-0.5 rounded font-bold text-[9px] font-mono tracking-widest whitespace-nowrap",
															(asset.dailyChangePct as number) > 0
																? "bg-emerald-500/10 text-emerald-600"
																: (asset.dailyChangePct as number) < 0
																	? "bg-rose-500/10 text-rose-600"
																	: "bg-black/5 text-t-text-secondary",
														)}
													>
														24H:{" "}
														{(asset.dailyChangePct as number) > 0 ? "+" : ""}
														{(asset.dailyChangePct as number).toFixed(2)}%
													</span>
												</div>
											)}

											{asset.quantity === 0 &&
											!isAggregatedBond &&
											asset.category !== "CASH" ? (
												<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mt-1">
													Zamknięta
												</span>
											) : (
												<div
													className={cn(
														"text-xs font-bold font-mono tracking-tight mt-1",
														asset.profitAmount >= 0
															? "text-emerald-600"
															: "text-rose-600",
													)}
												>
													{asset.profitAmount > 0 ? "+" : ""}
													{formatCurrency(asset.profitAmount)} PLN
													<span className="text-[9px] opacity-80 ml-1">
														({asset.profitPercent > 0 ? "+" : ""}
														{asset.profitPercent.toFixed(2)}%)
													</span>
												</div>
											)}
										</div>

										<div className="flex flex-col items-end">
											<span className="text-[9px] font-bold text-t-text-tertiary uppercase tracking-widest mb-0.5">
												Wartość
											</span>
											<span className="text-base font-black text-t-text-primary font-mono tracking-tight">
												{formatCurrency(asset.currentValue ?? 0)}{" "}
												<span className="text-[10px] text-t-text-tertiary ml-0.5">
													PLN
												</span>
											</span>
										</div>
									</div>

									{/* Quick Expand Hint */}
									{expandedAssetId === asset.id && !isAggregatedBond && (
										<div className="p-4 bg-blue-500/5 border-t border-t-border-subtle text-center text-xs font-medium text-blue-600 dark:text-blue-400">
											Więcej szczegółów technicznych w widoku tabeli.
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			<PaginatedBar
				items={filteredAndSortedAssets}
				currentPage={currentPage}
				onClick={setCurrentPage}
			/>

			{/* MODALS */}
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

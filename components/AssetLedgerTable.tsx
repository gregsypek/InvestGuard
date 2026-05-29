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
			{/* ZMIANA: Usunięto całkowicie tło kontenera (bg-transparent lub bg-background bez ramek), 
			    aby tabela nie wyglądała jak zamknięta w pudełku. */}
			<div className="w-full overflow-x-auto no-scrollbar pb-4">
				<Table className="min-w-[700px] sm:min-w-[800px]">
					<TableHeader>
						<TableRow className="border-b border-white/[0.03] hover:bg-transparent">
							{/* STICKY COLUMN - HEADER: Ciemne tło, dopasowane do Twoich zmian */}
							<TableHead className="sticky left-0 z-20 bg-[#0a0e17] w-48 sm:w-56 text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)] border-none">
								Aktywo
							</TableHead>
							{/* ZMIANA: Ukrywamy nagłówek kategorii na telefonach */}
							<TableHead className="hidden sm:table-cell w-32 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-none">
								Kategoria
							</TableHead>
							<TableHead className="w-32 sm:w-40 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center border-none">
								Alokacja (%)
							</TableHead>
							<TableHead className="w-32 sm:w-40 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center border-none">
								Korekta
							</TableHead>
							<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500 w-28 sm:w-32 border-none">
								Zysk / Strata
							</TableHead>
							<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500 border-none pr-4">
								Wartość Rynkowa
							</TableHead>
							{/* ZMIANA: Maksymalnie odchudzona ostatnia kolumna */}
							<TableHead className="w-8 border-none px-0"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedAssets.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="text-center py-16 text-slate-500 font-medium border-none"
								>
									Portfel jest pusty. Zacznij dodawać aktywa.
								</TableCell>
							</TableRow>
						) : (
							paginatedAssets.map((asset) => {
								const isAggregatedBond = asset.id === "bonds-summary-id";

								const assetHistory = isAggregatedBond
									? portfolio.transactionHistories.filter(
											(tx) => tx.category === "BONDS",
										)
									: portfolio.transactionHistories.filter(
											(tx) =>
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
										{/* ULTRA-DELIKATNE LINIE POMIĘDZY WIERSZAMI */}
										<TableRow
											className={cn(
												"border-b border-white/[0.03] transition-colors group",
												hasHistory
													? "cursor-pointer hover:bg-white/[0.02]"
													: "opacity-90",
												isExpanded && "bg-[#05070a]",
												isHighlighted && "bg-blue-500/5",
												asset.quantity === 0 &&
													!isAggregatedBond &&
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
											{/* STICKY COLUMN - DANE: Ciemne tło */}
											<TableCell
												className={cn(
													"sticky left-0 z-10 py-3 md:px-4 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)] border-none transition-colors",
													isExpanded
														? "bg-[#080c14]"
														: "bg-[#0a0e17] group-hover:bg-[#0c121e]",
												)}
											>
												<div className="flex items-center gap-2 md:gap-3 pl-1">
													{hasHistory && (
														<ChevronDown
															className={cn(
																"h-4 w-4 shrink-0 text-slate-500 group-hover:text-slate-300 transition-all duration-200",
																isExpanded ? "rotate-180" : "rotate-0",
															)}
														/>
													)}
													{/* <AssetLogo
														ticker={asset.ticker || ""}
														className="w-5 h-5 md:w-6 md:h-6 drop-shadow-sm shrink-0 bg-white rounded-full   p-2"
													/> */}
													<AssetLogo
														ticker={asset.ticker || ""}
														// Było: w-5 h-5 md:w-6 md:h-6
														// Jest: w-4 h-4 md:w-5 md:h-5 (zmniejszone o jeden stopień)
														className="w-4 h-4 md:w-5 md:h-5 drop-shadow-sm shrink-0 bg-white rounded-full"
													/>
													<div className="flex flex-col justify-center">
														{/* INTELIGENTNE UKRYWANIE: Na telefonach nazwa jest mocno ścięta lub ukryta */}
														<div className="hidden sm:block font-bold text-xs md:text-sm text-slate-200 truncate max-w-[140px] md:max-w-[180px] xl:max-w-[240px] tracking-tight">
															{asset.name}
														</div>
														<div className="flex items-center gap-1.5 md:mt-0.5">
															{/* ZMIANA: Na telefonach pokazujemy kropkę kategorii obok tickera! */}
															<div
																className="w-1.5 h-1.5 rounded-full opacity-80 shrink-0 sm:hidden block"
																style={{ backgroundColor: categoryColor }}
															/>
															<span className="text-[10px] md:text-[9px] font-bold text-slate-300 md:text-slate-400 font-mono sm:bg-white/5 sm:border sm:border-white/10 px-0 sm:px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
																{asset.cleanTicker}
															</span>
															<span className="text-[10px] text-blue-400 font-bold tracking-wide">
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

											{/* ZMIANA: Ukryta kolumna Kategorii na telefonach */}
											<TableCell className="border-none hidden sm:table-cell">
												<div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
														<span className="text-slate-300 font-mono">
															{share}%
														</span>
													</div>
													<Progress
														value={share}
														indicatorColor={categoryColor}
														className="h-1 bg-slate-800"
													/>
												</div>
											</TableCell>

											<TableCell className="border-none">
												{isAggregatedBond ? (
													<span className="text-[9px] text-slate-600 uppercase tracking-widest block text-center font-bold">
														Auto-kalkulacja
													</span>
												) : asset.quantity === 0 ? (
													<span className="text-sm text-slate-700 block text-center font-bold">
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
												{asset.quantity === 0 && !isAggregatedBond ? (
													<div className="inline-flex items-center px-2 py-0.5 rounded-sm border border-white/5 bg-white/5 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
														Zamknięta
													</div>
												) : (
													<div
														className={cn(
															"text-xs md:text-sm font-bold font-mono tracking-tight",
															asset.profitAmount >= 0
																? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]"
																: "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.2)]",
														)}
													>
														<div>
															{asset.profitAmount > 0 ? "+" : ""}
															{asset.profitAmount.toLocaleString(undefined, {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}{" "}
															<span className="text-[9px] uppercase">PLN</span>
														</div>
														<div className="text-[9px] md:text-[10px] opacity-80 mt-0.5">
															{asset.profitPercent > 0 ? "+" : ""}
															{asset.profitPercent.toFixed(2)}%
														</div>
													</div>
												)}
											</TableCell>

											<TableCell className="text-right font-bold font-mono text-sm md:text-[15px] text-slate-200 tabular-nums border-none pr-4">
												{asset.currentValue
													? asset.currentValue.toLocaleString("pl-PL", {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})
													: 0}{" "}
												<span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">
													PLN
												</span>
											</TableCell>

											{/* ZMIANA: Skompresowana ostatnia kolumna akcji */}
											<TableCell
												className="text-right border-none px-0 pr-2"
												onClick={(e) => e.stopPropagation()}
											>
												{isAggregatedBond ? (
													!isDemo && (
														<Link
															href="/bond-reports"
															className="inline-flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all p-1.5 rounded-md"
															title="Szczegóły"
														>
															<ExternalLink size={14} />
														</Link>
													)
												) : (
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<button className="p-1.5 hover:bg-white/10 rounded-md transition-colors outline-none focus:ring-2 focus:ring-blue-500">
																<MoreHorizontal className="h-4 w-4 text-slate-400" />
															</button>
														</DropdownMenuTrigger>
														<DropdownMenuContent
															align="end"
															className="w-40 bg-[#0a0e17] border-white/5 text-slate-200"
														>
															<DropdownMenuItem
																className="cursor-pointer font-medium hover:bg-white/5 focus:bg-white/5"
																disabled={asset.quantity === 0}
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
																	setAssetToSell(asset as unknown as Asset);
																}}
															>
																<HandCoins className="mr-2 h-4 w-4 text-emerald-400" />{" "}
																Sprzedaj
															</DropdownMenuItem>
															<DropdownMenuItem
																className="cursor-pointer font-medium hover:bg-white/5 focus:bg-white/5"
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
																	setAssetToAdjust(asset as unknown as Asset);
																}}
															>
																<Scale className="mr-2 h-4 w-4 text-blue-400" />{" "}
																Korekta
															</DropdownMenuItem>
															<DropdownMenuSeparator className="bg-white/5" />
															<div onClick={(e) => e.stopPropagation()}>
																<DeleteButton
																	id={asset.id}
																	onDelete={deleteAsset}
																	confirmMsg={`Usunąć całkowicie ${asset.name}?`}
																	isDemo={isDemo}
																	className="flex w-full items-center gap-2 px-2 py-1.5 cursor-pointer font-medium text-sm text-rose-500 hover:bg-rose-500/10 transition-colors rounded-sm"
																	label="Usuń"
																/>
															</div>
														</DropdownMenuContent>
													</DropdownMenu>
												)}
											</TableCell>
										</TableRow>

										{/* SEKCJA Z HISTORIĄ */}
										{isExpanded && (
											<TableRow className="bg-background border-b border-white/5 hover:bg-[#05070a]">
												<TableCell colSpan={7} className="p-0 border-none">
													<div className="animate-in fade-in slide-in-from-top-2 duration-300">
														<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 bg-gradient-to-b from-black/20 to-transparent shadow-inner">
															{/* LEWA STRONA: Wykres */}
															<div className="lg:col-span-4 h-48 lg:h-full bg-[#0a0e17] rounded-xl border border-white/5 p-4 flex flex-col">
																<p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
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
																					backgroundColor: "#05070a",
																					border:
																						"1px solid rgba(255,255,255,0.05)",
																					borderRadius: "8px",
																					fontSize: "11px",
																					fontWeight: "600",
																					color: "#e2e8f0",
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
																					stroke: "#0a0e17",
																					strokeWidth: 2,
																				}}
																			/>
																		</AreaChart>
																	</ResponsiveContainer>
																</div>
															</div>

															{/* PRAWA STRONA: Lista transakcji */}
															<div className="lg:col-span-8 space-y-3">
																<div className="flex justify-between items-center px-1 mb-2">
																	<p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
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
																				className="w-3 h-3 rounded bg-[#0a0e17] border-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
																			/>
																			<span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">
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
																			const txUnitPrice =
																				t.quantity !== 0
																					? Math.abs(
																							t.executedValue / t.quantity,
																						)
																					: 0;

																			return (
																				<div
																					key={t.id}
																					className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] bg-[#0a0e17] border border-white/5 p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
																				>
																					<div className="flex items-center gap-3 md:gap-4">
																						<span className="text-slate-400 font-mono tracking-tighter">
																							{new Date(
																								t.executedAt,
																							).toLocaleDateString()}
																						</span>
																						<span
																							className={cn(
																								"px-2 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-widest border",
																								isCorrection
																									? "bg-blue-500/10 text-blue-400 border-blue-500/20"
																									: isBuy
																										? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
																										: "bg-orange-500/10 text-orange-400 border-orange-500/20",
																							)}
																						>
																							{isCorrection
																								? "Korekta"
																								: isBuy
																									? "Kupno"
																									: "Sprzedaż"}
																						</span>
																						{isAggregatedBond && (
																							<span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">
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
																											? "text-blue-400"
																											: "text-rose-400"
																										: isBuy
																											? "text-emerald-400"
																											: "text-orange-400",
																								)}
																							>
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
																								<span className="text-[9px] text-slate-500 font-medium tracking-tighter">
																									@ {txUnitPrice.toFixed(2)} /
																									szt.
																								</span>
																							)}
																						</div>
																						<span className="min-w-[70px] font-bold text-slate-400 text-xs">
																							{isCorrection
																								? "0.0000"
																								: (isBuy ? "+" : "-") +
																									Math.abs(t.quantity).toFixed(
																										4,
																									)}{" "}
																							<span className="text-[9px] text-slate-600">
																								szt.
																							</span>
																						</span>
																					</div>
																				</div>
																			);
																		},
																	)}

																	{!showFullHistory &&
																		assetHistory.length > 3 && (
																			<p className="text-[10px] text-center text-slate-600 font-bold tracking-widest uppercase py-3">
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
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070a]/80 backdrop-blur-sm p-4">
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
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070a]/80 backdrop-blur-sm p-4">
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

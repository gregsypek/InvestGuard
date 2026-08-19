"use client";

import {
	Calendar,
	ChevronDown,
	ChevronRight,
	Clock,
	Filter,
	HandCoins,
	Lock,
	TableCellsMerge,
} from "lucide-react";
import React, { Fragment, useMemo, useState, useTransition } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import {
	handleDeleteBond,
	sellBondAction,
	updateBondInterestRate,
	updateBondValue,
} from "@/lib/actions/bond-actions";

import type { Asset } from "@prisma/client";
import { BOND_DURATIONS } from "@/lib/constants";
import { Bond } from "@/lib/types";
import { DeleteButton } from "./DeleteButton";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { Progress } from "@/components/ui/progress";
import QuickAdjustCell from "@/components/QuickAdjustCell";
import { SellAssetModal } from "./SellAssetModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 🚀 1. Dodajemy rozszerzony typ, żeby TS wiedział o nowym polu
interface ExtendedBond extends Bond {
	currentPeriodRate?: number;
	hasGlobalConfig?: boolean;
}
interface Props {
	initialBonds: ExtendedBond[];
	portfolioId: string;
	allPortfolios: { id: string; name: string }[];
}

export default function BondLedgerTable({
	initialBonds,
	portfolioId,
	allPortfolios,
}: Props) {
	const [openGroups, setOpenGroups] = useState<string[]>([]);
	const [assetToSell, setAssetToSell] = useState<Asset | null>(null);
	const [isPending, startTransition] = useTransition();

	// 🚀 NOWOŚĆ: Stan wybranego roku do filtrowania (Domyślnie obecny rok)
	const [selectedYear, setSelectedYear] = useState<string>(
		new Date().getFullYear().toString(),
	);

	const portfoliosWithCash = allPortfolios.map((p) => ({
		id: p.id,
		name: p.name,
	}));

	// 🚀 NOWOŚĆ: Generowanie listy dostępnych lat na podstawie danych
	const availableYears = useMemo(() => {
		const years = new Set(
			initialBonds.map((b) =>
				new Date(b.purchaseDate).getFullYear().toString(),
			),
		);
		return Array.from(years).sort((a, b) => b.localeCompare(a));
	}, [initialBonds]);

	// 🚀 ZMIANA: Grupowanie uwzględniające filtr roku
	const groupedBonds = useMemo(() => {
		const groups: Record<string, ExtendedBond[]> = {};
		initialBonds.forEach((bond) => {
			const bondYear = new Date(bond.purchaseDate).getFullYear().toString();

			// Pomijamy obligacje, jeśli nie pasują do wybranego roku (i nie wybrano "ALL")
			if (selectedYear !== "ALL" && bondYear !== selectedYear) return;

			const ticker = bond.ticker ?? "NIEZNANE";
			const prefix = ticker.match(/^[A-Z]+/)?.[0] || "INNE";
			if (!groups[prefix]) groups[prefix] = [];
			groups[prefix].push(bond);
		});
		return groups;
	}, [initialBonds, selectedYear]);

	const toggleGroup = (ticker: string) => {
		setOpenGroups((prev) =>
			prev.includes(ticker)
				? prev.filter((t) => t !== ticker)
				: [...prev, ticker],
		);
	};

	const calculateProgress = (start: Date | string, end: Date | string) => {
		const startTime = new Date(start).getTime();
		const endTime = new Date(end).getTime();
		const now = new Date().getTime();

		if (now >= endTime) return 100;
		const total = endTime - startTime;
		const current = now - startTime;

		return Math.max(0, Math.min(100, (current / total) * 100));
	};

	// 🚀 NOWOŚĆ: Funkcja wyliczająca aktualny okres odsetkowy (lata od zakupu + 1)
	const getCurrentPeriod = (purchaseDate: Date | string) => {
		const start = new Date(purchaseDate).getTime();
		const now = new Date().getTime();
		if (now < start) return 1;

		// Dzielimy różnicę czasu przez długość roku w milisekundach
		const yearsDiff = (now - start) / (1000 * 60 * 60 * 24 * 365.25);
		return Math.floor(yearsDiff) + 1;
	};

	const getMaturityDate = (bond: Bond) => {
		if (bond.maturityDate) return new Date(bond.maturityDate);

		const cleanTicker = bond.ticker?.split("_")[0].toUpperCase() || "";
		const prefix = cleanTicker.substring(0, 3);
		const years = BOND_DURATIONS[prefix] || 10;

		const d = new Date(bond.purchaseDate);
		d.setFullYear(d.getFullYear() + years);
		return d;
	};

	if (!portfolioId) {
		return <PortfolioEmptyState variant="NOT_FOUND" />;
	}

	const handleConfirmSell = async (data: {
		quantity: number;
		price: number;
		targetId: string;
		note: string;
	}) => {
		if (!assetToSell) return;
		const formData = new FormData();
		formData.append("bondId", assetToSell.id);
		formData.append("quantity", data.quantity.toString());
		formData.append("sellPrice", data.price.toString());
		formData.append("targetPortfolioId", data.targetId);
		formData.append("executedAt", new Date().toISOString());
		if (data.note) formData.append("note", data.note);

		startTransition(async () => {
			const result = await sellBondAction(formData);
			if (result.success) {
				setAssetToSell(null);
				toast.success("Sprzedano obligacje");
			} else {
				toast.error(result.error);
			}
		});
	};

	return (
		<div className="w-full flex flex-col gap-4">
			{/* 🚀 NOWOŚĆ: PASEK FILTROWANIA PO ROKU */}
			{availableYears.length > 0 && (
				<div className="flex items-center gap-2 overflow-x-auto p-2 scrollbar-hide">
					<div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
						<Filter size={12} />
						Rok Zakupu
					</div>

					<button
						onClick={() => setSelectedYear("ALL")}
						className={cn(
							"px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
							selectedYear === "ALL"
								? "bg-blue-600/10 border-blue-500 text-blue-500 border"
								: "bg-transparent border border-transparent text-t-text-tertiary hover:bg-black/5 dark:hover:bg-white/5",
						)}
					>
						Wszystkie
					</button>

					{availableYears.map((year) => (
						<button
							key={year}
							onClick={() => setSelectedYear(year)}
							className={cn(
								"px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
								selectedYear === year
									? "bg-blue-600/10 border-blue-500 text-blue-500 border"
									: "bg-t-bg-panel border border-t-border-subtle text-t-text-secondary hover:border-blue-500/50",
							)}
						>
							{year}
						</button>
					))}
				</div>
			)}

			<Table className="w-full min-w-[800px]">
				<TableHeader>
					<TableRow className="border-b border-t-border-subtle hover:bg-transparent">
						<TableHead className="sticky left-0 z-20 bg-t-bg-sticky text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pl-6 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
							Seria / Zakup
						</TableHead>
						<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
							Wykup / Postęp
						</TableHead>
						<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
							Oprocentowanie
						</TableHead>
						<TableHead className=" text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4">
							Kapitał / Wycena
						</TableHead>
						<TableHead className=" text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pr-6">
							Akcje
						</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{Object.keys(groupedBonds).length === 0 && (
						<TableRow>
							<TableCell
								colSpan={5}
								className="py-12 text-center text-t-text-tertiary text-sm font-bold border-none"
							>
								Brak obligacji dla wybranego roku ({selectedYear}).
							</TableCell>
						</TableRow>
					)}

					{Object.entries(groupedBonds).map(
						([ticker, transzes], groupIndex) => {
							const totalVal = transzes.reduce(
								(s, t) => s + (t.currentValue || 0),
								0,
							);
							const isOpen = openGroups.includes(ticker);
							const isEvenGroup = groupIndex % 2 === 1;

							return (
								<Fragment key={ticker}>
									<TableRow
										onClick={() => toggleGroup(ticker)}
										className={cn(
											"cursor-pointer border-b border-t-border-subtle transition-colors group",
											isOpen
												? "bg-blue-500/5 dark:bg-blue-500/10"
												: isEvenGroup
													? "bg-t-bg-base/50 dark:bg-t-bg-base/30 hover:bg-t-hover"
													: "hover:bg-t-hover",
										)}
									>
										<TableCell className="sticky left-0 z-10 pl-6 py-4 border-none bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
											<div className="flex items-center gap-3">
												{isOpen ? (
													<ChevronDown
														size={20}
														className="text-blue-500 shrink-0"
													/>
												) : (
													<ChevronRight
														size={20}
														className="text-blue-500 shrink-0"
													/>
												)}
												<div className="flex flex-col">
													<span className="text-sm font-bold text-t-text-primary uppercase tracking-wider whitespace-nowrap">
														{ticker}
													</span>
													<span className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mt-0.5 whitespace-nowrap">
														{transzes.length} szt.
													</span>
												</div>
											</div>
										</TableCell>

										<TableCell
											colSpan={2}
											className="py-4 border-none text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest whitespace-nowrap"
										>
											Podsumowanie grupy
										</TableCell>

										<TableCell className="py-4 border-none font-mono font-bold text-t-text-primary whitespace-nowrap">
											{totalVal.toLocaleString("pl-PL", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
											<span className="text-[10px] text-t-text-tertiary ml-1">
												PLN
											</span>
										</TableCell>
										<TableCell className="py-4 border-none" />
									</TableRow>

									{isOpen &&
										transzes.map((bond, childIndex) => {
											const mDate = getMaturityDate(bond);
											const progressValue = calculateProgress(
												bond.purchaseDate,
												mDate,
											);
											const currentPeriod = getCurrentPeriod(bond.purchaseDate);
											const isEvenChild = childIndex % 2 === 1;

											return (
												<TableRow
													key={bond.id}
													className={cn(
														"border-b border-t-border-subtle transition-colors relative group hover:bg-t-hover",
														isEvenChild
															? "bg-t-bg-base/30 dark:bg-black/20"
															: "",
													)}
												>
													<TableCell className="sticky left-0 z-10 p-0 border-none bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
														<div className="relative w-full h-full pl-14 pr-4 py-4 flex flex-col justify-center">
															<div className="absolute left-8 top-0 bottom-0 w-px bg-blue-500/30 group-hover:bg-blue-500/50 transition-colors" />
															<div className="absolute left-8 top-1/2 w-4 h-px bg-blue-500/30 group-hover:bg-blue-500/50 transition-colors" />

															<div className="flex flex-col gap-1.5 relative z-10">
																<input
																	type="text"
																	defaultValue={bond.name || ticker}
																	className="bg-transparent border-b border-transparent hover:border-t-border-subtle focus:border-blue-500 outline-none text-[11px] font-bold text-t-text-primary uppercase w-28 transition-colors"
																	onBlur={(e) =>
																		console.log(
																			"Update name for:",
																			bond.id,
																			e.target.value,
																		)
																	}
																/>
																<div className="flex items-center gap-1.5 text-[10px] text-t-text-secondary font-bold tracking-widest uppercase whitespace-nowrap">
																	<Calendar
																		size={12}
																		className="opacity-70 text-blue-500"
																	/>
																	{new Date(
																		bond.purchaseDate,
																	).toLocaleDateString("pl-PL")}
																</div>
																<div className="flex flex-col">
																	<span className="text-[10px] font-black text-t-text-primary tracking-widest uppercase whitespace-nowrap">
																		{bond.quantity} szt.
																	</span>
																</div>
															</div>
														</div>
													</TableCell>

													<TableCell className="py-4 border-none">
														<div className="flex flex-col gap-1.5">
															<span className="text-[10px] font-bold tracking-widest uppercase text-t-text-secondary flex items-center gap-1.5 whitespace-nowrap">
																<Clock
																	size={12}
																	className="opacity-70 text-blue-400"
																/>
																{mDate.toLocaleDateString("pl-PL")}
															</span>
															<Progress
																value={progressValue}
																className="h-1.5 w-28 bg-black/5 dark:bg-white/5 border border-t-border-subtle"
																indicatorColor="bg-blue-500"
															/>
														</div>
													</TableCell>

													{/* 🚀 ZMIANA: Dodano wyświetlanie bieżącego okresu odsetkowego pod kontrolką w kolumnie Oprocentowanie[cite: 6] */}
													<TableCell className="py-4 border-none">
														<div className="flex flex-col items-start gap-1.5">
															{/* 🚀 LOGIKA: Jeśli ma konfigurację z Panelu, to blokujemy edycję */}
															{bond.hasGlobalConfig ? (
																<div
																	className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1.5 rounded-lg border border-t-border-subtle cursor-help"
																	title="Oprocentowanie bazowe jest automatycznie zarządzane przez List Emisyjny w Panelu Ustawień"
																>
																	<Lock
																		size={12}
																		className="text-t-text-tertiary"
																	/>
																	<span className="text-[11px] font-bold text-t-text-primary">
																		{bond.interestRate?.toFixed(2)}%
																	</span>
																</div>
															) : (
																<QuickAdjustCell
																	currentValue={bond.interestRate || 0}
																	assetId={bond.id}
																	onUpdate={updateBondInterestRate}
																	label={`${bond.interestRate || 0}%`}
																/>
															)}

															{bond.currentPeriodRate !== undefined &&
																bond.currentPeriodRate !==
																	bond.interestRate && (
																	<span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
																		Bieżące: {bond.currentPeriodRate.toFixed(2)}
																		%
																	</span>
																)}
															<span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
																Okres Odsetkowy: {currentPeriod}
															</span>
														</div>
													</TableCell>

													<TableCell className="py-4 border-none">
														<div className="flex flex-col items-start gap-1">
															<span className="text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary flex items-center gap-1 whitespace-nowrap">
																Wkład:{" "}
																{bond.investedCapital?.toLocaleString("pl-PL", {
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																})}{" "}
																PLN
															</span>

															<QuickAdjustCell
																currentValue={bond.currentValue || 0}
																assetId={bond.id}
																onUpdate={updateBondValue}
																label={`${bond.currentValue?.toLocaleString()} PLN`}
															/>

															{bond.currentValue &&
															bond.investedCapital &&
															bond.currentValue > bond.investedCapital ? (
																<span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap">
																	+
																	{(
																		bond.currentValue - bond.investedCapital
																	).toLocaleString("pl-PL", {
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2,
																	})}{" "}
																	PLN
																</span>
															) : null}
														</div>
													</TableCell>

													<TableCell className="pr-6 py-4 border-none">
														<div className="flex justify-end gap-1">
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	const assetFromBond: Asset = {
																		...bond,
																		category: "BONDS",
																		portfolioId: portfolioId,
																		targetPercentage: 55,
																		isObserved: false,
																		purchaseDate: new Date(bond.purchaseDate),
																		createdAt: new Date(),
																		updatedAt: new Date(),
																		dailyChange: 0,
																		nominalValue: bond.currentValue ?? null,
																		rationale: null,
																		timeHorizon: null,
																		expectedRoi: null,
																		conviction: null,
																		riskLevel: null,
																		rateType: null,
																		interestRate: bond.interestRate ?? null,
																		maturityDate: bond.maturityDate
																			? new Date(bond.maturityDate)
																			: null,
																	};
																	setAssetToSell(assetFromBond);
																}}
																className="p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-600 dark:text-blue-400 hover:text-white rounded-xl transition-all border border-blue-500/20"
																title="Wykup / Sprzedaż"
															>
																<HandCoins size={14} />
															</button>

															<DeleteButton
																id={bond.id}
																onDelete={handleDeleteBond}
																title="Usuwanie Transzy Obligacji"
																confirmMsg="Czy na pewno chcesz bezpowrotnie usunąć wybraną transzę obligacji? Usunięcie wpisu wpłynie na wyliczenia wartości całego portfela."
															/>
														</div>
													</TableCell>
												</TableRow>
											);
										})}
								</Fragment>
							);
						},
					)}
				</TableBody>
			</Table>

			{assetToSell && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<SellAssetModal
						asset={assetToSell}
						portfoliosWithCash={portfoliosWithCash}
						currentPortfolioId={portfolioId}
						onConfirm={handleConfirmSell}
						onClose={() => setAssetToSell(null)}
						isLoading={isPending}
					/>
				</div>
			)}
		</div>
	);
}

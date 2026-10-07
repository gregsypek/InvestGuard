"use client";

import {
	Calendar,
	ChevronDown,
	ChevronRight,
	Clock,
	Filter,
	HandCoins,
	LayoutGrid,
	LayoutList,
	Lock,
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
import { formatCurrency } from "@/lib/utils/format-currency";
import { toast } from "sonner";

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

	const [selectedYear, setSelectedYear] = useState<string>(
		new Date().getFullYear().toString(),
	);

	// 🚀 NOWY STAN: Przełącznik widoku (Tabela / Kafelki)
	const [viewMode, setViewMode] = useState<"table" | "cards">("table");

	const portfoliosWithCash = allPortfolios.map((p) => ({
		id: p.id,
		name: p.name,
	}));

	const availableYears = useMemo(() => {
		const years = new Set(
			initialBonds.map((b) =>
				new Date(b.purchaseDate).getFullYear().toString(),
			),
		);
		return Array.from(years).sort((a, b) => b.localeCompare(a));
	}, [initialBonds]);

	const groupedBonds = useMemo(() => {
		const groups: Record<string, ExtendedBond[]> = {};
		initialBonds.forEach((bond) => {
			const bondYear = new Date(bond.purchaseDate).getFullYear().toString();

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

	const getCurrentPeriod = (purchaseDate: Date | string) => {
		const start = new Date(purchaseDate).getTime();
		const now = new Date().getTime();
		if (now < start) return 1;

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
			{/* FILTRY I PRZEŁĄCZNIK WIDOKU */}
			{availableYears.length > 0 && (
				<div className="flex flex-col md:flex-row md:items-center gap-3 p-3 w-full bg-t-bg-panel border-b border-t-border-subtle rounded-t-2xl">
					{/* LEWA STRONA (na mobile to góra): Etykieta i przełącznik widoku */}
					<div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
						<div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
							<Filter size={12} />
							Rok Zakupu
						</div>

						{/* Przełącznik Widoku -> TYLKO MOBILE (Na małym ekranie jest obok etykiety) */}
						<div className="flex md:hidden items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-t-border-subtle shrink-0">
							<button
								onClick={() => setViewMode("table")}
								className={cn(
									"p-1.5 rounded-md transition-all",
									viewMode === "table"
										? "bg-t-bg-panel text-theme-primary shadow-sm"
										: "text-t-text-tertiary hover:text-t-text-primary",
								)}
								title="Widok Tabeli"
							>
								<LayoutList size={14} />
							</button>
							<button
								onClick={() => setViewMode("cards")}
								className={cn(
									"p-1.5 rounded-md transition-all",
									viewMode === "cards"
										? "bg-t-bg-panel text-theme-primary shadow-sm"
										: "text-t-text-tertiary hover:text-t-text-primary",
								)}
								title="Widok Kafelków"
							>
								<LayoutGrid size={14} />
							</button>
						</div>
					</div>

					{/* ŚRODEK (na mobile to dół): Przewijana lista lat (Scrolluje się niezależnie od reszty paska!) */}
					<div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full flex-1 md:px-2">
						<button
							onClick={() => setSelectedYear("ALL")}
							className={cn(
								"px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shrink-0",
								selectedYear === "ALL"
									? "bg-blue-600/10 border-blue-500 text-blue-500 border shadow-sm"
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
									"px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shrink-0",
									selectedYear === year
										? "bg-blue-600/10 border-blue-500 text-blue-500 border shadow-sm"
										: "bg-transparent border border-transparent text-t-text-secondary hover:bg-black/5 dark:hover:bg-white/5",
								)}
							>
								{year}
							</button>
						))}
					</div>

					{/* PRAWA STRONA: Przełącznik Widoku -> TYLKO DESKTOP (Zawsze przypięty do prawej) */}
					<div className="hidden md:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-t-border-subtle shrink-0 ml-auto">
						<button
							onClick={() => setViewMode("table")}
							className={cn(
								"p-1.5 rounded-md transition-all",
								viewMode === "table"
									? "bg-t-bg-panel text-theme-primary shadow-sm"
									: "text-t-text-tertiary hover:text-t-text-primary",
							)}
							title="Widok Tabeli"
						>
							<LayoutList size={14} />
						</button>
						<button
							onClick={() => setViewMode("cards")}
							className={cn(
								"p-1.5 rounded-md transition-all",
								viewMode === "cards"
									? "bg-t-bg-panel text-theme-primary shadow-sm"
									: "text-t-text-tertiary hover:text-t-text-primary",
							)}
							title="Widok Kafelków"
						>
							<LayoutGrid size={14} />
						</button>
					</div>
				</div>
			)}

			{/* ========================================= */}
			{/* WIDOK 1: TABELA (Horyzontalnie Przewijana) */}
			{/* ========================================= */}
			{viewMode === "table" && (
				<div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-2">
					<Table className="w-full min-w-[750px]">
						<TableHeader>
							<TableRow className="border-b border-t-border-subtle hover:bg-transparent bg-black/5 dark:bg-white/5">
								<TableHead className="sticky left-0 z-20 bg-t-bg-panel/95 backdrop-blur-sm text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-r border-t-border-subtle py-3 pl-4 sm:pl-6 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.2)] w-32 sm:w-44">
									Seria / Zakup
								</TableHead>
								<TableHead className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-3 px-4">
									Wykup / Postęp
								</TableHead>
								<TableHead className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-3 px-4">
									Oprocentowanie
								</TableHead>
								<TableHead className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-3 px-4">
									Kapitał / Wycena
								</TableHead>
								<TableHead className="text-right text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-3 pr-4 sm:pr-6">
									Akcje
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{Object.keys(groupedBonds).length === 0 && (
								<TableRow>
									<TableCell
										className="py-12 text-center text-t-text-tertiary text-sm font-bold border-none"
										colSpan={5}
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
												<TableCell className="sticky left-0 z-10 pl-3 sm:pl-5 py-4 border-r border-t-border-subtle bg-t-bg-panel group-hover:bg-t-hover transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.2)]">
													<div className="flex items-center gap-2 sm:gap-3">
														{isOpen ? (
															<ChevronDown
																className="text-blue-500 shrink-0 w-4 h-4 sm:w-5 sm:h-5"
																size={20}
															/>
														) : (
															<ChevronRight
																className="text-blue-500 shrink-0 w-4 h-4 sm:w-5 sm:h-5"
																size={20}
															/>
														)}
														<div className="flex flex-col min-w-0">
															<span className="text-xs sm:text-sm font-bold text-t-text-primary uppercase tracking-wider truncate">
																{ticker}
															</span>
															<span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mt-0.5 truncate">
																{transzes.length} szt.
															</span>
														</div>
													</div>
												</TableCell>

												<TableCell
													colSpan={2}
													className="py-4 border-none text-[9px] sm:text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest whitespace-nowrap px-4"
												>
													Podsumowanie grupy
												</TableCell>

												<TableCell className="py-4 px-4 border-none font-mono font-bold text-t-text-primary text-[11px] sm:text-sm whitespace-nowrap">
													{formatCurrency(totalVal)}
													<span className="text-[9px] sm:text-[10px] text-t-text-tertiary ml-1">
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
													const currentPeriod = getCurrentPeriod(
														bond.purchaseDate,
													);
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
															<TableCell className="sticky left-0 z-10 p-0 border-r border-t-border-subtle bg-t-bg-panel group-hover:bg-t-hover transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.2)]">
																<div className="relative w-full h-full pl-10 sm:pl-14 pr-2 sm:pr-4 py-3 sm:py-4 flex flex-col justify-center">
																	<div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-blue-500/30 group-hover:bg-blue-500/50 transition-colors" />
																	<div className="absolute left-6 sm:left-8 top-1/2 w-3 sm:w-4 h-px bg-blue-500/30 group-hover:bg-blue-500/50 transition-colors" />

																	<div className="flex flex-col gap-1 sm:gap-1.5 relative z-10 min-w-0">
																		<span className="text-[10px] sm:text-[11px] font-bold text-t-text-primary uppercase truncate w-full">
																			{(bond.name || ticker)
																				.replace(/obligacje/gi, "")
																				.trim()}
																		</span>
																		<div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-t-text-secondary font-bold tracking-widest uppercase whitespace-nowrap">
																			<Calendar
																				className="opacity-70 text-blue-500 shrink-0 w-3 h-3"
																				size={12}
																			/>
																			{new Date(
																				bond.purchaseDate,
																			).toLocaleDateString("pl-PL")}
																		</div>
																		<div className="flex flex-col">
																			<span className="text-[9px] sm:text-[10px] font-black text-t-text-primary tracking-widest uppercase whitespace-nowrap">
																				{bond.quantity} szt.
																			</span>
																		</div>
																	</div>
																</div>
															</TableCell>

															<TableCell className="py-3 sm:py-4 px-4 border-none">
																<div className="flex flex-col gap-1 sm:gap-1.5">
																	<span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-t-text-secondary flex items-center gap-1.5 whitespace-nowrap">
																		<Clock
																			className="opacity-70 text-blue-400 shrink-0 w-3 h-3"
																			size={12}
																		/>
																		{mDate.toLocaleDateString("pl-PL")}
																	</span>
																	<Progress
																		value={progressValue}
																		className="h-1.5 w-full max-w-[120px] bg-black/5 dark:bg-white/5 border border-t-border-subtle"
																		indicatorColor="bg-blue-500"
																	/>
																</div>
															</TableCell>

															<TableCell className="py-3 sm:py-4 px-4 border-none">
																<div className="flex flex-col items-start gap-1 sm:gap-1.5">
																	{bond.hasGlobalConfig ? (
																		<div
																			className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1.5 rounded-lg border border-t-border-subtle cursor-help"
																			title="Oprocentowanie bazowe jest automatycznie zarządzane przez List Emisyjny w Panelu Ustawień"
																		>
																			<Lock
																				className="text-t-text-tertiary shrink-0 w-3 h-3"
																				size={12}
																			/>
																			<span className="text-[10px] sm:text-[11px] font-bold text-t-text-primary">
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
																			<span className="text-[9px] sm:text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 sm:px-2 py-0.5 rounded border border-blue-500/20 whitespace-nowrap">
																				Bieżące:{" "}
																				{bond.currentPeriodRate.toFixed(2)}%
																			</span>
																		)}
																	<span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
																		Okres: {currentPeriod}
																	</span>
																</div>
															</TableCell>

															<TableCell className="py-3 sm:py-4 px-4 border-none">
																<div className="flex flex-col items-start gap-1 sm:gap-1.5">
																	<span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary flex items-center gap-1 whitespace-nowrap">
																		Wkład:{" "}
																		{formatCurrency(bond.investedCapital)} PLN
																	</span>

																	<QuickAdjustCell
																		currentValue={bond.currentValue || 0}
																		assetId={bond.id}
																		onUpdate={updateBondValue}
																		label={`${formatCurrency(bond.currentValue || 0)} PLN`}
																	/>

																	{bond.currentValue &&
																	bond.investedCapital &&
																	bond.currentValue > bond.investedCapital ? (
																		<span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap">
																			+
																			{formatCurrency(
																				bond.currentValue -
																					bond.investedCapital,
																			)}{" "}
																			PLN
																		</span>
																	) : null}
																</div>
															</TableCell>

															<TableCell className="pr-4 sm:pr-6 py-3 sm:py-4 border-none">
																<div className="flex justify-end gap-1 sm:gap-1.5">
																	<button
																		onClick={(e) => {
																			e.stopPropagation();
																			const assetFromBond: Asset = {
																				...bond,
																				category: "BONDS",
																				portfolioId: portfolioId,
																				targetPercentage: 55,
																				isObserved: false,
																				purchaseDate: new Date(
																					bond.purchaseDate,
																				),
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
																		className="p-1.5 sm:p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-600 dark:text-blue-400 hover:text-white rounded-xl transition-all border border-blue-500/20 shrink-0"
																		title="Wykup / Sprzedaż"
																	>
																		<HandCoins
																			className="w-3.5 h-3.5 sm:w-4 sm:h-4"
																			size={14}
																		/>
																	</button>

																	<DeleteButton
																		id={bond.id}
																		onDelete={handleDeleteBond}
																		title="Usuwanie Transzy Obligacji"
																		confirmMsg="Czy na pewno chcesz usunąć wybraną transzę obligacji?"
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
				</div>
			)}

			{/* ========================================= */}
			{/* WIDOK 2: KAFELKI (Elastyczny Grid Szklisty) */}
			{/* ========================================= */}
			{viewMode === "cards" && (
				<div className="flex flex-col gap-4 p-2 sm:p-0 w-full animate-in fade-in duration-300">
					{Object.keys(groupedBonds).length === 0 && (
						<div className="py-12 text-center text-t-text-tertiary text-sm font-bold">
							Brak obligacji dla wybranego roku ({selectedYear}).
						</div>
					)}

					{Object.entries(groupedBonds).map(([ticker, transzes]) => (
						<div
							key={ticker}
							className="flex flex-col bg-t-bg-panel rounded-2xl overflow-hidden shadow-sm border border-t-border-subtle"
						>
							{/* Nagłówek Grupy Kafelka */}
							<div className="bg-black/5 dark:bg-white/5 p-4 border-b border-t-border-subtle flex justify-between items-center">
								<div className="flex flex-col">
									<span className="text-sm sm:text-base font-black text-t-text-primary uppercase tracking-wider">
										{ticker}
									</span>
									<span className="text-[10px] font-bold tracking-widest text-blue-500 uppercase mt-0.5">
										{transzes.length} szt.
									</span>
								</div>
								<div className="text-right font-mono text-sm sm:text-base font-bold text-t-text-primary">
									{formatCurrency(
										transzes.reduce((s, t) => s + (t.currentValue || 0), 0),
										0,
									)}{" "}
									<span className="text-[10px] text-t-text-tertiary ml-0.5">
										PLN
									</span>
								</div>
							</div>

							{/* Lista Transzy w Grupie */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
								{/* <div className="flex flex-col"> */}
								{transzes.map((bond, idx) => {
									const mDate = getMaturityDate(bond);
									const progressValue = calculateProgress(
										bond.purchaseDate,
										mDate,
									);
									const currentPeriod = getCurrentPeriod(bond.purchaseDate);
									const isLast = idx === transzes.length - 1;

									return (
										<div
											key={bond.id}
											className={cn(
												"p-4 sm:p-5 flex flex-col gap-4 relative hover:bg-t-hover transition-colors",
												!isLast && "border-b border-t-border-subtle/50",
											)}
										>
											{/* Top: Nazwa, Ilość, Akcje */}
											<div className="flex justify-between items-start gap-4">
												<div className="flex flex-col gap-1 min-w-0">
													<span className="font-bold text-sm text-t-text-primary uppercase truncate w-full">
														{(bond.name || ticker)
															.replace(/obligacje/gi, "")
															.trim()}
													</span>
													<div className="flex items-center gap-1.5 text-[10px] text-t-text-secondary font-bold tracking-widest uppercase">
														<Calendar
															size={12}
															className="text-blue-500 shrink-0"
														/>
														{new Date(bond.purchaseDate).toLocaleDateString(
															"pl-PL",
														)}
													</div>
												</div>
												<div className="flex items-center gap-2 shrink-0">
													<span className="text-[10px] font-black text-t-text-primary tracking-widest uppercase bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md border border-t-border-subtle">
														{bond.quantity} szt.
													</span>
													<button
														onClick={() => {
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
														className="p-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-600 dark:text-blue-400 hover:text-white rounded-lg transition-all border border-blue-500/20"
													>
														<HandCoins size={14} />
													</button>
													<DeleteButton
														id={bond.id}
														onDelete={handleDeleteBond}
														title="Usuwanie Transzy Obligacji"
														confirmMsg="Czy na pewno chcesz usunąć wybraną transzę obligacji?"
													/>
												</div>
											</div>

											{/* Middle: Postęp */}
											<div className="flex flex-col gap-1.5">
												<div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-t-text-secondary">
													<span>Wykup:</span>
													<span className="flex items-center gap-1.5">
														<Clock size={12} className="text-blue-400" />
														{mDate.toLocaleDateString("pl-PL")}
													</span>
												</div>
												<Progress
													value={progressValue}
													className="h-1.5 w-full bg-black/5 dark:bg-white/5 border border-t-border-subtle"
													indicatorColor="bg-blue-500"
												/>
											</div>

											{/* Bottom: Oprocentowanie i Wycena */}
											<div className="flex flex-wrap justify-between items-end gap-4 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-t-border-subtle mt-1">
												<div className="flex flex-col gap-1.5">
													<span className="text-[9px] font-bold text-t-text-tertiary uppercase tracking-widest">
														Oprocentowanie
													</span>
													<div className="flex flex-wrap items-center gap-2">
														{bond.hasGlobalConfig ? (
															<span className="text-xs font-black text-t-text-primary flex items-center gap-1">
																<Lock
																	size={10}
																	className="text-t-text-tertiary"
																/>
																{bond.interestRate?.toFixed(2)}%
															</span>
														) : (
															<QuickAdjustCell
																currentValue={bond.interestRate || 0}
																assetId={bond.id}
																onUpdate={updateBondInterestRate}
																label={`${bond.interestRate || 0}%`}
															/>
														)}
														<span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
															Okres: {currentPeriod}
														</span>
													</div>
												</div>

												<div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
													<span className="text-[9px] font-bold text-t-text-tertiary uppercase tracking-widest">
														Wycena PLN
													</span>
													<QuickAdjustCell
														currentValue={bond.currentValue || 0}
														assetId={bond.id}
														onUpdate={updateBondValue}
														label={`${formatCurrency(bond.currentValue || 0)}`}
													/>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			)}

			{/* MODAL SPRZEDAŻY */}
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

"use client";

import {
	Calendar,
	ChevronDown,
	ChevronRight,
	Clock,
	HandCoins,
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

interface Props {
	initialBonds: Bond[];
	portfolioId: string;
	allPortfolios: { id: string; name: string }[];
}

// EN: Extracted to a clean, dedicated component
export default function BondLedgerTable({
	initialBonds,
	portfolioId,
	allPortfolios,
}: Props) {
	const [openGroups, setOpenGroups] = useState<string[]>([]);
	// const [assetToSell, setAssetToSell] = useState<Bond | null>(null);
	const [assetToSell, setAssetToSell] = useState<Asset | null>(null);
	const [isPending, startTransition] = useTransition(); // Do obsługi ładowania
	// EN: Grouping bonds using useMemo for better performance

	// Przygotowujemy listę pod modal (filtrujemy np. tylko te, które przyjmują gotówkę)
	const portfoliosWithCash = allPortfolios.map((p) => ({
		id: p.id,
		name: p.name,
	}));
	const groupedBonds = useMemo(() => {
		const groups: Record<string, Bond[]> = {};
		initialBonds.forEach((bond) => {
			const ticker = bond.ticker ?? "NIEZNANE";
			const prefix = ticker.match(/^[A-Z]+/)?.[0] || "INNE";
			if (!groups[prefix]) groups[prefix] = [];
			groups[prefix].push(bond);
		});
		return groups;
	}, [initialBonds]);

	const toggleGroup = (ticker: string) => {
		setOpenGroups((prev) =>
			prev.includes(ticker)
				? prev.filter((t) => t !== ticker)
				: [...prev, ticker],
		);
	};

	// EN: Helper to calculate progress using objects instead of strings
	const calculateProgress = (start: Date | string, end: Date | string) => {
		// new Date() bezpiecznie parsuje zarówno obiekty Date jak i Stringi ISO
		const startTime = new Date(start).getTime();
		const endTime = new Date(end).getTime();
		const now = new Date().getTime();

		if (now >= endTime) return 100;
		const total = endTime - startTime;
		const current = now - startTime;

		return Math.max(0, Math.min(100, (current / total) * 100));
	};
	console.log("🚀 ~ calculateProgress ~ calculateProgress:", calculateProgress);

	// EN: Function to estimate maturity date based on series type
	const getMaturityDate = (bond: Bond) => {
		if (bond.maturityDate) return new Date(bond.maturityDate);

		// Wyciągamy TYLKO 3 pierwsze litery przedrostka do słownika
		const cleanTicker = bond.ticker?.split("_")[0].toUpperCase() || "";
		const prefix = cleanTicker.substring(0, 3); // Z 'ROD0438' robimy 'ROD'
		const years = BOND_DURATIONS[prefix] || 10; // Zabezpieczenie na 10 lat, a nie na 0!

		// Bezpieczne tworzenie daty z purchaseDate
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
		formData.append("bondId", assetToSell.id); // 👈 Upewnij się że tu jest 'bondId'
		formData.append("quantity", data.quantity.toString());
		formData.append("sellPrice", data.price.toString()); // To jest nasze 'totalValue' z modalu
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
		<div className="w-full">
			<Table className="w-full min-w-[800px]">
				<TableHeader>
					<TableRow className="border-b border-t-border-subtle hover:bg-transparent">
						{/* STICKY NAGŁÓWEK */}
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
									{/* ================= PARENT ROW (Nagłówek Grupy) ================= */}
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
										{/* STICKY RODZIC */}
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

									{/* ================= CHILD ROWS (Pojedyncze transze) ================= */}
									{isOpen &&
										transzes.map((bond, childIndex) => {
											const mDate = getMaturityDate(bond);
											const progressValue = calculateProgress(
												bond.purchaseDate,
												mDate,
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
													{/* STICKY DZIECKO z niebieskim drzewkiem */}
													<TableCell className="sticky left-0 z-10 p-0 border-none bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.3)]">
														{/* Wewnętrzny wrapper 'relative', dzięki któremu 'sticky' komórki nie jest nadpisywane */}
														<div className="relative w-full h-full pl-14 pr-4 py-4 flex flex-col justify-center">
															{/* Linia pionowa (drzewko) */}
															<div className="absolute left-8 top-0 bottom-0 w-px bg-blue-500/30 group-hover:bg-blue-500/50 transition-colors" />
															{/* Linia pozioma do wiersza */}
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

													{/* 2. Wykup / Postęp */}
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

													{/* 3. Oprocentowanie */}
													<TableCell className="py-4 border-none">
														<QuickAdjustCell
															currentValue={bond.interestRate || 0}
															assetId={bond.id}
															onUpdate={updateBondInterestRate}
															label={`${bond.interestRate || 0}%`}
														/>
													</TableCell>

													{/* 4. Kapitał / Wycena */}
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

															{/* ZYSK FINANSOWY ZAWSZE ZIELONY */}
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

													{/* 5. Akcje (Sprzedaż / Kosz) na niebiesko */}
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

															{/* <DeleteButton
																id={bond.id}
																onDelete={handleDeleteBond}
																confirmMsg="Czy na pewno chcesz bezpowrotnie usunąć wybraną transzę obligacji?"
															/> */}
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

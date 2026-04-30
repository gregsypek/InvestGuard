"use client";

import {
	Calendar,
	ChevronDown,
	ChevronRight,
	Clock,
	HandCoins,
} from "lucide-react";
import React, { Fragment, useMemo, useState, useTransition } from "react";
import {
	handleDeleteBond,
	sellBondAction,
	updateBondInterestRate,
	updateBondValue,
} from "@/lib/actions/bond-actions";

import type { Asset } from "@prisma/client";
import { Bond } from "@/lib/types";
import { DeleteButton } from "./DeleteButton";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { Progress } from "@/components/ui/progress";
import QuickAdjustCell from "@/components/QuickAdjustCell";
import { SellAssetModal } from "./SellAssetModal";
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
		return initialBonds.reduce(
			(acc, b) => {
				// EN: Fallback for missing tickers to prevent disappearing rows
				const key = b.ticker || "NIEZNANE";
				acc[key] ??= [];
				acc[key].push(b);
				return acc;
			},
			{} as Record<string, Bond[]>,
		);
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

	// EN: Function to estimate maturity date based on series type
	const getMaturityDate = (bond: Bond) => {
		if (bond.maturityDate) return new Date(bond.maturityDate);

		const durations: Record<string, number> = {
			ROD: 12,
			EDO: 10,
			ROS: 6,
			COI: 4,
			TOZ: 3,
			DOR: 2,
			ROR: 1,
			OTS: 0.25,
		};

		const cleanTicker = bond.ticker?.split("_")[0].toUpperCase() || "";
		const years = durations[cleanTicker] || 0;

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
		// EN: Moved rounded corners and overflow hidden to the wrapper div for proper table styling
		<div className="overflow-hidden">
			<table className="w-full text-sm">
				<thead className="bg-muted/50 border-b border-border">
					<tr>
						<th className="h-12 px-6 text-left font-medium text-muted-foreground">
							Seria / Zakup
						</th>
						<th className="h-12 px-4 text-left font-medium text-muted-foreground">
							Wykup / Postęp
						</th>
						<th className="h-12 px-4 text-left font-medium text-muted-foreground">
							Oprocentowanie
						</th>
						<th className="h-12 px-4 text-left font-medium text-muted-foreground">
							Kapitał / Wycena
						</th>
						<th className="h-12 px-6 text-right font-medium text-muted-foreground">
							Akcje
						</th>
					</tr>
				</thead>
				<tbody>
					{Object.entries(groupedBonds).map(([ticker, transzes]) => {
						const totalVal = transzes.reduce(
							(s, t) => s + (t.currentValue || 0),
							0,
						);
						const isOpen = openGroups.includes(ticker);

						return (
							<Fragment key={ticker}>
								{/* EN: PARENT ROW */}
								<tr
									onClick={() => toggleGroup(ticker)}
									className="cursor-pointer font-semibold border-b border-border hover:bg-muted/40 transition-colors bg-blue-400/5"
								>
									<td className="px-6 py-4 flex items-center gap-2">
										{isOpen ? (
											<ChevronDown size={18} className="text-primary" />
										) : (
											<ChevronRight
												size={18}
												className="text-muted-foreground"
											/>
										)}
										<span className="text-primary font-bold">{ticker}</span>
										<span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full ml-1">
											{transzes.length} szt.
										</span>
									</td>
									<td
										colSpan={2}
										className="px-4 py-4 text-muted-foreground text-[10px] uppercase tracking-widest"
									>
										Podsumowanie grupy
									</td>
									<td className="px-4 py-4 font-mono font-bold text-foreground">
										{totalVal.toLocaleString("pl-PL", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}{" "}
										PLN
									</td>
									<td className="px-6 py-4"></td>
								</tr>

								{/* EN: CHILD ROWS (TRANCHES) */}
								{isOpen &&
									transzes.map((bond) => {
										const mDate = getMaturityDate(bond);
										const progressValue = calculateProgress(
											bond.purchaseDate,
											mDate,
										);

										return (
											<tr
												key={bond.id}
												className="border-b border-border/50  hover:bg-muted/20 transition-colors relative"
											>
												{/* EN: Visual indentation for child rows */}
												<td className="pl-14 px-4 py-4 relative">
													<div className="absolute left-8 top-0 bottom-0 w-px bg-blue-400" />
													<div className="absolute left-8 top-1/2 w-4 h-px bg-blue-400" />

													<div className="flex flex-col gap-1.5">
														<input
															type="text"
															defaultValue={bond.name || ticker}
															className="bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none text-[11px] font-bold uppercase w-28 transition-colors"
															onBlur={(e) =>
																console.log(
																	"Update name for:",
																	bond.id,
																	e.target.value,
																)
															}
														/>
														<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
															<Calendar size={12} className="opacity-70" />
															{new Date(bond.purchaseDate).toLocaleDateString(
																"pl-PL",
															)}
														</div>
														<div className="flex flex-col">
															<span className="text-[10px] text-muted-foreground uppercase">
																<span className="font-black text-primary">
																	{bond.quantity} szt.
																</span>
															</span>
														</div>
													</div>
												</td>
												<td className="px-4 py-4">
													<div className="flex flex-col gap-1.5">
														<span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
															<Clock size={12} className="opacity-70" />{" "}
															{mDate.toLocaleDateString("pl-PL")}
														</span>
														<Progress
															value={progressValue}
															className="h-1.5 w-28"
														/>
													</div>
												</td>
												<td className="px-4 py-4">
													<QuickAdjustCell
														currentValue={bond.interestRate || 0}
														assetId={bond.id}
														onUpdate={updateBondInterestRate}
														label={`${bond.interestRate || 0}%`}
													/>
												</td>
												{/* <td className="px-4 py-4 font-mono text-xs font-semibold">
													{bond.currentValue?.toLocaleString()}
												</td> */}
												<td className="px-4 py-4">
													<div className="flex flex-col items-start gap-0.5">
														{/* Wkład własny (szary, mniejszy) */}
														<span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
															Wkład:{" "}
															{bond.investedCapital?.toLocaleString("pl-PL", {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}{" "}
															PLN
														</span>

														{/* Aktualna Wycena (wyraźna, pogrubiona) */}
														{/* <span className="font-mono text-xs font-bold text-foreground">
															{bond.currentValue?.toLocaleString()} PLN
														</span> */}
														{/* <td className="px-4 py-4"> */}
														<QuickAdjustCell
															currentValue={bond.currentValue || 0}
															assetId={bond.id}
															onUpdate={updateBondValue} // Nowa akcja!
															label={`${bond.currentValue?.toLocaleString()} PLN`}
														/>
														{/* </td> */}
														{/* Wyliczony Zysk (na zielono, jeśli jest na plusie) */}
														{bond.currentValue &&
														bond.investedCapital &&
														bond.currentValue > bond.investedCapital ? (
															<span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 rounded-sm">
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
												</td>
												{/* <td className="px-6 py-4 text-right">
													<DeleteButton
														id={bond.id}
														onDelete={handleDeleteBond}
														confirmMsg="Czy napewno chcesz usunąć wybraną obligację?"
													/>
												</td> */}
												<td className="px-6 py-4 text-right flex justify-end gap-2">
													<button
														onClick={(e) => {
															e.stopPropagation();

															// EN: Create a full Asset object from the Bond data to satisfy TypeScript
															const assetFromBond: Asset = {
																...bond,
																category: "BONDS", // Hardcoded because it's a Bond
																portfolioId: portfolioId,
																targetPercentage: 55, // Your model allocation for bonds
																purchaseDate: new Date(bond.purchaseDate), // Converting string to Date object
																createdAt: new Date(),
																updatedAt: new Date(),
																dailyChange: 0,

																// EN: Set optional fields to null to match the Asset interface
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
														className="p-2 hover:bg-emerald-500/10 text-emerald-600 rounded-full transition-colors"
													>
														<HandCoins size={16} />
													</button>

													<DeleteButton
														id={bond.id}
														onDelete={handleDeleteBond}
														confirmMsg="Czy napewno chcesz usunąć wybraną obligację?"
													/>
												</td>
											</tr>
										);
									})}
							</Fragment>
						);
					})}
				</tbody>
			</table>
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

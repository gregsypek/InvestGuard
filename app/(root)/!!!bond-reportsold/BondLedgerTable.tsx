"use client";

import {
	Calendar,
	ChevronDown,
	ChevronRight,
	Clock,
	Trash2,
} from "lucide-react";
import React, { Fragment, useMemo, useState } from "react";
import { deleteBond, updateBondInterestRate } from "@/app/actions";

import { Bond } from "@/lib/types";
import { Button } from "@/components/ui/button";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { Progress } from "@/components/ui/progress";
import QuickAdjustCell from "@/components/QuickAdjustCell";
import { toast } from "sonner";

interface Props {
	initialBonds: Bond[];
	portfolioId: string;
}

// EN: Extracted to a clean, dedicated component
export default function BondLedgerTable({ initialBonds, portfolioId }: Props) {
	const [openGroups, setOpenGroups] = useState<string[]>([]);

	// EN: Grouping bonds using useMemo for better performance
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
	const calculateProgress = (start: string, end: Date) => {
		const startTime = new Date(start).getTime();
		const endTime = end.getTime();
		const now = new Date().getTime();

		if (now >= endTime) return 100;
		const total = endTime - startTime;
		const current = now - startTime;
		return Math.max(0, Math.min(100, (current / total) * 100));
	};

	const handleDelete = async (id: string) => {
		if (confirm("Czy na pewno chcesz usunąć tę transzę z portfela?")) {
			const result = await deleteBond(id);
			if (result.success) toast.success(result.message);
			else toast.error(result.message);
		}
	};

	// EN: Function to estimate maturity date based on series type
	const getMaturityDate = (bond: Bond) => {
		if (bond.maturityDate && bond.maturityDate !== "null")
			return new Date(bond.maturityDate);

		const durations: Record<string, number> = {
			ROD: 12,
			EDO: 10,
			ROS: 6,
			COI: 4,
			TOZ: 3,
			DOS: 2,
		};

		const years = bond.ticker ? durations[bond.ticker] : 0;
		const d = new Date(bond.purchaseDate);
		d.setFullYear(d.getFullYear() + years);
		return d;
	};

	if (!portfolioId) {
		return <PortfolioEmptyState variant="NOT_FOUND" />;
	}

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
							Wycena (PLN)
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
									className="cursor-pointer font-semibold border-b border-border hover:bg-muted/40 transition-colors "
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
										{totalVal.toLocaleString()} PLN
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
												className="border-b border-border/50 bg-blue-500/5 hover:bg-muted/20 transition-colors relative"
											>
												{/* EN: Visual indentation for child rows */}
												<td className="pl-14 px-4 py-4 relative">
													<div className="absolute left-8 top-0 bottom-0 w-px bg-primary/20" />
													<div className="absolute left-8 top-1/2 w-4 h-px bg-primary/20" />

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
														label={`${bond.interestRate}%`}
													/>
												</td>
												<td className="px-4 py-4 font-mono text-xs font-semibold">
													{bond.currentValue?.toLocaleString()}
												</td>
												<td className="px-6 py-4 text-right">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
														onClick={() => handleDelete(bond.id)}
													>
														<Trash2 size={16} />
													</Button>
												</td>
											</tr>
										);
									})}
							</Fragment>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

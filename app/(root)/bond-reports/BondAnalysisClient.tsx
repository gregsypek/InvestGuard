"use client";

import {
	Calendar,
	ChevronDown,
	ChevronRight,
	Clock,
	Trash2,
} from "lucide-react";
import React, { Fragment, useMemo, useState } from "react";
import { deleteBond, updateBondInterestRate } from "@/lib/actions/bond-actions";

import { Bond } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import QuickAdjustCell from "@/components/QuickAdjustCell";
import { toast } from "sonner";

export default function BondAnalysisClient({
	initialBonds,
}: {
	initialBonds: Bond[];
}) {
	const [openGroups, setOpenGroups] = useState<string[]>([]);
	// EN: Grouping bonds using useMemo for better performance and debugging
	const groupedBonds = useMemo(() => {
		// console.log("📊 Przeliczam grupy dla obligacji:", initialBonds.length);
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
	}, [initialBonds]); // EN: Recalculate only when initialBonds change
	const toggleGroup = (ticker: string) => {
		setOpenGroups((prev) =>
			prev.includes(ticker)
				? prev.filter((t) => t !== ticker)
				: [...prev, ticker],
		);
	};
	// EN: Helper to calculate progress using objects instead of strings to avoid 'null' issues
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
			EDO: 10,
			COI: 4,
			DOS: 2,
			TOZ: 3,
		};
		// const years = durations[bond.ticker] || 0;

		const years = bond.ticker ? durations[bond.ticker] : 0;
		const d = new Date(bond.purchaseDate);
		d.setFullYear(d.getFullYear() + years);
		return d;
	};

	return (
		<div className="rounded-md  shadow-sm">
			<table className="w-full text-sm">
				<thead className="bg-muted/50 border-b">
					<tr>
						<th className="h-12 px-4 text-left font-medium">Seria / Zakup</th>
						<th className="h-12 px-4 text-left font-medium">Wykup / Postęp</th>
						<th className="h-12 px-4 text-left font-medium">Oprocentowanie</th>
						<th className="h-12 px-4 text-left font-medium">Wycena (PLN)</th>
						<th className="h-12 px-4 text-right font-medium">Akcje</th>
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
								{/* WIERSZ RODZICA */}
								<tr
									onClick={() => toggleGroup(ticker)}
									className="cursor-pointer hover:bg-muted/50 border-b font-semibold bg-slate-50/50"
								>
									<td className="px-4 py-4 flex items-center gap-2">
										{isOpen ? (
											<ChevronDown size={18} />
										) : (
											<ChevronRight size={18} />
										)}
										<span className="text-blue-600 font-bold">{ticker}</span>
										<span className="text-[10px] text-muted-foreground font-normal">
											({transzes.length} szt. )
										</span>
									</td>
									<td
										colSpan={2}
										className="px-4 py-4 text-muted-foreground text-[10px] uppercase"
									>
										Podsumowanie
									</td>
									<td className="px-4 py-4 font-mono font-bold text-primary">
										{totalVal.toLocaleString()} PLN
									</td>
									<td className="px-4 py-4"></td>
								</tr>

								{/* WIERSZE DZIECI */}
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
												className="border-b hover:bg-muted/5 transition-colors"
											>
												<td className="pl-12 px-4 py-3">
													<div className="flex flex-col gap-1">
														{/* EN: Interactive Name input */}
														<input
															type="text"
															defaultValue={bond.name || ticker}
															className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary outline-none text-[11px] font-bold uppercase w-32"
															onBlur={(e) =>
																console.log(
																	"Update name for:",
																	bond.id,
																	e.target.value,
																)
															}
														/>
														<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
															<Calendar size={10} />
															{new Date(bond.purchaseDate).toLocaleDateString(
																"pl-PL",
															)}
														</div>
													</div>
												</td>
												<td className="px-4 py-3">
													<div className="flex flex-col gap-1">
														<span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 italic">
															<Clock size={10} />{" "}
															{mDate.toLocaleDateString("pl-PL")}
														</span>
														<Progress
															value={progressValue}
															className="h-1 w-24"
														/>
													</div>
												</td>
												<td className="px-4 py-3">
													<QuickAdjustCell
														currentValue={bond.interestRate || 0}
														assetId={bond.id}
														onUpdate={updateBondInterestRate}
														label={`${bond.interestRate}%`}
													/>
												</td>
												<td className="px-4 py-3 font-mono text-xs font-semibold">
													{bond.currentValue?.toLocaleString()}
												</td>
												<td className="px-4 py-3 text-right">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive"
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

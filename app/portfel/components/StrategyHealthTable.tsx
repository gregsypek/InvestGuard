import { ArrowDownRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { CategoryStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";

interface Props {
	data: CategoryStatus[];
}

export default function StrategyHealthTable({ data }: Props) {
	const filteredData = data.filter((x) => x.weight > 0);

	return (
		// 🚀 1. Kontener z ukrytym scrollbarem i nowym promieniem zaokrąglenia (2xl)
		<div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-t-border bg-t-bg-panel shadow-sm">
			<Table className="w-full min-w-[480px] sm:min-w-[600px] md:min-w-[700px]">
				<TableHeader>
					<TableRow className="hover:bg-transparent border-t-border-subtle bg-black/2 dark:bg-white/5">
						{/* 🚀 2. Przyklejona kolumna węższa na mobile (w-28), z delikatniejszym cieniem */}
						<TableHead className=" bg-t-bg-sticky sticky left-0 z-20 w-28 sm:w-40 md:w-56 backdrop-blur-sm px-3 sm:px-4 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-r border-t-border-subtle shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.2)]">
							Kategoria
						</TableHead>
						<TableHead className="text-right px-3 sm:px-4 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
							Cel
						</TableHead>
						<TableHead className="text-right px-3 sm:px-4 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
							Aktualnie
						</TableHead>
						<TableHead className="text-right px-3 sm:px-4 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
							Odchylenie
						</TableHead>
						<TableHead className="text-right px-3 sm:px-4 py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
							Akcja
						</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{filteredData.map((item) => {
						const isSignificant = Math.abs(item.differenceWeight) > 2;

						return (
							<TableRow
								key={item.category}
								className="border-t-border-subtle hover:bg-t-hover transition-colors group"
							>
								<TableCell className="sticky left-0 z-10 p-0 bg-t-bg-sticky group-hover:bg-t-hover border-r border-t-border-subtle shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.2)] transition-colors">
									<div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-3 sm:py-4">
										<div
											className={cn("w-1.5 h-6 rounded-full", item.color)}
											style={{ backgroundColor: item.color }}
										/>
										<span className=" font-bold text-[11px] sm:text-sm tracking-tight text-t-text-primary truncate">
											{item.name}
										</span>
									</div>
								</TableCell>

								<TableCell className="text-right px-3 sm:px-4 py-3 sm:py-4 font-mono text-[11px] sm:text-xs font-medium text-t-text-secondary">
									{item.weight}%
								</TableCell>

								<TableCell className="text-right px-3 sm:px-4 py-3 sm:py-4 font-mono text-[11px] sm:text-xs font-bold text-t-text-primary">
									{item.actualPercentage.toFixed(2)}%
								</TableCell>

								<TableCell
									className={cn(
										"text-right px-3 sm:px-4 py-3 sm:py-4 font-mono text-[11px] sm:text-xs font-black",
										isSignificant ? "text-rose-500" : "text-emerald-500",
									)}
								>
									{item.differenceWeight > 0 ? "+" : ""}
									{item.differenceWeight.toFixed(1)}{" "}
									<span className="text-[9px] text-t-text-tertiary">pp</span>
								</TableCell>

								<TableCell className="text-right px-3 sm:px-4 py-3 sm:py-4">
									{Math.abs(item.differencePLN) < 10 ? (
										<div className="flex items-center justify-end gap-1.5 text-t-text-tertiary">
											<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">
												Idealnie
											</span>
											<CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
										</div>
									) : item.differencePLN > 0 ? (
										// 🚀 4. "Dokup" schowane na mobile, zostaje strzałka i pogrubiona kwota
										<div className="flex items-center justify-end gap-1.5 text-emerald-500">
											<div className="flex items-baseline gap-1">
												<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block text-emerald-500/70">
													Dokup
												</span>
												<span className="text-[11px] sm:text-sm font-black whitespace-nowrap">
													{formatCurrency(item.differencePLN, 0)}
												</span>
											</div>
											<ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
										</div>
									) : (
										// 🚀 4. "Zredukuj" schowane na mobile
										<div className="flex items-center justify-end gap-1.5 text-rose-500">
											<div className="flex items-baseline gap-1">
												<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block text-rose-500/70">
													Zredukuj
												</span>
												<span className="text-[11px] sm:text-sm font-black whitespace-nowrap">
													{formatCurrency(Math.abs(item.differencePLN), 0)}
												</span>
											</div>
											<ArrowDownRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
										</div>
									)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

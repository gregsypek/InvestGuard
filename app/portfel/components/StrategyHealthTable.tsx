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

interface Props {
	data: CategoryStatus[];
}

export default function StrategyHealthTable({ data }: Props) {
	const filteredData = data.filter((x) => x.weight > 0);

	// Podmień cały return w StrategyHealthTable.tsx:
	return (
		<div className="w-full overflow-x-auto no-scrollbar rounded-xl border border-t-border bg-t-bg-panel ">
			<Table className="w-full min-w-[600px]">
				<TableHeader>
					<TableRow className="hover:bg-transparent border-t-border-subtle">
						<TableHead className="sticky left-0 z-10 w-40 md:w-56 bg-t-bg-sticky text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-r border-t-border md:border-none shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] md:shadow-none">
							Kategoria
						</TableHead>
						<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
							Cel
						</TableHead>
						<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
							Aktualnie
						</TableHead>
						<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
							Odchylenie
						</TableHead>
						<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary pr-4">
							Sugerowana Akcja
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
								<TableCell className="sticky left-0 z-10 py-3 md:py-4 bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover border-r border-t-border md:border-none shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] md:shadow-none transition-colors">
									<div className="flex items-center gap-3 pl-2">
										<div
											className={cn("w-1.5 h-6 rounded-full", item.color)}
											style={{ backgroundColor: item.color }}
										/>
										<span className="font-bold text-sm tracking-tight text-t-text-primary whitespace-nowrap">
											{item.name}
										</span>
									</div>
								</TableCell>

								<TableCell className="text-right font-mono text-xs font-medium text-t-text-secondary">
									{item.weight}%
								</TableCell>

								<TableCell className="text-right font-mono text-xs text-t-text-primary">
									{item.actualPercentage.toFixed(2)}%
								</TableCell>

								<TableCell
									className={cn(
										"text-right font-mono text-xs font-bold",
										isSignificant
											? "text-rose-600 dark:text-rose-500"
											: "text-emerald-600 dark:text-emerald-400",
									)}
								>
									{item.differenceWeight > 0 ? "+" : ""}
									{item.differenceWeight.toFixed(1)} pp
								</TableCell>

								<TableCell className="text-right pr-4">
									{Math.abs(item.differencePLN) < 10 ? (
										<div className="flex items-center justify-end gap-1.5 text-t-text-tertiary">
											<span className="text-[10px] font-bold uppercase tracking-widest">
												Idealnie
											</span>
											<CheckCircle2 className="h-3.5 w-3.5" />
										</div>
									) : item.differencePLN > 0 ? (
										<div className="flex items-center justify-end gap-1.5 text-emerald-600 dark:text-emerald-400">
											<span className="text-xs font-semibold whitespace-nowrap">
												Dokup{" "}
												{item.differencePLN.toLocaleString("pl-PL", {
													maximumFractionDigits: 0,
												})}{" "}
												PLN
											</span>
											<ArrowUpRight className="h-4 w-4" />
										</div>
									) : (
										<div className="flex items-center justify-end gap-1.5 text-rose-600 dark:text-rose-500">
											<span className="text-xs font-semibold whitespace-nowrap">
												Zredukuj{" "}
												{Math.abs(item.differencePLN).toLocaleString("pl-PL", {
													maximumFractionDigits: 0,
												})}{" "}
												PLN
											</span>
											<ArrowDownRight className="h-4 w-4" />
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

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

	return (
		<div className="w-full overflow-x-auto no-scrollbar rounded-xl border border-white/5 bg-[#05070a]/30">
			<Table className="w-full min-w-[600px]">
				<TableHeader>
					<TableRow className="hover:bg-transparent border-white/5">
						<TableHead className="sticky left-0 z-10 w-40 md:w-56 bg-[#0a0e17] text-[10px] font-bold uppercase tracking-widest text-slate-500 border-r border-white/5 md:border-none shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] md:shadow-none">
							Kategoria
						</TableHead>
						<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
							Cel
						</TableHead>
						<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
							Aktualnie
						</TableHead>
						<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
							Odchylenie
						</TableHead>
						<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500 pr-4">
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
								className="border-white/5 hover:bg-white/[0.02] transition-colors group"
							>
								{/* ZMIANA: Przywrócono Twoje oryginalne kolory bez efektu świecenia */}
								<TableCell className="sticky left-0 z-10 py-3 md:py-4 bg-[#0a0e17] border-r border-white/5 md:border-none shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] md:shadow-none transition-colors">
									<div className="flex items-center gap-3 pl-2">
										<div
											className={cn("w-1.5 h-6 rounded-full", item.color)}
											style={{ backgroundColor: item.color }}
										/>
										<span className="font-bold text-sm tracking-tight text-slate-200 whitespace-nowrap">
											{item.name}
										</span>
									</div>
								</TableCell>

								<TableCell className="text-right font-mono text-xs font-medium text-slate-400">
									{item.weight}%
								</TableCell>

								<TableCell className="text-right font-mono text-xs text-slate-300">
									{item.actualPercentage.toFixed(2)}%
								</TableCell>

								<TableCell
									className={cn(
										"text-right font-mono text-xs font-bold",
										isSignificant ? "text-rose-500" : "text-emerald-400",
									)}
								>
									{item.differenceWeight > 0 ? "+" : ""}
									{item.differenceWeight.toFixed(1)} pp
								</TableCell>

								<TableCell className="text-right pr-4">
									{/* ZMIANA: Usunięto otoczkę przycisku i "glow". Teraz to czysta, elegancka informacja. */}
									{Math.abs(item.differencePLN) < 10 ? (
										<div className="flex items-center justify-end gap-1.5 text-slate-500">
											<span className="text-[10px] font-bold uppercase tracking-widest">
												Idealnie
											</span>
											<CheckCircle2 className="h-3.5 w-3.5" />
										</div>
									) : item.differencePLN > 0 ? (
										<div className="flex items-center justify-end gap-1.5 text-emerald-400">
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
										<div className="flex items-center justify-end gap-1.5 text-rose-500">
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

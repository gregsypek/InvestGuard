import {
	Activity,
	ArrowDownRight,
	ArrowUpRight,
	CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
// components/portfolio/StrategyHealthTable.tsx
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { CategoryStatus } from "@/lib/types";
import { CustomCardHeader } from "@/components/shared/CustomCardHeader";
import { cn } from "@/lib/utils";

interface Props {
	data: CategoryStatus[];
}

export default function StrategyHealthTable({ data }: Props) {
	const filteredData = data.filter((x) => x.weight > 0);

	return (
		<Card className="bg-muted/30 border-none shadow-none">
			<CustomCardHeader
				title="Kondycja i Rebalancing"
				description="Porównanie obecnej struktury portfela z Twoim celem inwestycyjnym."
				icon={Activity}
			/>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent border-border uppercase tracking-wider text-[10px] font-black">
							<TableHead className="w-48">Kategoria</TableHead>
							<TableHead className="text-right">Cel</TableHead>
							<TableHead className="text-right">Aktualnie</TableHead>
							<TableHead className="text-right">Odchylenie</TableHead>
							<TableHead className="text-right text-primary">
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
									className="border-border hover:bg-muted/10 transition-colors"
								>
									<TableCell className="py-4">
										<div className="flex items-center gap-2">
											<div
												className={cn("w-1.5 h-6 rounded-full", item.color)}
												style={{ backgroundColor: item.color }} // Jeśli color to HEX
											/>
											<span className="font-bold text-sm tracking-tight">
												{item.name}
											</span>
										</div>
									</TableCell>

									<TableCell className="text-right font-mono text-xs font-semibold">
										{item.weight}%
									</TableCell>

									<TableCell className="text-right font-mono text-xs">
										{item.actualPercentage.toFixed(2)}%
									</TableCell>

									<TableCell
										className={cn(
											"text-right font-mono text-xs font-bold",
											isSignificant ? "text-red-500" : "text-emerald-500",
										)}
									>
										{item.differenceWeight > 0 ? "+" : ""}
										{item.differenceWeight.toFixed(1)} pp
									</TableCell>

									<TableCell className="text-right">
										{Math.abs(item.differencePLN) < 10 ? ( // Ignoruj groszowe różnice
											<div className="flex items-center justify-end gap-2 text-emerald-600 dark:text-emerald-400">
												<span className="text-[10px] font-bold uppercase tracking-tighter">
													Idealnie
												</span>
												<CheckCircle2 className="h-4 w-4" />
											</div>
										) : item.differencePLN > 0 ? (
											<Button
												size="sm"
												variant="outline"
												className="bg-transparent hover:bg-transparent border  text-emerald-600 border-none shadow-none text-[10px] font-bold uppercase h-8 transition-all"
											>
												<ArrowUpRight className="h-3.5 w-3.5 mr-1" />
												Dokup {item.differencePLN.toLocaleString()} PLN
											</Button>
										) : (
											<Button
												size="sm"
												variant="outline"
												className="text-red-500  text-[10px] font-bold border-none uppercase h-8 transition-all"
											>
												<ArrowDownRight className="h-3.5 w-3.5 mr-1" />
												Nadmiar {Math.abs(
													item.differencePLN,
												).toLocaleString()}{" "}
												PLN
											</Button>
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

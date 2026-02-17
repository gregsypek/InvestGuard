// components/portfolio/PortfolioTableBeauty.tsx
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
interface Props {
	data: CategoryStatus[];
}

export default function PortfolioTableBeauty({ data }: Props) {
	console.log("🚀 ~ PortfolioTableBeauty ~ data:", data);

	const filteredData = data.filter((x) => x.weight > 0);
	return (
		<Card className="border-border2 bg-card">
			<CardHeader>
				<CardTitle className="text-xl font-bold text-foreground">
					Portfolio Health & Rebalancing
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent border-border uppercase tracking-wider text-xs ">
							<TableHead className="w-50 font-bold">Category</TableHead>
							<TableHead className="text-right font-bold">Target</TableHead>
							<TableHead className="text-right font-bold">Actual</TableHead>
							<TableHead className="text-right font-bold">Deviation</TableHead>
							<TableHead className="text-right text-primary font-bold">
								Action (PLN)
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredData.map((item) => (
							<TableRow key={item.category} className="border-border">
								<TableCell className="font-medium">
									<div className="flex items-center gap-2">
										{/* Small color indicator for the category */}
										<Circle
											className={cn("w-3 h-3 rounded-full", item.color)}
										/>
										{item.name}
									</div>
								</TableCell>
								<TableCell className="text-right">{item.weight}%</TableCell>
								<TableCell className="text-right">
									{item.actualPercentage.toFixed(2)}%
								</TableCell>
								<TableCell
									className={cn(
										"text-right font-semibold",
										item.differenceWeight > 2 || item.differenceWeight < -2
											? "text-red-500"
											: "text-green-500",
									)}
								>
									{/* Show the differenceWeight in percentage points */}
									{item.differenceWeight > 0 ? "+" : ""}
									{item.differenceWeight.toFixed(1)} pp
								</TableCell>

								<TableCell className="text-right py-4">
									{item.differencePLN === 0 ? (
										// SYTUACJA: STAN IDEALNY / BRAK RUCHU
										<div className="flex flex-col items-end gap-1">
											<span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
												Zbalansowano
											</span>
											<span className="text-[10px] uppercase tracking-wider text-muted-foreground italic">
												Brak akcji
											</span>
										</div>
									) : item.differencePLN > 0 ? (
										// SYTUACJA: KUPNO (Niedoważenie)
										<Button
											size="sm"
											className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
											// onClick={() => openPlanner(item)}
										>
											<ArrowUpRight className="h-4 w-4" />
											Kup {item.differencePLN.toLocaleString()} PLN
										</Button>
									) : (
										// SYTUACJA: SPRZEDAŻ (Przeważenie)
										<Button
											size="sm"
											variant="outline"
											className="border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 cursor-not-allowed opacity-70 gap-2"
											disabled
										>
											<ArrowDownRight className="h-4 w-4" />
											Sprzedaj {Math.abs(
												item.differencePLN,
											).toLocaleString()}{" "}
											PLN
										</Button>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

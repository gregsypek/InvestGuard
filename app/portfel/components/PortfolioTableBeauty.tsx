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

interface Props {
	data: CategoryStatus[];
}

export default function PortfolioTableBeauty({ data }: Props) {
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
						{data.map((item) => (
							<TableRow key={item.category} className="border-border">
								<TableCell className="font-medium">
									<div className="flex items-center gap-2">
										{/* Small color indicator for the category */}
										<div className={cn("w-3 h-3 rounded-full", item.color)} />
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
								<TableCell className="text-right font-mono">
									{/* Positive value means we need to buy more */}
									{item.differencePLN > 0 ? (
										<span className="text-blue-500">
											Buy {item.differencePLN.toLocaleString()} PLN
										</span>
									) : (
										<span className="text-orange-500">
											Sell {Math.abs(item.differencePLN).toLocaleString()} PLN
										</span>
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

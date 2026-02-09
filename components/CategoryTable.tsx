// components/CategoryTable.tsx
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Circle } from "lucide-react";
import { COLORS } from "@/lib/constants";

interface CategoryTableProps {
	data: Record<string, number>;
	totalValue: number;
}

export const CategoryTable = ({ data, totalValue }: CategoryTableProps) => {
	const sortedCategories = Object.entries(data).sort(([, a], [, b]) => b - a);
	console.log("🚀 ~ CategoryTable ~ sortedCategories:", sortedCategories);

	return (
		<Card className="border-border2 bg-card">
			<CardHeader>
				<CardTitle className="text-xl font-bold text-foreground">
					Portfolios Health & Allocation
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader className="bg-muted/50">
						<TableRow>
							<TableHead className="w-50 font-bold">Category</TableHead>
							<TableHead className="text-right font-bold">
								Value (PLN)
							</TableHead>
							<TableHead className="w-[40%] text-right font-bold">
								Allocation
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedCategories.map(([category, value]) => {
							const percentage =
								totalValue > 0 ? (value / totalValue) * 100 : 0;
							const colorClass = COLORS[category] || "bg-primary";

							return (
								<TableRow key={category} className="border-border2">
									<TableCell className="font-medium">
										<div className="flex items-center gap-2">
											{/* Visual indicator for category */}
											{/* <div className={`h-2 w-2 rounded-full ${colorClass}`} />
											 */}
											<Circle fill={colorClass} className="h-3 w-3" />
											<span className="capitalize">
												{category.toLowerCase()}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-right font-mono">
										{value.toLocaleString()}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-3">
											<Progress value={percentage} className="h-2 flex-1" />
											<span className="text-xs font-bold w-10 text-right">
												{percentage.toFixed(1)}%
											</span>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
};

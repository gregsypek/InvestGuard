"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { COLORS } from "@/lib/constants";
import { LayoutGrid } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// EN: Mapping technical IDs to Polish labels for display
const CATEGORY_LABELS: Record<string, string> = {
	BONDS: "Obligacje",
	DEVELOPED: "Rynki Rozwinięte",
	EMERGING: "Rynki Wschodzące",
	GOLD: "Złoto",
	BOOSTER: "Booster (Alpha)",
	CASH: "Gotówka",
	CRYPTO: "Kryptowaluty",
	COMMODITIES: "Surowce",
};

interface CategoryTableProps {
	data: Record<string, number>;
	totalValue: number;
}

export const CategoryTable = ({ data, totalValue }: CategoryTableProps) => {
	// EN: Convert object to array and sort by value descending
	const sortedCategories = Object.entries(data).sort(([, a], [, b]) => b - a);

	// EN: Handle scenario where no data is available
	if (sortedCategories.length === 0) {
		return (
			<Card className="border-border2 bg-card">
				<CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-3">
					<LayoutGrid className="h-10 w-10 text-muted-foreground/30" />
					<div className="space-y-1">
						<p className="text-sm font-medium">Brak danych alokacji</p>
						<p className="text-xs text-muted-foreground">
							Dodaj pierwsze aktywa do swoich portfeli, aby zobaczyć
							podsumowanie.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-border2 bg-card">
			<CardHeader>
				<CardTitle className="text-xl font-bold text-foreground">
					Skład i Zdrowie Portfela
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader className="bg-muted/30">
						<TableRow className="border-border2 hover:bg-transparent">
							<TableHead className="w-50 font-bold text-foreground">
								Kategoria
							</TableHead>
							<TableHead className="text-right font-bold text-foreground">
								Wartość (PLN)
							</TableHead>
							<TableHead className="w-[40%] text-right font-bold text-foreground">
								Alokacja
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedCategories.map(([category, value]) => {
							// EN: Calculate percentage safely to avoid division by zero
							const percentage =
								totalValue > 0 ? (value / totalValue) * 100 : 0;
							const colorValue = COLORS[category] || "var(--primary)";
							// console.log("🚀 ~ CategoryTable ~ colorValue:", colorValue)

							return (
								<TableRow
									key={category}
									className="border-border2 hover:bg-muted/20 transition-colors"
								>
									<TableCell className="font-medium">
										<div className="flex items-center gap-3">
											{/* EN: Custom circle with border matching the rest of the UI */}
											<div
												className="h-3 w-3 rounded-full border border-border2 shadow-xs"
												style={{ backgroundColor: colorValue }}
											/>
											<span className="font-semibold text-sm">
												{CATEGORY_LABELS[category] || category}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-right font-mono text-sm">
										{value.toLocaleString(undefined, {
											maximumFractionDigits: 2,
										})}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-4">
											{/* EN: Using the progress bar to visualize the weight */}
											<Progress
												value={percentage}
												className="h-2 flex-1 bg-muted"
												// FIX: Use colorValue (CSS var) instead of the label text
												// UI: Używamy zmiennej koloru, a nie nazwy kategorii
												indicatorColor={colorValue}
											/>
											<span className="text-xs font-bold w-12 text-right tabular-nums">
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

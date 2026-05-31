"use client";

import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { LayoutGrid } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CategoryTableProps {
	data: Record<string, number>;
	totalValue: number;
}

export const CategoryTable = ({ data, totalValue }: CategoryTableProps) => {
	const sortedCategories = Object.entries(data).sort(([, a], [, b]) => b - a);

	if (sortedCategories.length === 0) {
		return (
			<div className="w-full rounded-2xl border border-t-border bg-t-bg-panel flex flex-col items-center justify-center py-16 text-center space-y-3">
				<div className="p-4 rounded-full bg-black/5 dark:bg-white/5 border border-t-border-subtle mb-2">
					<LayoutGrid className="h-8 w-8 text-t-text-tertiary" />
				</div>
				<div className="space-y-1">
					<p className="text-sm font-bold text-t-text-primary tracking-tight">
						Brak danych alokacji
					</p>
					<p className="text-xs font-medium text-t-text-secondary">
						Dodaj pierwsze aktywa do swoich portfeli, aby zobaczyć podsumowanie.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full overflow-x-auto no-scrollbar rounded-2xl border border-t-border bg-t-bg-panel">
			<Table className="w-full min-w-[500px] sm:min-w-[650px]">
				<TableHeader>
					<TableRow className="border-b border-t-border-subtle hover:bg-transparent">
						{/* ZMIANA: Dokładnie ta sama logika STICKY co w StrategyHealthTable */}
						<TableHead className="sticky left-0 z-10 w-40 md:w-56 bg-t-bg-sticky text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-r border-t-border md:border-none shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] md:shadow-none pl-6 py-4">
							Kategoria
						</TableHead>
						<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 md:pr-8">
							Wartość (PLN)
						</TableHead>
						<TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary border-none py-4 pr-6 w-[30%] md:w-[40%]">
							Udział
						</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{sortedCategories.map(([category, value]) => {
						const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
						const colorValue =
							COLORS[category as keyof typeof COLORS] || "#64748b";

						return (
							<TableRow
								key={category}
								// ZMIANA: Przywrócono "hover:bg-t-hover" oraz "group" dla podświetlenia wiersza
								className="border-b border-t-border-subtle hover:bg-t-hover transition-colors group"
							>
								{/* ZMIANA: Komórka synchronizuje swój kolor z hoverem na wierszu (group-hover:bg-t-bg-sticky-hover) */}
								<TableCell className="sticky left-0 z-10 pl-6 py-4 sm:py-5 bg-t-bg-sticky group-hover:bg-t-bg-sticky-hover border-r border-t-border md:border-none shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] md:shadow-none transition-colors">
									<div className="flex items-center gap-3">
										<div
											className="h-2 w-2 rounded-full opacity-80 shrink-0"
											style={{ backgroundColor: colorValue }}
										/>
										<span className="font-bold text-sm tracking-tight text-t-text-primary whitespace-nowrap">
											{CATEGORY_LABELS[
												category as keyof typeof CATEGORY_LABELS
											] || category}
										</span>
									</div>
								</TableCell>

								<TableCell className="text-right font-mono text-sm font-semibold text-t-text-primary border-none py-4 sm:py-5 md:pr-8">
									{value.toLocaleString("pl-PL", {
										maximumFractionDigits: 2,
										minimumFractionDigits: 2,
									})}
								</TableCell>

								<TableCell className="pr-6 border-none py-4 sm:py-5">
									<div className="flex items-center justify-end gap-6">
										<Progress
											value={percentage}
											className="h-1.5 w-full max-w-[160px] bg-slate-200 dark:bg-slate-800"
											indicatorColor={colorValue}
										/>
										<span className="text-xs font-bold w-12 text-right tabular-nums text-t-text-secondary font-mono">
											{percentage.toFixed(1)}%
										</span>
									</div>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
};

"use client";

import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Cell,
	Legend,
	LegendPayload,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import { useEffect, useState } from "react";

import { CategoryStatus } from "@/lib/types";
import { PieChart as PieChartIcon } from "lucide-react"; // EN: Icon for empty state

interface PortfolioPieChartProps {
	title: string;
	dataKey: string;
	data: CategoryStatus[];
}
// 1. Definiujemy kształt pojedynczego elementu legendy
// interface LegendPayloadItem {
// 	value: string; // To będzie techniczna nazwa kategorii (np. "BONDS")
// 	color: string; // Kolor z wykresu
// 	// Możesz dodać inne pola jeśli ich potrzebujesz
// }
// 2. Typujemy propsy funkcji
interface CustomLegendProps {
	// Use 'readonly' to match Recharts' internal requirements
	// payload?: readonly LegendPayloadItem[];
	payload?: readonly LegendPayload[];
}
export default function PortfolioPieChart({
	title,
	dataKey,
	data,
}: PortfolioPieChartProps) {
	// EN: Check if all values are zero or data is empty
	// UI: Sprawdzenie czy wszystkie wartości są zerowe lub brak danych
	const isEmpty =
		data.length === 0 ||
		data.every(
			(item) => (item[dataKey as keyof CategoryStatus] as number) === 0,
		);

	// EN: Custom Legend to match the "Circle with border" requirement
	// UI: Własna legenda z "kółkiem z borderem"

	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setHasMounted(true), 0);
		return () => clearTimeout(t);
	}, []);

	// if (!hasMounted) return null;

	if (!hasMounted)
		return (
			<div className="aspect-video w-full bg-muted animate-pulse rounded-xl" />
		);
	const renderCustomLegend = (props: CustomLegendProps) => {
		const { payload } = props;
		if (!payload) return null;

		return (
			<ul className="flex flex-wrap justify-center gap-x-2 gap-y-2 mt-2">
				{payload.map((entry, index) => {
					// EN: We cast 'entry.value' to the keys of CATEGORY_LABELS to satisfy TypeScript's index signature requirements.
					const labelKey = entry.value as keyof typeof CATEGORY_LABELS;

					return (
						<li key={`item-${index}`} className="flex items-center gap-2">
							{/* EN: The circle with border matching your system style */}
							<div
								className="h-3 w-3 rounded-full border border-border2 shadow-xs"
								style={{ backgroundColor: entry.color }}
							/>
							<span className="text-xs font-medium text-muted-foreground">
								{/* EN: Accessing the label with a typed key ensures safety and avoids the 'any' error. */}
								{CATEGORY_LABELS[labelKey] || entry.value}
							</span>
						</li>
					);
				})}
			</ul>
		);
	};

	return (
		<Card className="border-border shadow-sm bg-background overflow-hidden flex flex-col">
			<CardHeader className="pb-2">
				<CardTitle className="text-md flex justify-center my-3 tracking-tight text-foreground">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="h-full min-h-75 lg:min-h-60 w-full relative pt-0">
				{/* <CardContent className="flex-1 pb-0"> */}
				{isEmpty ? (
					// <div className="h-[400px] w-full">
					<div className="flex h-full w-full flex-col items-center justify-center space-y-3">
						<div className="rounded-full border-2 border-dashed border-muted/50 p-6">
							<PieChartIcon className="h-10 w-10 text-muted-foreground/30" />
						</div>
						<div className="text-center">
							<p className="text-sm font-semibold text-foreground/80">
								Brak danych do wykresu
							</p>
							<p className="text-[11px] uppercase tracking-widest text-muted-foreground">
								Dodaj aktywa, aby zobaczyć podział
							</p>
						</div>
					</div>
				) : (
					// </div>
					// <div className="w-full aspect-square min-h-[300px] max-h-[400px]">
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={data}
								dataKey={dataKey}
								nameKey="category"
								cx="50%"
								cy="50%" // Przesunięte lekko do góry, by zrobić miejsce na legendę
								innerRadius={65}
								outerRadius={85}
								paddingAngle={5}
								stroke="var(--card)" // Stroke w kolorze tła karty daje efekt "pustych przerw"
								strokeWidth={3}
							>
								{data.map((entry) => (
									<Cell
										key={entry.category}
										fill={COLORS[entry.category as keyof typeof COLORS]}
										className="outline-none hover:opacity-80 transition-opacity"
									/>
								))}
							</Pie>
							<Tooltip
								cursor={false}
								contentStyle={{
									backgroundColor: "var(--card)",
									border: "1px solid var(--border)",
									borderRadius: "12px",
									fontSize: "12px",
									fontWeight: "600",
									boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
								}}
								itemStyle={{
									color: "var(--foreground)",
								}}
								// Poprawiony formatter z obsługą opcjonalną
								formatter={(value: number | undefined) =>
									value !== undefined ? `${value.toFixed(2)}%` : "0.00%"
								}
							/>
							<Legend
								content={renderCustomLegend}
								verticalAlign="bottom"
								// wrapperStyle={{ paddingTop: "20px" }}
							/>
						</PieChart>
					</ResponsiveContainer>
					// </div>
				)}
			</CardContent>
		</Card>
	);
}

"use client";

import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryStatus } from "@/lib/types";
function PortfolioPieChart({
	title,
	dataKey,
	data,
}: {
	title: string;
	dataKey: string;
	data: CategoryStatus[];
}) {
	// const assets = await db.asset.findMany();
	// console.log("🚀 ~ DashboardPage ~ assets:", assets);
	// Mapping our OKLCH variables from globals.css to hex/css values for Recharts
	// In Tailwind v4, we can use CSS variables directly
	const COLORS = {
		BONDS: "var(--color-portfolio-bonds)",
		DEVELOPED: "var(--color-portfolio-developed)",
		EMERGING: "var(--color-portfolio-emerging)",
		GOLD: "var(--color-portfolio-gold)",
		BOOSTER: "var(--color-portfolio-booster)",
	};
	// const data = calculateGapAnalysis(assets);
	return (
		<Card key={title} className="bg-card border-border2 shadow-sm">
			<CardHeader>
				<CardTitle className="text-foreground text-left font-bold text-xl">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="h-75">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={data}
							dataKey={dataKey}
							nameKey="name"
							cx="50%"
							cy="50%"
							innerRadius={60}
							outerRadius={80}
							paddingAngle={5}
						>
							{data.map((entry) => (
								<Cell
									key={entry.category}
									fill={COLORS[entry.category as keyof typeof COLORS]}
								/>
							))}
						</Pie>
						<Tooltip
							/* Formatting Tooltip to 2 decimal places */
							formatter={(value: number | undefined) => {
								if (value === undefined) return "0.00%";
								return `${Number(value).toFixed(2)}%`;
							}}
							contentStyle={{
								backgroundColor: "var(--card)",
								borderColor: "var(--border2)",
								borderRadius: "12px",
							}}
							itemStyle={{ color: "var(--foreground)" }}
						/>
						<Legend iconType="circle" />
					</PieChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}

export default PortfolioPieChart;

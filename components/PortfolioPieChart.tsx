"use client";

import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
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
import { PieChart as PieChartIcon } from "lucide-react";

interface PortfolioPieChartProps {
	title: string;
	dataKey: string;
	data: CategoryStatus[];
}

interface CustomLegendProps {
	// Use 'readonly' to match Recharts' internal requirements
	payload?: readonly LegendPayload[];
}

export default function PortfolioPieChart({
	title,
	dataKey,
	data,
}: PortfolioPieChartProps) {
	const isEmpty =
		data.length === 0 ||
		data.every(
			(item) => (item[dataKey as keyof CategoryStatus] as number) === 0,
		);

	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setHasMounted(true), 0);
		return () => clearTimeout(t);
	}, []);

	if (!hasMounted)
		return (
			<div className="w-full h-[400px] bg-white/5 animate-pulse rounded-2xl" />
		);

	const renderCustomLegend = (props: CustomLegendProps) => {
		const { payload } = props;
		if (!payload) return null;

		return (
			<ul className="flex flex-wrap justify-center gap-x-4 gap-y-3 mt-6">
				{payload.map((entry, index) => {
					const labelKey = entry.value as keyof typeof CATEGORY_LABELS;

					return (
						<li key={`item-${index}`} className="flex items-center gap-2">
							<div
								className="h-2 w-2 rounded-full opacity-80"
								style={{
									backgroundColor: entry.color,
									boxShadow: `0 0 8px ${entry.color}`,
								}}
							/>
							<span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
								{CATEGORY_LABELS[labelKey] || entry.value}
							</span>
						</li>
					);
				})}
			</ul>
		);
	};

	return (
		<div className="flex flex-col bg-[#0a0e17] border border-white/5 rounded-2xl p-6 relative w-full h-full">
			<h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 text-center mb-2">
				{title}
			</h4>

			{/* FIX dla Safari: Sztywna wysokość zamiast flex-1 */}
			<div className="w-full h-[300px] min-h-[300px] mt-4 relative">
				{isEmpty ? (
					<div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
						<div className="rounded-full border border-white/5 bg-[#05070a] p-6 shadow-inner">
							<PieChartIcon className="h-10 w-10 text-slate-700" />
						</div>
						<div className="text-center">
							<p className="text-sm font-semibold text-slate-300">
								Brak danych do wykresu
							</p>
							<p className="text-[10px] uppercase tracking-widest text-slate-600 mt-1">
								Dodaj aktywa, aby zobaczyć podział
							</p>
						</div>
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={data}
								dataKey={dataKey}
								nameKey="category"
								cx="50%"
								cy="50%"
								innerRadius={70}
								outerRadius={95}
								paddingAngle={4}
								stroke="#0a0e17"
								strokeWidth={4}
							>
								{data.map((entry) => (
									<Cell
										key={entry.category}
										fill={COLORS[entry.category as keyof typeof COLORS]}
										className="outline-none hover:opacity-80 transition-opacity cursor-pointer"
									/>
								))}
							</Pie>
							<Tooltip
								cursor={false}
								contentStyle={{
									backgroundColor: "#05070a",
									border: "1px solid rgba(255,255,255,0.05)",
									borderRadius: "12px",
									fontSize: "12px",
									fontWeight: "700",
									boxShadow: "0 8px 16px rgba(0,0,0,0.4)",
									color: "#e2e8f0",
								}}
								itemStyle={{ color: "#e2e8f0" }}
								formatter={(value) =>
									typeof value === "number" ? `${value.toFixed(2)}%` : "0.00%"
								}
							/>
							<Legend content={renderCustomLegend} verticalAlign="bottom" />
						</PieChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}

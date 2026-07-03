"use client";

import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";

interface BenchmarkDataPoint {
	date: string;
	portfolioPct: number;
	[indexName: string]: string | number;
}

interface PortfolioBenchmarkChartProps {
	data: BenchmarkDataPoint[];
	userIndices: string[];
}

const INDEX_COLORS: Record<string, string> = {
	SP500: "#8b5cf6", // Violet
	NASDAQ: "#ec4899", // Pink
	WIG20: "#0b36f5", // Amber
	DAX: "#06b6d4", // Cyan
	BTC: "#f7931a", // Orange (Bitcoin)
	GOLD: "#ffd700", // Gold
};

export function PortfolioBenchmarkChart({
	data,
	userIndices,
}: PortfolioBenchmarkChartProps) {
	// Stan przechowujący informację, które linie są ukryte (np. { "BTC": true })
	const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

	const toggleLine = (dataKey: string) => {
		setHiddenLines((prev) => ({
			...prev,
			[dataKey]: !prev[dataKey],
		}));
	};

	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-center h-full opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-slate-500">
					Brak danych do porównania
				</p>
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<LineChart
				data={data}
				margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
			>
				<CartesianGrid
					strokeDasharray="3 3"
					vertical={false}
					stroke="rgba(255,255,255,0.05)"
				/>

				<XAxis
					dataKey="date"
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#64748b" }}
					tickMargin={10}
					tickFormatter={(val) =>
						format(new Date(val), "dd MMM", { locale: pl })
					}
				/>

				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#64748b" }}
					tickFormatter={(val) => `${val > 0 ? "+" : ""}${val}%`}
				/>

				<ReferenceLine
					y={0}
					stroke="rgba(255,255,255,0.2)"
					strokeDasharray="3 3"
				/>

				<Tooltip
					content={<BenchmarkTooltip hiddenLines={hiddenLines} />}
					cursor={{ stroke: "rgba(255,255,255,0.1)" }}
				/>

				{/* Legenda staje się klikalna i zmienia przezroczystość odznaczonych elementów */}
				<Legend
					wrapperStyle={{
						fontSize: "11px",
						paddingTop: "10px",
						cursor: "pointer",
					}}
					onClick={(e) => toggleLine(String(e.dataKey))}
					formatter={(value, entry) => (
						<span
							style={{
								opacity: hiddenLines[String(entry.dataKey)] ? 0.4 : 1,
								transition: "opacity 0.2s",
							}}
						>
							{value}
						</span>
					)}
				/>

				{/* Linia Portfela - główna, której nie da się wyłączyć */}
				<Line
					type="monotone"
					dataKey="portfolioPct"
					name="Twój Portfel"
					stroke="#10b981"
					strokeWidth={3}
					dot={false}
					activeDot={{ r: 6, fill: "#10b981", strokeWidth: 0 }}
				/>

				{/* Dynamiczne linie z możliwością ukrywania (właściwość hide) */}
				{userIndices.map((indexKey) => (
					<Line
						key={indexKey}
						type="monotone"
						dataKey={indexKey}
						name={indexKey}
						stroke={INDEX_COLORS[indexKey] || "#cbd5e1"}
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 4 }}
						hide={hiddenLines[indexKey]}
					/>
				))}
			</LineChart>
		</ResponsiveContainer>
	);
}

function BenchmarkTooltip({ active, payload, label, hiddenLines }: any) {
	if (active && payload && payload.length) {
		const date = new Date(label);
		return (
			<div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-xl min-w-[180px]">
				<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
					{format(date, "dd MMMM yyyy", { locale: pl })}
				</p>
				<div className="space-y-2">
					{payload.map((entry: any, index: number) => {
						// Nie wyświetlaj w tooltipie ukrytych linii
						if (hiddenLines && hiddenLines[entry.dataKey]) return null;

						const isPositive = entry.value >= 0;
						return (
							<div
								key={index}
								className="flex justify-between items-center gap-4"
							>
								<span
									className="text-xs font-medium"
									style={{ color: entry.color }}
								>
									{entry.name}
								</span>
								<span
									className={`text-sm font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
								>
									{isPositive ? "+" : ""}
									{Number(entry.value).toFixed(2)}%
								</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	}
	return null;
}

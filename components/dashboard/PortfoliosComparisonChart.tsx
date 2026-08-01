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
import { CheckCircle2, Circle } from "lucide-react";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";

interface PortfolioDataPoint {
	date: string | Date;
	[portfolioId: string]: string | number | Date;
}

interface PortfolioInfo {
	id: string;
	name: string;
}

interface PortfoliosComparisonChartProps {
	data: PortfolioDataPoint[];
	portfolios: PortfolioInfo[];
	chartMode: "VALUE" | "PERCENTAGE";
}

// Nowoczesna paleta kolorów dla ścigających się portfeli
const COLORS = [
	"#3b82f6", // Niebieski
	"#ec4899", // Różowy
	"#f59e0b", // Pomarańczowy
	"#10b981", // Szmaragdowy
	"#8b5cf6", // Fioletowy
	"#06b6d4", // Cyjan
];

export function PortfoliosComparisonChart({
	data,
	portfolios,
	chartMode,
}: PortfoliosComparisonChartProps) {
	const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

	const toggleLine = (dataKey: string) => {
		setHiddenLines((prev) => ({
			...prev,
			[dataKey]: !prev[dataKey],
		}));
	};

	if (!data || data.length === 0 || portfolios.length === 0) {
		return (
			<div className="flex items-center justify-center h-full opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-slate-500">
					Wybierz portfele do porównania
				</p>
			</div>
		);
	}

	// Obliczanie Y-Axis
	const allValues = data.flatMap((d) =>
		portfolios.map((p) => Number(d[p.id]) || 0),
	);
	const maxAbsValue = Math.max(...allValues.map(Math.abs), 5);
	const yDomain = Math.ceil(maxAbsValue * 1.1);

	const renderCustomLegend = ({ payload }: any) => (
		<div className="mt-4">
			<ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
				{payload.map((entry: any, index: number) => {
					const dataKey = String(entry.dataKey);
					const isHidden = hiddenLines[dataKey];

					return (
						<li
							key={dataKey}
							onClick={() => toggleLine(dataKey)}
							className={`flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
								isHidden
									? "opacity-40 grayscale"
									: "opacity-100 hover:opacity-80 hover:scale-105"
							}`}
						>
							{!isHidden ? (
								<CheckCircle2
									className="w-4 h-4"
									style={{
										color: entry.color,
										filter: `drop-shadow(0 0 4px ${entry.color}80)`,
									}}
								/>
							) : (
								<Circle className="w-4 h-4" style={{ color: entry.color }} />
							)}
							<span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
								{entry.value}
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);

	return (
		<div className="w-full h-full flex flex-col">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart
					data={data}
					margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
				>
					<CartesianGrid
						strokeDasharray="2 6"
						vertical={false}
						stroke="rgba(148,163,184,0.08)"
					/>
					<XAxis
						dataKey="date"
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
						tickMargin={12}
						tickFormatter={(val) =>
							format(new Date(val), "dd MMM", { locale: pl })
						}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
						tickFormatter={
							(val) =>
								chartMode === "PERCENTAGE"
									? `${val > 0 ? "+" : ""}${val}%`
									: `${(val / 1000).toFixed(0)}k` // Formatowanie dla wartości w PLN (skrócone)
						}
						domain={
							chartMode === "PERCENTAGE"
								? [-yDomain, yDomain]
								: ["auto", "auto"]
						}
					/>
					<ReferenceLine
						y={0}
						stroke="rgba(148,163,184,0.25)"
						strokeWidth={1}
					/>
					<Tooltip
						content={
							<ComparisonTooltip
								hiddenLines={hiddenLines}
								chartMode={chartMode}
							/>
						}
						cursor={{ stroke: "rgba(148,163,184,0.15)", strokeWidth: 2 }}
					/>
					<Legend content={renderCustomLegend} />

					{portfolios.map((p, idx) => (
						<Line
							key={p.id}
							type="monotone"
							dataKey={p.id}
							name={p.name}
							stroke={COLORS[idx % COLORS.length]}
							strokeWidth={3}
							dot={false}
							activeDot={{ r: 5, strokeWidth: 0 }}
							hide={hiddenLines[p.id]}
						/>
					))}
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}

// Tooltip sortujący portfele od najlepszego
function ComparisonTooltip({
	active,
	payload,
	label,
	hiddenLines,
	chartMode,
}: any) {
	if (active && payload && payload.length) {
		const sortedPayload = [...payload]
			.filter((entry: any) => !(hiddenLines && hiddenLines[entry.dataKey]))
			.sort((a, b) => b.value - a.value);

		return (
			<div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/40 rounded-2xl p-4 shadow-2xl min-w-[220px]">
				<p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
					{format(new Date(label), "dd MMMM yyyy", { locale: pl })}
				</p>
				<div className="space-y-2.5">
					{sortedPayload.map((entry: any, index: number) => {
						const isPositive = entry.value >= 0;
						return (
							<div
								key={index}
								className="flex justify-between items-center gap-4"
							>
								<div className="flex items-center gap-2">
									<span
										className="w-2.5 h-2.5 rounded-full"
										style={{ backgroundColor: entry.color }}
									/>
									<span className="text-xs font-medium text-slate-300 line-clamp-1">
										{entry.name}
									</span>
								</div>
								<span
									className={`text-sm font-bold tabular-nums whitespace-nowrap ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
								>
									{chartMode === "PERCENTAGE"
										? `${isPositive ? "+" : ""}${Number(entry.value).toFixed(2)}%`
										: `${Number(entry.value).toLocaleString("pl-PL", { maximumFractionDigits: 0 })} PLN`}
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

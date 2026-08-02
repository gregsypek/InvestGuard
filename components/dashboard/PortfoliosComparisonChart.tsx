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
import {
	CheckCircle2,
	Circle,
	Maximize2,
	Minimize2,
	WalletCards,
} from "lucide-react";

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

const COLORS = [
	"#3b82f6",
	"#ec4899",
	"#f59e0b",
	"#10b981",
	"#8b5cf6",
	"#06b6d4",
];

export function PortfoliosComparisonChart({
	data,
	portfolios,
	chartMode,
}: PortfoliosComparisonChartProps) {
	const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
	const [isExpanded, setIsExpanded] = useState(false);

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

	const allValues = data.flatMap((d) =>
		portfolios.map((p) => Number(d[p.id]) || 0),
	);
	const maxAbsValue = Math.max(...allValues.map(Math.abs), 5);
	const yDomain = Math.ceil(maxAbsValue * 1.1);

	const renderCustomLegend = ({ payload }: any) => (
		<div className="mt-4">
			<ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
				{payload.map((entry: any) => {
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
			<p className="text-[9px] text-center text-slate-500 uppercase tracking-widest font-bold mt-4 opacity-70">
				💡 Kliknij w nazwę portfela, aby włączyć lub wyłączyć go z wykresu
			</p>
		</div>
	);

	const chartContent = (
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
					tickFormatter={(val) =>
						chartMode === "PERCENTAGE"
							? `${val > 0 ? "+" : ""}${val}%`
							: `${(val / 1000).toFixed(0)}k`
					}
					domain={
						chartMode === "PERCENTAGE" ? [-yDomain, yDomain] : ["auto", "auto"]
					}
				/>
				<ReferenceLine y={0} stroke="rgba(148,163,184,0.25)" strokeWidth={1} />
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
						isAnimationActive={true}
						animationDuration={800}
					/>
				))}
			</LineChart>
		</ResponsiveContainer>
	);

	if (isExpanded) {
		return (
			<div className="fixed inset-0 z-[100] bg-slate-950/97 backdrop-blur-xl p-6 md:p-12 flex flex-col animate-in fade-in duration-200">
				<div className="relative flex justify-between items-center mb-6">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
							<WalletCards className="w-5 h-5 text-blue-400" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-white tracking-tight">
								Wyścig Portfeli
							</h3>
							<p className="text-sm text-slate-400">
								Szczegółowe porównanie strategii inwestycyjnych
							</p>
						</div>
					</div>
					<button
						onClick={() => setIsExpanded(false)}
						className="p-2.5 bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-xl transition-colors shadow-lg border border-slate-700/50 hover:border-rose-500/30"
					>
						<Minimize2 className="w-6 h-6" />
					</button>
				</div>
				<div className="relative flex-1 min-h-0 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-8 shadow-2xl">
					{chartContent}
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full h-full flex flex-col group">
			<div className="flex justify-end px-1 pb-2 shrink-0 z-10">
				{/* Przycisk powiększania widoczny na mobile */}
				<button
					onClick={() => setIsExpanded(true)}
					className="p-1.5 bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-400 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-sm z-10"
					title="Powiększ wykres"
				>
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>
			<div className="flex-1 min-h-0 absolute inset-0 pt-8">{chartContent}</div>
		</div>
	);
}

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

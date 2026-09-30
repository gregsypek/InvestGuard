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
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import React, { useState } from "react";

import { ChartContainer } from "../shared/ChartContainer";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const THEME_COLORS: Record<string, string> = {
	blue: "#3b82f6",
	indigo: "#6366f1",
	violet: "#8b5cf6",
	purple: "#a855f7",
	fuchsia: "#d946ef",
	pink: "#ec4899",
	emerald: "#10b981",
	teal: "#14b8a6",
	cyan: "#06b6d4",
	sky: "#0ea5e9",
	amber: "#f59e0b",
	orange: "#f97316",
	lime: "#84cc16",
	slate: "#64748b",
	red: "#ef4444",
	rose: "#f43f5e",
	green: "#22c55e",
	yellow: "#eab308",
	zinc: "#71717a",
	stone: "#78716c",
};

interface PortfolioBenchmarkChartProps {
	data: BenchmarkDataPoint[];
	userIndices: string[];
	portfolioColorTheme?: string; // 👈 DODANE
}

// --- TYPES ---
export interface BenchmarkDataPoint {
	date: string;
	portfolioPct: number;
	[indexName: string]: string | number;
}

interface PortfolioBenchmarkChartProps {
	data: BenchmarkDataPoint[];
	userIndices: string[];
}

interface LegendPayloadItem {
	dataKey?: string | number | ((obj: unknown) => unknown);
	color?: string;
	value?: React.ReactNode;
}

const INDEX_COLORS: Record<string, string> = {
	SP500: "#8b5cf6", // Violet
	NASDAQ: "#ec4899", // Pink
	WIG20: "#3b82f6", // Modern Blue
	DAX: "#06b6d4", // Cyan
	BTC: "#f59e0b", // Golden Orange
	GOLD: "#fbbf24", // Gold
};
export function PortfolioBenchmarkChart({
	data,
	userIndices,
	portfolioColorTheme = "blue",
}: PortfolioBenchmarkChartProps) {
	const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
	const [isExpanded, setIsExpanded] = useState(false);

	const mainPortfolioColor =
		THEME_COLORS[portfolioColorTheme] || THEME_COLORS.blue;

	const toggleLine = (dataKey: string) => {
		setHiddenLines((prev) => ({
			...prev,
			[dataKey]: !prev[dataKey],
		}));
	};

	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-center h-full min-h-[300px] opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
					Brak danych do porównania
				</p>
			</div>
		);
	}
	// Wyciągamy ostatni dzień, by pokazać łączny wynik portfela w Badge
	const lastDay = data[data.length - 1];
	const currentPortfolioPct = lastDay?.portfolioPct || 0;
	const isPortfolioPositive = currentPortfolioPct >= 0;

	// Maksymalne odchylenia do symetrii osi Y
	const allValues = data.flatMap((d) => [
		d.portfolioPct,
		...userIndices.map((idx) => Number(d[idx]) || 0),
	]);
	const maxAbsValue = Math.max(...allValues.map(Math.abs), 5);
	const yDomain = Math.ceil(maxAbsValue * 1.1);

	// Odznaka trendu dla głównego portfela
	const trendBadge = (compact = false) => (
		<div
			className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
				isPortfolioPositive
					? "bg-emerald-500/10 border-emerald-500/20"
					: "bg-rose-500/10 border-rose-500/20"
			}`}
		>
			{/* {isPortfolioPositive ? (
				<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
			) : (
				<TrendingDown className="w-3.5 h-3.5 text-rose-500" />
			)} */}
			<span
				className={`text-[11px] font-bold tabular-nums ${
					isPortfolioPositive ? "text-emerald-500" : "text-rose-500"
				}`}
			>
				{!compact && (
					<span className="text-t-text-tertiary mr-1 font-medium">
						Twój Portfel:
					</span>
				)}
				{isPortfolioPositive ? "+" : ""}
				{currentPortfolioPct.toFixed(2)}%
			</span>
		</div>
	);

	const renderCustomLegend = ({
		payload,
	}: {
		payload?: readonly LegendPayloadItem[];
	}) => {
		if (!payload) return null;

		return (
			<div className="pt-4 pb-1">
				<ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
					{payload.map((entry) => {
						const dataKey = String(entry.dataKey);
						const isHidden = hiddenLines[dataKey];
						const isPortfolio = dataKey === "portfolioPct";
						const itemColor = isPortfolio ? mainPortfolioColor : entry.color;

						return (
							<li
								key={dataKey}
								onClick={() => !isPortfolio && toggleLine(dataKey)}
								className={`flex items-center gap-1.5 transition-all duration-300 ${
									isHidden
										? "opacity-40 grayscale cursor-pointer"
										: "opacity-100 hover:opacity-80 hover:scale-105 " +
											(isPortfolio ? "cursor-default" : "cursor-pointer")
								}`}
							>
								{!isHidden ? (
									<CheckCircle2
										className={`w-4 h-4 transition-all ${isPortfolio ? "animate-pulse" : ""}`}
										style={{
											color: itemColor,
											filter: `drop-shadow(0 0 6px ${itemColor}60)`,
										}}
									/>
								) : (
									<Circle
										className="w-4 h-4 transition-all"
										style={{ color: itemColor }}
									/>
								)}
								<span
									className={`text-[10px] font-bold uppercase tracking-widest ${isPortfolio ? "text-t-text-primary" : "text-t-text-secondary"}`}
								>
									{entry.value}
								</span>
							</li>
						);
					})}
				</ul>
				<p className="text-[9px] text-center text-t-text-tertiary uppercase tracking-widest font-bold mt-4 mb-2 opacity-70">
					💡 Kliknij w nazwę indeksu, aby włączyć lub wyłączyć go z wykresu
				</p>
			</div>
		);
	};

	const chartContent = (
		<ChartContainer className="h-full min-h-[300px] w-full flex-1">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart
					data={data}
					margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
				>
					<defs>
						<linearGradient id="portfolioGradient" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor="#34d399" />
							<stop offset="50%" stopColor="#10b981" />
							<stop offset="100%" stopColor="#059669" />
						</linearGradient>

						<filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
							<feGaussianBlur stdDeviation="3" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					<CartesianGrid
						strokeDasharray="2 6"
						vertical={false}
						stroke="var(--t-border-subtle)"
					/>

					<XAxis
						dataKey="date"
						axisLine={false}
						tickLine={false}
						tick={{
							fontSize: 10,
							fill: "var(--t-text-tertiary)",
							fontWeight: 500,
						}}
						tickMargin={12}
						tickFormatter={(val) =>
							format(new Date(val), "dd MMM", { locale: pl })
						}
					/>

					<YAxis
						axisLine={false}
						tickLine={false}
						tick={{
							fontSize: 10,
							fill: "var(--t-text-tertiary)",
							fontWeight: 500,
						}}
						tickFormatter={(val) => `${val > 0 ? "+" : ""}${val}%`}
						domain={[-yDomain, yDomain]}
					/>

					<ReferenceLine y={0} stroke="var(--t-border)" strokeWidth={1} />

					<Tooltip
						content={<BenchmarkTooltip hiddenLines={hiddenLines} />}
						cursor={{ stroke: "var(--t-border-subtle)", strokeWidth: 2 }}
						wrapperStyle={{ zIndex: 1000, outline: "none" }}
					/>

					<Legend
						content={renderCustomLegend}
						verticalAlign="bottom"
						wrapperStyle={{
							position: "relative",
							zIndex: 10,
						}}
					/>

					{userIndices.map((indexKey) => (
						<Line
							key={indexKey}
							type="monotone"
							dataKey={indexKey}
							name={indexKey}
							stroke={INDEX_COLORS[indexKey] || "var(--t-text-tertiary)"}
							strokeWidth={2.5}
							dot={false}
							activeDot={{ r: 4, strokeWidth: 0 }}
							hide={hiddenLines[indexKey]}
							opacity={0.8}
						/>
					))}

					<Line
						type="monotone"
						dataKey="portfolioPct"
						name="Twój Portfel"
						stroke={mainPortfolioColor}
						strokeWidth={3.5}
						dot={false}
						activeDot={{
							r: 6,
							fill: mainPortfolioColor,
							stroke: "var(--t-bg-panel)",
							strokeWidth: 2,
						}}
						filter="url(#lineGlow)"
					/>
				</LineChart>
			</ResponsiveContainer>
		</ChartContainer>
	);

	if (isExpanded) {
		return (
			<div className="fixed inset-0 z-[999] bg-t-bg-base/95 backdrop-blur-xl p-4 sm:p-8 md:p-12 flex flex-col animate-in fade-in duration-200">
				<div
					className="pointer-events-none absolute inset-0 opacity-40"
					style={{
						background:
							"radial-gradient(circle at 15% 10%, rgba(16,185,129,0.08), transparent 45%)",
					}}
				/>
				<div className="relative flex justify-between items-center mb-6">
					<div className="flex items-start gap-3 flex-col sm:flex-row">
						<div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hidden sm:block">
							<TrendingUp className="w-5 h-5 text-emerald-500" />
						</div>
						<div>
							<h3 className="text-xl sm:text-2xl font-bold text-t-text-primary tracking-tight">
								Benchmark Portfela
							</h3>
							<p className="text-xs sm:text-sm text-t-text-secondary">
								Zestawienie stopy zwrotu Twojego portfela z głównymi indeksami
								rynkowymi
							</p>
						</div>
						<div className="mt-2 sm:mt-0 sm:ml-4">{trendBadge(false)}</div>
					</div>
					<button
						onClick={() => setIsExpanded(false)}
						className="p-2 sm:p-2.5 bg-t-bg-panel hover:bg-rose-500/10 text-t-text-secondary hover:text-rose-500 rounded-xl transition-colors shadow-sm border border-t-border hover:border-rose-500/30"
					>
						<Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" />
					</button>
				</div>
				<div className="relative flex flex-col flex-1 min-h-[300px] bg-t-bg-panel border border-t-border rounded-2xl p-4 md:p-6 shadow-xl">
					{chartContent}
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full h-full flex flex-col group bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-5 shadow-sm">
			<div className="flex items-center justify-between z-20 mb-2">
				<div>{trendBadge(true)}</div>
				<button
					onClick={() => setIsExpanded(true)}
					className="p-1.5 bg-t-bg-base border border-t-border text-t-text-tertiary hover:text-emerald-500 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-sm"
					title="Powiększ wykres"
				>
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>
			<div className="flex-1 w-full min-h-0 relative z-10">{chartContent}</div>
		</div>
	);
}

// ----------------------------------------------------------------------
// TOOLTIP TYPES
// ----------------------------------------------------------------------
interface TooltipPayloadItem {
	dataKey: string;
	value: number;
	name: string;
	color: string;
}

interface BenchmarkTooltipProps {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	label?: string;
	hiddenLines?: Record<string, boolean>;
}

function BenchmarkTooltip({
	active,
	payload,
	label,
	hiddenLines,
}: BenchmarkTooltipProps) {
	if (active && payload && payload.length) {
		const date = new Date(label as string);

		const sortedPayload = [...payload]
			.filter((entry) => !(hiddenLines && hiddenLines[entry.dataKey]))
			.sort((a, b) => b.value - a.value);

		const mainPortfolioEntry = sortedPayload.find(
			(e) => e.dataKey === "portfolioPct",
		);
		const isMainPositive = mainPortfolioEntry
			? mainPortfolioEntry.value >= 0
			: true;

		return (
			<div className="bg-t-bg-panel/95 backdrop-blur-md border border-t-border rounded-xl p-4 shadow-xl max-w-[280px]">
				<div
					className={`absolute top-0 left-0 right-0 h-[2px] ${
						isMainPositive
							? "bg-gradient-to-r from-emerald-400 to-emerald-600"
							: "bg-gradient-to-r from-rose-400 to-rose-600"
					}`}
				/>

				<p className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-3 border-b border-t-border pb-1.5">
					{format(date, "dd MMMM yyyy", { locale: pl })}
				</p>
				<div className="space-y-2.5">
					{sortedPayload.map((entry, index) => {
						const isPositive = entry.value >= 0;
						const isPortfolio = entry.dataKey === "portfolioPct";

						return (
							<div
								key={index}
								className={`flex justify-between items-center gap-6 ${isPortfolio ? "bg-t-bg-base -mx-2 px-2 py-1.5 rounded-lg border border-t-border" : ""}`}
							>
								<div className="flex items-center gap-2">
									<span
										className={`w-2 h-2 rounded-full ${isPortfolio ? "animate-pulse" : ""}`}
										style={{ backgroundColor: entry.color }}
									/>
									<span
										className={`text-xs ${isPortfolio ? "font-bold text-t-text-primary" : "font-medium text-t-text-secondary"}`}
									>
										{entry.name}
									</span>
								</div>
								<span
									className={`text-sm font-bold tabular-nums ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
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

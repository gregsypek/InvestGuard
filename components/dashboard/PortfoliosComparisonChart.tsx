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

import { ChartContainer } from "../shared/ChartContainer";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils/format-currency";
import { pl } from "date-fns/locale";
import { useState } from "react";

interface PortfolioDataPoint {
	date: string | Date;
	[portfolioId: string]: string | number | Date;
}

// Map color strings from Prisma to actual CSS Hex values from globals.css
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

interface PortfolioInfo {
	id: string;
	name: string;
	colorTheme?: string; // Added field from Prisma schema
}

interface PortfoliosComparisonChartProps {
	data: PortfolioDataPoint[];
	portfolios: PortfolioInfo[];
	activeIds: string[];
	chartMode: "VALUE" | "PERCENTAGE";
}

interface LegendPayloadItem {
	dataKey?: string | number | ((obj: unknown) => unknown);
	color?: string;
	value?: React.ReactNode;
}

interface TooltipPayloadItem {
	dataKey: string;
	value: number;
	name: string;
	color: string;
}

interface ComparisonTooltipProps {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	label?: string | Date;
	hiddenLines: Record<string, boolean>;
	chartMode: "VALUE" | "PERCENTAGE";
}

export function PortfoliosComparisonChart({
	data,
	portfolios,
	activeIds,
	chartMode,
}: PortfoliosComparisonChartProps) {
	const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
	const [prevActiveIds, setPrevActiveIds] = useState<string>("");
	const [isExpanded, setIsExpanded] = useState(false);

	const currentActiveIdsStr = activeIds.join(",");
	if (currentActiveIdsStr !== prevActiveIds) {
		setPrevActiveIds(currentActiveIdsStr);
		const nextHidden: Record<string, boolean> = {};
		portfolios.forEach((p) => {
			nextHidden[p.id] = !(
				activeIds.includes("ALL") || activeIds.includes(p.id)
			);
		});
		setHiddenLines(nextHidden);
	}

	const toggleLine = (dataKey: string) => {
		setHiddenLines((prev) => ({
			...prev,
			[dataKey]: !prev[dataKey],
		}));
	};

	if (!data || data.length === 0 || portfolios.length === 0) {
		return (
			<div className="flex items-center justify-center h-full opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
					Brak danych do porównania
				</p>
			</div>
		);
	}

	const allValues = data.flatMap((d) =>
		portfolios.map((p) => Number(d[p.id]) || 0),
	);
	const maxAbsValue = Math.max(...allValues.map(Math.abs), 5);
	const yDomain = Math.ceil(maxAbsValue * 1.1);

	const renderCustomLegend = ({
		payload,
	}: {
		payload?: readonly LegendPayloadItem[];
	}) => {
		if (!payload) return null;

		return (
			<div>
				<ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
					{payload.map((entry) => {
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
								<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
									{entry.value}
								</span>
							</li>
						);
					})}
				</ul>
				<p className="text-[9px] text-center text-t-text-tertiary uppercase tracking-widest font-bold my-4 opacity-70">
					💡 Kliknij w nazwę portfela, aby włączyć lub wyłączyć go z wykresu
				</p>
			</div>
		);
	};

	const chartContent = (
		<ChartContainer className="h-full min-h-0 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart
					data={data}
					// 1. Wyrównujemy marginesy wewnętrzne Recharts, aby wykres ładnie wypełniał Canvas
					margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
				>
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
						tickFormatter={(val) =>
							chartMode === "PERCENTAGE"
								? `${val > 0 ? "+" : ""}${val}%`
								: `${(val / 1000).toFixed(0)}k`
						}
						domain={
							chartMode === "PERCENTAGE"
								? [-yDomain, yDomain]
								: ["auto", "auto"]
						}
					/>
					<ReferenceLine y={0} stroke="var(--t-border)" strokeWidth={1} />
					<Tooltip
						content={
							<ComparisonTooltip
								hiddenLines={hiddenLines}
								chartMode={chartMode}
							/>
						}
						cursor={{ stroke: "var(--t-border-subtle)", strokeWidth: 2 }}
						// 2. Podnosimy zIndex drastycznie wyżej niż legenda i resetujemy outline
						wrapperStyle={{ zIndex: 1000, outline: "none" }}
					/>
					<Legend
						content={renderCustomLegend}
						verticalAlign="bottom"
						wrapperStyle={{
							position: "relative",
							// 3. Obniżamy zIndex legendy, aby tekst "Kliknij w nazwę..." nie przebijał
							zIndex: 10,
						}}
					/>

					{portfolios.map((p) => {
						// Fallback to blue if colorTheme is missing or invalid
						const themeColor =
							THEME_COLORS[p.colorTheme || "blue"] || THEME_COLORS.blue;

						return (
							<Line
								key={p.id}
								type="monotone"
								dataKey={p.id}
								name={p.name}
								stroke={themeColor}
								strokeWidth={3}
								dot={false}
								activeDot={{ r: 5, strokeWidth: 0 }}
								hide={hiddenLines[p.id]}
								isAnimationActive={true}
								animationDuration={800}
							/>
						);
					})}
				</LineChart>
			</ResponsiveContainer>
		</ChartContainer>
	);

	if (isExpanded) {
		return (
			<div className="fixed inset-0 z-[100] bg-t-bg-base/95 backdrop-blur-xl p-6 md:p-12 flex flex-col animate-in fade-in duration-200">
				<div className="relative flex justify-between items-center mb-6">
					<div className="flex items-start gap-3 flex-col sm:flex-row">
						<div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
							<WalletCards className="w-5 h-5 text-blue-500" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-t-text-primary tracking-tight">
								Wyścig Portfeli
							</h3>
							<p className="text-sm text-t-text-secondary">
								Szczegółowe porównanie strategii inwestycyjnych
							</p>
						</div>
					</div>
					<button
						onClick={() => setIsExpanded(false)}
						className="p-2.5 bg-t-bg-panel hover:bg-rose-500/10 text-t-text-secondary hover:text-rose-500 rounded-xl transition-colors shadow-lg border border-t-border hover:border-rose-500/30"
					>
						<Minimize2 className="w-6 h-6" />
					</button>
				</div>
				<div className="relative flex-1 min-h-0 bg-t-bg-panel border border-t-border rounded-2xl p-4 md:p-8 shadow-2xl">
					{chartContent}
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full h-full flex flex-col group bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
			<div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
				<button
					onClick={() => setIsExpanded(true)}
					className="p-1.5 bg-t-bg-base border border-t-border text-t-text-tertiary hover:text-emerald-500 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-sm"
					title="Powiększ wykres"
				>
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>
			{/* Zmieniono 'py-3' na 'pt-6', aby wykres naturalnie odsunął się od górnego przycisku i zachował symetrię względem bocznych paddingów */}
			<div className="flex-1 w-full h-full min-h-0 pt-6">{chartContent}</div>
		</div>
	);
}

function ComparisonTooltip({
	active,
	payload,
	label,
	hiddenLines,
	chartMode,
}: ComparisonTooltipProps) {
	if (active && payload && payload.length) {
		const sortedPayload = [...payload]
			.filter((entry) => !(hiddenLines && hiddenLines[entry.dataKey]))
			.sort((a, b) => b.value - a.value);

		return (
			<div className=" bg-t-bg-panel border border-t-border rounded-2xl p-4 shadow-xl min-w-55">
				<p className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-3 border-b border-t-border pb-2">
					{format(new Date(label as string | Date), "dd MMMM yyyy", {
						locale: pl,
					})}
				</p>
				<div className="space-y-2.5">
					{sortedPayload.map((entry, index) => {
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
									<span className="text-xs font-medium text-t-text-secondary line-clamp-1">
										{entry.name}
									</span>
								</div>
								<span
									className={`text-sm font-bold tabular-nums whitespace-nowrap ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
								>
									{chartMode === "PERCENTAGE"
										? `${isPositive ? "+" : ""}${Number(entry.value).toFixed(2)}%`
										: `${formatCurrency(entry.value, 0)} PLN`}
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

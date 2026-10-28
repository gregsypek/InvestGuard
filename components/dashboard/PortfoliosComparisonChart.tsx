"use client";

import {
	Brush,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	ChartCardLayout,
	ComparisonValuePill,
} from "../shared/ChartCardLayout";
import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { FilterBadge } from "../shared/FilterBadge";
import { WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useChartContext } from "../providers/ChartProvider";

interface PortfolioDataPoint {
	date: string | Date;
	[portfolioId: string]: string | number | Date;
}

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
	colorTheme?: string;
}

interface PortfoliosComparisonChartProps {
	data: PortfolioDataPoint[];
	portfolios: PortfolioInfo[];
	activeIds: string[];
	chartMode: "VALUE" | "PERCENTAGE";
	setChartMode?: (mode: "VALUE" | "PERCENTAGE") => void;
	activeRange?: string;
	onRangeChange?: (range: string) => void;
	dataMode?: "REAL" | "SIMULATED";
	setDataMode?: (mode: "REAL" | "SIMULATED") => void;
	titleInside?: string;
	subtitleInside?: string;
	isRangeDisabled?: (range: string) => boolean;
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

const TIME_RANGES = ["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX"];

export function PortfoliosComparisonChart({
	data,
	portfolios,
	activeIds,
	chartMode,
	setChartMode,
	activeRange,
	onRangeChange,
	dataMode,
	setDataMode,
	titleInside,
	subtitleInside,
	isRangeDisabled,
}: PortfoliosComparisonChartProps) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
	const [prevActiveIds, setPrevActiveIds] = useState<string>("");
	const [isMobile, setIsMobile] = useState(false);

	// Sync logic for brush so labels match the visible range
	const [brushIndex, setBrushIndex] = useState({
		start: 0,
		end: data && data.length > 0 ? data.length - 1 : 0,
	});

	const currentDataKey =
		data && data.length > 0
			? `${data.length}-${String(data[0].date)}`
			: "empty";
	const [prevDataKey, setPrevDataKey] = useState(currentDataKey);

	if (currentDataKey !== prevDataKey) {
		setPrevDataKey(currentDataKey);
		setBrushIndex({
			start: 0,
			end: data && data.length > 0 ? data.length - 1 : 0,
		});
	}
	const visibleIds = useMemo(
		() =>
			portfolios
				.filter(
					(p) =>
						(activeIds.includes("ALL") || activeIds.includes(p.id)) &&
						!hiddenLines[p.id],
				)
				.map((p) => p.id),
		[portfolios, activeIds, hiddenLines],
	);

	const lastValid = useMemo(() => {
		const result: Record<string, { relIndex: number; absIndex: number }> = {};
		portfolios.forEach((p) => {
			for (let i = brushIndex.end; i >= brushIndex.start; i--) {
				if (data[i] && data[i][p.id] != null) {
					result[p.id] = { relIndex: i - brushIndex.start, absIndex: i };
					break;
				}
			}
		});
		return result;
	}, [data, portfolios, brushIndex.start, brushIndex.end]);

	// Wartości końcowe widocznych linii (do rankingu i rozsuwania pigułek)
	const endValues = useMemo(() => {
		const vals: Record<string, number> = {};
		visibleIds.forEach((id) => {
			const li = lastValid[id];
			if (li) vals[id] = Number(data[li.absIndex][id]);
		});
		return vals;
	}, [visibleIds, lastValid, data]);

	const currentActiveIdsStr = activeIds.join(",");

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 640);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
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
	}, [currentActiveIdsStr, portfolios, activeIds, prevActiveIds]);

	if (!data || data.length === 0 || portfolios.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-2 opacity-60">
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

	// 🚀 Toggle individual lines inside the chart
	const toggleLine = (id: string) => {
		setHiddenLines((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	// 🚀 PORTFOLIOS OVERLAY (Clickable filters on top of the chart)
	const portfoliosOverlay = portfolios?.map((p) => {
		// Only render filters for portfolios that are actually selected in the parent component
		if (!activeIds.includes("ALL") && !activeIds.includes(p.id)) return null;

		const isVisible = !hiddenLines[p.id]; // Visible if NOT hidden
		return (
			<FilterBadge
				key={p.id}
				id={p.id}
				label={p.name}
				isSelected={isVisible}
				onToggle={() => toggleLine(p.id)}
			/>
		);
	});

	// Top controls passed to ChartCardLayout
	const topControls = (
		<>
			{setChartMode && (
				<div className="flex items-center gap-1 border border-t-border rounded-lg p-1 shadow-sm">
					<FilterBadge
						id={currencySymbol}
						label={currencySymbol}
						isSelected={chartMode === "VALUE"}
						onToggle={() => setChartMode("VALUE")}
					/>
					<FilterBadge
						id="%"
						label="%"
						isSelected={chartMode === "PERCENTAGE"}
						onToggle={() => setChartMode("PERCENTAGE")}
					/>
				</div>
			)}
			{setDataMode && (
				<div className="flex items-center gap-1 border border-t-border rounded-lg p-1 shadow-sm">
					<FilterBadge
						id="REAL"
						label="Real"
						isSelected={dataMode === "REAL"}
						onToggle={() => setDataMode("REAL")}
					/>
					<FilterBadge
						id="SIMULATED"
						label="Sym"
						isSelected={dataMode === "SIMULATED"}
						onToggle={() => setDataMode("SIMULATED")}
					/>
				</div>
			)}
		</>
	);

	// Legend passed as headerExtra
	const legendBadge = (
		<div className="flex flex-wrap items-center gap-3">
			<div className="flex items-center gap-1.5 rounded-full border px-2 sm:px-2.5 py-1 bg-blue-500/10 border-blue-500/20">
				<span className="text-[11px] font-bold tabular-nums text-blue-500">
					<span className="text-t-text-tertiary mr-1 font-medium">
						LEGENDA:
					</span>
					KOLORY
				</span>
			</div>
			<div className="hidden md:flex flex-wrap items-center gap-3 ml-2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
				{portfolios.map((p) => {
					// Only show in legend if it's active in parent
					if (!activeIds.includes("ALL") && !activeIds.includes(p.id))
						return null;

					const isHidden = hiddenLines[p.id];
					const themeColor =
						THEME_COLORS[p.colorTheme || "blue"] || THEME_COLORS.blue;
					return (
						<div
							key={p.id}
							className="flex items-center gap-1.5 transition-all duration-300"
						>
							<span
								className="w-3 h-3 rounded-full"
								style={{
									backgroundColor: themeColor,
									opacity: isHidden ? 0.3 : 1,
								}}
							/>
							<span className={cn(isHidden && "opacity-40 grayscale")}>
								{p.name}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);

	// Footer ranges utilizing disabled logic
	const footerRanges = onRangeChange
		? TIME_RANGES.map((range) => {
				const disabled =
					dataMode === "REAL" && isRangeDisabled
						? isRangeDisabled(range)
						: false;
				return (
					<div
						key={range}
						className={cn(
							!activeRange && "opacity-40 grayscale pointer-events-none",
							disabled &&
								"opacity-30 grayscale cursor-not-allowed pointer-events-none",
						)}
					>
						<FilterBadge
							id={range}
							label={range}
							isSelected={activeRange === range && !disabled}
							onToggle={disabled ? undefined : onRangeChange}
						/>
					</div>
				);
			})
		: null;

	return (
		<ChartCardLayout
			title={titleInside || "Wyścig Portfeli"}
			subtitle={subtitleInside || "Porównanie Strategii"}
			icon={WalletCards}
			controls={topControls}
			headerExtra={legendBadge}
			topOverlay={portfoliosOverlay}
			footer={footerRanges}
		>
			<div className="w-full flex-1 min-h-0 border-b border-t-border-subtle pb-2 relative h-full">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={data}
						syncId="portfolioSyncComparison"
						margin={{
							top: 40,
							right: isMobile ? 30 : 40,
							left: 20,
							bottom: 0,
						}}
					>
						<CartesianGrid
							strokeDasharray="4 4"
							vertical={false}
							stroke="var(--t-border)"
						/>
						<XAxis dataKey="date" hide={true} />
						<YAxis
							orientation="right"
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
							width={isMobile ? 35 : 55}
						/>
						<ReferenceLine
							y={0}
							stroke="var(--t-border-strong, var(--t-border))"
							strokeWidth={1}
						/>
						<Tooltip
							content={
								<ComparisonTooltip
									hiddenLines={hiddenLines}
									chartMode={chartMode}
								/>
							}
							offset={15}
							cursor={{ stroke: "var(--t-border-subtle)", strokeWidth: 2 }}
							wrapperStyle={{
								zIndex: 1000,
								outline: "none",
								pointerEvents: "none",
							}}
						/>
						<Brush
							dataKey="date"
							height={24}
							startIndex={brushIndex.start}
							endIndex={brushIndex.end}
							stroke="var(--t-text-tertiary)"
							fill="transparent"
							onChange={(e) => {
								if (
									e &&
									typeof e.startIndex === "number" &&
									typeof e.endIndex === "number"
								) {
									setBrushIndex({ start: e.startIndex, end: e.endIndex });
								}
							}}
							tickFormatter={(val) => {
								const date = new Date(val);
								const isShortRange = ["1W", "1M", "3M", "YTD"].includes(
									activeRange || "",
								);
								if (isShortRange)
									return date.toLocaleDateString("pl-PL", {
										day: "numeric",
										month: "short",
									});
								return date.toLocaleDateString("pl-PL", {
									month: "short",
									year: "2-digit",
								});
							}}
							traveller={(props: any) => {
								const { x, y, width, height } = props;
								return (
									<g
										transform={`translate(${x}, ${y})`}
										className="cursor-ew-resize"
									>
										<rect
											x={0}
											y={0}
											width={width}
											height={height}
											rx={4}
											fill="var(--t-text-tertiary)"
											strokeLinecap="round"
										/>
										<line
											x1={width / 2}
											y1={height * 0.25}
											x2={width / 2}
											y2={height * 0.75}
											stroke="var(--t-bg-base)"
											strokeWidth={2}
											strokeLinecap="round"
										/>
									</g>
								);
							}}
						/>
						{portfolios.map((p) => {
							const themeColor =
								THEME_COLORS[p.colorTheme || "blue"] || THEME_COLORS.blue;

							if (hiddenLines[p.id]) return null;

							return (
								<React.Fragment key={`group-${p.id}`}>
									<Line
										type="monotone"
										dataKey={p.id}
										name={p.name}
										stroke={themeColor}
										strokeWidth={2.5}
										dot={false}
										activeDot={{
											r: 6,
											strokeWidth: 2,
											fill: themeColor,
											stroke: "var(--t-bg-panel)",
										}}
										pointerEvents="none"
										isAnimationActive
										animationDuration={800}
										label={
											<ComparisonValuePill
												customProps={{
													seriesId: p.id,
													color: themeColor,
													targetIndex: lastValid[p.id]?.relIndex,
													endValues,
													mode: chartMode,
													currencySymbol,
													convertPLN,
												}}
											/>
										}
									/>
								</React.Fragment>
							);
						})}
					</ComposedChart>
				</ResponsiveContainer>
			</div>
		</ChartCardLayout>
	);
}

function ComparisonTooltip({
	active,
	payload,
	label,
	hiddenLines,
	chartMode,
}: ComparisonTooltipProps) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	if (active && payload && payload.length) {
		const cleanPayload = payload.filter(
			(p) =>
				!String(p.dataKey).startsWith("lastValue_") && p.dataKey !== "date",
		);

		const sortedPayload = [...cleanPayload]
			.filter((entry) => !(hiddenLines && hiddenLines[entry.dataKey]))
			.sort((a, b) => b.value - a.value);

		return (
			<div className="bg-t-bg-panel/95 backdrop-blur-md border border-t-border rounded-xl p-4 shadow-xl min-w-[260px] relative overflow-hidden">
				<p className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-3 border-b border-t-border pb-1.5">
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
								className="flex justify-between items-center gap-6"
							>
								<div className="flex items-center gap-2">
									<span
										className="w-2 h-2 rounded-full"
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
										: `${formatCurrency(convertPLN(entry.value))} ${currencySymbol}`}
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

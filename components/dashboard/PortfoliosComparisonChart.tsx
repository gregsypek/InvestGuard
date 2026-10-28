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
	ZIndexLayer,
	usePlotArea,
} from "recharts";
import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { ChartCardLayout } from "../shared/ChartCardLayout";
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

const PILL_HEIGHT = 22;
const PILL_GAP = 4;
const PILL_STEP = PILL_HEIGHT + PILL_GAP;
const PILL_MIN_WIDTH = 65;

interface PillItem {
	id: string;
	color: string;
	value: number;
	index: number; // indeks względem widocznego zakresu Brusha
}

/**
 * Rozstawia etykiety w osi Y tak, by się nie nakładały.
 * Zwraca finalne pozycje Y (środek pigułki) w tej samej kolejności co `targets`.
 */
function spreadLabels(
	targets: number[],
	step: number,
	lo: number,
	hi: number,
): number[] {
	const order = targets
		.map((_, i) => i)
		.sort((a, b) => targets[a] - targets[b]);

	const place = (ids: number[]) => {
		const mean = ids.reduce((s, i) => s + targets[i], 0) / ids.length;
		const span = (ids.length - 1) * step;
		const top = Math.min(
			Math.max(mean - span / 2, lo),
			Math.max(lo, hi - span),
		);
		return { ids, top };
	};

	let clusters = order.map((i) => place([i]));

	let merged = true;
	while (merged) {
		merged = false;
		for (let c = 1; c < clusters.length; c++) {
			const prev = clusters[c - 1];
			const cur = clusters[c];
			const prevBottom = prev.top + (prev.ids.length - 1) * step;
			if (cur.top - prevBottom < step - 0.01) {
				clusters = [
					...clusters.slice(0, c - 1),
					place([...prev.ids, ...cur.ids]),
					...clusters.slice(c + 1),
				];
				merged = true;
				break;
			}
		}
	}

	const result = new Array<number>(targets.length).fill(0);
	clusters.forEach((cl) =>
		cl.ids.forEach((id, k) => {
			result[id] = cl.top + k * step;
		}),
	);
	return result;
}

interface EndPillsProps {
	pills: PillItem[];
	count: number; // liczba punktów w widocznym zakresie
	domain: [number, number];
	mode: "VALUE" | "PERCENTAGE";
	currencySymbol: string;
	convertPLN: (v: number) => number;
}

function EndPills({
	pills,
	count,
	domain,
	mode,
	currencySymbol,
	convertPLN,
}: EndPillsProps) {
	const plot = usePlotArea();
	if (!plot || !Number.isFinite(plot.width) || !Number.isFinite(plot.height))
		return null;
	const [dMin, dMax] = domain;
	const range = dMax - dMin || 1;
	const yOf = (v: number) => plot.y + ((dMax - v) / range) * plot.height;
	const xOf = (i: number) =>
		count > 1 ? plot.x + (i / (count - 1)) * plot.width : plot.x + plot.width;

	const items = pills.map((p) => {
		const label =
			mode === "PERCENTAGE"
				? `${p.value > 0 ? "+" : ""}${p.value.toFixed(2)}%`
				: `${new Intl.NumberFormat("pl-PL", {
						notation: "compact",
						maximumFractionDigits: 1,
					}).format(convertPLN(p.value))} ${currencySymbol}`;
		return { ...p, x: xOf(p.index), y: yOf(p.value), label };
	});

	const finalYs = spreadLabels(
		items.map((i) => i.y),
		PILL_STEP,
		plot.y + PILL_HEIGHT / 2,
		plot.y + plot.height - PILL_HEIGHT / 2,
	);

	return (
		<ZIndexLayer zIndex={2000}>
			<g style={{ pointerEvents: "none" }}>
				{items.map((it, k) => {
					const fy = finalYs[k];
					const w = Math.max(PILL_MIN_WIDTH, it.label.length * 7 + 16);
					return (
						<g key={it.id}>
							<path
								d={`M ${it.x} ${it.y} C ${it.x - 10} ${it.y}, ${it.x - 10} ${fy}, ${it.x - 16} ${fy}`}
								stroke={it.color}
								strokeWidth={1.5}
								strokeDasharray="2 2"
								fill="none"
							/>
							<rect
								x={it.x - 16 - w}
								y={fy - PILL_HEIGHT / 2}
								width={w}
								height={PILL_HEIGHT}
								rx={6}
								fill={it.color}
								stroke="var(--t-bg-panel)"
								strokeWidth={2}
							/>
							<text
								x={it.x - 16 - w / 2}
								y={fy + 3.5}
								textAnchor="middle"
								fill="#fff"
								fontSize={10}
								fontWeight="bold"
							>
								{it.label}
							</text>
							<circle
								cx={it.x}
								cy={it.y}
								r={4}
								fill={it.color}
								stroke="var(--t-bg-panel)"
								strokeWidth={2}
							/>
						</g>
					);
				})}
			</g>
		</ZIndexLayer>
	);
}

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
			? `${data.length}-${String(data[0].date)}-${String(data[data.length - 1].date)}`
			: "empty";

	const [prevDataKey, setPrevDataKey] = useState(currentDataKey);

	if (currentDataKey !== prevDataKey) {
		setPrevDataKey(currentDataKey);
		setBrushIndex({
			start: 0,
			end: data && data.length > 0 ? data.length - 1 : 0,
		});
	}

	const dataLen = data?.length ?? 0;
	const lastIdx = Math.max(0, dataLen - 1);
	const brush = useMemo(() => {
		const start = Math.min(Math.max(0, brushIndex.start), lastIdx);
		const end = Math.min(Math.max(start, brushIndex.end), lastIdx);
		return { start, end };
	}, [brushIndex.start, brushIndex.end, lastIdx]);

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

	const pills = useMemo<PillItem[]>(() => {
		if (!data?.length) return [];
		const out: PillItem[] = [];
		portfolios.forEach((p) => {
			if (!visibleIds.includes(p.id)) return;
			const color = THEME_COLORS[p.colorTheme || "blue"] || THEME_COLORS.blue;
			for (
				let i = Math.min(brush.end, data.length - 1);
				i >= brush.start;
				i--
			) {
				const v = data[i]?.[p.id];
				if (v != null) {
					out.push({
						id: p.id,
						color,
						value: Number(v),
						index: i - brush.start,
					});
					break;
				}
			}
		});
		return out;
	}, [data, portfolios, visibleIds, brush.start, brush.end]);

	const yDomain = useMemo<[number, number]>(() => {
		if (!data?.length || visibleIds.length === 0) return [-5, 5];
		let min = Infinity;
		let max = -Infinity;
		for (let i = brush.start; i <= Math.min(brush.end, data.length - 1); i++) {
			visibleIds.forEach((id) => {
				const v = data[i]?.[id];
				if (v != null) {
					const n = Number(v);
					if (n < min) min = n;
					if (n > max) max = n;
				}
			});
		}
		if (!isFinite(min) || !isFinite(max)) return [-5, 5];
		if (chartMode === "PERCENTAGE") {
			min = Math.min(min, 0);
			max = Math.max(max, 0);
		}
		const pad = (max - min || 1) * 0.12;
		return [min - pad, max + pad];
	}, [data, visibleIds, brush.start, brush.end, chartMode]);
	if (!data || data.length === 0 || portfolios.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-2 opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
					Brak danych do porównania
				</p>
			</div>
		);
	}

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

	const leader = [...pills].sort((a, b) => b.value - a.value)[0];
	const leaderName = portfolios.find((p) => p.id === leader?.id)?.name;
	const leaderValue = leader
		? chartMode === "PERCENTAGE"
			? `${leader.value > 0 ? "+" : ""}${leader.value.toFixed(2)}%`
			: `${formatCurrency(convertPLN(leader.value))} ${currencySymbol}`
		: null;

	const legendBadge = (
		<div className="flex flex-wrap items-center gap-3">
			{leader && (
				<div className="flex items-center gap-1.5 rounded-full border px-2 sm:px-2.5 py-1 bg-blue-500/10 border-blue-500/20">
					<span className="text-[11px] font-bold tabular-nums text-blue-500">
						<span className="text-t-text-tertiary mr-1 font-medium">
							PROWADZI:
						</span>
						{leaderName} {leaderValue}
					</span>
				</div>
			)}
			<div className="flex flex-wrap items-center gap-3 ml-2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
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
									? `${val > 0 ? "+" : ""}${Math.round(val)}%`
									: `${(val / 1000).toFixed(0)}k`
							}
							domain={yDomain}
							allowDataOverflow
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
						{dataLen > 1 && (
							<Brush
								key={currentDataKey}
								dataKey="date"
								height={24}
								startIndex={brush.start}
								endIndex={brush.end}
								stroke="var(--t-text-tertiary)"
								fill="transparent"
								onChange={(e) => {
									if (
										e &&
										Number.isFinite(e.startIndex) &&
										Number.isFinite(e.endIndex) &&
										e.startIndex >= 0 &&
										e.endIndex <= lastIdx &&
										(e.startIndex !== brush.start || e.endIndex !== brush.end)
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
						)}
						{portfolios.map((p) => {
							const themeColor =
								THEME_COLORS[p.colorTheme || "blue"] || THEME_COLORS.blue;
							if (hiddenLines[p.id]) return null;
							return (
								<Line
									key={`line-${p.id}`}
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
								/>
							);
						})}

						<EndPills
							pills={pills}
							count={brush.end - brush.start + 1}
							domain={yDomain}
							mode={chartMode}
							currencySymbol={currencySymbol}
							convertPLN={convertPLN}
						/>
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

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
import { EndPills, PillItem, THEME_COLORS } from "../shared/EndPills";
import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { ChartCardLayout } from "../shared/ChartCardLayout";
import { FilterBadge } from "../shared/FilterBadge";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useChartContext } from "../providers/ChartProvider";

export interface BenchmarkDataPoint {
	date: string | Date;
	[key: string]: string | number | Date;
}

interface PortfolioInfo {
	id: string;
	name: string;
	colorTheme?: string;
}

interface PortfolioBenchmarkChartProps {
	data: BenchmarkDataPoint[];
	userIndices: string[];
	portfolios: PortfolioInfo[];
	activeIds: string[];
	chartMode: "VALUE" | "PERCENTAGE";
	setChartMode?: (mode: "VALUE" | "PERCENTAGE") => void;
	dataMode?: "REAL" | "SIMULATED";
	setDataMode?: (mode: "REAL" | "SIMULATED") => void;
	activeRange?: string;
	onRangeChange?: (range: string) => void;
	isRangeDisabled?: (range: string) => boolean;
	titleInside?: string;
	subtitleInside?: string;
}

const INDEX_COLORS: Record<string, string> = {
	SP500: "#8b5cf6",
	NASDAQ: "#ec4899",
	WIG20: "#3b82f6",
	DAX: "#06b6d4",
	BTC: "#f59e0b",
	GOLD: "#fbbf24",
};

const TOTAL_KEY = "TOTAL_CAPITAL";
const TOTAL_COLOR = "#2563eb"; // Highlighted primary blue color for Total Capital

const TIME_RANGES = ["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX"];

export function PortfolioBenchmarkChart({
	data,
	userIndices,
	portfolios,
	activeIds,
	chartMode,
	setChartMode,
	dataMode,
	setDataMode,
	activeRange,
	onRangeChange,
	isRangeDisabled,
	titleInside,
	subtitleInside,
}: PortfolioBenchmarkChartProps) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
	const [prevActiveIds, setPrevActiveIds] = useState<string>("");
	const [isMobile, setIsMobile] = useState(false);

	// Sync logic for brush
	const [brushIndex, setBrushIndex] = useState({
		start: 0,
		end: data && data.length > 0 ? data.length - 1 : 0,
	});

	const dataLen = data?.length ?? 0;
	const lastIdx = Math.max(0, dataLen - 1);

	const currentDataKey =
		dataLen > 0
			? `${dataLen}-${String(data[0].date)}-${String(data[lastIdx].date)}`
			: "empty";

	const [prevDataKey, setPrevDataKey] = useState(currentDataKey);

	if (currentDataKey !== prevDataKey) {
		setPrevDataKey(currentDataKey);
		setBrushIndex({ start: 0, end: lastIdx });
	}

	const brush = useMemo(() => {
		const start = Math.min(Math.max(0, brushIndex.start), lastIdx);
		const end = Math.min(Math.max(start, brushIndex.end), lastIdx);
		return { start, end };
	}, [brushIndex.start, brushIndex.end, lastIdx]);

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
			const nextHidden: Record<string, boolean> = { ...hiddenLines };
			portfolios.forEach((p) => {
				nextHidden[p.id] = !(
					activeIds.includes("ALL") || activeIds.includes(p.id)
				);
			});
			setHiddenLines(nextHidden);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentActiveIdsStr, portfolios, activeIds, prevActiveIds]);

	const visiblePortfolioIds = useMemo(
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

	const visibleIndices = useMemo(
		() => userIndices.filter((idx) => !hiddenLines[idx]),
		[userIndices, hiddenLines],
	);

	const pills = useMemo<PillItem[]>(() => {
		if (!data?.length) return [];
		const out: PillItem[] = [];

		// Pill for Total Capital
		if (!hiddenLines[TOTAL_KEY]) {
			for (let i = brush.end; i >= brush.start; i--) {
				const v = data[i]?.[TOTAL_KEY];
				if (v != null) {
					out.push({
						id: TOTAL_KEY,
						color: TOTAL_COLOR,
						value: Number(v),
						index: i - brush.start,
					});
					break;
				}
			}
		}

		// Pills for individual portfolios
		portfolios.forEach((p) => {
			if (!visiblePortfolioIds.includes(p.id)) return;
			const color = THEME_COLORS[p.colorTheme || "blue"] || THEME_COLORS.blue;
			for (let i = brush.end; i >= brush.start; i--) {
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

		// Pills for market indices
		userIndices.forEach((idx) => {
			if (!visibleIndices.includes(idx)) return;
			const color = INDEX_COLORS[idx] || "#64748b";
			for (let i = brush.end; i >= brush.start; i--) {
				const v = data[i]?.[idx];
				if (v != null) {
					out.push({
						id: idx,
						color,
						value: Number(v),
						index: i - brush.start,
					});
					break;
				}
			}
		});

		return out;
	}, [
		data,
		portfolios,
		userIndices,
		visiblePortfolioIds,
		visibleIndices,
		hiddenLines,
		brush.start,
		brush.end,
	]);

	const yDomain = useMemo<[number, number]>(() => {
		if (
			!data?.length ||
			(visiblePortfolioIds.length === 0 &&
				visibleIndices.length === 0 &&
				hiddenLines[TOTAL_KEY])
		)
			return [-5, 5];
		let min = Infinity;
		let max = -Infinity;

		const keysToCheck = [...visiblePortfolioIds, ...visibleIndices];
		if (!hiddenLines[TOTAL_KEY]) keysToCheck.push(TOTAL_KEY);

		for (let i = brush.start; i <= brush.end; i++) {
			keysToCheck.forEach((key) => {
				const v = data[i]?.[key];
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
	}, [
		data,
		visiblePortfolioIds,
		visibleIndices,
		hiddenLines,
		brush.start,
		brush.end,
		chartMode,
	]);

	if (!data || dataLen === 0) {
		return (
			<div className="flex items-center justify-center h-full min-h-[300px] opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
					Brak danych do benchmarku
				</p>
			</div>
		);
	}

	const toggleLine = (id: string) => {
		setHiddenLines((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const topControls = (
		<>
			{setChartMode && (
				<div className="flex items-center gap-1">
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
				<div className="flex items-center gap-1">
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

	// Portfolio Filters
	const portfoliosOverlay = portfolios?.map((p) => {
		if (!activeIds.includes("ALL") && !activeIds.includes(p.id)) return null;
		return (
			<FilterBadge
				key={p.id}
				id={p.id}
				label={p.name}
				isSelected={!hiddenLines[p.id]}
				onToggle={() => toggleLine(p.id)}
			/>
		);
	});

	// Index Filters
	const indicesOverlay = userIndices.map((idx) => (
		<FilterBadge
			key={idx}
			id={idx}
			label={idx}
			isSelected={!hiddenLines[idx]}
			onToggle={() => toggleLine(idx)}
		/>
	));

	const combinedOverlay = (
		<div className="flex flex-wrap items-center gap-2 md:justify-end justify-center w-full">
			<FilterBadge
				id={TOTAL_KEY}
				label="Suma Portfeli"
				isSelected={!hiddenLines[TOTAL_KEY]}
				onToggle={() => toggleLine(TOTAL_KEY)}
			/>
			{portfolios.length > 0 && <div className="w-px h-5 bg-t-border mx-1" />}
			{portfoliosOverlay}
			{userIndices.length > 0 && <div className="w-px h-5 bg-t-border mx-1" />}
			{indicesOverlay}
		</div>
	);

	const leader = [...pills].sort((a, b) => b.value - a.value)[0];
	const leaderName =
		leader?.id === TOTAL_KEY
			? "Suma Portfeli"
			: portfolios.find((p) => p.id === leader?.id)?.name || leader?.id;
	const leaderValue = leader
		? chartMode === "PERCENTAGE"
			? `${leader.value > 0 ? "+" : ""}${leader.value.toFixed(2)}%`
			: `${formatCurrency(convertPLN(leader.value))} ${currencySymbol}`
		: null;

	const headerExtra = (
		<div className="flex flex-wrap items-center gap-3">
			{leader && (
				<div className="hidden md:flex items-center gap-1.5 rounded-full border px-2 sm:px-2.5 py-1 bg-emerald-500/10 border-emerald-500/20">
					<span className="text-[11px] font-bold tabular-nums text-emerald-500">
						<span className="text-t-text-tertiary mr-1 font-medium">
							PROWADZI:
						</span>
						{leaderName} {leaderValue}
					</span>
				</div>
			)}
			<div className="flex flex-wrap items-center gap-3 ml-2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
				{/* Suma Portfeli Legend */}
				<div className="flex items-center gap-1.5">
					<span
						className="w-3 h-3 rounded-full"
						style={{
							backgroundColor: TOTAL_COLOR,
							opacity: hiddenLines[TOTAL_KEY] ? 0.3 : 1,
						}}
					/>
					<span
						className={cn(hiddenLines[TOTAL_KEY] && "opacity-40 grayscale")}
					>
						Suma Portfeli
					</span>
				</div>

				{/* Individual Portfolios Legend */}
				{portfolios.map((p) => {
					if (!activeIds.includes("ALL") && !activeIds.includes(p.id))
						return null;
					return (
						<div key={p.id} className="flex items-center gap-1.5">
							<span
								className="w-3 h-3 rounded-full"
								style={{
									backgroundColor:
										THEME_COLORS[p.colorTheme || "blue"] || THEME_COLORS.blue,
									opacity: hiddenLines[p.id] ? 0.3 : 1,
								}}
							/>
							<span className={cn(hiddenLines[p.id] && "opacity-40 grayscale")}>
								{p.name}
							</span>
						</div>
					);
				})}
				{/* Market Indices Legend */}
				{userIndices.map((idx) => (
					<div key={idx} className="flex items-center gap-1.5">
						<span
							className="w-3 h-3 rounded-full"
							style={{
								backgroundColor: INDEX_COLORS[idx] || "#64748b",
								opacity: hiddenLines[idx] ? 0.3 : 1,
							}}
						/>
						<span className={cn(hiddenLines[idx] && "opacity-40 grayscale")}>
							{idx}
						</span>
					</div>
				))}
			</div>
		</div>
	);

	const footerRanges = onRangeChange
		? TIME_RANGES.map((range) => {
				const disabled = isRangeDisabled ? isRangeDisabled(range) : false;
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
							onToggle={disabled ? () => {} : (id) => onRangeChange?.(id)}
						/>
					</div>
				);
			})
		: null;

	return (
		<ChartCardLayout
			title={titleInside || "Benchmark Portfeli"}
			subtitle={
				subtitleInside || "Stopa zwrotu i wycena Twoich strategii na tle rynków"
			}
			controls={topControls}
			icon={TrendingUp}
			headerExtra={headerExtra}
			topOverlay={combinedOverlay}
			footer={footerRanges}
		>
			<div className="w-full flex-1 min-h-0 border-b border-t-border-subtle pb-2 relative h-full">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={data}
						margin={{ top: 40, right: isMobile ? 30 : 40, left: 20, bottom: 0 }}
					>
						<CartesianGrid
							strokeDasharray="4 4"
							vertical={false}
							stroke="var(--t-border)"
						/>
						<XAxis dataKey="date" hide />
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
									: `${new Intl.NumberFormat("pl-PL", { notation: "compact", compactDisplay: "short" }).format(convertPLN(val))}`
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
								<BenchmarkTooltip
									hiddenLines={hiddenLines}
									chartMode={chartMode}
									portfolios={portfolios}
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
									return date.toLocaleDateString(
										"pl-PL",
										isShortRange
											? { day: "numeric", month: "short" }
											: { month: "short", year: "2-digit" },
									);
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

						{/* Renderowanie Indeksów */}
						{userIndices.map((idx) => {
							if (hiddenLines[idx]) return null;
							return (
								<Line
									key={`idx-${idx}`}
									type="monotone"
									dataKey={idx}
									name={idx}
									stroke={INDEX_COLORS[idx] || "#64748b"}
									strokeWidth={2.5}
									strokeDasharray="5 5"
									dot={false}
									activeDot={{ r: 4, strokeWidth: 0 }}
									opacity={0.8}
									pointerEvents="none"
									isAnimationActive={true}
									animationDuration={800}
								/>
							);
						})}

						{/* Renderowanie Sumy Portfeli */}
						{!hiddenLines[TOTAL_KEY] && (
							<Line
								key={`port-${TOTAL_KEY}`}
								type="monotone"
								dataKey={TOTAL_KEY}
								name="Suma Portfeli"
								stroke={TOTAL_COLOR}
								strokeWidth={4}
								strokeDasharray="7 7" // 🚀 DODANA ZMIANA: Przerywana linia dla Sumy Portfeli
								dot={false}
								activeDot={{
									r: 7,
									fill: TOTAL_COLOR,
									stroke: "var(--t-bg-panel)",
									strokeWidth: 2,
								}}
								pointerEvents="none"
								isAnimationActive
								animationDuration={800}
							/>
						)}

						{/* Renderowanie Poszczególnych Portfeli */}
						{portfolios.map((p) => {
							if (hiddenLines[p.id]) return null;
							if (!visiblePortfolioIds.includes(p.id)) return null;

							const themeColor =
								THEME_COLORS[p.colorTheme || "blue"] || THEME_COLORS.blue;

							return (
								<Line
									key={`port-${p.id}`}
									type="monotone"
									dataKey={p.id}
									name={p.name}
									stroke={themeColor}
									strokeWidth={3}
									dot={false}
									activeDot={{
										r: 6,
										fill: themeColor,
										stroke: "var(--t-bg-panel)",
										strokeWidth: 2,
									}}
									pointerEvents="none"
									isAnimationActive
									animationDuration={800}
								/>
							);
						})}

						{/* Reusable EndPills */}
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

// ----------------------------------------------------------------------
// TOOLTIP
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
	chartMode: "VALUE" | "PERCENTAGE";
	portfolios: PortfolioInfo[];
}

function BenchmarkTooltip({
	active,
	payload,
	label,
	hiddenLines,
	chartMode,
	portfolios,
}: BenchmarkTooltipProps) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	if (!active || !payload || payload.length === 0) return null;

	const uniquePayload = Array.from(
		new Map(payload.map((item) => [item.dataKey, item])).values(),
	);

	const sortedPayload = uniquePayload
		.filter((entry) => !(hiddenLines && hiddenLines[entry.dataKey]))
		.sort((a, b) => b.value - a.value);

	const topEntry = sortedPayload[0];
	const isTopPositive = topEntry ? topEntry.value >= 0 : true;

	return (
		<div className="bg-t-bg-panel/95 backdrop-blur-md border border-t-border rounded-xl p-4 shadow-xl min-w-[240px] max-w-[300px] relative overflow-hidden">
			<div
				className={cn(
					"absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r",
					isTopPositive
						? "from-emerald-400 to-emerald-600"
						: "from-rose-400 to-rose-600",
				)}
			/>
			<p className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-3 border-b border-t-border pb-1.5">
				{format(new Date(label as string), "dd MMMM yyyy", { locale: pl })}
			</p>
			<div className="space-y-2.5">
				{sortedPayload.map((entry, index) => {
					const isPositive = entry.value >= 0;
					const isPortfolio =
						portfolios.some((p) => p.id === entry.dataKey) ||
						entry.dataKey === TOTAL_KEY;
					const displayName =
						entry.dataKey === TOTAL_KEY ? "Suma Portfeli" : entry.name;

					return (
						<div
							key={`${entry.dataKey}-${index}`}
							className={cn(
								"flex justify-between items-center gap-6",
								isPortfolio &&
									"bg-t-bg-base -mx-2 px-2 py-1.5 rounded-lg border border-t-border",
							)}
						>
							<div className="flex items-center gap-2">
								<span
									className="w-2 h-2 rounded-full"
									style={{ backgroundColor: entry.color }}
								/>
								<span
									className={cn(
										"text-xs line-clamp-1 max-w-[140px]",
										isPortfolio
											? "font-bold text-t-text-primary"
											: "font-medium text-t-text-secondary",
									)}
								>
									{displayName}
								</span>
							</div>
							<span
								className={cn(
									"text-sm font-bold tabular-nums whitespace-nowrap",
									isPositive ? "text-emerald-500" : "text-rose-500",
								)}
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

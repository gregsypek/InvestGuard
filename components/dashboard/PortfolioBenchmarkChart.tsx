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

import { ChartCardLayout } from "../shared/ChartCardLayout";
import { FilterBadge } from "../shared/FilterBadge";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useChartContext } from "../providers/ChartProvider";

export interface BenchmarkDataPoint {
	date: string;
	portfolioPct: number;
	[indexName: string]: string | number;
}

interface PortfolioBenchmarkChartProps {
	data: BenchmarkDataPoint[];
	userIndices: string[];
	portfolioColorTheme?: string;
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

const TIME_RANGES = ["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX"];
const PORTFOLIO_KEY = "portfolioPct";

export function PortfolioBenchmarkChart({
	data,
	userIndices,
	portfolioColorTheme = "blue",
	activeRange,
	onRangeChange,
	isRangeDisabled,
	titleInside,
	subtitleInside,
}: PortfolioBenchmarkChartProps) {
	const { convertPLN } = useChartContext();

	const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
	const [isMobile, setIsMobile] = useState(false);

	const dataLen = data?.length ?? 0;
	const lastIdx = Math.max(0, dataLen - 1);

	const [brushIndex, setBrushIndex] = useState({ start: 0, end: lastIdx });

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

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 640);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const mainPortfolioColor =
		THEME_COLORS[portfolioColorTheme] || THEME_COLORS.blue;

	const colorOf = (key: string) =>
		key === PORTFOLIO_KEY ? mainPortfolioColor : INDEX_COLORS[key] || "#64748b";

	const seriesKeys = useMemo(
		() => [PORTFOLIO_KEY, ...userIndices],
		[userIndices],
	);
	const visibleKeys = useMemo(
		() => seriesKeys.filter((k) => !hiddenLines[k]),
		[seriesKeys, hiddenLines],
	);

	const toggleLine = (key: string) =>
		setHiddenLines((prev) => ({ ...prev, [key]: !prev[key] }));

	const pills = useMemo<PillItem[]>(() => {
		if (!dataLen) return [];
		const out: PillItem[] = [];
		visibleKeys.forEach((key) => {
			for (let i = brush.end; i >= brush.start; i--) {
				const v = data[i]?.[key];
				if (v != null) {
					out.push({
						id: key,
						color:
							key === PORTFOLIO_KEY
								? mainPortfolioColor
								: INDEX_COLORS[key] || "#64748b",
						value: Number(v),
						index: i - brush.start,
					});
					break;
				}
			}
		});
		return out;
	}, [data, dataLen, visibleKeys, brush.start, brush.end, mainPortfolioColor]);

	const yDomain = useMemo<[number, number]>(() => {
		if (!dataLen || visibleKeys.length === 0) return [-5, 5];
		let min = 0;
		let max = 0;
		for (let i = brush.start; i <= brush.end; i++) {
			visibleKeys.forEach((key) => {
				const v = data[i]?.[key];
				if (v != null) {
					const n = Number(v);
					if (n < min) min = n;
					if (n > max) max = n;
				}
			});
		}
		const pad = (max - min || 1) * 0.12;
		return [min - pad, max + pad];
	}, [data, dataLen, visibleKeys, brush.start, brush.end]);

	if (!data || dataLen === 0) {
		return (
			<div className="flex items-center justify-center h-full min-h-[300px] opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
					Brak danych do porównania
				</p>
			</div>
		);
	}

	const currentPortfolioPct = data[lastIdx]?.portfolioPct || 0;
	const isPortfolioPositive = currentPortfolioPct >= 0;

	// Klikalne filtry nad wykresem (portfel zawsze widoczny, indeksy do przełączania)
	const overlay = (
		<>
			<FilterBadge
				id={PORTFOLIO_KEY}
				label="Twój Portfel"
				isSelected
				onToggle={undefined}
			/>
			{userIndices.map((key) => (
				<FilterBadge
					key={key}
					id={key}
					label={key}
					isSelected={!hiddenLines[key]}
					onToggle={() => toggleLine(key)}
				/>
			))}
		</>
	);

	const headerExtra = (
		<div className="flex flex-wrap items-center gap-3">
			<div
				className={cn(
					"flex items-center gap-1.5 rounded-full border px-2.5 py-1",
					isPortfolioPositive
						? "bg-emerald-500/10 border-emerald-500/20"
						: "bg-rose-500/10 border-rose-500/20",
				)}
			>
				<span
					className={cn(
						"text-[11px] font-bold tabular-nums",
						isPortfolioPositive ? "text-emerald-500" : "text-rose-500",
					)}
				>
					<span className="text-t-text-tertiary mr-1 font-medium">
						Twój Portfel:
					</span>
					{isPortfolioPositive ? "+" : ""}
					{currentPortfolioPct.toFixed(2)}%
				</span>
			</div>
			<div className="flex flex-wrap items-center gap-3 ml-2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
				{seriesKeys.map((key) => (
					<div key={key} className="flex items-center gap-1.5">
						<span
							className="w-3 h-3 rounded-full"
							style={{
								backgroundColor: colorOf(key),
								opacity: hiddenLines[key] ? 0.3 : 1,
							}}
						/>
						<span className={cn(hiddenLines[key] && "opacity-40 grayscale")}>
							{key === PORTFOLIO_KEY ? "Twój Portfel" : key}
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
							onToggle={disabled ? undefined : onRangeChange}
						/>
					</div>
				);
			})
		: null;

	return (
		<ChartCardLayout
			title={titleInside || "Benchmark Portfela"}
			subtitle={
				subtitleInside ||
				"Stopa zwrotu Twojego portfela na tle głównych indeksów rynkowych"
			}
			icon={TrendingUp}
			headerExtra={headerExtra}
			topOverlay={overlay}
			footer={footerRanges}
		>
			<div className="w-full flex-1 min-h-0 border-b border-t-border-subtle pb-2 relative h-full">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={data}
						margin={{
							top: 40,
							right: isMobile ? 30 : 40,
							left: 20,
							bottom: 0,
						}}
					>
						<defs>
							<filter
								id="lineGlow"
								x="-20%"
								y="-20%"
								width="140%"
								height="140%"
							>
								<feGaussianBlur stdDeviation="3" result="blur" />
								<feMerge>
									<feMergeNode in="blur" />
									<feMergeNode in="SourceGraphic" />
								</feMerge>
							</filter>
						</defs>

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
								`${val > 0 ? "+" : ""}${Math.round(val)}%`
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
							content={<BenchmarkTooltip hiddenLines={hiddenLines} />}
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

						{userIndices.map((key) =>
							hiddenLines[key] ? null : (
								<Line
									key={`line-${key}`}
									type="monotone"
									dataKey={key}
									name={key}
									stroke={colorOf(key)}
									strokeWidth={2.5}
									dot={false}
									activeDot={{ r: 4, strokeWidth: 0 }}
									opacity={0.8}
									pointerEvents="none"
									isAnimationActive
									animationDuration={800}
								/>
							),
						)}

						<Line
							type="monotone"
							dataKey={PORTFOLIO_KEY}
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
							pointerEvents="none"
							isAnimationActive
							animationDuration={800}
						/>

						<EndPills
							pills={pills}
							count={brush.end - brush.start + 1}
							domain={yDomain}
							mode="PERCENTAGE"
							currencySymbol="%"
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
}

function BenchmarkTooltip({
	active,
	payload,
	label,
	hiddenLines,
}: BenchmarkTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;

	const sortedPayload = [...payload]
		.filter((entry) => !(hiddenLines && hiddenLines[entry.dataKey]))
		.sort((a, b) => b.value - a.value);

	const mainEntry = sortedPayload.find((e) => e.dataKey === PORTFOLIO_KEY);
	const isMainPositive = mainEntry ? mainEntry.value >= 0 : true;

	return (
		<div className="bg-t-bg-panel/95 backdrop-blur-md border border-t-border rounded-xl p-4 shadow-xl min-w-[240px] max-w-[280px] relative overflow-hidden">
			<div
				className={cn(
					"absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r",
					isMainPositive
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
					const isPortfolio = entry.dataKey === PORTFOLIO_KEY;
					return (
						<div
							key={index}
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
										"text-xs",
										isPortfolio
											? "font-bold text-t-text-primary"
											: "font-medium text-t-text-secondary",
									)}
								>
									{entry.name}
								</span>
							</div>
							<span
								className={cn(
									"text-sm font-bold tabular-nums",
									isPositive ? "text-emerald-500" : "text-rose-500",
								)}
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

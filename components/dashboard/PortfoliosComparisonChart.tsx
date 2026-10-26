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
import { Camera, Maximize2, Minimize2, WalletCards } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { APP_NAME } from "@/lib/constants";
import { ChartContainer } from "../shared/ChartContainer";
import { FilterBadge } from "../shared/FilterBadge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { toPng } from "html-to-image";
import { toast } from "sonner";
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
}: PortfoliosComparisonChartProps) {
	const chartRef = useRef<HTMLDivElement>(null);
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
	const [prevActiveIds, setPrevActiveIds] = useState<string>("");
	const [isExpanded, setIsExpanded] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

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

	const toggleLine = (dataKey: string) => {
		setHiddenLines((prev) => ({
			...prev,
			[dataKey]: !prev[dataKey],
		}));
	};

	const lastDataIndex = useMemo(() => {
		if (!data || data.length === 0) return -1;
		return data.length - 1;
	}, [data]);

	const handleDownload = async () => {
		if (!chartRef.current) return;
		const toastId = toast.loading("Generowanie zrzutu ekranu...");
		try {
			const bgColor = document.documentElement.classList.contains("dark")
				? "#0f172a"
				: "#ffffff";
			const dataUrl = await toPng(chartRef.current, {
				cacheBust: true,
				backgroundColor: bgColor,
				pixelRatio: 2,
				filter: (node) => {
					if (node?.classList?.contains("recharts-brush")) return false;
					return true;
				},
			});
			const link = document.createElement("a");
			link.download = `InvestGuard-Porownanie-${format(new Date(), "yyyy-MM-dd")}.png`;
			link.href = dataUrl;
			link.click();
			toast.success("Wykres został zapisany jako zdjęcie.", { id: toastId });
		} catch (err) {
			console.error(err);
			toast.error("Błąd generowania obrazu.", { id: toastId });
		}
	};

	if (!data || data.length === 0 || portfolios.length === 0) {
		return (
			<div className="flex items-center justify-center h-full min-h-[300px] opacity-60">
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

	const CustomizedLabel = (props: any) => {
		const { x, y, value, index, color } = props;

		if (index !== lastDataIndex || value == null) return null;

		const isPercentage = chartMode === "PERCENTAGE";
		const displayValue = isPercentage
			? `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
			: `${new Intl.NumberFormat("pl-PL", { notation: "compact", maximumFractionDigits: 1 }).format(convertPLN(value))} ${currencySymbol}`;
		// 🚀 ZMIANA: Dynamiczna szerokość dopasowana do ilości znaków w tekście + margines bezpieczeństwa
		const rectWidth = Math.max(
			isPercentage ? 60 : 80,
			displayValue.length * 7 + 16,
		);
		const rectHeight = 22;

		return (
			<g style={{ outline: "none" }}>
				<line
					x1={x}
					y1={y}
					x2={x - 12}
					y2={y}
					stroke={color}
					strokeWidth={1.5}
					strokeDasharray="2 2"
				/>
				<rect
					x={x - 12 - rectWidth}
					y={y - rectHeight / 2}
					width={rectWidth}
					height={rectHeight}
					rx={6}
					fill={color}
				/>
				<text
					x={x - 12 - rectWidth / 2}
					y={y + 3.5}
					textAnchor="middle"
					fill="#fff"
					fontSize={10}
					fontWeight="bold"
				>
					{displayValue}
				</text>
				<circle
					cx={x}
					cy={y}
					r={4}
					fill={color}
					stroke="var(--t-bg-panel)"
					strokeWidth={2}
				/>
			</g>
		);
	};

	const renderControls = () => (
		<div className="flex flex-col lg:flex-row lg:justify-between lg:items-start z-20 mb-2 sm:mb-4 w-full gap-3">
			<div className="flex flex-wrap items-center gap-3">
				<div
					className={cn(
						"flex items-center gap-1.5 rounded-full border px-2 sm:px-2.5 py-1 bg-emerald-500/10 border-emerald-500/20",
					)}
				>
					<span
						className={cn(
							"text-[11px] font-bold tabular-nums text-emerald-500",
						)}
					>
						<span className="text-t-text-tertiary mr-1 font-medium">
							STRAT:
						</span>
						VS
					</span>
				</div>
				<div className="hidden md:flex items-center gap-3 ml-2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
					{portfolios.map((p) => {
						const isHidden = hiddenLines[p.id];
						const themeColor =
							THEME_COLORS[p.colorTheme || "blue"] || THEME_COLORS.blue;
						return (
							<div
								key={p.id}
								// onClick={() => toggleLine(p.id)}
								className="flex items-center gap-1.5 transition-all duration-300  "
								// className={`flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
								// 	isHidden
								// 		? "opacity-40 grayscale"
								// 		: "opacity-100 hover:opacity-80 hover:scale-105"
								// }`}
							>
								<span
									className="w-3 h-3 rounded-full"
									style={{
										backgroundColor: themeColor,
										opacity: isHidden ? 0.3 : 1,
									}}
								/>
								{p.name}
							</div>
						);
					})}
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2">
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
				<div className="w-px h-5 bg-t-border mx-1 hidden sm:block" />
				<div className="flex items-center gap-1">
					<button
						onClick={handleDownload}
						className="flex items-center gap-1.5 px-1 xl:px-3 py-1 xl:py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border hover:cursor-pointer text-slate-400 border-slate-700/60 hover:text-slate-600 hover:border-slate-400"
					>
						<Camera className="w-4 h-4" />
					</button>
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className={cn(
							"flex items-center gap-1.5 px-1 xl:px-3 py-1 xl:py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border hover:cursor-pointer",
							isExpanded
								? "bg-theme-soft text-theme-primary border-theme-border shadow-sm hover:opacity-80 brightness-75"
								: "text-slate-400 border-slate-700/60 hover:text-slate-600 hover:border-slate-400",
						)}
						title={isExpanded ? "Zwiń wykres" : "Powiększ wykres"}
					>
						{isExpanded ? (
							<Minimize2 className="w-4 h-4" />
						) : (
							<Maximize2 className="w-4 h-4" />
						)}
					</button>
				</div>
			</div>
		</div>
	);

	const chartContent = (
		<ChartContainer className="h-full min-h-0 w-full flex-1 relative flex flex-col pt-4">
			{(titleInside || subtitleInside) && (
				<div className="absolute top-2 left-2 z-20 pointer-events-none max-w-md bg-t-bg-panel/70 p-2 rounded-lg">
					{titleInside && (
						<h3 className="text-sm font-bold text-t-text-primary">
							{titleInside}
						</h3>
					)}
					{subtitleInside && (
						<p className="text-[10px] text-t-text-tertiary mt-1 leading-tight whitespace-pre-wrap">
							{subtitleInside}
						</p>
					)}
				</div>
			)}
			<div className="absolute -bottom-20 right-4 pointer-events-none z-0 opacity-15 dark:opacity-10">
				<div className="flex items-center gap-2 grayscale">
					<div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center">
						<Image
							src="/logo.svg"
							alt="Logo"
							width={32}
							height={32}
							className="block dark:hidden object-contain"
							style={{ width: "auto", height: "auto" }}
						/>
						<Image
							src="/logo-light.svg"
							alt="Logo"
							width={32}
							height={32}
							className="hidden dark:block object-contain"
							style={{ width: "auto", height: "auto" }}
						/>
					</div>
					<span className="text-xl font-black tracking-tighter hidden lg:inline-block transition-colors text-t-text-primary">
						{APP_NAME}.
					</span>
				</div>
			</div>

			<div className="relative z-10 h-full w-full [&_*:focus]:outline-none flex flex-col">
				<div className="w-full flex-1 min-h-0 border-b border-t-border-subtle pb-2 relative">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart
							data={data}
							syncId="portfolioSyncComparison"
							margin={{
								top: 40,
								right: isMobile ? 10 : 20,
								left: 25,
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
								stroke="var(--t-text-tertiary)"
								fill="var(--theme-border)"
								tickFormatter={(val) =>
									new Date(val).toLocaleDateString("pl-PL", {
										month: "short",
										year: "2-digit",
									})
								}
							/>
							{portfolios.map((p) => {
								const themeColor =
									THEME_COLORS[p.colorTheme || "blue"] || THEME_COLORS.blue;

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
											hide={hiddenLines[p.id]}
											pointerEvents="none"
											isAnimationActive={true}
											animationDuration={800}
											label={<CustomizedLabel color={themeColor} />}
										/>
									</React.Fragment>
								);
							})}
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</div>
		</ChartContainer>
	);

	if (isExpanded) {
		return (
			<div className="fixed inset-0 z-[100] bg-t-bg-base/95 backdrop-blur-xl p-6 md:p-12 flex flex-col animate-in fade-in duration-200">
				<div
					className="pointer-events-none absolute inset-0 opacity-40"
					style={{
						background:
							"radial-gradient(circle at 15% 10%, var(--theme-soft), transparent 45%)",
					}}
				/>
				<div className="relative flex justify-between items-center mb-6">
					<div className="flex items-start gap-3 flex-col sm:flex-row">
						<div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hidden sm:block">
							<WalletCards className="w-5 h-5 text-blue-500" />
						</div>
						<div>
							<h3 className="text-xl sm:text-2xl font-bold text-t-text-primary tracking-tight">
								Wyścig Portfeli
							</h3>
							<p className="text-xs sm:text-sm text-t-text-secondary">
								Szczegółowe porównanie strategii inwestycyjnych
							</p>
						</div>
					</div>
					{renderControls()}
				</div>
				<div
					ref={chartRef}
					className="relative flex-1 min-h-0 bg-t-bg-panel border border-t-border rounded-2xl p-4 shadow-xl flex flex-col"
				>
					<div className="flex-1 w-full bg-t-bg-panel rounded-lg pb-2 pt-2 relative">
						{chartContent}
					</div>
					{onRangeChange && (
						<div className="flex items-center justify-center sm:justify-start gap-1.5 mt-3 pt-3 border-t border-t-border overflow-x-auto pb-1">
							{TIME_RANGES.map((range) => (
								<div
									key={range}
									className={cn(
										!activeRange && "opacity-40 grayscale pointer-events-none",
									)}
								>
									<FilterBadge
										id={range}
										label={range}
										isSelected={activeRange === range}
										onToggle={onRangeChange}
									/>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div
			ref={chartRef}
			className="relative w-full h-full flex flex-col group bg-t-bg-panel p-2 rounded-xl"
		>
			{renderControls()}
			<div className="flex-1 w-full min-h-0 relative z-10 bg-t-bg-panel rounded-lg pt-2 pb-2 pr-2">
				{chartContent}
			</div>
			{onRangeChange && (
				<div className="flex items-center justify-center sm:justify-start gap-1.5 mt-3 pt-3 border-t border-t-border overflow-x-auto pb-1">
					{TIME_RANGES.map((range) => (
						<div
							key={range}
							className={cn(
								!activeRange && "opacity-40 grayscale pointer-events-none",
							)}
						>
							<FilterBadge
								id={range}
								label={range}
								isSelected={activeRange === range}
								onToggle={onRangeChange}
							/>
						</div>
					))}
				</div>
			)}
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
			<div className="bg-t-bg-panel/95 backdrop-blur-md border border-t-border rounded-xl p-4 shadow-xl min-w-55 relative overflow-hidden">
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

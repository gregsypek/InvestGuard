"use client";

import {
	Area,
	AreaChart,
	Brush,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	ResponsiveContainer,
	Scatter,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Camera,
	ChevronLeft,
	ChevronRight,
	Maximize2,
	Minimize2,
	Wallet2,
} from "lucide-react";
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

export interface ChartDataPoint {
	date: string;
	value: number;
	invested: number;
}

export interface TransactionData {
	id?: string;
	type: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAWAL" | string;
	date?: string;
	executedAt?: string | Date | null;
	ticker?: string | null;
	assetName?: string | null;
	executedValue?: number | null;
	[key: string]: unknown;
}

export interface MergedDataPoint extends ChartDataPoint {
	buyEvent: number | null;
	sellEvent: number | null;
	multiEvent: number | null;
	txDetails: TransactionData[] | null;
	lastValue: number | null;
	drawdown: number;
}

interface PortfolioChartProps {
	data: ChartDataPoint[];
	transactions?: TransactionData[];
	mode?: "VALUE" | "PERCENTAGE";
	activeRange?: string;
	onRangeChange?: (range: string) => void;
	setMode?: (mode: "VALUE" | "PERCENTAGE") => void;
	dataMode?: "REAL" | "SIMULATED";
	setDataMode?: (mode: "REAL" | "SIMULATED") => void;
	showBrush?: boolean;
	titleInside?: string;
	subtitleInside?: string;
}

const TIME_RANGES = ["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX"];

const getEndOfDayTime = (dateStr: string) => {
	const [year, month, day] = dateStr.split("-").map(Number);
	return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
};

export function PortfolioChart({
	data,
	transactions = [],
	mode = "VALUE",
	activeRange = "1M",
	onRangeChange,
	setMode,
	dataMode,
	setDataMode,
	showBrush = true,
	titleInside,
	subtitleInside,
}: PortfolioChartProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const chartRef = useRef<HTMLDivElement>(null);
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 640);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// NOWOŚĆ: html-to-image rozwiązuje problem z kolorami lab()
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
					// Ukryj brusha na screenie
					if (node?.classList?.contains("recharts-brush")) return false;
					return true;
				},
			});
			const link = document.createElement("a");
			link.download = `InvestGuard-${format(new Date(), "yyyy-MM-dd")}.png`;
			link.href = dataUrl;
			link.click();
			toast.success("Wykres został zapisany jako zdjęcie.", { id: toastId });
		} catch (err) {
			console.error("Błąd generowania obrazu:", err);
			toast.error("Nie udało się utworzyć obrazu. Spróbuj ponownie.", {
				id: toastId,
			});
		}
	};

	const mergedData: MergedDataPoint[] = useMemo(() => {
		if (!data || data.length === 0) return [];

		const txsWithTime = transactions.map((t) => {
			const txDateStr = t.executedAt || t.date;
			return {
				...t,
				parsedTime: txDateStr ? new Date(txDateStr).getTime() : 0,
			};
		});

		let maxPeak = 0;

		return data.map((point, index) => {
			const currentPointTime = getEndOfDayTime(point.date);
			let prevPointTime =
				index > 0
					? getEndOfDayTime(data[index - 1].date)
					: new Date(
							point.date.split("-").map(Number)[0],
							point.date.split("-").map(Number)[1] - 1,
							point.date.split("-").map(Number)[2],
							0,
							0,
							0,
							0,
						).getTime() - 1;

			const periodTxs = txsWithTime.filter(
				(t) => t.parsedTime > prevPointTime && t.parsedTime <= currentPointTime,
			);
			const isMulti = periodTxs.length > 1;
			const hasBuy =
				!isMulti &&
				periodTxs.some((t) => t.type === "BUY" || t.type === "DEPOSIT");
			const hasSell =
				!isMulti &&
				periodTxs.some((t) => t.type === "SELL" || t.type === "WITHDRAWAL");

			// Kalkulacja Drawdown (Obsunięcia)
			if (point.value > maxPeak) maxPeak = point.value;
			const drawdown =
				maxPeak > 0 ? ((point.value - maxPeak) / maxPeak) * 100 : 0;

			return {
				...point,
				buyEvent: hasBuy ? point.value : null,
				sellEvent: hasSell ? point.value : null,
				multiEvent: isMulti ? point.value : null, // Wiele transakcji
				txDetails: periodTxs.length > 0 ? periodTxs : null,
				lastValue: index === data.length - 1 ? point.value : null,
				drawdown,
			};
		});
	}, [data, transactions]);

	if (!mergedData || mergedData.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-2 opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
					Brak danych historycznych
				</p>
			</div>
		);
	}

	const lastPoint = mergedData[mergedData.length - 1];
	let isPositive = true;
	let trendValue = "";
	if (mode === "PERCENTAGE") {
		isPositive = lastPoint.value >= 0;
		trendValue = `${isPositive ? "+" : ""}${lastPoint.value.toFixed(2)}%`;
	} else {
		const netProfit = lastPoint.value - lastPoint.invested;
		isPositive = netProfit >= 0;
		const pct =
			lastPoint.invested > 0 ? (netProfit / lastPoint.invested) * 100 : 0;
		trendValue = `${isPositive ? "+" : ""}${pct.toFixed(2)}%`;
	}

	const trendBadge = (
		<div className="flex flex-wrap items-center gap-3">
			<div
				className={cn(
					"flex items-center gap-1.5 rounded-full border px-2.5 py-1",
					isPositive
						? "bg-emerald-500/10 border-emerald-500/20"
						: "bg-rose-500/10 border-rose-500/20",
				)}
			>
				<span
					className={cn(
						"text-[11px] font-bold tabular-nums",
						isPositive ? "text-emerald-500" : "text-rose-500",
					)}
				>
					<span className="text-t-text-tertiary mr-1 font-medium">ROI:</span>
					{trendValue}
				</span>
			</div>
			{transactions.length > 0 && (
				<div className="hidden md:flex items-center gap-3 ml-2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
					<div className="flex items-center gap-1.5">
						<span className="w-4 h-4 flex items-center justify-center rounded-full bg-[#10b981] border-white border-2 text-[9px] font-bold text-white">
							K
						</span>{" "}
						Wpłata
					</div>
					<div className="flex items-center gap-1.5">
						<span className="w-4 h-4 flex items-center justify-center rounded-full bg-[#ef4444] border-white border-2 text-[9px] font-bold text-white">
							S
						</span>{" "}
						Wypłata
					</div>
					<div className="flex items-center gap-1.5">
						<span className="w-4 h-4 flex items-center justify-center rounded-full bg-[#9333ea] border-white border-2 text-[9px] font-bold text-white">
							M
						</span>{" "}
						Wiele transakcji
					</div>
				</div>
			)}
		</div>
	);

	const EventLabel = (props: any) => {
		const { cx, cy, type } = props;
		if (!cx || !cy) return null;
		let color =
			type === "BUY" ? "#10b981" : type === "SELL" ? "#ef4444" : "#9333ea";
		let letter = type === "BUY" ? "K" : type === "SELL" ? "S" : "M";
		return (
			<g style={{ outline: "none" }} className="cursor-pointer">
				<circle
					cx={cx}
					cy={cy}
					r={7}
					fill={color}
					stroke="var(--t-bg-panel)"
					strokeWidth={1.5}
				/>
				<text
					x={cx}
					y={cy}
					dy={3}
					textAnchor="middle"
					fill="#fff"
					fontSize={9}
					fontWeight="bold"
				>
					{letter}
				</text>
			</g>
		);
	};

	const LastValuePill = (props: any) => {
		const { cx, cy, value } = props;
		if (!cx || !cy || value == null) return null;
		const isPercentage = mode === "PERCENTAGE";
		const displayValue = isPercentage
			? `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
			: `${new Intl.NumberFormat("pl-PL", { notation: "compact", maximumFractionDigits: 1 }).format(convertPLN(value))} ${currencySymbol}`;
		const rectWidth = isPercentage ? 50 : 65;
		const rectHeight = 22;
		return (
			<g style={{ outline: "none" }}>
				<line
					x1={cx}
					y1={cy}
					x2={cx - 12}
					y2={cy}
					stroke="var(--theme-primary)"
					strokeWidth={1.5}
					strokeDasharray="2 2"
				/>
				<rect
					x={cx - 12 - rectWidth}
					y={cy - rectHeight / 2}
					width={rectWidth}
					height={rectHeight}
					rx={6}
					fill="var(--theme-primary)"
				/>
				<text
					x={cx - 12 - rectWidth / 2}
					y={cy + 3.5}
					textAnchor="middle"
					fill="#fff"
					fontSize={10}
					fontWeight="bold"
				>
					{displayValue}
				</text>
				<circle
					cx={cx}
					cy={cy}
					r={4}
					fill="var(--theme-primary)"
					stroke="var(--t-bg-panel)"
					strokeWidth={2}
				/>
			</g>
		);
	};

	const chartContent = (
		<ChartContainer className="h-full min-h-0 w-full flex-1 relative flex flex-col">
			{(titleInside || subtitleInside) && (
				<div className="absolute top-2 left-2 z-20 pointer-events-none max-w-md bg-t-bg-panel/50 backdrop-blur-sm p-2 rounded-lg">
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
			<div className="absolute bottom-1 right-2 pointer-events-none z-0 opacity-15 dark:opacity-10">
				<div className="flex items-center gap-2 grayscale">
					<div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center">
						<Image
							src="/logo.svg"
							alt="Logo"
							width={24}
							height={24}
							className="block dark:hidden object-contain"
							style={{ width: "auto", height: "auto" }}
						/>
						<Image
							src="/logo-light.svg"
							alt="Logo"
							width={24}
							height={24}
							className="hidden dark:block object-contain"
							style={{ width: "auto", height: "auto" }}
						/>
					</div>
					<span className="text-lg font-black tracking-tighter hidden sm:inline-block transition-colors text-t-text-primary">
						{APP_NAME}.
					</span>
				</div>
			</div>

			<div className="relative z-10 h-full w-full [&_*:focus]:outline-none flex flex-col">
				{/* GŁÓWNY WYKRES (70% wysokości) */}
				<div className="w-full h-[70%] border-b border-t-border-subtle pb-2">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart
							data={mergedData}
							syncId="portfolioSync"
							margin={{
								top: 40,
								right: isMobile ? 10 : 20,
								left: 25,
								bottom: 0,
							}}
						>
							<defs>
								<filter
									id="glowBlue"
									x="-20%"
									y="-20%"
									width="140%"
									height="140%"
								>
									<feGaussianBlur stdDeviation="4" result="blur" />
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
								width={isMobile ? 45 : 60}
								domain={["auto", "auto"]}
								tickFormatter={(val) =>
									mode === "PERCENTAGE"
										? `${val > 0 ? "+" : ""}${val}%`
										: `${new Intl.NumberFormat("pl-PL", { notation: "compact", compactDisplay: "short" }).format(convertPLN(val))}`
								}
							/>
							{mode === "PERCENTAGE" && (
								<ReferenceLine y={0} stroke="var(--t-border)" strokeWidth={1} />
							)}
							{/* pointerEvents: 'auto' pozwala na klikanie w Tooltip! */}
							<Tooltip
								content={<CustomTooltip mode={mode} />}
								cursor={{ stroke: "var(--t-border-subtle)", strokeWidth: 2 }}
								wrapperStyle={{
									zIndex: 1000,
									outline: "none",
									pointerEvents: "auto",
								}}
							/>
							<Area
								type="monotone"
								dataKey="value"
								stroke="var(--theme-primary)"
								strokeWidth={2.5}
								fillOpacity={1}
								fill="transparent"
								filter="url(#glowBlue)"
								activeDot={{
									r: 6,
									fill: "var(--theme-primary)",
									stroke: "var(--t-bg-panel)",
									strokeWidth: 2,
								}}
							/>
							{mode === "VALUE" && (
								<Line
									type="stepAfter"
									dataKey="invested"
									stroke="var(--t-text-tertiary)"
									strokeWidth={2}
									strokeDasharray="5 5"
									dot={false}
									activeDot={false}
									opacity={0.6}
								/>
							)}
							{transactions.length > 0 && (
								<Scatter
									dataKey="buyEvent"
									shape={(props: any) => <EventLabel {...props} type="BUY" />}
								/>
							)}
							{transactions.length > 0 && (
								<Scatter
									dataKey="sellEvent"
									shape={(props: any) => <EventLabel {...props} type="SELL" />}
								/>
							)}
							{transactions.length > 0 && (
								<Scatter
									dataKey="multiEvent"
									shape={(props: any) => <EventLabel {...props} type="MULTI" />}
								/>
							)}
							<Scatter
								dataKey="lastValue"
								shape={(props: any) => <LastValuePill {...props} />}
								isAnimationActive={false}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>

				{/* WYKRES OBSUNIĘCIA KAPITAŁU (30% wysokości) */}
				<div className="w-full h-[30%] pt-2">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart
							data={mergedData}
							syncId="portfolioSync"
							margin={{
								top: 10,
								right: isMobile ? 10 : 20,
								left: 25,
								bottom: 20,
							}}
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
									format(new Date(val), "MMM yy", { locale: pl })
								}
								minTickGap={20}
								padding={{ left: 10, right: 10 }}
							/>
							<YAxis
								orientation="right"
								axisLine={false}
								tickLine={false}
								tick={{
									fontSize: 9,
									fill: "var(--t-text-tertiary)",
									fontWeight: 500,
								}}
								width={isMobile ? 45 : 60}
								domain={["dataMin", 0]}
								tickFormatter={(val) => `${val.toFixed(0)}%`}
							/>
							<Tooltip
								content={<CustomTooltip mode="DRAWDOWN" />}
								cursor={{ stroke: "var(--t-border-subtle)", strokeWidth: 2 }}
								wrapperStyle={{ zIndex: 1000, outline: "none" }}
							/>
							<Area
								type="monotone"
								dataKey="drawdown"
								stroke="#ef4444"
								strokeWidth={1.5}
								fill="#ef4444"
								fillOpacity={0.1}
							/>
							{showBrush && (
								<Brush
									dataKey="date"
									height={24}
									stroke="var(--t-text-tertiary)"
									fill="var(--t-bg-base)"
									tickFormatter={(val) =>
										new Date(val).toLocaleDateString("pl-PL", {
											month: "short",
											year: "2-digit",
										})
									}
								/>
							)}
						</AreaChart>
					</ResponsiveContainer>
					<div className="absolute bottom-[28%] left-8 text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary opacity-70">
						Obsunięcie kapitału (%)
					</div>
				</div>
			</div>
		</ChartContainer>
	);

	const renderControls = () => (
		<div className="flex flex-col lg:flex-row lg:justify-between lg:items-start z-20 mb-2 sm:mb-4 w-full gap-3">
			<div>{trendBadge}</div>
			<div className="flex flex-wrap items-center gap-2">
				{setMode && (
					<div className="flex items-center gap-1 border border-t-border rounded-lg p-1 shadow-sm">
						<FilterBadge
							id={currencySymbol}
							label={currencySymbol}
							isSelected={mode === "VALUE"}
							onToggle={() => setMode("VALUE")}
						/>
						<FilterBadge
							id={currencySymbol}
							label="%"
							isSelected={mode === "PERCENTAGE"}
							onToggle={() => setMode("PERCENTAGE")}
						/>
					</div>
				)}
				{setDataMode && (
					<div className="flex items-center gap-1 border border-t-border rounded-lg p-1 shadow-sm">
						<FilterBadge
							id={currencySymbol}
							label="Real"
							isSelected={dataMode === "REAL"}
							onToggle={() => setDataMode("REAL")}
						/>
						<FilterBadge
							id={currencySymbol}
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
							<Wallet2 className="w-5 h-5 text-blue-500" />
						</div>
						<div>
							<h3 className="text-xl sm:text-2xl font-bold text-t-text-primary tracking-tight">
								Szczegóły Inwestycji
							</h3>
							<p className="text-xs sm:text-sm text-t-text-secondary">
								Dokładna analiza wartości kapitału w czasie i historia
								transakcji
							</p>
						</div>
					</div>
					{renderControls()}
				</div>
				<div className="relative flex-1 min-h-0 bg-t-bg-panel border border-t-border rounded-2xl p-4 shadow-xl flex flex-col">
					<div
						ref={chartRef}
						className="flex-1 w-full bg-t-bg-panel rounded-lg pb-2 pt-2 relative"
					>
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
		<div className="relative w-full h-full flex flex-col group">
			{renderControls()}
			<div
				ref={chartRef}
				className="flex-1 w-full min-h-0 relative z-10 bg-t-bg-panel rounded-lg pt-2 pb-2 pr-2"
			>
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

// ----------------------------------------------------------------------
// INTERAKTYWNY TOOLTIP Z PAGINACJĄ
// ----------------------------------------------------------------------
interface TooltipPayloadItem {
	dataKey: string;
	value: number;
	payload: MergedDataPoint;
}
interface CustomTooltipProps {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	label?: string;
	mode: "VALUE" | "PERCENTAGE" | "DRAWDOWN";
}

function CustomTooltip({ active, payload, label, mode }: CustomTooltipProps) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	// Stan stronnicowania Tooltipa
	const [txPage, setTxPage] = useState(0);

	// Reset strony gdy najeżdżamy na nową datę
	useEffect(() => {
		setTxPage(0);
	}, [label]);

	if (active && payload && payload.length && label) {
		const dataObj = payload[0].payload;

		if (mode === "DRAWDOWN") {
			return (
				<div className="bg-t-bg-panel/95 backdrop-blur-md border border-t-border rounded-xl p-3 shadow-xl">
					<p className="text-[9px] font-bold text-t-text-tertiary uppercase tracking-widest mb-1.5">
						{format(new Date(label), "dd MMM yyyy", { locale: pl })}
					</p>
					<div className="flex items-center gap-2">
						<span className="text-xs text-t-text-secondary">
							Obsunięcie (MaxDD):
						</span>
						<span className="text-sm font-bold text-rose-500">
							{dataObj.drawdown.toFixed(2)}%
						</span>
					</div>
				</div>
			);
		}

		const value = payload.find((p) => p.dataKey === "value")?.value || 0;
		const invested = payload.find((p) => p.dataKey === "invested")?.value || 0;
		const formatVal = (val: number) =>
			mode === "PERCENTAGE"
				? `${val > 0 ? "+" : ""}${val.toFixed(2)}%`
				: `${formatCurrency(convertPLN(val))} ${currencySymbol}`;
		const isProfit = mode === "PERCENTAGE" ? value >= 0 : value >= invested;
		const difference = value - invested;

		const txs = dataObj.txDetails || [];
		const totalTxs = txs.length;

		return (
			<div className="bg-t-bg-panel/95 backdrop-blur-md border border-t-border rounded-xl p-4 shadow-xl max-w-[280px] pointer-events-auto">
				<div
					className={`absolute top-0 left-0 right-0 h-[2px] ${isProfit ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-rose-400 to-rose-600"}`}
				/>
				<p className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-3 border-b border-t-border pb-1.5">
					{format(new Date(label), "dd MMMM yyyy", { locale: pl })}
				</p>
				<div className="space-y-2.5">
					<div className="flex justify-between items-center text-xs gap-4">
						<div className="flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
							<span className="text-t-text-secondary">
								{mode === "PERCENTAGE" ? "Zwrot:" : "Wycena:"}
							</span>
						</div>
						<span
							className={
								mode === "PERCENTAGE" && isProfit
									? "font-bold text-emerald-500"
									: mode === "PERCENTAGE" && !isProfit
										? "font-bold text-rose-500"
										: "font-bold text-t-text-primary"
							}
						>
							{formatVal(value)}
						</span>
					</div>
					{mode === "VALUE" && (
						<>
							<div className="flex justify-between items-center text-xs gap-4">
								<div className="flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-t-text-tertiary" />
									<span className="text-t-text-secondary">Zainwestowano:</span>
								</div>
								<span className="font-bold text-t-text-primary">
									{formatVal(invested)}
								</span>
							</div>
							<div className="pt-2 mt-2 border-t border-t-border-subtle flex justify-between items-center">
								<span className="text-[11px] font-bold text-t-text-tertiary uppercase">
									Zysk / Strata:
								</span>
								<span
									className={`text-sm font-black tabular-nums ${isProfit ? "text-emerald-500" : "text-rose-500"}`}
								>
									{isProfit ? "+" : ""}
									{formatVal(difference)}
								</span>
							</div>
						</>
					)}
				</div>

				{/* 🚀 ZMIANA: Paginowany Tooltip dla transakcji wzorowany na Atlas ETF */}
				{totalTxs > 0 && (
					<div className="mt-3 pt-3 border-t border-t-border border-dashed">
						<div className="flex items-center justify-between mb-2">
							<p className="text-[9px] font-black text-t-text-tertiary uppercase tracking-widest">
								{totalTxs > 1 ? "Wiele zdarzeń" : "Zdarzenie"}
							</p>
							{totalTxs > 1 && (
								<div className="flex items-center gap-1.5 text-xs text-t-text-secondary">
									<button
										onClick={(e) => {
											e.stopPropagation();
											setTxPage(Math.max(0, txPage - 1));
										}}
										disabled={txPage === 0}
										className="hover:text-t-text-primary disabled:opacity-30 p-0.5"
									>
										<ChevronLeft className="w-3.5 h-3.5" />
									</button>
									<span className="text-[10px] font-mono">
										{txPage + 1} / {totalTxs}
									</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											setTxPage(Math.min(totalTxs - 1, txPage + 1));
										}}
										disabled={txPage === totalTxs - 1}
										className="hover:text-t-text-primary disabled:opacity-30 p-0.5"
									>
										<ChevronRight className="w-3.5 h-3.5" />
									</button>
								</div>
							)}
						</div>

						{/* Pokaż tylko jedną (aktywną) transakcję */}
						{(() => {
							const tx = txs[txPage];
							const isBuy = tx.type === "BUY" || tx.type === "DEPOSIT";
							return (
								<div className="flex flex-col gap-1.5 bg-t-bg-base/50 p-2 rounded-lg border border-t-border-subtle">
									<div className="flex justify-between items-center text-xs">
										<span className="text-t-text-tertiary">Typ</span>
										<span
											className={
												isBuy
													? "text-emerald-500 font-bold"
													: "text-rose-500 font-bold"
											}
										>
											{isBuy ? "Wpłata / Kupno" : "Wypłata / Sprzedaż"}
										</span>
									</div>
									<div className="flex justify-between items-center text-xs">
										<span className="text-t-text-tertiary">Walor</span>
										<span
											className="font-medium text-t-text-primary max-w-[120px] truncate"
											title={tx.assetName || tx.ticker || ""}
										>
											{tx.assetName || tx.ticker || "-"}
										</span>
									</div>
									<div className="flex justify-between items-center text-xs">
										<span className="text-t-text-tertiary">Kwota</span>
										<span className="font-mono text-t-text-primary">
											{formatCurrency(
												convertPLN(Math.abs(tx.executedValue || 0)),
											)}{" "}
											{currencySymbol}
										</span>
									</div>
								</div>
							);
						})()}
					</div>
				)}
			</div>
		);
	}
	return null;
}

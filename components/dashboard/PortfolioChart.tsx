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
import { ChartCardLayout, SingleValuePill } from "../shared/ChartCardLayout";
import { ChevronLeft, ChevronRight, Wallet2, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { FilterBadge } from "../shared/FilterBadge";
import { PortfolioWithAssets } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
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
	portfolios?: PortfolioWithAssets[];
	onPortfolioToggle?: (id: string) => void;
	activeIds?: string[];
	// 🚀 Added prop: Function to check if range should be disabled
	isRangeDisabled?: (range: string) => boolean;
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
	portfolios,
	onPortfolioToggle,
	activeIds = [],
	isRangeDisabled,
}: PortfolioChartProps) {
	const [isMobile, setIsMobile] = useState(false);
	const [clickedData, setClickedData] = useState<MergedDataPoint | null>(null);
	const [txPage, setTxPage] = useState(0);
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	const [brushIndex, setBrushIndex] = useState({
		start: 0,
		end: data && data.length > 0 ? data.length - 1 : 0,
	});

	// 🔥 BEZPIECZNY WZORZEC REACT: Aktualizacja stanu podczas renderowania
	// Włączamy 'activeRange' do klucza, by mieć pewność, że kliknięcie w przycisk ZAWSZE resetuje brusha
	const currentDataKey =
		data && data.length > 0
			? `${activeRange}-${data.length}-${data[0].date}`
			: `empty-${activeRange}`;

	const [prevDataKey, setPrevDataKey] = useState(currentDataKey);

	if (currentDataKey !== prevDataKey) {
		setPrevDataKey(currentDataKey);
		setBrushIndex({
			start: 0,
			end: data && data.length > 0 ? data.length - 1 : 0,
		});
	}
	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 640);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

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
			const prevPointTime =
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

			if (point.value > maxPeak) maxPeak = point.value;
			const drawdown =
				maxPeak > 0 ? ((point.value - maxPeak) / maxPeak) * 100 : 0;

			return {
				...point,
				buyEvent: hasBuy ? point.value : null,
				sellEvent: hasSell ? point.value : null,
				multiEvent: isMulti ? point.value : null,
				txDetails: periodTxs.length > 0 ? periodTxs : null,
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

	// 🚀 BADGES TO BE PASSED AS headerExtra
	const trendBadge = (
		<div className="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3">
			<div
				className={cn(
					"flex items-center gap-1.5 rounded-full border px-1.5 sm:px-2.5 sm:py-1",
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
				<div className="flex items-center gap-3 ml-2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
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
							W
						</span>{" "}
						Wiele <span className="hidden lg:inline">transakcji</span>
					</div>
				</div>
			)}
		</div>
	);

	// 🚀 BUTTONS TO BE PASSED AS controls
	const topControls = (
		<>
			{setMode && (
				<div className="flex items-center gap-1">
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
				<div className="flex items-center gap-1">
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
		</>
	);

	// 🚀 PORTFOLIOS OVERLAY TO BE PASSED AS topOverlay
	const portfoliosOverlay = portfolios?.map((p) => {
		const isActive = activeIds.includes("ALL") || activeIds.includes(p.id);
		return (
			<FilterBadge
				key={p.id}
				id={p.id}
				label={p.name}
				isSelected={isActive}
				onToggle={() => onPortfolioToggle?.(p.id)}
			/>
		);
	});

	const EventLabel = (props: any) => {
		const { cx, cy, type, payload } = props;
		if (!cx || !cy) return null;
		const color =
			type === "BUY" ? "#10b981" : type === "SELL" ? "#ef4444" : "#9333ea";
		const letter = type === "BUY" ? "K" : type === "SELL" ? "S" : "W";
		return (
			<g
				style={{ outline: "none" }}
				className="cursor-pointer hover:opacity-80 transition-opacity"
				onClick={(e) => {
					e.stopPropagation();
					if (payload && payload.txDetails && payload.txDetails.length > 0) {
						setClickedData(payload);
						setTxPage(0);
					}
				}}
			>
				<circle
					cx={cx}
					cy={cy}
					r={14}
					fill="rgba(255, 255, 255, 0)"
					pointerEvents="all"
				/>
				<circle
					cx={cx}
					cy={cy}
					r={10}
					fill={color}
					stroke="var(--t-bg-panel)"
					strokeWidth={2}
					pointerEvents="none"
				/>
				<text
					x={cx}
					y={cy}
					dy={3.5}
					textAnchor="middle"
					fill="#fff"
					fontSize={10}
					fontWeight="bold"
					pointerEvents="none"
				>
					{letter}
				</text>
			</g>
		);
	};

	// 🚀 DISABLED LOGIC IN FOOTER
	const footerRanges = onRangeChange
		? TIME_RANGES.map((range) => {
				// Disable button if in REAL mode and range has no data
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
							// 🚀 Fix: Forward the badge 'id' (which holds the range) safely without passing undefined
							onToggle={disabled ? () => {} : (id) => onRangeChange?.(id)}
						/>
					</div>
				);
			})
		: null;

	return (
		<ChartCardLayout
			title={titleInside}
			subtitle={subtitleInside}
			icon={Wallet2}
			controls={topControls}
			headerExtra={trendBadge}
			topOverlay={portfoliosOverlay}
			footer={footerRanges}
		>
			<div className="w-full flex-1 min-h-0 border-b border-t-border-subtle pb-2 relative h-full">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={mergedData}
						syncId="portfolioSync"
						margin={{ top: 40, right: isMobile ? 15 : 20, left: 20, bottom: 0 }}
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
							width={isMobile ? 15 : 20}
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
						<Tooltip
							content={<CustomTooltip mode={mode} />}
							offset={15}
							cursor={{ stroke: "var(--t-border-subtle)", strokeWidth: 2 }}
							wrapperStyle={{
								zIndex: 1000,
								outline: "none",
								pointerEvents: "none",
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
							pointerEvents="none"
							activeDot={{
								r: 6,
								fill: "var(--theme-primary)",
								stroke: "var(--t-bg-panel)",
								strokeWidth: 2,
								pointerEvents: "none",
							}}
							label={(props: any) => (
								<SingleValuePill
									{...props}
									customProps={{
										brushEndIndex: brushIndex.end,
										mode: mode,
										currencySymbol: currencySymbol,
										convertPLN: convertPLN,
									}}
								/>
							)}
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
								pointerEvents="none"
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
					</ComposedChart>
				</ResponsiveContainer>

				{/* Blocked Modal for Transaction Details */}
				{clickedData && (
					<div
						className="absolute inset-0 z-[2000] flex items-center justify-center pointer-events-auto bg-t-bg-base/70 rounded-lg"
						onClick={() => setClickedData(null)}
					>
						<div
							className="bg-t-bg-panel border border-t-border shadow-2xl rounded-2xl p-5 w-full max-w-[320px] animate-in zoom-in-95 fade-in duration-200"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex justify-between items-center mb-4 border-b border-t-border pb-3">
								<div className="flex items-center gap-2">
									{clickedData.txDetails && clickedData.txDetails.length > 1 ? (
										<>
											<button
												onClick={() => setTxPage(Math.max(0, txPage - 1))}
												disabled={txPage === 0}
												className="hover:text-t-text-primary disabled:opacity-30 p-1.5 bg-t-bg-base rounded-md border border-t-border-subtle transition-colors"
											>
												<ChevronLeft className="w-4 h-4" />
											</button>
											<span className="text-xs font-bold w-12 text-center">
												{txPage + 1} / {clickedData.txDetails.length}
											</span>
											<button
												onClick={() =>
													setTxPage(
														Math.min(
															(clickedData.txDetails?.length || 1) - 1,
															txPage + 1,
														),
													)
												}
												disabled={
													txPage === (clickedData.txDetails?.length || 1) - 1
												}
												className="hover:text-t-text-primary disabled:opacity-30 p-1.5 bg-t-bg-base rounded-md border border-t-border-subtle transition-colors"
											>
												<ChevronRight className="w-4 h-4" />
											</button>
										</>
									) : (
										<span className="text-[11px] font-bold text-t-text-secondary uppercase tracking-wider">
											Szczegóły zdarzenia
										</span>
									)}
								</div>
								<button
									onClick={() => setClickedData(null)}
									className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
							{clickedData.txDetails && clickedData.txDetails[txPage] && (
								<div className="space-y-3">
									<div className="flex justify-between items-center text-sm border-b border-t-border-subtle pb-2">
										<span className="text-t-text-tertiary text-xs">Data</span>
										<span className="font-bold">
											{format(new Date(clickedData.date), "dd.MM.yyyy")}
										</span>
									</div>
									<div className="flex justify-between items-center text-sm border-b border-t-border-subtle pb-2">
										<span className="text-t-text-tertiary text-xs">Typ</span>
										<span
											className={
												clickedData.txDetails[txPage].type === "BUY" ||
												clickedData.txDetails[txPage].type === "DEPOSIT"
													? "text-emerald-500 font-bold"
													: "text-rose-500 font-bold"
											}
										>
											{clickedData.txDetails[txPage].type === "BUY" ||
											clickedData.txDetails[txPage].type === "DEPOSIT"
												? "Wpłata / Kupno"
												: "Wypłata / Sprzedaż"}
										</span>
									</div>
									<div className="flex justify-between items-center text-sm border-b border-t-border-subtle pb-2">
										<span className="text-t-text-tertiary text-xs">Walor</span>
										<span
											className="font-medium truncate max-w-[150px] text-right"
											title={
												clickedData.txDetails[txPage].assetName ||
												clickedData.txDetails[txPage].ticker ||
												""
											}
										>
											{clickedData.txDetails[txPage].assetName ||
												clickedData.txDetails[txPage].ticker ||
												"-"}
										</span>
									</div>
									<div className="flex justify-between items-center text-sm">
										<span className="text-t-text-tertiary text-xs">Kwota</span>
										<span className="font-mono font-bold text-base">
											{formatCurrency(
												convertPLN(
													Math.abs(
														clickedData.txDetails[txPage].executedValue || 0,
													),
												),
											)}{" "}
											{currencySymbol}
										</span>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			<div className="w-full h-[120px] shrink-0 pt-2">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={mergedData}
						syncId="portfolioSync"
						margin={{
							top: 10,
							right: isMobile ? 15 : 20,
							left: 20,
							bottom: 35,
						}}
					>
						<CartesianGrid
							strokeDasharray="4 4"
							vertical={false}
							stroke="var(--t-border)"
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
							width={isMobile ? 15 : 20}
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
								tickFormatter={(val) =>
									new Date(val).toLocaleDateString("pl-PL", {
										month: "short",
										year: "2-digit",
									})
								}
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
					</AreaChart>
				</ResponsiveContainer>
				<div className="absolute bottom-[22%] left-8 text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary opacity-70">
					Obsunięcie kapitału (%)
				</div>
			</div>
		</ChartCardLayout>
	);
}

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
							Obsunięcie od szczytu:
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
			<div className="bg-t-bg-panel/95 backdrop-blur-md border border-t-border rounded-xl p-4 shadow-xl min-w-[260px] relative overflow-hidden">
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
				{totalTxs === 1 && (
					<div className="mt-3 pt-3 border-t border-t-border-subtle flex flex-col gap-1.5">
						<span className="text-[9px] font-black text-t-text-tertiary uppercase tracking-widest mb-1">
							Zdarzenie (Szczegóły)
						</span>
						<div className="flex justify-between items-center text-xs">
							<span className="text-t-text-tertiary">Typ</span>
							<span
								className={
									txs[0].type === "BUY" || txs[0].type === "DEPOSIT"
										? "text-emerald-500 font-bold"
										: "text-rose-500 font-bold"
								}
							>
								{txs[0].type === "BUY" || txs[0].type === "DEPOSIT"
									? "Wpłata / Kupno"
									: "Wypłata / Sprzedaż"}
							</span>
						</div>
						<div className="flex justify-between items-center text-xs">
							<span className="text-t-text-tertiary">Walor</span>
							<span
								className="font-medium truncate max-w-[120px]"
								title={txs[0].assetName || txs[0].ticker || ""}
							>
								{txs[0].assetName || txs[0].ticker || "-"}
							</span>
						</div>
						<div className="flex justify-between items-center text-xs">
							<span className="text-t-text-tertiary">Kwota</span>
							<span className="font-mono font-bold text-t-text-primary">
								{formatCurrency(
									convertPLN(Math.abs(txs[0].executedValue || 0)),
								)}{" "}
								{currencySymbol}
							</span>
						</div>
					</div>
				)}
				{totalTxs > 1 && (
					<div className="mt-3 pt-3 border-t border-t-border-subtle flex items-center justify-between mb-2">
						<span className="text-xs font-bold text-t-text-secondary">
							Wiele zdarzeń
						</span>
						<span className="text-[10px] font-bold bg-t-bg-base border border-t-border px-1.5 py-0.5 rounded">
							{totalTxs} ×
						</span>
					</div>
				)}
				{totalTxs > 1 && (
					<div className="text-center text-[9px] text-t-text-tertiary uppercase tracking-widest bg-t-bg-base/50 py-1.5 rounded font-bold">
						Kliknij w kółko W na wykresie, aby rozwinąć
					</div>
				)}
			</div>
		);
	}
	return null;
}

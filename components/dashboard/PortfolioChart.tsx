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
	X,
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
	const [clickedData, setClickedData] = useState<MergedDataPoint | null>(null);
	const [txPage, setTxPage] = useState(0);
	const chartRef = useRef<HTMLDivElement>(null);
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	// 🚀 ZARZĄDZANIE STANEM BRUSHA - Inicjalizacja bezpośrednia
	const [brushIndex, setBrushIndex] = useState({
		start: 0,
		end: data && data.length > 0 ? data.length - 1 : 0,
	});

	// Tworzymy unikalny klucz dla obecnego zestawu danych (ilość elementów + pierwsza data)
	const currentDataKey =
		data && data.length > 0 ? `${data.length}-${data[0].date}` : "empty";
	const [prevDataKey, setPrevDataKey] = useState(currentDataKey);

	// 🚀 Zgodnie z wytycznymi React: Aktualizacja stanu podczas renderowania (zamiast w useEffect)
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
						Wiele transakcji
					</div>
				</div>
			)}
		</div>
	);

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

	// 🚀 INTELIGENTNA PLAKIETKA (Rysowana po prawej stronie osi)
	const LastValuePill = (props: any) => {
		const { x, y, value, index } = props;

		// Renderuj pigułkę tylko dla absolutnie ostatniego punktu objętego przez aktualny Brush!
		if (index !== brushIndex.end || x == null || y == null || value == null)
			return null;

		const isPercentage = mode === "PERCENTAGE";
		const displayValue = isPercentage
			? `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
			: `${new Intl.NumberFormat("pl-PL", { notation: "compact", maximumFractionDigits: 1 }).format(convertPLN(value))} ${currencySymbol}`;

		const rectWidth = Math.max(
			isPercentage ? 60 : 70,
			displayValue.length * 7 + 16,
		);
		const rectHeight = 22;

		return (
			<g style={{ outline: "none" }}>
				{/* Linia narysowana w PRAWĄ stronę, poza granicą wykresu (w marginesie) */}
				<line
					x1={x}
					y1={y}
					x2={x + 12}
					y2={y}
					stroke="var(--theme-primary)"
					strokeWidth={1.5}
					strokeDasharray="2 2"
				/>
				<rect
					x={x + 12}
					y={y - rectHeight / 2}
					width={rectWidth}
					height={rectHeight}
					rx={6}
					fill="var(--theme-primary)"
				/>
				<text
					x={x + 12 + rectWidth / 2}
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
					fill="var(--theme-primary)"
					stroke="var(--t-bg-panel)"
					strokeWidth={2}
				/>
			</g>
		);
	};

	const chartContent = (
		<ChartContainer className="h-full min-h-0 w-full flex-1 relative flex flex-col ">
			<div className="absolute -top-2 w-full  left-5 pointer-events-none z-0 opacity-15 dark:opacity-10">
				<div className="flex items-center gap-2 grayscale">
					<div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center">
						<Image
							src="/logo-static.svg"
							alt="Logo"
							width={32}
							height={32}
							className="block dark:hidden object-contain"
							style={{ width: "auto", height: "auto" }}
						/>
						<Image
							src="/logo-light-static.svg"
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
							data={mergedData}
							syncId="portfolioSync"
							// 🚀 WIEKSZY PRAWY MARGINES - Otwiera miejsce dla plakietki by nie ucinała jej krawędź
							margin={{
								top: 40,
								// right: isMobile ? 85 : 100,
								right: isMobile ? 30 : 50,
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
									pointerEvents:
										"none" /* 🚀 MAGIA: Kółko wraca, ale przepuszcza Twoje kliknięcia do spodu! */,
								}}
								label={(props: any) => <LastValuePill {...props} />}
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
										{clickedData.txDetails &&
										clickedData.txDetails.length > 1 ? (
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
											<span className="text-t-text-tertiary text-xs">
												Walor
											</span>
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
											<span className="text-t-text-tertiary text-xs">
												Kwota
											</span>
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
							// 🚀 MARGINES BOTTOM: 35 tworzy świetną przerwę dla Brusha poniżej wykresu!
							// 🚀 MARGINES RIGHT: Zsynchronizowany z górnym dla perfekcyjnej lini.
							margin={{
								top: 10,
								right: isMobile ? 20 : 40,
								left: 25,
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
									fill="transparent"
									// 🚀 AKTUALIZACJA STANU PRZY ZOOMOWANIU
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
									// 🚀 CUSTOMOWY UI DLA UCHWYTÓW (Z zaokrągleniami)
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
													// fill="var(--t-bg-base)"
													strokeLinecap="round"
												/>
												<line
													x1={width / 2}
													y1={height * 0.25}
													x2={width / 2}
													y2={height * 0.75}
													stroke="var(--t-bg-base)"
													// stroke="var(--t-text-tertiary)"
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
			</div>
		</ChartContainer>
	);

	const renderControls = () => (
		<div className="flex flex-col  px-6 z-20 mb-2 sm:mb-4 w-full gap-3">
			<div className="flex flex-col items-center md:flex-row justify-between w-full">
				{(titleInside || subtitleInside) && (
					<div className="  flex justify-between flex-col md:items-start items-center pb-2  pointer-events-none bg-transparent rounded-lg">
						{!isExpanded && titleInside && (
							<h3 className="text-sm font-bold text-t-text-primary">
								{titleInside}
							</h3>
						)}
						{subtitleInside && (
							<p
								className={cn(
									"text-xs flex-1 self-end font-semibold text-t-text-tertiary mt-1 leading-tight",
									!isExpanded && "whitespace-pre-wrap, text-[10px]",
								)}
							>
								{subtitleInside}
							</p>
						)}
					</div>
				)}
				<div className="flex flex-wrap items-center gap-2  justify-end ">
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
						<div className="flex items-center gap-1  ">
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
			<div>{trendBadge}</div>
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
				<div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-3 pt-3 sm:px-6 border-t border-t-border overflow-x-auto pb-1">
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

				{/* 🚀 Logika dla zdarzeń (1 od razu szczegóły, >1 zachęta do kliknięcia) */}
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

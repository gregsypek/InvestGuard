"use client";

import {
	Brush,
	CartesianGrid,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { EndPills, PillItem } from "../shared/EndPills";
import {
	Info,
	LineChart as LineChartIcon,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { ChartCardLayout } from "../shared/ChartCardLayout";
import { FilterBadge } from "../shared/FilterBadge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useChartContext } from "../providers/ChartProvider";

export interface MarketHistoryPoint {
	date: string;
	value: number;
}

interface MarketDetailChartProps {
	data: MarketHistoryPoint[];
	name: string;
	ticker?: string;
	color?: string;
	srcCurrency?: string;
	onClose?: () => void;
}

const TIME_RANGES = ["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX"];

export function MarketDetailChart({
	data,
	name,
	ticker,
	color = "#3b82f6",
	srcCurrency = "USD",
	onClose,
}: MarketDetailChartProps) {
	const { currency, exchangeRates } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);
	const [isMobile, setIsMobile] = useState(false);

	const [activeRange, setActiveRange] = useState("1Y");
	const [customBrush, setCustomBrush] = useState<{
		start: number;
		end: number;
	} | null>(null);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 640);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// 🚀 Sprawdzamy czy mamy wystarczającą historię danych (min. 5 wpisów)
	const hasEnoughHistory = useMemo(() => {
		return data && data.length >= 5;
	}, [data]);

	const startDateFormatted = useMemo(() => {
		if (!data || data.length === 0) return "";
		return format(new Date(data[0].date), "dd MMMM yyyy", { locale: pl });
	}, [data]);

	const filteredData = useMemo(() => {
		if (!data || data.length === 0) return [];
		if (!hasEnoughHistory) return data; // Jeśli danych jest mało, nie filtrujemy zakresami

		const now = new Date();
		now.setUTCHours(0, 0, 0, 0);
		let cutoff = new Date(0);

		switch (activeRange) {
			case "1W":
				cutoff = new Date(now.setDate(now.getDate() - 7));
				break;
			case "1M":
				cutoff = new Date(now.setMonth(now.getMonth() - 1));
				break;
			case "3M":
				cutoff = new Date(now.setMonth(now.getMonth() - 3));
				break;
			case "YTD":
				cutoff = new Date(now.getFullYear(), 0, 1);
				break;
			case "1Y":
				cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
				break;
			case "3Y":
				cutoff = new Date(now.setFullYear(now.getFullYear() - 3));
				break;
			case "5Y":
				cutoff = new Date(now.setFullYear(now.getFullYear() - 5));
				break;
			case "MAX":
			default:
				cutoff = new Date(0);
				break;
		}
		return data.filter((d) => new Date(d.date).getTime() >= cutoff.getTime());
	}, [data, activeRange, hasEnoughHistory]);

	// Przeliczamy dane na wybraną walutę w UI
	const chartDataWithCurrency = useMemo(() => {
		let rate = 1;
		const src = srcCurrency.toUpperCase();
		const tgt = currency.toUpperCase();

		if (src !== tgt) {
			const usdpln = exchangeRates["USDPLN"] || 4.0;
			const eurpln = exchangeRates["EURPLN"] || 4.3;
			const gbppln = exchangeRates["GBPPLN"] || 5.0;

			let rateToPLN = 1;
			if (src === "USD") rateToPLN = usdpln;
			else if (src === "EUR") rateToPLN = eurpln;
			else if (src === "GBP") rateToPLN = gbppln;

			let plnToTgt = 1;
			if (tgt === "USD") plnToTgt = 1 / usdpln;
			else if (tgt === "EUR") plnToTgt = 1 / eurpln;
			else if (tgt === "GBP") plnToTgt = 1 / gbppln;

			rate = rateToPLN * plnToTgt;
		}

		return filteredData.map((d) => ({
			...d,
			value: d.value * rate,
		}));
	}, [filteredData, srcCurrency, currency, exchangeRates]);

	const brush = useMemo(() => {
		const lastIdx = Math.max(0, (chartDataWithCurrency?.length || 1) - 1);
		if (!customBrush) return { start: 0, end: lastIdx };
		return {
			start: Math.min(Math.max(0, customBrush.start), lastIdx),
			end: Math.min(Math.max(customBrush.start, customBrush.end), lastIdx),
		};
	}, [customBrush, chartDataWithCurrency]);

	const percentChange = useMemo(() => {
		if (!chartDataWithCurrency || chartDataWithCurrency.length === 0) return 0;
		const startVal = chartDataWithCurrency[brush.start]?.value || 0;
		const endVal = chartDataWithCurrency[brush.end]?.value || 0;
		if (startVal === 0) return 0;
		return ((endVal - startVal) / startVal) * 100;
	}, [chartDataWithCurrency, brush.start, brush.end]);

	const yDomain = useMemo<[number, number]>(() => {
		if (!chartDataWithCurrency || chartDataWithCurrency.length === 0)
			return [-5, 5];
		let min = Infinity;
		let max = -Infinity;
		for (let i = brush.start; i <= brush.end; i++) {
			const v = chartDataWithCurrency[i]?.value;
			if (v != null) {
				if (v < min) min = v;
				if (v > max) max = v;
			}
		}
		if (!isFinite(min) || !isFinite(max)) return [-5, 5];
		const pad = (max - min || 1) * 0.1;
		return [min - pad, max + pad];
	}, [chartDataWithCurrency, brush.start, brush.end]);

	const pills = useMemo<PillItem[]>(() => {
		if (!chartDataWithCurrency || chartDataWithCurrency.length === 0) return [];
		const lastVal =
			chartDataWithCurrency[brush.end]?.value ||
			chartDataWithCurrency[chartDataWithCurrency.length - 1]?.value;
		return [
			{
				id: ticker || name,
				color: color,
				value: lastVal,
				index: brush.end - brush.start,
			},
		];
	}, [chartDataWithCurrency, brush.start, brush.end, ticker, name, color]);

	if (!data || data.length < 2) {
		return (
			<div className="flex flex-col items-center justify-center p-8 bg-t-bg-panel border border-t-border rounded-2xl shadow-sm my-4">
				<p className="text-sm font-bold text-t-text-primary mb-1">
					Brak pełnej historii wycen
				</p>
				<p className="text-xs text-t-text-secondary text-center max-w-md">
					Dla waloru <strong>{name}</strong> nie zebrano jeszcze wystarczającej
					ilości danych historycznych.
				</p>
			</div>
		);
	}

	// 🚀 Jeśli brak pełnej historii, w stopce pokazujemy informację zamiast przycisków
	const footerRanges = hasEnoughHistory ? (
		TIME_RANGES.map((range) => (
			<div key={range}>
				<FilterBadge
					id={range}
					label={range}
					isSelected={activeRange === range}
					onToggle={() => {
						setActiveRange(range);
						setCustomBrush(null);
					}}
				/>
			</div>
		))
	) : (
		<span className="text-[10px] font-medium text-t-text-tertiary">
			Zakres czasowy zablokowany • Zbieranie danych w toku
		</span>
	);

	return (
		<div className="w-full animate-in slide-in-from-top-4 fade-in duration-300 mb-6">
			<div className="relative h-[400px] sm:h-[500px] w-full flex flex-col bg-t-bg-panel border border-t-border rounded-2xl p-2 sm:p-4 shadow-md">
				<ChartCardLayout
					title={name}
					subtitle={
						<div className="flex items-center gap-2 mt-1">
							<span className="text-xs text-t-text-secondary">
								{ticker
									? `Symbol: ${ticker}`
									: "Historia wycen zebrana z rynku"}
							</span>
							<div
								className={cn(
									"flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest",
									percentChange >= 0
										? "bg-gain/10 text-gain"
										: "bg-loss/10 text-loss",
								)}
							>
								{percentChange >= 0 ? (
									<TrendingUp className="w-3 h-3" />
								) : (
									<TrendingDown className="w-3 h-3" />
								)}
								{percentChange >= 0 ? "+" : ""}
								{percentChange.toFixed(2)}%
							</div>
						</div>
					}
					icon={LineChartIcon}
					footer={footerRanges}
				>
					<div className="w-full flex-1 min-h-0 border-b border-t-border-subtle pb-2 relative h-full">
						<ResponsiveContainer width="100%" height="100%">
							<ComposedChart
								data={chartDataWithCurrency}
								margin={{
									top: 20,
									right: isMobile ? 30 : 40,
									left: 10,
									bottom: 0,
								}}
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
										`${formatCurrency(val, 1, currency, currency, exchangeRates)}\u00A0${currencySymbol}`
									}
									domain={yDomain}
									width={isMobile ? 45 : 55}
								/>
								<Tooltip
									content={
										<MarketTooltip
											color={color}
											currency={currency}
											currencySymbol={currencySymbol}
											exchangeRates={exchangeRates}
										/>
									}
									cursor={{ stroke: "var(--t-border-subtle)", strokeWidth: 2 }}
								/>
								{/* Pokazujemy pędzel nawigacyjny tylko przy pełnej historii */}
								{hasEnoughHistory && chartDataWithCurrency.length > 1 && (
									<Brush
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
												Number.isFinite(e.endIndex)
											) {
												setCustomBrush({
													start: e.startIndex,
													end: e.endIndex,
												});
											}
										}}
									/>
								)}
								<Line
									type="monotone"
									dataKey="value"
									stroke={color}
									strokeWidth={3}
									dot={false}
									activeDot={{
										r: 6,
										fill: color,
										stroke: "var(--t-bg-panel)",
										strokeWidth: 2,
									}}
									isAnimationActive={true}
								/>
								<EndPills
									pills={pills}
									count={brush.end - brush.start + 1}
									domain={yDomain}
									mode="VALUE"
									currencySymbol={currencySymbol}
									convertPLN={(v) => v}
								/>
							</ComposedChart>
						</ResponsiveContainer>
					</div>
				</ChartCardLayout>
			</div>
			{/* Baner informacyjny przy krótkiej historii */}
			{!hasEnoughHistory && (
				<div className="flex items-center gap-2.5 p-3 mt-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium shadow-sm">
					<Info className="w-4 h-4 shrink-0 text-blue-500" />
					<span>
						Zbieranie historii w toku. Wykres prezentuje wstępne dane gromadzone
						od dnia <strong>{startDateFormatted}</strong>.
					</span>
				</div>
			)}
		</div>
	);
}

function MarketTooltip({
	active,
	payload,
	label,
	color,
	currency,
	currencySymbol,
	exchangeRates,
}: any) {
	if (!active || !payload || payload.length === 0) return null;
	const val = payload[0].value;
	return (
		<div className="bg-t-bg-panel/95 backdrop-blur-md border border-t-border rounded-xl p-3 shadow-xl min-w-[200px]">
			<p className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-2 border-b border-t-border pb-1">
				{format(new Date(label as string), "dd MMMM yyyy", { locale: pl })}
			</p>
			<div className="flex flex-col gap-1 mb-2">
				<div className="flex justify-between items-center gap-4">
					<div className="flex items-center gap-1.5">
						<span
							className="w-2 h-2 rounded-full"
							style={{ backgroundColor: color }}
						/>
						<span className="text-xs font-bold text-t-text-primary">
							Wycena Rynkowa
						</span>
					</div>
					<span className="text-sm font-bold tabular-nums text-t-text-primary">
						{formatCurrency(val, 2, currency, currency, exchangeRates)}
						{"\u00A0"}
						{currencySymbol}
					</span>
				</div>
			</div>
			<div className="pt-2 mt-2 border-t border-t-border-subtle">
				<p className="text-[9px] text-t-text-tertiary leading-tight">
					Dane historyczne pobrane na koniec sesji giełdowej.
				</p>
			</div>
		</div>
	);
}

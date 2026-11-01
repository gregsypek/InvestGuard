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
import { EndPills, PillItem } from "../shared/EndPills";
import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { ChartCardLayout } from "../shared/ChartCardLayout";
import { FilterBadge } from "../shared/FilterBadge";
import { LineChart as LineChartIcon } from "lucide-react";
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
	onClose?: () => void;
}

const TIME_RANGES = ["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX"];

export function MarketDetailChart({
	data,
	name,
	ticker,
	color = "#3b82f6", // Domyślny niebieski
	onClose,
}: MarketDetailChartProps) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);
	const [isMobile, setIsMobile] = useState(false);

	const [activeRange, setActiveRange] = useState("1Y");
	const [brushIndex, setBrushIndex] = useState({ start: 0, end: 0 });

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 640);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// 1. LOGIKA FILTROWANIA DANYCH (Ożywia filtry pod wykresem!)
	const filteredData = useMemo(() => {
		if (!data || data.length === 0) return [];

		const now = new Date();
		now.setUTCHours(0, 0, 0, 0);
		let cutoff = new Date(0); // Dla MAX bierzemy wszystko

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

		// Filtrujemy dane, zostawiając tylko te równe lub nowsze od cutoff
		return data.filter((d) => new Date(d.date).getTime() >= cutoff.getTime());
	}, [data, activeRange]);

	// Inicjalizacja zakresu Brusha (za każdym razem, gdy zmieniają się przefiltrowane dane)
	useEffect(() => {
		if (filteredData && filteredData.length > 0) {
			const end = filteredData.length - 1;
			setBrushIndex({ start: 0, end });
		}
	}, [filteredData]);

	const brush = useMemo(() => {
		const lastIdx = Math.max(0, (filteredData?.length || 1) - 1);
		const start = Math.min(Math.max(0, brushIndex.start), lastIdx);
		const end = Math.min(Math.max(start, brushIndex.end), lastIdx);
		return { start, end };
	}, [brushIndex.start, brushIndex.end, filteredData]);

	const yDomain = useMemo<[number, number]>(() => {
		if (!filteredData || filteredData.length === 0) return [-5, 5];
		let min = Infinity;
		let max = -Infinity;
		for (let i = brush.start; i <= brush.end; i++) {
			const v = filteredData[i]?.value;
			if (v != null) {
				if (v < min) min = v;
				if (v > max) max = v;
			}
		}
		if (!isFinite(min) || !isFinite(max)) return [-5, 5];
		const pad = (max - min || 1) * 0.1;
		return [min - pad, max + pad];
	}, [filteredData, brush.start, brush.end]);

	const pills = useMemo<PillItem[]>(() => {
		if (!filteredData || filteredData.length === 0) return [];
		const lastVal =
			filteredData[brush.end]?.value ||
			filteredData[filteredData.length - 1]?.value;
		return [
			{
				id: ticker || name,
				color: color,
				value: lastVal,
				index: brush.end - brush.start,
			},
		];
	}, [filteredData, brush.start, brush.end, ticker, name, color]);

	if (!data || data.length < 2) {
		return (
			<div className="flex flex-col items-center justify-center p-8 bg-t-bg-panel border border-t-border rounded-2xl shadow-sm my-4">
				<p className="text-sm font-bold text-t-text-primary mb-1">
					Brak pełnej historii wycen
				</p>
				<p className="text-xs text-t-text-secondary text-center max-w-md">
					Dla waloru <strong>{name}</strong> nie zebrano jeszcze wystarczającej
					ilości danych historycznych do wyrysowania wykresu.
				</p>
			</div>
		);
	}

	const footerRanges = TIME_RANGES.map((range) => (
		<div key={range}>
			<FilterBadge
				id={range}
				label={range}
				isSelected={activeRange === range}
				onToggle={() => setActiveRange(range)}
			/>
		</div>
	));

	return (
		<div className="w-full animate-in slide-in-from-top-4 fade-in duration-300 mb-6">
			<div className="relative h-[400px] sm:h-[500px] w-full flex flex-col bg-t-bg-panel border border-t-border rounded-2xl p-2 sm:p-4 shadow-md">
				<ChartCardLayout
					title={name}
					subtitle={
						ticker ? `Symbol: ${ticker}` : "Historia wycen zebrana z rynku"
					}
					icon={LineChartIcon}
					footer={footerRanges}
				>
					<div className="w-full flex-1 min-h-0 border-b border-t-border-subtle pb-2 relative h-full">
						<ResponsiveContainer width="100%" height="100%">
							<ComposedChart
								data={filteredData}
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
									// 2. Dodajemy formatowanie waluty na osi Y
									tickFormatter={(val) =>
										`${formatCurrency(convertPLN(val), 0)} ${currencySymbol}`
									}
									domain={yDomain}
									width={isMobile ? 45 : 55}
								/>
								<Tooltip
									// Przekazujemy funkcje do Tooltipa
									content={
										<MarketTooltip
											color={color}
											currencySymbol={currencySymbol}
											convertPLN={convertPLN}
										/>
									}
									cursor={{ stroke: "var(--t-border-subtle)", strokeWidth: 2 }}
								/>
								{filteredData.length > 1 && (
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
												setBrushIndex({ start: e.startIndex, end: e.endIndex });
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
									convertPLN={convertPLN}
								/>
							</ComposedChart>
						</ResponsiveContainer>
					</div>
				</ChartCardLayout>
			</div>
		</div>
	);
}

// 3. Wyjaśnienie w Tooltipie
function MarketTooltip({
	active,
	payload,
	label,
	color,
	currencySymbol,
	convertPLN,
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
						{formatCurrency(convertPLN(val), 2)}
						{currencySymbol}
					</span>
				</div>
			</div>
			{/* Subtelne wyjaśnienie pochodzenia danych */}
			<div className="pt-2 mt-2 border-t border-t-border-subtle">
				<p className="text-[9px] text-t-text-tertiary leading-tight">
					Dane historyczne pobrane na koniec sesji giełdowej.
				</p>
			</div>
		</div>
	);
}

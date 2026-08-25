"use client";

import {
	Bar,
	BarChart,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
import { Maximize2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Asset } from "@prisma/client";

// --- 1. DEFINICJE TYPÓW (Eliminacja błędów "any") ---
interface GlobalAnalyticsChartsProps {
	assets: Asset[];
	totalValue: number;
	hideClosed: boolean;
	filterCategory: string;
	sortBy: string;
}

// Opisujemy dokładnie nasz obiekt po sformatowaniu, aby Tooltip wiedział, co czyta
interface BarChartItem {
	name: string;
	fullName: string;
	value: number;
	profitPLN: number;
	profitPct: number;
	percentage: number;
	fill: string;
	categoryLabel: string;
}

// Typy narzucane przez bibliotekę Recharts dla etykiet
interface RechartsLabelProps {
	x?: number | string;
	y?: number | string;
	width?: number | string;
	height?: number | string;
	index?: number;
}
interface PieLabelProps {
	cx?: number;
	cy?: number;
	midAngle?: number;
	innerRadius?: number;
	outerRadius?: number;
	percent?: number;
}

export default function GlobalAnalyticsCharts({
	assets,
	totalValue,
	hideClosed,
	filterCategory,
	sortBy,
}: GlobalAnalyticsChartsProps) {
	const [isFullscreen, setIsFullscreen] = useState(false);

	const { pieData, barDataTop10, allBarData } = useMemo(() => {
		// --- FILTROWANIE ---
		let filtered = assets.filter(
			(a) => !(a.category === "CASH" && (a.currentValue || 0) === 0),
		);

		if (hideClosed) {
			filtered = filtered.filter(
				(a) => a.quantity > 0 || a.category === "CASH",
			);
		}
		if (filterCategory !== "ALL") {
			filtered = filtered.filter((a) => a.category === filterCategory);
		}

		// --- WYKRES KOŁOWY ---
		const categoryMap = new Map<string, number>();
		filtered.forEach((a) => {
			const cat = a.category || "UNKNOWN";
			categoryMap.set(cat, (categoryMap.get(cat) || 0) + (a.currentValue || 0));
		});

		const pieData = Array.from(categoryMap.entries())
			.map(([category, value]) => ({
				category,
				labelName:
					CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category,
				value,
				percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
				fill: COLORS[category as keyof typeof COLORS] || "#64748b",
			}))
			.sort((a, b) => b.value - a.value);

		// --- SORTOWANIE ZAAWANSOWANE ---
		const sortedAssets = [...filtered].sort((a, b) => {
			if (sortBy === "PROFIT") {
				const profitA = (a.currentValue || 0) - (a.investedCapital || 0);
				const profitB = (b.currentValue || 0) - (b.investedCapital || 0);
				return profitB - profitA;
			}
			if (sortBy === "PROFIT_PCT") {
				const pctA = a.investedCapital
					? ((a.currentValue || 0) - a.investedCapital) / a.investedCapital
					: 0;
				const pctB = b.investedCapital
					? ((b.currentValue || 0) - b.investedCapital) / b.investedCapital
					: 0;
				return pctB - pctA;
			}
			return (b.currentValue || 0) - (a.currentValue || 0);
		});

		// --- FORMATOWANIE ETYKIET ---
		const formatAssetForBar = (a: Asset): BarChartItem => {
			const fallbackName = a.name || "Nieznane";
			const displayLabel = a.ticker
				? a.category === "BONDS"
					? a.ticker.split("_")[0]
					: a.ticker
				: fallbackName.length > 15
					? fallbackName.substring(0, 15) + "..."
					: fallbackName;

			const profitPLN = (a.currentValue || 0) - (a.investedCapital || 0);
			const profitPct = a.investedCapital
				? (profitPLN / a.investedCapital) * 100
				: 0;

			return {
				name: displayLabel,
				fullName: fallbackName,
				value: a.currentValue || 0,
				profitPLN,
				profitPct,
				percentage:
					totalValue > 0 ? ((a.currentValue || 0) / totalValue) * 100 : 0,
				fill: COLORS[a.category as keyof typeof COLORS] || "#64748b",
				categoryLabel:
					CATEGORY_LABELS[a.category as keyof typeof CATEGORY_LABELS] ||
					a.category,
			};
		};

		const allBarData = sortedAssets.map(formatAssetForBar);
		const barDataTop10 = [...allBarData].slice(0, 10);
		const rest = sortedAssets.slice(10);

		if (rest.length > 0) {
			const restValue = rest.reduce((sum, a) => sum + (a.currentValue || 0), 0);
			barDataTop10.push({
				name: "Pozostałe",
				fullName: `Inne walory (${rest.length})`,
				value: restValue,
				profitPLN: 0,
				profitPct: 0,
				percentage: totalValue > 0 ? (restValue / totalValue) * 100 : 0,
				fill: "#334155",
				categoryLabel: "Inne",
			});
		}

		return { pieData, barDataTop10, allBarData };
	}, [assets, totalValue, hideClosed, filterCategory, sortBy]);

	if (pieData.length === 0) return null;

	const tooltipStyle = {
		backgroundColor: "var(--t-bg-panel)",
		borderColor: "var(--t-border-subtle)",
		borderRadius: "12px",
		fontSize: "12px",
		color: "var(--t-text-primary)",
		boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
	};

	// --- 2. BEZPIECZNY TOOLTIP (unknown naprawia błędy biblioteki) ---
	const barTooltipFormatter = (
		value: unknown,
		name: unknown,
		props: unknown,
	) => {
		// Bezpieczne rzutowanie z ominięciem wewnętrznych typów Recharts
		const item = (props as { payload: BarChartItem }).payload;
		const numValue = Number(value || 0);
		let extra = "";

		if (sortBy === "PROFIT" && item.name !== "Pozostałe") {
			const sign = item.profitPLN > 0 ? "+" : "";
			extra = ` (Zysk: ${sign}${item.profitPLN.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} PLN)`;
		} else if (sortBy === "PROFIT_PCT" && item.name !== "Pozostałe") {
			const sign = item.profitPct > 0 ? "+" : "";
			extra = ` (Zysk: ${sign}${item.profitPct.toFixed(2)}%)`;
		}

		return [
			`${numValue.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} PLN${extra}`,
			"Wartość",
		];
	};

	const renderPieLabel = ({
		cx = 0,
		cy = 0,
		midAngle = 0,
		innerRadius = 0,
		outerRadius = 0,
		percent = 0,
	}: PieLabelProps) => {
		if (percent < 0.04) return null;
		const RADIAN = Math.PI / 180;
		const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
		const x = cx + radius * Math.cos(-midAngle * RADIAN);
		const y = cy + radius * Math.sin(-midAngle * RADIAN);

		return (
			<text
				x={x}
				y={y}
				fill="white"
				textAnchor="middle"
				dominantBaseline="central"
				className="text-[10px] font-black drop-shadow-md pointer-events-none"
			>
				{(percent * 100).toFixed(0)}%
			</text>
		);
	};

	// --- 3. GŁÓWNA LOGIKA ETYKIET SŁUPKÓW ---
	function renderBarLabelLogic(
		props: RechartsLabelProps,
		dataArray: BarChartItem[],
	) {
		const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props;
		const item = dataArray[index];
		if (!item) return null;

		// 🚀 Rzutowanie na liczby, aby Typescript się nie burzył przy x + width
		const numX = Number(x);
		const numY = Number(y);
		const numWidth = Number(width);
		const numHeight = Number(height);

		let extraText = "";
		let extraFill = "var(--t-text-tertiary)";

		if (sortBy === "PROFIT" && item.name !== "Pozostałe") {
			const sign = item.profitPLN > 0 ? "+" : "";
			extraText = `(${sign}${item.profitPLN.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} PLN)`;
			extraFill = item.profitPLN >= 0 ? "#10b981" : "#ef4444";
		} else if (sortBy === "PROFIT_PCT" && item.name !== "Pozostałe") {
			const sign = item.profitPct > 0 ? "+" : "";
			extraText = `(${sign}${item.profitPct.toFixed(1)}%)`;
			extraFill = item.profitPct >= 0 ? "#10b981" : "#ef4444";
		} else {
			if (item.percentage < 0.1) return null;
			extraText = `(${item.percentage.toFixed(1)}% całości)`;
		}

		return (
			<text
				x={numX + numWidth + 8}
				y={numY + numHeight / 2}
				fill="var(--t-text-secondary)"
				dominantBaseline="central"
				className="text-[10px] font-bold font-mono tracking-tighter"
			>
				{item.value.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} PLN{" "}
				<tspan fill={extraFill}>{extraText}</tspan>
			</text>
		);
	}
	// --- 4. KOMPONENTY NAPRAWIAJĄCE "Missing display name" ---
	const BarLabelTop10 = (props: RechartsLabelProps) =>
		renderBarLabelLogic(props, barDataTop10);
	BarLabelTop10.displayName = "BarLabelTop10";

	const BarLabelAll = (props: RechartsLabelProps) =>
		renderBarLabelLogic(props, allBarData);
	BarLabelAll.displayName = "BarLabelAll";
	return (
		<>
			<div className="grid lg:grid-cols-2 gap-6 items-stretch border border-t-border bg-t-bg-panel rounded-2xl p-6">
				{/* LEWA STRONA: Donut */}
				<div className="flex flex-col items-center border-b lg:border-b-0 lg:border-r border-t-border-subtle pb-6 lg:pb-0 lg:pr-6">
					<h4 className="text-sm font-bold uppercase tracking-widest text-t-text-tertiary mb-6 w-full text-left">
						Udział typów walorów
					</h4>
					<div className="w-full h-[280px]">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={pieData}
									dataKey="value"
									nameKey="labelName"
									cx="50%"
									cy="50%"
									innerRadius={70}
									outerRadius={110}
									paddingAngle={2}
									stroke="var(--t-bg-panel)"
									strokeWidth={2}
									label={renderPieLabel}
									labelLine={false}
								>
									{pieData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.fill} />
									))}
								</Pie>
								<Tooltip
									formatter={(value: unknown) => [
										`${Number(value || 0).toLocaleString("pl-PL", { maximumFractionDigits: 0 })} PLN`,
										"Wartość",
									]}
									contentStyle={tooltipStyle}
									itemStyle={{
										color: "var(--t-text-primary)",
										fontWeight: "bold",
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>

					{/* Legenda pod Donutem */}
					<div className="flex flex-wrap justify-center gap-3 mt-4">
						{pieData.map((entry) => (
							<div key={entry.category} className="flex items-center gap-1.5">
								<div
									className="w-2 h-2 rounded-full"
									style={{ backgroundColor: entry.fill }}
								/>
								<span className="text-[10px] font-bold text-t-text-secondary uppercase tracking-widest">
									{entry.labelName}
									<span className="text-t-text-tertiary ml-1">
										{entry.value.toLocaleString("pl-PL", {
											maximumFractionDigits: 0,
										})}{" "}
										PLN
									</span>
									<span className="text-t-text-tertiary ml-1">
										({entry.percentage.toFixed(1)}%)
									</span>
								</span>
							</div>
						))}
					</div>
				</div>

				{/* PRAWA STRONA: Top 10 Słupki */}
				<div className="flex flex-col pt-6 lg:pt-0 lg:pl-6 relative">
					<div className="flex justify-between items-center mb-6 w-full">
						<h4 className="text-sm font-bold uppercase tracking-widest text-t-text-tertiary">
							Największe pozycje
						</h4>
						<button
							onClick={() => setIsFullscreen(true)}
							className="p-1.5 rounded-md text-t-text-tertiary hover:text-t-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors group relative"
						>
							<Maximize2 className="w-4 h-4" />
							<span className="absolute -top-8 right-0 bg-black/80 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
								Pełny widok
							</span>
						</button>
					</div>

					<div className="w-full flex-1 min-h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								layout="vertical"
								data={barDataTop10}
								margin={{ top: 0, right: 100, left: 0, bottom: 0 }}
							>
								<XAxis type="number" hide />
								<YAxis
									dataKey="name"
									type="category"
									width={110}
									axisLine={false}
									tickLine={false}
									tick={{
										fontSize: 10,
										fill: "var(--t-text-secondary)",
										fontWeight: "bold",
									}}
								/>
								<Tooltip
									cursor={{ fill: "rgba(255,255,255,0.05)" }}
									formatter={barTooltipFormatter}
									labelFormatter={(label, payload) =>
										payload?.[0]?.payload.fullName || String(label)
									}
									contentStyle={tooltipStyle}
									itemStyle={{
										color: "var(--t-text-primary)",
										fontWeight: "bold",
									}}
								/>
								<Bar
									dataKey="value"
									radius={[0, 4, 4, 0]}
									barSize={20}
									label={(props: any) =>
										renderBarLabelLogic(props, barDataTop10)
									}
								>
									{barDataTop10.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.fill} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>

			{/* Modal Pełnoekranowy */}
			{isFullscreen && (
				<div className="fixed inset-0 z-50 bg-t-bg-base/95 backdrop-blur-md flex flex-col p-4 sm:p-8 animate-in fade-in duration-200">
					<div className="max-w-6xl w-full mx-auto flex-1 flex flex-col h-full bg-t-bg-panel border border-t-border rounded-2xl overflow-hidden shadow-2xl">
						<div className="flex justify-between items-center p-6 border-b border-t-border-subtle bg-t-bg-sticky">
							<div>
								<h3 className="text-lg font-bold text-t-text-primary uppercase tracking-widest">
									Wszystkie pozycje w portfelu
								</h3>
								<p className="text-xs text-t-text-tertiary mt-1">
									Układ zależy od wybranego filtru sortowania
								</p>
							</div>
							<button
								onClick={() => setIsFullscreen(false)}
								className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors border border-t-border-subtle"
							>
								<X className="w-5 h-5 text-t-text-primary" />
							</button>
						</div>

						<div className="flex-1 w-full p-6 overflow-y-auto no-scrollbar">
							<div
								style={{ height: Math.max(allBarData.length * 40, 400) }}
								className="w-full"
							>
								<ResponsiveContainer width="100%" height="100%">
									<BarChart
										layout="vertical"
										data={allBarData}
										margin={{ top: 0, right: 120, left: 0, bottom: 0 }}
									>
										<XAxis type="number" hide />
										<YAxis
											dataKey="name"
											type="category"
											width={130}
											axisLine={false}
											tickLine={false}
											tick={{
												fontSize: 11,
												fill: "var(--t-text-secondary)",
												fontWeight: "bold",
											}}
										/>
										<Tooltip
											cursor={{ fill: "rgba(255,255,255,0.05)" }}
											formatter={barTooltipFormatter}
											labelFormatter={(label, payload) =>
												payload?.[0]?.payload.fullName || String(label)
											}
											contentStyle={tooltipStyle}
											itemStyle={{
												color: "var(--t-text-primary)",
												fontWeight: "bold",
											}}
										/>
										<Bar
											dataKey="value"
											radius={[0, 4, 4, 0]}
											barSize={24}
											label={(props: any) =>
												renderBarLabelLogic(props, allBarData)
											}
										>
											{allBarData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.fill} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

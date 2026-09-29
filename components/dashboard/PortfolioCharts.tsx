"use client";

import {
	Area,
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
	Maximize2,
	Minimize2,
	TrendingDown,
	TrendingUp,
	Wallet2,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import { ChartContainer } from "../shared/ChartContainer";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils/format-currency";
import { pl } from "date-fns/locale";

// --- INPUT DATA TYPES ---
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
	txDetails: TransactionData[] | null;
}

interface PortfolioChartProps {
	data: ChartDataPoint[];
	transactions?: TransactionData[];
	mode?: "VALUE" | "PERCENTAGE";
}

// Helper function to set the end of the day time from YYYY-MM-DD format
const getEndOfDayTime = (dateStr: string) => {
	const [year, month, day] = dateStr.split("-").map(Number);
	return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
};

export function PortfolioChart({
	data,
	transactions = [],
	mode = "VALUE",
}: PortfolioChartProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	// --- LOGIC FOR MERGING TRANSACTIONS WITH CHART DATA ---
	const mergedData: MergedDataPoint[] = useMemo(() => {
		if (!data || data.length === 0) return [];

		const txsWithTime = transactions.map((t) => {
			const txDateStr = t.executedAt || t.date;
			return {
				...t,
				parsedTime: txDateStr ? new Date(txDateStr).getTime() : 0,
				formattedDate: txDateStr
					? format(new Date(txDateStr), "dd MMM yyyy", { locale: pl })
					: "",
			};
		});

		return data.map((point, index) => {
			const currentPointTime = getEndOfDayTime(point.date);
			let prevPointTime = 0;

			if (index > 0) {
				prevPointTime = getEndOfDayTime(data[index - 1].date);
			} else {
				const [year, month, day] = point.date.split("-").map(Number);
				prevPointTime =
					new Date(year, month - 1, day, 0, 0, 0, 0).getTime() - 1;
			}

			const periodTxs = txsWithTime.filter(
				(t) => t.parsedTime > prevPointTime && t.parsedTime <= currentPointTime,
			);

			const hasBuy = periodTxs.some(
				(t) => t.type === "BUY" || t.type === "DEPOSIT",
			);
			const hasSell = periodTxs.some(
				(t) => t.type === "SELL" || t.type === "WITHDRAWAL",
			);

			return {
				...point,
				buyEvent: hasBuy ? point.value : null,
				sellEvent: hasSell ? point.value : null,
				txDetails: periodTxs.length > 0 ? periodTxs : null,
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

	// --- TREND BADGE CALCULATIONS ---
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

	const trendBadge = (compact = false) => (
		<div className="flex flex-wrap items-center gap-3">
			<div
				className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
					isPositive
						? "bg-emerald-500/10 border-emerald-500/20"
						: "bg-rose-500/10 border-rose-500/20"
				}`}
			>
				{isPositive ? (
					<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
				) : (
					<TrendingDown className="w-3.5 h-3.5 text-rose-500" />
				)}
				<span
					className={`text-[11px] font-bold tabular-nums ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
				>
					{!compact ? (
						<span className="text-t-text-tertiary mr-1 font-medium">
							Prosta Stopa Zwrotu (Simple ROI):
						</span>
					) : (
						<span className="text-t-text-tertiary mr-1 font-medium">ROI:</span>
					)}
					{trendValue}
				</span>
			</div>

			{!compact && transactions.length > 0 && (
				<div className="hidden sm:flex items-center gap-3 ml-2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
					<div className="flex items-center gap-1.5">
						<div className="w-2 h-2 rounded-full bg-emerald-500" /> Wpłaty/Kupno
					</div>
					<div className="flex items-center gap-1.5">
						<div className="w-2 h-2 rounded-full bg-rose-500" />{" "}
						Wypłaty/Sprzedaż
					</div>
				</div>
			)}
		</div>
	);

	// --- CHART RENDERING ---
	const chartContent = (
		<ChartContainer className="h-full min-h-[300px] w-full flex-1">
			<ResponsiveContainer width="100%" height="100%">
				<ComposedChart
					data={mergedData}
					margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
				>
					<defs>
						<filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
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
							format(new Date(val), "dd MMM", { locale: pl })
						}
						minTickGap={20}
					/>

					<YAxis
						axisLine={false}
						tickLine={false}
						tick={{
							fontSize: 10,
							fill: "var(--t-text-tertiary)",
							fontWeight: 500,
						}}
						width={mode === "PERCENTAGE" ? 40 : 55}
						domain={["auto", "auto"]}
						tickFormatter={(val) => {
							if (mode === "PERCENTAGE") return `${val > 0 ? "+" : ""}${val}%`;
							return new Intl.NumberFormat("pl-PL", {
								notation: "compact",
								compactDisplay: "short",
							}).format(val);
						}}
					/>

					{mode === "PERCENTAGE" && (
						<ReferenceLine y={0} stroke="var(--t-border)" strokeWidth={1} />
					)}

					<Tooltip
						content={<CustomTooltip mode={mode} />}
						cursor={{ stroke: "var(--t-border-subtle)", strokeWidth: 2 }}
						wrapperStyle={{ zIndex: 1000, outline: "none" }}
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
						<Scatter dataKey="buyEvent" fill="#10b981" />
					)}
					{transactions.length > 0 && (
						<Scatter dataKey="sellEvent" fill="#ef4444" />
					)}
				</ComposedChart>
			</ResponsiveContainer>
		</ChartContainer>
	);

	if (isExpanded) {
		return (
			<div className="fixed inset-0 z-[999] bg-t-bg-base/95 backdrop-blur-xl p-4 sm:p-8 md:p-12 flex flex-col animate-in fade-in duration-200">
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
						<div className="mt-2 sm:mt-0 sm:ml-4">{trendBadge(false)}</div>
					</div>
					<button
						onClick={() => setIsExpanded(false)}
						className="p-2 sm:p-2.5 bg-t-bg-panel hover:bg-rose-500/10 text-t-text-secondary hover:text-rose-500 rounded-xl transition-colors shadow-sm border border-t-border hover:border-rose-500/30"
					>
						<Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" />
					</button>
				</div>
				<div className="relative flex-1 min-h-0 bg-t-bg-panel border border-t-border rounded-2xl p-4 md:p-6 shadow-xl">
					{chartContent}
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full h-full flex flex-col group bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-5 shadow-sm">
			<div className="flex justify-between items-start z-20 mb-2">
				<div>{trendBadge(true)}</div>
				<button
					onClick={() => setIsExpanded(true)}
					className="p-1.5 bg-t-bg-base border border-t-border text-t-text-tertiary hover:text-emerald-500 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-sm"
					title="Powiększ wykres"
				>
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>

			<div className="flex-1 w-full min-h-0 relative z-10">{chartContent}</div>
		</div>
	);
}

// ----------------------------------------------------------------------
// TOOLTIP TYPES
// ----------------------------------------------------------------------
interface TooltipPayloadItem {
	dataKey: string;
	value: number;
	color?: string;
	name?: string;
	payload: MergedDataPoint;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	label?: string;
	mode: "VALUE" | "PERCENTAGE";
}

function CustomTooltip({ active, payload, label, mode }: CustomTooltipProps) {
	if (active && payload && payload.length && label) {
		const dataObj = payload[0].payload;
		const value = payload.find((p) => p.dataKey === "value")?.value || 0;
		const invested = payload.find((p) => p.dataKey === "invested")?.value || 0;

		const formatVal = (val: number) => {
			if (mode === "PERCENTAGE")
				return `${val > 0 ? "+" : ""}${val.toFixed(2)}%`;
			// Using the resilient formatCurrency utility
			return `${formatCurrency(val)} PLN`;
		};

		const isProfit = mode === "PERCENTAGE" ? value >= 0 : value >= invested;
		const difference = value - invested;

		return (
			<div className="bg-t-bg-panel/95 backdrop-blur-md border border-t-border rounded-xl p-4 shadow-xl max-w-[280px]">
				<div
					className={`absolute top-0 left-0 right-0 h-[2px] ${isProfit ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-rose-400 to-rose-600"}`}
				/>

				<p className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-3 border-b border-t-border pb-1.5">
					{format(new Date(label), "dd MMMM yyyy", { locale: pl })}
				</p>

				{/* 1. PORTFOLIO SECTION */}
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

				{/* 2. TRANSACTIONS SECTION */}
				{dataObj.txDetails && dataObj.txDetails.length > 0 && (
					<div className="mt-3 pt-3 border-t border-t-border border-dashed space-y-2">
						<p className="text-[9px] font-black text-t-text-tertiary uppercase tracking-widest">
							Zdarzenia w tym okresie:
						</p>
						{dataObj.txDetails.map((tx, idx: number) => {
							const isBuy = tx.type === "BUY" || tx.type === "DEPOSIT";
							return (
								<div key={idx} className="flex flex-col mb-2 last:mb-0">
									<div className="flex justify-between items-center gap-4 text-xs">
										<span
											className={
												isBuy
													? "text-emerald-500 font-bold"
													: "text-rose-500 font-bold"
											}
										>
											{isBuy ? "KUPNO" : "SPRZEDAŻ"}{" "}
											{tx.ticker || tx.assetName || ""}
										</span>
										<span className="text-t-text-secondary font-mono text-right">
											{formatCurrency(Math.abs(tx.executedValue || 0))} PLN
										</span>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		);
	}
	return null;
}

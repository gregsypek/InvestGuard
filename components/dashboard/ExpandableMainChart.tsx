"use client";

import {
	CartesianGrid,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Scatter,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Maximize2, Minimize2 } from "lucide-react";
import React, { useMemo, useState } from "react";

import { ChartLegend } from "./ChartLegend";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface ExpandableMainChartProps {
	data: any[];
	transactions?: any[];
	chartMode: "VALUE" | "PERCENTAGE";
}

export function ExpandableMainChart({
	data,
	transactions = [],
	chartMode,
}: ExpandableMainChartProps) {
	const [isFullscreen, setIsFullscreen] = useState(false);

	const mergedData = useMemo(() => {
		if (!data || data.length === 0) return [];

		return data.map((point) => {
			const dayTxs = transactions.filter((t) => {
				const txDate = new Date(t.executedAt || t.date)
					.toISOString()
					.split("T")[0];
				return txDate === point.date;
			});

			const hasBuy = dayTxs.some(
				(t) => t.type === "BUY" || t.type === "DEPOSIT",
			);
			const hasSell = dayTxs.some(
				(t) => t.type === "SELL" || t.type === "WITHDRAWAL",
			);

			return {
				...point,
				buyEvent: hasBuy ? point.value : null,
				sellEvent: hasSell ? point.value : null,
				txDetails: dayTxs.length > 0 ? dayTxs : null,
			};
		});
	}, [data, transactions]);

	// Komponent Legendy (Używamy go w obu widokach)

	const chartContentElement = (
		<ResponsiveContainer width="100%" height="100%" minHeight={200}>
			<ComposedChart
				data={mergedData}
				margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
			>
				<defs>
					<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
						<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid
					strokeDasharray="3 3"
					vertical={false}
					stroke="rgba(255,255,255,0.05)"
				/>
				<XAxis
					dataKey="date"
					tickFormatter={(val) =>
						format(new Date(val), "dd MMM", { locale: pl })
					}
					tick={{ fontSize: 10, fill: "#64748b" }}
					tickLine={false}
					axisLine={false}
					minTickGap={30}
				/>
				{/* <YAxis hide domain={["auto", "auto"]} />
				 */}
				<YAxis
					domain={["auto", "auto"]}
					tickFormatter={(val) =>
						chartMode === "PERCENTAGE"
							? `${val}%`
							: val >= 1000
								? `${(val / 1000).toFixed(0)}k`
								: val
					}
					tick={{ fontSize: 10, fill: "#64748b" }}
					tickLine={false}
					axisLine={false}
					width={45}
					tickMargin={5}
				/>
				<Tooltip
					content={<CustomChartTooltip chartMode={chartMode} />}
					cursor={{ fill: "rgba(255,255,255,0.05)" }}
				/>

				<Line
					type="monotone"
					dataKey="value"
					stroke="#3b82f6"
					strokeWidth={2}
					dot={false}
					activeDot={{ r: 4, fill: "#3b82f6" }}
				/>

				{transactions.length > 0 && (
					<Scatter dataKey="buyEvent" fill="#10b981" />
				)}
				{transactions.length > 0 && (
					<Scatter dataKey="sellEvent" fill="#ef4444" />
				)}
			</ComposedChart>
		</ResponsiveContainer>
	);

	if (!isFullscreen) {
		return (
			<div className="relative w-full h-full flex flex-col group">
				<ChartLegend chartMode={chartMode} transactions={transactions} />
				<div className="flex-1 relative">
					<button
						onClick={() => setIsFullscreen(true)}
						className="absolute top-2 right-2 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-600 shadow-sm"
						title="Pełny ekran"
					>
						<Maximize2 className="w-4 h-4" />
					</button>
					{chartContentElement}
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-xl font-black text-white uppercase tracking-widest">
						Analiza Wartości Portfela
					</h2>
					<p className="text-slate-400 text-sm mt-1 mb-4">
						Szczegółowy widok wartości inwestycji ze wskaźnikami aktywności
					</p>
					<ChartLegend chartMode={chartMode} transactions={transactions} />
				</div>
				<button
					onClick={() => setIsFullscreen(false)}
					className="p-3 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-xl transition-colors border border-slate-700 hover:border-rose-500/50 self-start"
				>
					<Minimize2 className="w-5 h-5" />
				</button>
			</div>

			<div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-8 shadow-2xl">
				{chartContentElement}
			</div>
		</div>
	);
}

function CustomChartTooltip({ active, payload, label, chartMode }: any) {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		const dateStr = format(new Date(label), "dd MMMM yyyy", { locale: pl });
		const valueStr =
			chartMode === "PERCENTAGE"
				? `${data.value.toFixed(2)}%`
				: `${data.value.toFixed(2)} PLN`;

		return (
			<div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-xl z-50 min-w-[200px]">
				<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
					{dateStr}
				</p>
				<p className="text-sm font-bold text-blue-400 mb-1">
					Wycena: <span className="text-white">{valueStr}</span>
				</p>

				{data.txDetails && data.txDetails.length > 0 && (
					<div className="mt-3 pt-3 border-t border-slate-800/80 border-dashed space-y-2">
						<p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
							Zdarzenia w tym dniu:
						</p>
						{data.txDetails.map((tx: any, idx: number) => {
							const isBuy = tx.type === "BUY" || tx.type === "DEPOSIT";
							return (
								<div
									key={idx}
									className="flex justify-between items-center gap-4 text-xs"
								>
									<span
										className={
											isBuy
												? "text-emerald-400 font-bold"
												: "text-rose-400 font-bold"
										}
									>
										{isBuy ? "KUPNO" : "SPRZEDAŻ"} {tx.ticker || tx.assetName}
									</span>
									<span className="text-slate-300 font-mono">
										{Math.abs(tx.executedValue).toLocaleString("pl-PL", {
											minimumFractionDigits: 2,
										})}{" "}
										PLN
									</span>
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

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

// Pomocnicza funkcja do ustalania końca dnia z formatu YYYY-MM-DD
const getEndOfDayTime = (dateStr: string) => {
	const [year, month, day] = dateStr.split("-").map(Number);
	return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
};

export function ExpandableMainChart({
	data,
	transactions = [],
	chartMode,
}: ExpandableMainChartProps) {
	const [isFullscreen, setIsFullscreen] = useState(false);

	const mergedData = useMemo(() => {
		if (!data || data.length === 0) return [];

		// Dla optymalizacji parsujemy timestampy i ładne formaty dat raz
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
			// Ustalamy koniec okna czasowego (koniec obecnego dnia na wykresie)
			const currentPointTime = getEndOfDayTime(point.date);

			// Ustalamy początek okna czasowego
			let prevPointTime = 0;
			if (index > 0) {
				prevPointTime = getEndOfDayTime(data[index - 1].date);
			} else {
				// Dla pierwszego punktu sprawdzamy tylko ten jeden dzień (od północy)
				const [year, month, day] = point.date.split("-").map(Number);
				prevPointTime =
					new Date(year, month - 1, day, 0, 0, 0, 0).getTime() - 1;
			}

			// MAGIA: Szukamy transakcji, które wydarzyły się POMIĘDZY poprzednim a obecnym punktem (Okno Czasowe)
			const periodTxs = txsWithTime.filter((t) => {
				return t.parsedTime > prevPointTime && t.parsedTime <= currentPointTime;
			});

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

	// Komponent Legendy
	// const ChartLegend = () => (
	// 	<div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 pl-2">
	// 		<div className="flex items-center gap-1.5">
	// 			<div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
	// 			{chartMode === "VALUE" ? "Wartość Portfela" : "Zwrot Portfela"}
	// 		</div>
	// 		{transactions.length > 0 && (
	// 			<>
	// 				<div className="flex items-center gap-1.5">
	// 					<div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
	// 					Kupno / Wpłata
	// 				</div>
	// 				<div className="flex items-center gap-1.5">
	// 					<div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
	// 					Sprzedaż / Wypłata
	// 				</div>
	// 			</>
	// 		)}
	// 	</div>
	// );

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
							Zdarzenia w tym okresie:
						</p>
						{data.txDetails.map((tx: any, idx: number) => {
							const isBuy = tx.type === "BUY" || tx.type === "DEPOSIT";
							return (
								<div key={idx} className="flex flex-col mb-2 last:mb-0">
									<div className="flex justify-between items-center gap-4 text-xs">
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
											{Math.abs(tx.executedValue || 0).toLocaleString("pl-PL", {
												minimumFractionDigits: 2,
											})}{" "}
											PLN
										</span>
									</div>
									{/* Nowość: Data ukrytej transakcji w Tooltipie */}
									<span className="text-[9px] text-slate-500 mt-0.5">
										{tx.formattedDate}
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

"use client";

import {
	CartesianGrid,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Scatter,
	Tooltip,
	TooltipProps,
	XAxis,
	YAxis,
} from "recharts";
import {
	NameType,
	ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getCachedHistoricalPrices } from "@/lib/actions/yahoo.actions";
import { pl } from "date-fns/locale";

export interface TransactionPoint {
	date: string;
	type: "BUY" | "SELL";
	price: number;
}

interface AssetHistoryChartProps {
	ticker: string;
	transactions: TransactionPoint[];
}

export function AssetHistoryChart({
	ticker,
	transactions,
}: AssetHistoryChartProps) {
	const [chartData, setChartData] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function loadData() {
			if (!ticker) return;
			setIsLoading(true);

			const sortedTxs = [...transactions].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			);

			const startDate =
				sortedTxs.length > 0
					? new Date(
							new Date(sortedTxs[0].date).getTime() - 14 * 24 * 60 * 60 * 1000,
						)
					: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

			// ZMIANA: Przesyłamy datę jako tekst za pomocą .toISOString()
			const rawYahooData = await getCachedHistoricalPrices(
				ticker,
				startDate.toISOString(),
			);

			const mergedData = rawYahooData.map((day: any) => {
				const txOnThisDay = transactions.find((t) => t.date === day.date);

				return {
					date: day.date,
					price: day.price,
					// FIX: Kropka "przykleja" się fizycznie do linii ceny rynkowej z Yahoo!
					buyPoint: txOnThisDay?.type === "BUY" ? day.price : null,
					sellPoint: txOnThisDay?.type === "SELL" ? day.price : null,
					// Zapisujemy Twoją cenę z bazy danych specjalnie dla Tooltipa
					actualTxPricePln: txOnThisDay ? txOnThisDay.price : null,
				};
			});

			setChartData(mergedData);
			setIsLoading(false);
		}

		loadData();
	}, [ticker, transactions]);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center h-48 sm:h-64 border border-t-border-subtle rounded-xl bg-t-bg-panel/50">
				<Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
				<span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
					Pobieranie notowań giełdowych...
				</span>
			</div>
		);
	}

	if (chartData.length === 0) {
		return (
			<div className="flex items-center justify-center h-48 text-xs font-bold uppercase text-slate-500">
				Brak danych historycznych dla tego tickera.
			</div>
		);
	}

	return (
		<div className="h-64 w-full p-2 bg-t-bg-panel border border-t-border rounded-xl">
			{/* ZMIANA: Twarda wysokość (height={240}), by zapobiec załamywaniu się wykresu do 0x0 przy animacji */}
			<ResponsiveContainer width="100%" height={240}>
				<ComposedChart
					data={chartData}
					margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
				>
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
					<YAxis hide domain={["auto", "auto"]} />
					<Tooltip
						content={<CustomTxTooltip />}
						cursor={{ fill: "rgba(255,255,255,0.05)" }}
					/>
					<Line
						type="monotone"
						dataKey="price"
						stroke="#3b82f6"
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 4, fill: "#3b82f6" }}
					/>
					<Scatter dataKey="buyPoint" fill="#10b981" />
					<Scatter dataKey="sellPoint" fill="#ef4444" />
				</ComposedChart>
			</ResponsiveContainer>
		</div>
	);
}

// ZMIANA: Zamień obecną funkcję CustomTxTooltip na tę:
function CustomTxTooltip({ active, payload, label }: any) {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		const dateStr = format(new Date(label), "dd MMMM yyyy", { locale: pl });

		return (
			<div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 shadow-xl z-50">
				<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">
					{dateStr}
				</p>
				<p className="text-sm font-bold text-blue-400">
					Wycena rynkowa: {data.price.toFixed(2)}
				</p>

				{data.actualTxPricePln && (
					<div className="mt-2 pt-2 border-t border-slate-800 border-dashed">
						<p className="text-xs font-bold text-slate-300">
							Twój kurs (baza):{" "}
							<span className="text-white">
								{data.actualTxPricePln.toFixed(2)} PLN
							</span>
						</p>
						{data.buyPoint && (
							<p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mt-1">
								🎯 Dokonano zakupu
							</p>
						)}
						{data.sellPoint && (
							<p className="text-[11px] font-black text-rose-500 uppercase tracking-widest mt-1">
								🤝 Sprzedaż waloru
							</p>
						)}
					</div>
				)}
			</div>
		);
	}
	return null;
}

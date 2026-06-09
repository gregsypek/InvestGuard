"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface PnLDataPoint {
	date: string;
	change: number;
	isPositive: boolean;
}

interface DailyPnLChartProps {
	data: PnLDataPoint[];
}

export function DailyPnLChart({ data }: DailyPnLChartProps) {
	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-center h-full opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
					Zbyt mało danych do obliczenia zmienności
				</p>
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
				{/* Subtelna siatka z tyłu, tylko poziome linie dla odniesienia do zera */}
				<CartesianGrid
					strokeDasharray="3 3"
					vertical={false}
					stroke="rgba(255,255,255,0.05)"
				/>

				<XAxis
					dataKey="date"
					axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#64748b" }}
					tickMargin={10}
					tickFormatter={(val) =>
						format(new Date(val), "dd MMM", { locale: pl })
					}
				/>

				<YAxis hide domain={["auto", "auto"]} />

				<Tooltip
					content={<CustomPnLTooltip />}
					cursor={{ fill: "rgba(255,255,255,0.02)" }}
				/>

				<Bar dataKey="change" radius={[4, 4, 4, 4]}>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							// Szmaragdowy dla zysku, Czerwony dla straty
							fill={entry.isPositive ? "#10b981" : "#ef4444"}
							fillOpacity={0.8}
						/>
					))}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}

// ----------------------------------------------------------------------
// Dedykowany dymek z plusem/minusem
// ----------------------------------------------------------------------
function CustomPnLTooltip({ active, payload, label }: any) {
	if (active && payload && payload.length) {
		const value = payload[0].value;
		const isPositive = value >= 0;
		const date = new Date(label);

		return (
			<div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl">
				<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
					{format(date, "dd MMMM yyyy", { locale: pl })}
				</p>
				<p
					className={`text-lg font-black ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
				>
					{isPositive ? "+" : ""}
					{new Intl.NumberFormat("pl-PL", {
						style: "currency",
						currency: "PLN",
					}).format(value)}
				</p>
			</div>
		);
	}
	return null;
}

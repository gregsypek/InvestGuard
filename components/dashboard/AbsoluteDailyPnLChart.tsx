"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { format } from "date-fns";
import { pl } from "date-fns/locale";

// EN: Interface for exact nominal daily changes
interface AbsolutePnLDataPoint {
	date: string;
	exactChangePLN: number;
	totalPortfolioValue: number;
}

interface AbsoluteDailyPnLChartProps {
	data: AbsolutePnLDataPoint[];
}

export function AbsoluteDailyPnLChart({ data }: AbsoluteDailyPnLChartProps) {
	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-center h-full opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
					Brak danych do wyliczenia dziennego wyniku
				</p>
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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

				{/* EN: A clear zero-line to separate profits from losses */}
				<ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />

				<Tooltip
					content={<AbsolutePnLTooltip />}
					cursor={{ fill: "rgba(255,255,255,0.02)" }}
				/>

				<Bar dataKey="exactChangePLN" radius={[4, 4, 4, 4]}>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							// EN: Emerald for profit, Rose for loss
							fill={entry.exactChangePLN >= 0 ? "#10b981" : "#ef4444"}
							fillOpacity={0.85}
						/>
					))}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}

// EN: Custom Tooltip showing exact monetary values
function AbsolutePnLTooltip({ active, payload, label }: any) {
	if (active && payload && payload.length) {
		const changeValue = payload[0].payload.exactChangePLN;
		const totalValue = payload[0].payload.totalPortfolioValue;
		const isPositive = changeValue >= 0;
		const date = new Date(label);

		return (
			<div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-xl min-w-[180px]">
				<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
					{format(date, "dd MMMM yyyy", { locale: pl })}
				</p>

				<div className="space-y-1 mb-2">
					<p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
						Dzienny Wynik
					</p>
					<p
						className={`text-xl font-black tracking-tight ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
					>
						{isPositive ? "+" : ""}
						{new Intl.NumberFormat("pl-PL", {
							style: "currency",
							currency: "PLN",
						}).format(changeValue)}
					</p>
				</div>

				<div className="mt-3 pt-2 border-t border-slate-800/50 flex justify-between items-center">
					<span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
						Wartość portfela:
					</span>
					<span className="text-[10px] text-slate-300 font-bold">
						{new Intl.NumberFormat("pl-PL", {
							style: "currency",
							currency: "PLN",
							maximumFractionDigits: 0,
						}).format(totalValue)}
					</span>
				</div>
			</div>
		);
	}
	return null;
}

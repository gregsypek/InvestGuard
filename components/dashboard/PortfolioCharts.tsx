"use client";

import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useMemo } from "react";

interface ChartDataPoint {
	date: string;
	value: number;
}

interface PortfolioChartProps {
	data: ChartDataPoint[];
}

export function PortfolioChart({ data }: PortfolioChartProps) {
	// Jeśli nie mamy danych (np. nowy użytkownik), pokazujemy komunikat
	if (!data || data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
				<p className="text-sm font-bold uppercase tracking-widest text-t-text-secondary">
					Brak danych historycznych
				</p>
				<p className="text-xs text-t-text-tertiary">
					Wykres pojawi się, gdy system wygeneruje pierwszą migawkę (Snapshot).
				</p>
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
				<defs>
					{/* Definiujemy gradient tła pod wykresem */}
					<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
						<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
					</linearGradient>
				</defs>

				{/* Subtelna siatka z tyłu */}
				<CartesianGrid
					strokeDasharray="3 3"
					vertical={false}
					stroke="rgba(255,255,255,0.05)"
				/>

				<XAxis
					dataKey="date"
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#64748b" }}
					tickMargin={10}
					tickFormatter={(val) => {
						// Formatowanie daty na osi X (np. "05 Cze")
						const date = new Date(val);
						return format(date, "dd MMM", { locale: pl });
					}}
				/>

				<YAxis
					hide // Ukrywamy oś Y dla czystszego designu, wartości będą w Tooltipie
					domain={["auto", "auto"]}
				/>

				{/* Nasz Customowy, szklany Tooltip */}
				<Tooltip
					content={<CustomTooltip />}
					cursor={{
						stroke: "rgba(255,255,255,0.1)",
						strokeWidth: 1,
						strokeDasharray: "4 4",
					}}
				/>

				{/* Główna linia wykresu z wypełnieniem */}
				<Area
					type="monotone"
					dataKey="value"
					stroke="#3b82f6"
					strokeWidth={3}
					fillOpacity={1}
					fill="url(#colorValue)"
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}

// ----------------------------------------------------------------------
// Szklany, designerski dymek po najechaniu na wykres
// ----------------------------------------------------------------------
function CustomTooltip({ active, payload, label }: any) {
	if (active && payload && payload.length) {
		const value = payload[0].value;
		const date = new Date(label);

		return (
			<div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl">
				<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
					{format(date, "dd MMMM yyyy", { locale: pl })}
				</p>
				<p className="text-lg font-black text-white">
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

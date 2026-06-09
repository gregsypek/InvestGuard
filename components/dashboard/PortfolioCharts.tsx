"use client";

import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import Image from "next/image";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface ChartDataPoint {
	date: string;
	value: number; // Wartość rynkowa
	invested: number; // Wpłacony kapitał
}

interface PortfolioChartProps {
	data: ChartDataPoint[];
}

export function PortfolioChart({ data }: PortfolioChartProps) {
	if (!data || data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
				<p className="text-sm font-bold uppercase tracking-widest text-t-text-secondary">
					Brak danych historycznych
				</p>
			</div>
		);
	}

	return (
		<div className="relative w-full h-full">
			{/* Znak wodny w tle */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
				<div className="relative w-32 h-32 md:w-48 md:h-48 opacity-[0.03] dark:opacity-5 grayscale">
					<Image
						src="/logo-light.svg"
						alt="Watermark"
						fill
						className="object-contain"
					/>
				</div>
			</div>

			<div className="relative z-10 w-full h-full">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={data}
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
							axisLine={false}
							tickLine={false}
							tick={{ fontSize: 10, fill: "#475569" }}
							tickMargin={10}
							tickFormatter={(val) =>
								format(new Date(val), "dd MMM", { locale: pl })
							}
						/>

						<YAxis hide domain={["auto", "auto"]} />

						<Tooltip
							content={<CustomTooltip />}
							cursor={{
								stroke: "rgba(255,255,255,0.1)",
								strokeWidth: 1,
								strokeDasharray: "4 4",
							}}
						/>

						{/* Warstwa 1: Główna wartość portfela (z gradientem) */}
						<Area
							type="monotone"
							dataKey="value"
							stroke="#3b82f6"
							strokeWidth={3}
							fillOpacity={1}
							fill="url(#colorValue)"
							activeDot={{
								r: 6,
								fill: "#3b82f6",
								stroke: "#1e293b",
								strokeWidth: 2,
							}}
						/>

						{/* Warstwa 2: Przerywana linia włożonego kapitału */}
						<Line
							type="stepAfter" // Kształt 'schodków', bo kapitał wpłacamy skokowo
							dataKey="invested"
							stroke="#64748b" // Kolor szary/slate
							strokeWidth={2}
							strokeDasharray="5 5" // Efekt przerywanej linii
							dot={false}
							activeDot={false}
						/>
					</ComposedChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------
// Rozbudowany szklany Tooltip z wyliczeniem zysku
// ----------------------------------------------------------------------
function CustomTooltip({ active, payload, label }: any) {
	if (active && payload && payload.length) {
		const valueData = payload.find((p: any) => p.dataKey === "value");
		const investedData = payload.find((p: any) => p.dataKey === "invested");

		const value = valueData?.value || 0;
		const invested = investedData?.value || 0;

		const profit = value - invested;
		const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;
		const isProfit = profit >= 0;

		return (
			<div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl min-w-[200px]">
				<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
					{format(new Date(label), "dd MMMM yyyy", { locale: pl })}
				</p>

				<div className="space-y-2 mb-3">
					<div className="flex justify-between items-center text-xs">
						<span className="text-slate-400">Wartość portfela:</span>
						<span className="font-bold text-white ">
							{new Intl.NumberFormat("pl-PL", {
								style: "currency",
								currency: "PLN",
							}).format(value)}
						</span>
					</div>

					<div className="flex justify-between items-center text-xs">
						<span className="text-slate-400">Zainwestowano:</span>
						<span className="font-bold text-white">
							{new Intl.NumberFormat("pl-PL", {
								style: "currency",
								currency: "PLN",
							}).format(invested)}
						</span>
					</div>
				</div>

				<div className="pt-2 border-t border-white/10 flex justify-between items-center">
					<span className="text-xs font-bold text-slate-400">
						Całkowity wynik:
					</span>
					<div
						className={`text-right ${isProfit ? "text-emerald-400" : "text-rose-400"}`}
					>
						<p className="text-sm font-black">
							{isProfit ? "+" : ""}
							{new Intl.NumberFormat("pl-PL", {
								style: "currency",
								currency: "PLN",
							}).format(profit)}
						</p>
						<p className="text-[10px] font-bold">
							{isProfit ? "+" : ""}
							{profitPercent.toFixed(2)}%
						</p>
					</div>
				</div>
			</div>
		);
	}
	return null;
}

"use client";

import {
	Bar,
	CartesianGrid,
	Cell,
	ComposedChart,
	Legend,
	Line,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Maximize2, Minimize2 } from "lucide-react";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";

interface AbsolutePnLDataPoint {
	date: string;
	exactChangePLN: number;
	totalPortfolioValue: number;
	netCashFlow: number;
}

interface AbsoluteDailyPnLChartProps {
	data: AbsolutePnLDataPoint[];
}

export function AbsoluteDailyPnLChart({ data }: AbsoluteDailyPnLChartProps) {
	// EN: State to handle fullscreen expansion
	const [isExpanded, setIsExpanded] = useState(false);

	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-center h-full opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
					Brak danych do wyliczenia dziennego wyniku
				</p>
			</div>
		);
	}
	// 1. Wyliczamy maksymalne odchylenia dla ZYSKU (lewa oś) i dodajemy 10% marginesu
	const maxPnL = Math.max(...data.map((d) => Math.abs(d.exactChangePLN)), 50);
	const pnlDomain = maxPnL * 1.1;

	// 2. Wyliczamy maksymalne odchylenia dla WPŁAT (prawa oś) i dodajemy margines
	const maxCashFlow = Math.max(
		...data.map((d) => Math.abs(d.netCashFlow)),
		1000,
	);
	const cashDomain = maxCashFlow * 1.1;

	// EN: Reusable chart content for normal and expanded views
	const chartContent = (
		<ResponsiveContainer width="100%" height="100%">
			<ComposedChart
				data={data}
				margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
			>
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

				{/* EN: LEFT Y-AXIS - Strictly for daily market PnL bars */}
				<YAxis
					yAxisId="left"
					orientation="left"
					axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#a1a1aa" }}
					// EN: Format large numbers compactly (e.g., 15000 -> 15 tys.)
					tickFormatter={(val) =>
						new Intl.NumberFormat("pl-PL", {
							notation: "compact",
							maximumFractionDigits: 1,
						}).format(val) + " zł"
					}
					width={55}
					// WYMUSZAMY SYMETRIĘ WZGLĘDEM ZERA
					domain={[-pnlDomain, pnlDomain]}
				/>

				{/* EN: RIGHT Y-AXIS - Independent scale for cash deposits and withdrawals */}
				<YAxis
					yAxisId="right"
					orientation="right"
					axisLine={{ stroke: "rgba(59,130,246,0.2)" }}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#3b82f6" }}
					// tickFormatter={(val) => (val === 0 ? "" : `${val} zł`)}
					tickFormatter={(val) =>
						new Intl.NumberFormat("pl-PL", {
							notation: "compact",
							maximumFractionDigits: 1,
						}).format(val === 0 ? "" : `${val}`) + " zł"
					}
					width={55}
					// WYMUSZAMY SYMETRIĘ WZGLĘDEM ZERA
					domain={[-cashDomain, cashDomain]}
				/>

				{/* EN: Zero reference line bound to the left axis (market PnL) */}
				<ReferenceLine
					y={0}
					yAxisId="left"
					stroke="rgba(255,255,255,0.2)"
					strokeWidth={1}
				/>

				<Tooltip
					content={<AbsolutePnLTooltip />}
					cursor={{ fill: "rgba(255,255,255,0.02)" }}
				/>

				<Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />

				{/* EN: Bars are bound to the left Y-Axis */}
				<Bar
					yAxisId="left"
					dataKey="exactChangePLN"
					name="Dzienny Wynik Rynkowy"
					radius={[4, 4, 4, 4]}
				>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={entry.exactChangePLN >= 0 ? "#10b981" : "#ef4444"}
							fillOpacity={0.85}
						/>
					))}
				</Bar>

				{/* EN: Cash flow line is bound to the right Y-Axis to prevent compression */}
				<Line
					yAxisId="right"
					type="monotone"
					dataKey="netCashFlow"
					name="Wpłaty / Wypłaty"
					stroke="#3b82f6"
					strokeWidth={2}
					dot={(props) => {
						const { cx, cy, payload } = props;
						// EN: Only draw dots on days where actual cash flow occurred
						if (payload.netCashFlow !== 0) {
							return (
								<circle
									key={cx}
									cx={cx}
									cy={cy}
									r={4}
									fill="#3b82f6"
									stroke="none"
								/>
							);
						}
						return <script key={cx} />;
					}}
					activeDot={{ r: 5 }}
				/>
			</ComposedChart>
		</ResponsiveContainer>
	);

	// EN: Render fullscreen overlay
	if (isExpanded) {
		return (
			<div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md p-6 md:p-12 flex flex-col animate-in fade-in duration-200">
				<div className="flex justify-between items-center mb-6">
					<div>
						<h3 className="text-2xl font-bold text-white">
							Nominalny Wynik Dzienny
						</h3>
						<p className="text-sm text-slate-400">
							Widok szczegółowy (Lewa oś: Wynik rynkowy | Prawa oś: Wpłaty i
							Wypłaty)
						</p>
					</div>
					<button
						onClick={() => setIsExpanded(false)}
						className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors shadow-lg"
					>
						<Minimize2 className="w-6 h-6" />
					</button>
				</div>
				<div className="flex-1 min-h-0 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-8">
					{chartContent}
				</div>
			</div>
		);
	}

	// EN: Standard inline view
	return (
		<div className="relative w-full h-full group">
			<button
				onClick={() => setIsExpanded(true)}
				className="absolute top-0 right-0 z-10 p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm"
				title="Powiększ wykres"
			>
				<Maximize2 className="w-4 h-4" />
			</button>
			{chartContent}
		</div>
	);
}

// EN: Custom Tooltip logic for dual axis data layout
function AbsolutePnLTooltip({ active, payload, label }: any) {
	if (active && payload && payload.length) {
		const changeValue =
			payload.find((p: any) => p.dataKey === "exactChangePLN")?.value || 0;
		const netCashFlow =
			payload.find((p: any) => p.dataKey === "netCashFlow")?.value || 0;
		const totalValue = payload[0].payload.totalPortfolioValue;

		const isPositive = changeValue >= 0;
		const date = new Date(label);

		return (
			<div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-xl min-w-[220px]">
				<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
					{format(date, "dd MMMM yyyy", { locale: pl })}
				</p>

				<div className="space-y-1 mb-3">
					<p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
						Czysty Wynik Rynkowy
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

				{netCashFlow !== 0 && (
					<div className="mb-3 pt-2 border-t border-slate-800/50 flex justify-between items-center">
						<span className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">
							{netCashFlow > 0 ? "Wpłata:" : "Wypłata:"}
						</span>
						<span className="text-[11px] text-blue-400 font-bold">
							{netCashFlow > 0 ? "+" : ""}
							{new Intl.NumberFormat("pl-PL", {
								style: "currency",
								currency: "PLN",
								maximumFractionDigits: 0,
							}).format(netCashFlow)}
						</span>
					</div>
				)}

				<div className="mt-2 pt-2 border-t border-slate-800/50 flex justify-between items-center">
					<span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
						Suma aktywów:
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

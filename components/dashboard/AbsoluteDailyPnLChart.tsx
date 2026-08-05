"use client";

import {
	Area,
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
import { Maximize2, Minimize2, TrendingDown, TrendingUp } from "lucide-react";

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

	// EN: Aggregate trend for the whole visible period — shown as a small badge
	const totalPnL = data.reduce((acc, d) => acc + d.exactChangePLN, 0);
	const firstDay = data[0];
	// EN: Approximate baseline = portfolio value before the first day's own change
	const baselineValue =
		(firstDay?.totalPortfolioValue ?? 0) - (firstDay?.exactChangePLN ?? 0) || 1;
	const pnlPercent = (totalPnL / Math.abs(baselineValue)) * 100;
	const isPeriodPositive = totalPnL >= 0;

	// FIX: this is a plain function returning JSX — NOT a component declared
	// during render. Call it as trendBadge(true), never as <TrendBadge />,
	// otherwise React remounts it (and resets its state) on every render.
	const trendBadge = (compact = false) => (
		<div
			className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
				isPeriodPositive
					? "bg-emerald-500/10 border-emerald-500/20"
					: "bg-rose-500/10 border-rose-500/20"
			}`}
		>
			{isPeriodPositive ? (
				<TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
			) : (
				<TrendingDown className="w-3.5 h-3.5 text-rose-400" />
			)}
			<span
				className={`text-[11px] font-bold tabular-nums ${
					isPeriodPositive ? "text-emerald-400" : "text-rose-400"
				}`}
			>
				{isPeriodPositive ? "+" : ""}
				{pnlPercent.toFixed(2)}%
			</span>
			{!compact && (
				<span
					className={`text-[10px] font-semibold tabular-nums opacity-80 ${
						isPeriodPositive ? "text-emerald-400" : "text-rose-400"
					}`}
				>
					(
					{new Intl.NumberFormat("pl-PL", {
						style: "currency",
						currency: "PLN",
						maximumFractionDigits: 0,
					}).format(totalPnL)}
					)
				</span>
			)}
		</div>
	);

	// EN: Custom legend — small colored dots instead of Recharts' default squares
	const renderLegend = () => (
		<div className="flex items-center justify-center gap-6 pt-3">
			<div className="flex items-center gap-2">
				<span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
				<span className="text-[11px] font-semibold text-slate-400 tracking-wide">
					Dzienny Wynik Rynkowy
				</span>
			</div>
			<div className="flex items-center gap-2">
				<span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
				<span className="text-[11px] font-semibold text-slate-400 tracking-wide">
					Wpłaty / Wypłaty
				</span>
			</div>
		</div>
	);

	// EN: Reusable chart content for normal and expanded views
	const chartContent = (
		<ResponsiveContainer width="100%" height="100%">
			<ComposedChart
				data={data}
				margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
			>
				<defs>
					{/* EN: Gradients for gain / loss bars — richer than a flat fill */}
					<linearGradient id="positiveBarGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
						<stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
					</linearGradient>
					<linearGradient id="negativeBarGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#fb7185" stopOpacity={0.95} />
						<stop offset="100%" stopColor="#e11d48" stopOpacity={0.85} />
					</linearGradient>

					{/* EN: Blue gradient stroke for the cash flow line — the app's accent color */}
					<linearGradient id="cashFlowGradient" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stopColor="#60a5fa" />
						<stop offset="50%" stopColor="#3b82f6" />
						<stop offset="100%" stopColor="#2563eb" />
					</linearGradient>

					{/* EN: Vertical fade for the area under the cash flow line */}
					<linearGradient id="cashFlowAreaGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
						<stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
					</linearGradient>

					{/* EN: Soft glow filter applied to cash flow dots for a premium feel */}
					<filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
						<feGaussianBlur stdDeviation="3" result="blur" />
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				<CartesianGrid
					strokeDasharray="2 6"
					vertical={false}
					stroke="rgba(148,163,184,0.08)"
				/>

				<XAxis
					dataKey="date"
					axisLine={{ stroke: "rgba(148,163,184,0.12)" }}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
					tickMargin={12}
					tickFormatter={(val) =>
						format(new Date(val), "dd MMM", { locale: pl })
					}
				/>

				{/* EN: LEFT Y-AXIS - Strictly for daily market PnL bars */}
				<YAxis
					yAxisId="left"
					orientation="left"
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
					tickFormatter={(val) =>
						`${new Intl.NumberFormat("pl-PL", {
							notation: "compact",
							maximumFractionDigits: 1,
						}).format(val)} zł`
					}
					width={58}
					// WYMUSZAMY SYMETRIĘ WZGLĘDEM ZERA
					domain={[-pnlDomain, pnlDomain]}
				/>

				{/* EN: RIGHT Y-AXIS - Independent scale for cash deposits and withdrawals */}
				<YAxis
					yAxisId="right"
					orientation="right"
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#3b82f6", fontWeight: 600 }}
					// FIX: zero now returns an actual empty string instead of being
					// passed through Intl.NumberFormat (which coerced "" -> 0 -> "0 zł")
					tickFormatter={(val) =>
						val === 0
							? ""
							: `${new Intl.NumberFormat("pl-PL", {
									notation: "compact",
									maximumFractionDigits: 1,
								}).format(val)} zł`
					}
					width={58}
					// WYMUSZAMY SYMETRIĘ WZGLĘDEM ZERA
					domain={[-cashDomain, cashDomain]}
				/>

				{/* EN: Zero reference line bound to the left axis (market PnL) */}
				<ReferenceLine
					y={0}
					yAxisId="left"
					stroke="rgba(148,163,184,0.25)"
					strokeWidth={1}
				/>

				<Tooltip
					content={<AbsolutePnLTooltip />}
					cursor={{ fill: "rgba(59,130,246,0.04)" }}
				/>

				<Legend content={renderLegend} />

				{/* EN: Bars are bound to the left Y-Axis */}
				<Bar
					yAxisId="left"
					dataKey="exactChangePLN"
					name="Dzienny Wynik Rynkowy"
					radius={[6, 6, 6, 6]}
					maxBarSize={28}
				>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={
								entry.exactChangePLN >= 0
									? "url(#positiveBarGradient)"
									: "url(#negativeBarGradient)"
							}
						/>
					))}
				</Bar>

				{/* EN: Soft fill under the cash flow line, purely decorative */}
				<Area
					yAxisId="right"
					type="monotone"
					dataKey="netCashFlow"
					stroke="none"
					fill="url(#cashFlowAreaGradient)"
					legendType="none"
					tooltipType="none"
				/>

				{/* EN: Cash flow line is bound to the right Y-Axis to prevent compression */}
				<Line
					yAxisId="right"
					type="monotone"
					dataKey="netCashFlow"
					name="Wpłaty / Wypłaty"
					stroke="url(#cashFlowGradient)"
					strokeDasharray="5 5"
					strokeOpacity={0.7}
					strokeWidth={2.5}
					dot={(props: any) => {
						const { cx, cy, payload } = props;
						// EN: Only draw dots on days where actual cash flow occurred
						// FIX: was returning an invalid <script> element as a no-op;
						// returning null is the correct way to render "nothing" here.
						if (payload.netCashFlow !== 0) {
							return (
								<circle
									key={cx}
									cx={cx}
									cy={cy}
									r={4}
									fill="#3b82f6"
									stroke="#0f172a"
									strokeWidth={1.5}
									filter="url(#dotGlow)"
								/>
							);
						}
						return null;
					}}
					activeDot={{
						r: 6,
						fill: "#3b82f6",
						stroke: "#fff",
						strokeWidth: 2,
						filter: "url(#dotGlow)",
					}}
				/>
			</ComposedChart>
		</ResponsiveContainer>
	);

	// EN: Render fullscreen overlay
	if (isExpanded) {
		return (
			<div className="fixed inset-0 z-[100] bg-slate-950/97 backdrop-blur-xl p-6 md:p-12 flex flex-col animate-in fade-in duration-200">
				{/* EN: Subtle radial blue glow in the background for a premium fintech feel */}
				<div
					className="pointer-events-none absolute inset-0 opacity-40"
					style={{
						background:
							"radial-gradient(circle at 15% 10%, rgba(59,130,246,0.12), transparent 45%)",
					}}
				/>
				<div className="relative flex justify-between items-center mb-6">
					<div className="flex items-start gap-3 flex-col  sm:flex-row">
						<div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
							<TrendingUp className="w-5 h-5 text-blue-400" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-white tracking-tight">
								Nominalny Wynik Dzienny
							</h3>
							<p className="text-sm text-slate-400">
								Widok szczegółowy · Lewa oś: wynik rynkowy · Prawa oś: wpłaty i
								wypłaty
							</p>
						</div>
						<div className="ml-2">{trendBadge(false)}</div>
					</div>
					<button
						onClick={() => setIsExpanded(false)}
						className="p-2.5 bg-slate-800/80 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 rounded-xl transition-colors shadow-lg border border-slate-700/50 hover:border-blue-500/30"
					>
						<Minimize2 className="w-6 h-6" />
					</button>
				</div>
				<div className="relative flex-1 min-h-0 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-8 shadow-2xl">
					{chartContent}
				</div>
			</div>
		);
	}

	// EN: Standard inline view
	// FIX: the badge used to be `absolute top-0 left-0`, floating directly on
	// top of the chart's left Y-axis labels. It now sits in a real flex row
	// that takes up its own space, so the chart is pushed down instead of
	// being covered.
	return (
		<div className="relative w-full h-full flex flex-col group">
			<div className="flex items-center justify-between px-1 pb-2 shrink-0">
				<div>{trendBadge(true)}</div>
				<button
					onClick={() => setIsExpanded(true)}
					className="p-1.5 bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-400 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-sm z-10"
					title="Powiększ wykres"
				>
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>
			<div className="flex-1 min-h-0">{chartContent}</div>
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
			<div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/40 rounded-2xl p-4 shadow-2xl shadow-black/40 min-w-[230px] overflow-hidden">
				{/* EN: Thin accent bar on top, colored by the day's result */}
				<div
					className={`absolute top-0 left-0 right-0 h-[2px] ${
						isPositive
							? "bg-gradient-to-r from-emerald-400 to-emerald-600"
							: "bg-gradient-to-r from-rose-400 to-rose-600"
					}`}
				/>

				<p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
					{format(date, "dd MMMM yyyy", { locale: pl })}
				</p>

				<div className="space-y-1 mb-3">
					<p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
						Czysty Wynik Rynkowy
					</p>
					<p
						className={`text-xl font-black tracking-tight ${
							isPositive ? "text-emerald-400" : "text-rose-400"
						}`}
					>
						{isPositive ? "+" : ""}
						{new Intl.NumberFormat("pl-PL", {
							style: "currency",
							currency: "PLN",
						}).format(changeValue)}
					</p>
				</div>

				{netCashFlow !== 0 && (
					<div className="mb-3 pt-2 border-t border-slate-800/50 flex justify-between items-center bg-blue-500/5 -mx-1 px-1 py-1.5 rounded-lg">
						<span className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">
							{netCashFlow > 0 ? "Wpłata" : "Wypłata"}
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
						Suma aktywów
					</span>
					<span className="text-[10px] text-slate-200 font-bold">
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

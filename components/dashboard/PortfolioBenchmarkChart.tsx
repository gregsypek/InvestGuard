"use client";

import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	CheckCircle2,
	Circle,
	Maximize2,
	Minimize2,
	TrendingDown,
	TrendingUp,
} from "lucide-react";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";

interface BenchmarkDataPoint {
	date: string;
	portfolioPct: number;
	[indexName: string]: string | number;
}

interface PortfolioBenchmarkChartProps {
	data: BenchmarkDataPoint[];
	userIndices: string[];
}

const INDEX_COLORS: Record<string, string> = {
	SP500: "#8b5cf6", // Violet
	NASDAQ: "#ec4899", // Pink
	WIG20: "#3b82f6", // Zmieniony na trochę przyjemniejszy, nowoczesny niebieski
	DAX: "#06b6d4", // Cyan
	BTC: "#f59e0b", // Złoty pomarańcz
	GOLD: "#fbbf24", // Złoty
};

export function PortfolioBenchmarkChart({
	data,
	userIndices,
}: PortfolioBenchmarkChartProps) {
	const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
	const [isExpanded, setIsExpanded] = useState(false);

	const toggleLine = (dataKey: string) => {
		setHiddenLines((prev) => ({
			...prev,
			[dataKey]: !prev[dataKey],
		}));
	};

	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-center h-full opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-slate-500">
					Brak danych do porównania
				</p>
			</div>
		);
	}

	// Wyciągamy ostatni dzień, by pokazać łączny wynik portfela w Badge
	const lastDay = data[data.length - 1];
	const currentPortfolioPct = lastDay?.portfolioPct || 0;
	const isPortfolioPositive = currentPortfolioPct >= 0;

	// Maksymalne odchylenia do symetrii osi Y (opcjonalne, ale ładnie wygląda przy małych wahaniach)
	const allValues = data.flatMap((d) => [
		d.portfolioPct,
		...userIndices.map((idx) => Number(d[idx]) || 0),
	]);
	const maxAbsValue = Math.max(...allValues.map(Math.abs), 5);
	const yDomain = Math.ceil(maxAbsValue * 1.1);

	// Odznaka trendu dla głównego portfela
	const trendBadge = (compact = false) => (
		<div
			className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
				isPortfolioPositive
					? "bg-emerald-500/10 border-emerald-500/20"
					: "bg-rose-500/10 border-rose-500/20"
			}`}
		>
			{isPortfolioPositive ? (
				<TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
			) : (
				<TrendingDown className="w-3.5 h-3.5 text-rose-400" />
			)}
			<span
				className={`text-[11px] font-bold tabular-nums ${
					isPortfolioPositive ? "text-emerald-400" : "text-rose-400"
				}`}
			>
				{!compact && (
					<span className="text-slate-400 mr-1 font-medium">Twój Portfel:</span>
				)}
				{isPortfolioPositive ? "+" : ""}
				{currentPortfolioPct.toFixed(2)}%
			</span>
		</div>
	);

	// Własna, w pełni kontrolowana legenda UI
	// Własna, w pełni kontrolowana legenda UI
	const renderCustomLegend = ({ payload }: any) => {
		return (
			<div className="mt-4">
				<ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
					{payload.map((entry: any) => {
						// Zabezpieczenie przed błędem z Recharts
						const dataKey = String(entry.dataKey);
						const isHidden = hiddenLines[dataKey];
						const isPortfolio = dataKey === "portfolioPct";

						// Dla portfela wymuszamy zielony kolor
						const itemColor = isPortfolio ? "#10b981" : entry.color;

						return (
							<li
								key={dataKey}
								onClick={() => !isPortfolio && toggleLine(dataKey)}
								className={`flex items-center gap-1.5 transition-all duration-300 ${
									isHidden
										? "opacity-40 grayscale cursor-pointer"
										: "opacity-100 hover:opacity-80 hover:scale-105 " +
											(isPortfolio ? "cursor-default" : "cursor-pointer")
								}`}
							>
								{!isHidden ? (
									<CheckCircle2
										className={`w-4 h-4 transition-all ${isPortfolio ? "animate-pulse" : ""}`}
										style={{
											color: itemColor,
											filter: `drop-shadow(0 0 6px ${itemColor}60)`,
										}}
									/>
								) : (
									<Circle
										className="w-4 h-4 transition-all"
										style={{ color: itemColor }}
									/>
								)}
								<span
									className={`text-[10px] font-bold uppercase tracking-widest ${isPortfolio ? "text-slate-200" : "text-slate-400"}`}
								>
									{entry.value}
								</span>
							</li>
						);
					})}
				</ul>
				<p className="text-[9px] text-center text-slate-500 uppercase tracking-widest font-bold mt-4 opacity-70">
					💡 Kliknij w nazwę indeksu, aby włączyć lub wyłączyć go z wykresu
				</p>
			</div>
		);
	};

	const chartContent = (
		<ResponsiveContainer width="100%" height="100%">
			<LineChart
				data={data}
				margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
			>
				<defs>
					<linearGradient id="portfolioGradient" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stopColor="#34d399" />
						<stop offset="50%" stopColor="#10b981" />
						<stop offset="100%" stopColor="#059669" />
					</linearGradient>

					{/* Delikatny efekt świecenia dla linii Głównego Portfela */}
					<filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
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
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
					tickMargin={12}
					tickFormatter={(val) =>
						format(new Date(val), "dd MMM", { locale: pl })
					}
				/>

				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
					tickFormatter={(val) => `${val > 0 ? "+" : ""}${val}%`}
					domain={[-yDomain, yDomain]}
				/>

				<ReferenceLine y={0} stroke="rgba(148,163,184,0.25)" strokeWidth={1} />

				<Tooltip
					content={<BenchmarkTooltip hiddenLines={hiddenLines} />}
					cursor={{ stroke: "rgba(148,163,184,0.15)", strokeWidth: 2 }}
					wrapperStyle={{ zIndex: 100 }}
				/>

				{/* 🚀 ZMODYFIKOWANA LEGENDA */}
				<Legend
					content={renderCustomLegend}
					verticalAlign="bottom"
					wrapperStyle={{
						paddingTop: "24px", // Odsuwa legendę od linii wykresu
						position: "relative", // Zapobiega nakładaniu się z Tooltipem
					}}
				/>

				{/* Zwykłe indeksy - renderowane pod spodem */}
				{userIndices.map((indexKey) => (
					<Line
						key={indexKey}
						type="monotone"
						dataKey={indexKey}
						name={indexKey}
						stroke={INDEX_COLORS[indexKey] || "#cbd5e1"}
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 4, strokeWidth: 0 }}
						hide={hiddenLines[indexKey]}
						opacity={0.8}
					/>
				))}

				{/* Twój portfel - Renderowany na samym końcu (zawsze na wierzchu) */}
				<Line
					type="monotone"
					dataKey="portfolioPct"
					name="Twój Portfel"
					stroke="url(#portfolioGradient)"
					strokeWidth={3.5}
					dot={false}
					activeDot={{
						r: 6,
						fill: "#10b981",
						stroke: "#fff",
						strokeWidth: 2,
					}}
					filter="url(#lineGlow)"
				/>
			</LineChart>
		</ResponsiveContainer>
	);

	if (isExpanded) {
		return (
			<div className="fixed inset-0 z-[100] bg-slate-950/97 backdrop-blur-xl p-6 md:p-12 flex flex-col animate-in fade-in duration-200">
				<div
					className="pointer-events-none absolute inset-0 opacity-40"
					style={{
						background:
							"radial-gradient(circle at 15% 10%, rgba(16,185,129,0.08), transparent 45%)",
					}}
				/>
				<div className="relative flex justify-between items-center mb-6">
					<div className="flex items-start gap-3 flex-col  sm:flex-row">
						<div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
							<TrendingUp className="w-5 h-5 text-emerald-400" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-white tracking-tight">
								Benchmark Portfela
							</h3>
							<p className="text-sm text-slate-400">
								Zestawienie stopy zwrotu Twojego portfela z głównymi indeksami
								rynkowymi
							</p>
						</div>
						<div className="ml-2">{trendBadge(false)}</div>
					</div>
					<button
						onClick={() => setIsExpanded(false)}
						className="p-2.5 bg-slate-800/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl transition-colors shadow-lg border border-slate-700/50 hover:border-emerald-500/30"
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

// Custom Tooltip z funkcją Leaderboardu (od najwyższego wyniku)
function BenchmarkTooltip({ active, payload, label, hiddenLines }: any) {
	if (active && payload && payload.length) {
		const date = new Date(label);

		// Sortowanie payloadu po wartości (malejąco) - tworzy ładny ranking
		const sortedPayload = [...payload]
			.filter((entry: any) => !(hiddenLines && hiddenLines[entry.dataKey]))
			.sort((a, b) => b.value - a.value);

		const mainPortfolioEntry = sortedPayload.find(
			(e) => e.dataKey === "portfolioPct",
		);
		const isMainPositive = mainPortfolioEntry
			? mainPortfolioEntry.value >= 0
			: true;

		return (
			<div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/40 rounded-2xl p-4 shadow-2xl shadow-black/40 min-w-[200px] overflow-hidden">
				{/* Kolorowy pasek na górze bazujący na wyniku portfela */}
				<div
					className={`absolute top-0 left-0 right-0 h-[2px] ${
						isMainPositive
							? "bg-gradient-to-r from-emerald-400 to-emerald-600"
							: "bg-gradient-to-r from-rose-400 to-rose-600"
					}`}
				/>

				<p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
					{format(date, "dd MMMM yyyy", { locale: pl })}
				</p>
				<div className="space-y-2.5">
					{sortedPayload.map((entry: any, index: number) => {
						const isPositive = entry.value >= 0;
						const isPortfolio = entry.dataKey === "portfolioPct";

						return (
							<div
								key={index}
								className={`flex justify-between items-center gap-6 ${isPortfolio ? "bg-slate-800/50 -mx-2 px-2 py-1.5 rounded-lg border border-slate-700/50" : ""}`}
							>
								<div className="flex items-center gap-2">
									<span
										className={`w-2 h-2 rounded-full ${isPortfolio ? "animate-pulse" : ""}`}
										style={{ backgroundColor: entry.color }}
									/>
									<span
										className={`text-xs ${isPortfolio ? "font-bold text-slate-200" : "font-medium text-slate-400"}`}
									>
										{entry.name}
									</span>
								</div>
								<span
									className={`text-sm font-bold tabular-nums ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
								>
									{isPositive ? "+" : ""}
									{Number(entry.value).toFixed(2)}%
								</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	}
	return null;
}

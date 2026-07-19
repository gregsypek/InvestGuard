"use client";

import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	ResponsiveContainer,
	Scatter,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Maximize2,
	Minimize2,
	TrendingDown,
	TrendingUp,
	Wallet2,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import Image from "next/image";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export interface ChartDataPoint {
	date: string;
	value: number;
	invested: number;
}

interface PortfolioChartProps {
	data: ChartDataPoint[];
	transactions?: any[]; // Dodano transakcje do połączenia funkcjonalności
	mode?: "VALUE" | "PERCENTAGE";
}

// Pomocnicza funkcja do ustalania końca dnia z formatu YYYY-MM-DD
const getEndOfDayTime = (dateStr: string) => {
	const [year, month, day] = dateStr.split("-").map(Number);
	return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
};

export function PortfolioChart({
	data,
	transactions = [],
	mode = "VALUE",
}: PortfolioChartProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	// --- LOGIKA MERGOWANIA TRANSAKCJI Z DANYMI WYKRESU ---
	const mergedData = useMemo(() => {
		if (!data || data.length === 0) return [];

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
			const currentPointTime = getEndOfDayTime(point.date);
			let prevPointTime = 0;

			if (index > 0) {
				prevPointTime = getEndOfDayTime(data[index - 1].date);
			} else {
				const [year, month, day] = point.date.split("-").map(Number);
				prevPointTime =
					new Date(year, month - 1, day, 0, 0, 0, 0).getTime() - 1;
			}

			const periodTxs = txsWithTime.filter(
				(t) => t.parsedTime > prevPointTime && t.parsedTime <= currentPointTime,
			);

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

	if (!mergedData || mergedData.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
				<p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
					Brak danych historycznych
				</p>
			</div>
		);
	}

	// --- OBLICZENIA DLA ODZNAKI TRENDU ---
	const lastPoint = mergedData[mergedData.length - 1];
	let isPositive = true;
	let trendValue = "";

	if (mode === "PERCENTAGE") {
		isPositive = lastPoint.value >= 0;
		trendValue = `${isPositive ? "+" : ""}${lastPoint.value.toFixed(2)}%`;
	} else {
		const netProfit = lastPoint.value - lastPoint.invested;
		isPositive = netProfit >= 0;
		const pct =
			lastPoint.invested > 0 ? (netProfit / lastPoint.invested) * 100 : 0;
		trendValue = `${isPositive ? "+" : ""}${pct.toFixed(2)}%`;
	}

	const trendBadge = (compact = false) => (
		<div className="flex flex-wrap items-center gap-3">
			<div
				className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
					isPositive
						? "bg-emerald-500/10 border-emerald-500/20"
						: "bg-rose-500/10 border-rose-500/20"
				}`}
			>
				{isPositive ? (
					<TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
				) : (
					<TrendingDown className="w-3.5 h-3.5 text-rose-400" />
				)}
				<span
					className={`text-[11px] font-bold tabular-nums ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
				>
					{!compact && (
						<span className="text-slate-400 mr-1 font-medium">
							Wynik całkowity:
						</span>
					)}
					{trendValue}
				</span>
			</div>

			{/* Mini-legenda transakcji (wyświetlana tylko gdy są transakcje) */}
			{!compact && transactions.length > 0 && (
				<div className="hidden sm:flex items-center gap-3 ml-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
					<div className="flex items-center gap-1.5">
						<div className="w-2 h-2 rounded-full bg-emerald-500" /> Wpłaty/Kupno
					</div>
					<div className="flex items-center gap-1.5">
						<div className="w-2 h-2 rounded-full bg-rose-500" />{" "}
						Wypłaty/Sprzedaż
					</div>
				</div>
			)}
		</div>
	);

	// --- RENDEROWANIE WYKRESU ---
	const chartContent = (
		<ResponsiveContainer width="100%" height="100%">
			<ComposedChart
				data={mergedData}
				margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
			>
				<defs>
					<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
						<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
					</linearGradient>
					<filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="4" result="blur" />
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				{/* ❌ 1. ABY WYŁĄCZYĆ LOGO Z TŁA WYKRESU: Zakomentuj lub usuń poniższe znaczniki <pattern> i <rect> */}
				{/* <pattern
					id="watermark"
					patternUnits="userSpaceOnUse"
					width="100"
					height="100"
				>
					<image
						href="/logo-light.svg"
						x="0"
						y="0"
						width="100"
						height="100"
						opacity="0.02"
					/>
				</pattern>
				<rect
					width="100%"
					height="100%"
					fill="url(#watermark)"
					pointerEvents="none"
				/> */}
				{/* ----------------------------------------------------------------------------------------- */}

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
					minTickGap={20}
				/>

				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
					width={mode === "PERCENTAGE" ? 40 : 55}
					domain={["auto", "auto"]}
					tickFormatter={(val) => {
						if (mode === "PERCENTAGE") return `${val > 0 ? "+" : ""}${val}%`;
						return new Intl.NumberFormat("pl-PL", {
							notation: "compact",
							compactDisplay: "short",
						}).format(val);
					}}
				/>

				{mode === "PERCENTAGE" && (
					<ReferenceLine
						y={0}
						stroke="rgba(148,163,184,0.25)"
						strokeWidth={1}
					/>
				)}

				<Tooltip
					content={<CustomTooltip mode={mode} />}
					cursor={{ stroke: "rgba(148,163,184,0.15)", strokeWidth: 2 }}
				/>

				{/* ❌ 2. ABY WYŁĄCZYĆ NIEBIESKI GRADIENT: zmień fill="url(#colorValue)" na fill="transparent" poniżej */}
				<Area
					type="monotone"
					dataKey="value"
					stroke="#3b82f6"
					strokeWidth={3.5}
					fillOpacity={1}
					fill="url(#colorValue)"
					filter="url(#glowBlue)"
					activeDot={{
						r: 6,
						fill: "#3b82f6",
						stroke: "#1e293b",
						strokeWidth: 2,
					}}
				/>

				{/* Linia wpłaconego kapitału */}
				<Line
					type="stepAfter"
					dataKey="invested"
					stroke="#64748b"
					strokeWidth={2}
					strokeDasharray="5 5"
					dot={false}
					activeDot={false}
					opacity={0.6}
				/>

				{/* Kropki transakcji na wykresie */}
				{transactions.length > 0 && (
					<Scatter dataKey="buyEvent" fill="#10b981" />
				)}
				{transactions.length > 0 && (
					<Scatter dataKey="sellEvent" fill="#ef4444" />
				)}
			</ComposedChart>
		</ResponsiveContainer>
	);

	if (isExpanded) {
		return (
			<div className="fixed inset-0 z-[100] bg-slate-950/97 backdrop-blur-xl p-6 md:p-12 flex flex-col animate-in fade-in duration-200">
				<div
					className="pointer-events-none absolute inset-0 opacity-40"
					style={{
						background:
							"radial-gradient(circle at 15% 10%, rgba(59,130,246,0.08), transparent 45%)",
					}}
				/>
				<div className="relative flex justify-between items-center mb-6">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
							<Wallet2 className="w-5 h-5 text-blue-400" />
						</div>
						<div>
							<h3 className="text-2xl font-bold text-white tracking-tight">
								Szczegóły Inwestycji
							</h3>
							<p className="text-sm text-slate-400">
								Dokładna analiza wartości kapitału w czasie i historia
								transakcji
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

	return (
		<div className="relative w-full h-full flex flex-col group">
			{/* ❌ 3. ABY WYŁĄCZYĆ LOGO Z TŁA POZA FULLSCREENEM: Zakomentuj poniższy div */}
			{/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
				<div className="relative w-32 h-32 md:w-48 md:h-48 opacity-[0.03] dark:opacity-5 grayscale">
					<Image
						src="/logo-light.svg"
						alt="Watermark"
						fill
						className="object-contain"
					/>
				</div>
			</div> */}
			{/* ------------------------------------------------------------------------- */}

			<div className="relative z-10 flex items-center justify-between px-1 pb-2 shrink-0">
				<div>{trendBadge(true)}</div>
				<button
					onClick={() => setIsExpanded(true)}
					className="p-1.5 bg-slate-800/80 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-transparent hover:border-blue-500/30"
					title="Powiększ wykres"
				>
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>

			<div className="relative z-10 flex-1 min-h-0">{chartContent}</div>
		</div>
	);
}

// ----------------------------------------------------------------------
// Zunifikowany Tooltip (Portfel + Detale Transakcji)
// ----------------------------------------------------------------------
function CustomTooltip({ active, payload, label, mode }: any) {
	if (active && payload && payload.length && label) {
		// Rozpakowujemy pełny obiekt danych, by mieć dostęp do txDetails z useMemo
		const dataObj = payload[0].payload;
		const value = payload.find((p: any) => p.dataKey === "value")?.value || 0;
		const invested =
			payload.find((p: any) => p.dataKey === "invested")?.value || 0;

		const formatVal = (val: number) => {
			if (mode === "PERCENTAGE")
				return `${val > 0 ? "+" : ""}${val.toFixed(2)}%`;
			return new Intl.NumberFormat("pl-PL", {
				style: "currency",
				currency: "PLN",
			}).format(val);
		};

		const isProfit = mode === "PERCENTAGE" ? value >= 0 : value >= invested;
		const difference = value - invested;

		return (
			<div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/40 rounded-2xl p-4 shadow-2xl shadow-black/40 min-w-[220px] overflow-hidden z-50">
				<div
					className={`absolute top-0 left-0 right-0 h-[2px] ${isProfit ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-rose-400 to-rose-600"}`}
				/>

				<p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
					{format(new Date(label), "dd MMMM yyyy", { locale: pl })}
				</p>

				{/* 1. SEKCJA PORTFELA */}
				<div className="space-y-2.5">
					<div className="flex justify-between items-center text-xs gap-4">
						<div className="flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
							<span className="text-slate-400">
								{mode === "PERCENTAGE" ? "Zwrot:" : "Wycena:"}
							</span>
						</div>
						<span
							className={
								mode === "PERCENTAGE" && isProfit
									? "font-bold text-emerald-400"
									: mode === "PERCENTAGE" && !isProfit
										? "font-bold text-rose-400"
										: "font-bold text-white"
							}
						>
							{formatVal(value)}
						</span>
					</div>

					{mode === "VALUE" && (
						<>
							<div className="flex justify-between items-center text-xs">
								<div className="flex items-center gap-2">
									<span className="w-2 h-2 rounded-full bg-slate-500" />
									<span className="text-slate-400">Zainwestowano:</span>
								</div>
								<span className="font-bold text-slate-300">
									{formatVal(invested)}
								</span>
							</div>
							<div className="pt-2 mt-2 border-t border-slate-800/80 flex justify-between items-center">
								<span className="text-[11px] font-bold text-slate-500 uppercase">
									Zysk / Strata:
								</span>
								<span
									className={`text-sm font-black tabular-nums ${isProfit ? "text-emerald-400" : "text-rose-400"}`}
								>
									{isProfit ? "+" : ""}
									{formatVal(difference)}
								</span>
							</div>
						</>
					)}
				</div>

				{/* 2. SEKCJA TRANSAKCJI (Pojawia się tylko gdy danego dnia coś kupiono/sprzedano) */}
				{dataObj.txDetails && dataObj.txDetails.length > 0 && (
					<div className="mt-3 pt-3 border-t border-slate-800/80 border-dashed space-y-2">
						<p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
							Zdarzenia w tym okresie:
						</p>
						{dataObj.txDetails.map((tx: any, idx: number) => {
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
											{isBuy ? "KUPNO" : "SPRZEDAŻ"}{" "}
											{tx.ticker || tx.assetName || ""}
										</span>
										<span className="text-slate-300 font-mono text-right">
											{Math.abs(tx.executedValue || 0).toLocaleString("pl-PL", {
												minimumFractionDigits: 2,
											})}{" "}
											PLN
										</span>
									</div>
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

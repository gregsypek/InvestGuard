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
import { Maximize2, Minimize2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { ChartContainer } from "../shared/ChartContainer";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export interface AbsolutePnLDataPoint {
	date: string;
	exactChangePLN: number;
	totalPortfolioValue: number;
	netCashFlow: number;
	isLive?: boolean;
}

interface AbsoluteDailyPnLChartProps {
	data: AbsolutePnLDataPoint[];
}

export function AbsoluteDailyPnLChart({ data }: AbsoluteDailyPnLChartProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Śledzimy rozmiar ekranu, by dostosować szerokość osi Y i marginesy
	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 640);
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-center h-full min-h-[300px] opacity-60">
				<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
					Brak danych do wyliczenia dziennego wyniku
				</p>
			</div>
		);
	}

	const maxPnL = Math.max(...data.map((d) => Math.abs(d.exactChangePLN)), 50);
	const pnlDomain = maxPnL * 1.1;

	const maxCashFlow = Math.max(
		...data.map((d) => Math.abs(d.netCashFlow)),
		1000,
	);
	const cashDomain = maxCashFlow * 1.1;

	let twrMultiplier = 1;
	let totalPnL = 0;

	data.forEach((d) => {
		totalPnL += d.exactChangePLN;
		const startingCapital =
			d.totalPortfolioValue - d.exactChangePLN - d.netCashFlow;
		if (startingCapital > 0) {
			twrMultiplier *= 1 + d.exactChangePLN / startingCapital;
		}
	});

	const pnlPercent = (twrMultiplier - 1) * 100;
	const isPeriodPositive = totalPnL >= 0;

	const trendBadge = (compact = false) => (
		<div className="flex items-center gap-2">
			<div
				className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
					isPeriodPositive
						? "bg-emerald-500/10 border-emerald-500/20"
						: "bg-rose-500/10 border-rose-500/20"
				}`}
			>
				<span
					className={`text-[11px] font-bold tabular-nums ${
						isPeriodPositive ? "text-emerald-500" : "text-rose-500"
					}`}
				>
					{!compact ? (
						<span className="text-t-text-tertiary mr-1 font-medium">
							Stopa TWR:
						</span>
					) : (
						<span className="text-t-text-tertiary mr-1 font-medium">TWR:</span>
					)}
					{isPeriodPositive ? "+" : ""}
					{pnlPercent.toFixed(2)}%
				</span>

				<span
					className={`text-[10px] font-semibold tabular-nums opacity-80 ${
						isPeriodPositive ? "text-emerald-500" : "text-rose-500"
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
			</div>

			<div className="group relative  items-center justify-center cursor-help z-50 hidden sm:flex">
				<div className="w-5 h-5 rounded-full border border-t-text-tertiary flex items-center justify-center">
					<span className="text-[10px] font-bold text-t-text-tertiary transition-colors">
						i
					</span>
				</div>
				<div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 p-3 bg-t-bg-panel border border-t-border rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
					<p className="text-[10px] text-t-text-secondary leading-relaxed normal-case">
						<strong className="text-t-text-primary block mb-1">
							Stopa TWR (Time-Weighted Return)
						</strong>
						Pokazuje czystą skuteczność portfela. Ignoruje wpływ Twoich wpłat i
						wypłat w tym okresie, traktując je neutralnie.
					</p>
				</div>
			</div>
		</div>
	);

	const renderLegend = () => {
		const liveEntry = data.find((d) => d.isLive);
		const isTodayPositive = (liveEntry?.exactChangePLN ?? 0) >= 0;

		return (
			//  Zmniejszono padding-top (pt-0) i margines w dół, legenda ma przylegać wyżej
			<div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1.5 pt-0 mt-2">
				<div className="flex items-center gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
					<span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-t-text-secondary">
						Dzienny Wynik
					</span>
				</div>
				{liveEntry && (
					<div className="flex items-center gap-1.5 animate-in fade-in duration-200">
						<span
							className={`inline-block w-3 h-3 rounded-sm border border-dashed shrink-0 ${
								isTodayPositive
									? "bg-emerald-500/20 border-emerald-500"
									: "bg-rose-500/20 border-rose-500"
							}`}
						/>
						<span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-t-text-secondary">
							Dzisiaj
						</span>
					</div>
				)}
				<div className="flex items-center gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.6)] shrink-0" />
					<span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-t-text-secondary">
						Transfery
					</span>
				</div>
			</div>
		);
	};

	const chartContent = (
		<ChartContainer className="h-full min-h-[300px] w-full flex-1">
			<ResponsiveContainer width="100%" height="100%">
				{/* 🚀 ZMIANA KLUCZOWA: Zwiększono diametralnie margines z dołu, aby zrobić bufor na załamaną legendę! */}
				<ComposedChart
					data={data}
					margin={{
						top: 10,
						right: isMobile ? 0 : 10,
						left: isMobile ? -10 : 10,
						bottom: isMobile ? 40 : 25,
					}}
				>
					<defs>
						<linearGradient
							id="positiveBarGradient"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
							<stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
						</linearGradient>
						<linearGradient
							id="negativeBarGradient"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop offset="0%" stopColor="#fb7185" stopOpacity={0.95} />
							<stop offset="100%" stopColor="#e11d48" stopOpacity={0.85} />
						</linearGradient>
						<linearGradient id="cashFlowGradient" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor="var(--theme-primary)" />
							<stop offset="50%" stopColor="var(--theme-primary)" />
							<stop offset="100%" stopColor="var(--theme-primary)" />
						</linearGradient>
						<linearGradient
							id="cashFlowAreaGradient"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop
								offset="0%"
								stopColor="var(--theme-primary)"
								stopOpacity={0.25}
							/>
							<stop
								offset="100%"
								stopColor="var(--theme-primary)"
								stopOpacity={0}
							/>
						</linearGradient>
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
						stroke="var(--t-border-subtle)"
					/>

					<XAxis
						dataKey="date"
						axisLine={false}
						tickLine={false}
						tick={{
							fontSize: 9,
							fill: "var(--t-text-tertiary)",
							fontWeight: 500,
						}}
						tickMargin={12}
						//  Na małym ekranie format to tylko 'dd MMM', bez dodatkowych spacji, oszczędza miejsce
						tickFormatter={(val) =>
							format(new Date(val), isMobile ? "dd MMM" : "dd MMM", {
								locale: pl,
							})
						}
						minTickGap={25}
					/>

					<YAxis
						yAxisId="left"
						orientation="left"
						axisLine={false}
						tickLine={false}
						tick={{
							fontSize: 10,
							fill: "var(--t-text-tertiary)",
							fontWeight: 500,
						}}
						tickFormatter={(val) =>
							`${new Intl.NumberFormat("pl-PL", { notation: "compact", maximumFractionDigits: 1 }).format(val)}\u00A0zł`
						}
						width={isMobile ? 42 : 58}
						domain={[-pnlDomain, pnlDomain]}
					/>

					<YAxis
						yAxisId="right"
						orientation="right"
						axisLine={false}
						tickLine={false}
						tick={{
							fontSize: 10,
							fill: "var(--theme-primary)",
							fontWeight: 600,
						}}
						tickFormatter={(val) =>
							val === 0
								? ""
								: `${new Intl.NumberFormat("pl-PL", { notation: "compact", maximumFractionDigits: 1 }).format(val)}\u00A0zł`
						}
						width={isMobile ? 45 : 65}
						domain={[-cashDomain, cashDomain]}
					/>

					<ReferenceLine
						y={0}
						yAxisId="left"
						stroke="var(--t-border)"
						strokeWidth={1}
					/>

					<Tooltip
						content={<AbsolutePnLTooltip />}
						cursor={{ fill: "var(--t-hover)" }}
						wrapperStyle={{ zIndex: 1000, outline: "none" }}
					/>

					{/* 🚀 ZMIANA: Utrzymano verticalAlign, ale layout renderLegend został mocno odchudzony! */}
					<Legend
						content={renderLegend}
						wrapperStyle={{ zIndex: 10 }}
						verticalAlign="bottom"
					/>

					<Bar
						yAxisId="left"
						dataKey="exactChangePLN"
						name="Dzienny Wynik Rynkowy"
						radius={[6, 6, 6, 6]}
						maxBarSize={28}
					>
						{data.map((entry, index) => {
							const isPositive = entry.exactChangePLN >= 0;
							return (
								<Cell
									key={`cell-${index}`}
									fill={
										entry.isLive
											? isPositive
												? "rgba(16, 185, 129, 0.2)"
												: "rgba(244, 63, 94, 0.2)"
											: isPositive
												? "url(#positiveBarGradient)"
												: "url(#negativeBarGradient)"
									}
									stroke={
										entry.isLive ? (isPositive ? "#10b981" : "#f43f5e") : "none"
									}
									strokeDasharray={entry.isLive ? "4 4" : "none"}
									strokeWidth={entry.isLive ? 2 : 0}
								/>
							);
						})}
					</Bar>

					<Area
						yAxisId="right"
						type="monotone"
						dataKey="netCashFlow"
						stroke="none"
						fill="url(#cashFlowAreaGradient)"
						legendType="none"
						tooltipType="none"
					/>
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
							if (payload.netCashFlow !== 0) {
								return (
									<circle
										key={cx}
										cx={cx}
										cy={cy}
										r={4}
										fill="var(--theme-primary)"
										stroke="var(--t-bg-panel)"
										strokeWidth={1.5}
										filter="url(#dotGlow)"
									/>
								);
							}
							return null;
						}}
						activeDot={{
							r: 6,
							fill: "var(--theme-primary)",
							stroke: "var(--t-bg-panel)",
							strokeWidth: 2,
							filter: "url(#dotGlow)",
						}}
					/>
				</ComposedChart>
			</ResponsiveContainer>
		</ChartContainer>
	);

	if (isExpanded) {
		return (
			<div className="fixed inset-0 z-[999] bg-t-bg-base/95 backdrop-blur-xl p-4 sm:p-8 md:p-12 flex flex-col animate-in fade-in duration-200">
				<div
					className="pointer-events-none absolute inset-0 opacity-40"
					style={{
						background:
							"radial-gradient(circle at 15% 10%, var(--theme-soft), transparent 45%)",
					}}
				/>
				<div className="relative flex justify-between items-center mb-6">
					<div className="flex items-start gap-3 flex-col sm:flex-row">
						<div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hidden sm:block">
							<TrendingUp className="w-5 h-5 text-blue-500" />
						</div>
						<div>
							<h3 className="text-xl sm:text-2xl font-bold text-t-text-primary tracking-tight">
								Nominalny Wynik Dzienny
							</h3>
							<p className="text-xs sm:text-sm text-t-text-secondary">
								Widok szczegółowy · Lewa oś: wynik rynkowy · Prawa oś: wpłaty i
								wypłaty
							</p>
						</div>
						<div className="mt-2 sm:mt-0 sm:ml-4">{trendBadge(false)}</div>
					</div>
					<button
						onClick={() => setIsExpanded(false)}
						className="p-2 sm:p-2.5 bg-t-bg-panel hover:bg-rose-500/10 text-t-text-secondary hover:text-rose-500 rounded-xl transition-colors shadow-sm border border-t-border hover:border-rose-500/30"
					>
						<Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" />
					</button>
				</div>
				<div className="relative flex flex-col flex-1 min-h-0 bg-t-bg-panel border border-t-border rounded-2xl card-padding shadow-xl">
					{chartContent}
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full h-full flex flex-col group bg-t-bg-panel border border-t-border  rounded-2xl card-padding ">
			<div className="flex justify-between items-start z-20 mb-2">
				<div>{trendBadge(true)}</div>
				<button
					onClick={() => setIsExpanded(true)}
					className="p-1.5 
					 bg-t-bg-base text-t-text-tertiary hover:text-emerald-500 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-sm"
					title="Powiększ wykres"
				>
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>
			<div className="flex-1 w-full min-h-0 relative z-10">{chartContent}</div>
		</div>
	);
}

interface TooltipPayloadItem {
	dataKey: string;
	value: number;
	payload: AbsolutePnLDataPoint;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	label?: string;
}

function AbsolutePnLTooltip({ active, payload, label }: CustomTooltipProps) {
	if (active && payload && payload.length && label) {
		const changeValue =
			payload.find((p) => p.dataKey === "exactChangePLN")?.value || 0;
		const netCashFlow =
			payload.find((p) => p.dataKey === "netCashFlow")?.value || 0;

		const rawPayload = payload[0].payload;
		const totalValue = rawPayload.totalPortfolioValue || 0;
		const isLive = Boolean(rawPayload.isLive);
		const isPositive = changeValue >= 0;
		const date = new Date(label);

		return (
			<div className="bg-t-bg-panel/95 backdrop-blur-md border border-t-border rounded-xl p-4 shadow-xl max-w-[280px]">
				<div
					className={`absolute top-0 left-0 right-0 h-[2px] ${isPositive ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-rose-400 to-rose-600"}`}
				/>
				<div className="flex items-center justify-between gap-4 mb-3 border-b border-t-border pb-2">
					<p className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest">
						{format(date, "dd MMMM yyyy", { locale: pl })}
					</p>
					{isLive && (
						<span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider animate-pulse">
							Na żywo
						</span>
					)}
				</div>
				<div className="space-y-1 mb-3">
					<p className="text-[10px] text-t-text-secondary uppercase tracking-wider font-semibold">
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
					<div className="mb-3 pt-2 border-t border-t-border-subtle flex justify-between items-center bg-(--theme-soft) -mx-1 px-2 py-1.5 rounded-lg">
						<span className="text-[9px] text-[var(--theme-primary)] uppercase tracking-widest font-bold">
							{netCashFlow > 0 ? "Wpłata" : "Wypłata"}
						</span>
						<span className="text-[11px] text-[var(--theme-primary)] font-bold">
							{netCashFlow > 0 ? "+" : ""}
							{new Intl.NumberFormat("pl-PL", {
								style: "currency",
								currency: "PLN",
								maximumFractionDigits: 0,
							}).format(netCashFlow)}
						</span>
					</div>
				)}
				<div className="mt-2 pt-2 border-t border-t-border-subtle flex justify-between items-center gap-4">
					<span className="text-[9px] text-t-text-tertiary uppercase tracking-widest font-bold">
						Suma aktywów
					</span>
					<span className="text-[10px] text-t-text-primary font-bold">
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

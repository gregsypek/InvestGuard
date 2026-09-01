"use client";

import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { useMemo } from "react";

const CHART_COLORS = [
	"#3b82f6",
	"#10b981",
	"#8b5cf6",
	"#f59e0b",
	"#f43f5e",
	"#06b6d4",
];

export interface PortfolioSim {
	id: string;
	name: string;
	currentValue: number;
	targetValue: number;
	monthlyDeposit: number;
}

interface GoalProjectionChartProps {
	portfolios: PortfolioSim[];
}

function generateProjection(portfolios: PortfolioSim[]) {
	const data = [];
	let months = 0;
	const maxMonths = 360; // Max 30 lat
	const annualRate = 0.07;
	const monthlyRate = annualRate / 12;

	// Inicjalizacja stanu dla każdego portfela
	const state = portfolios.map((p) => ({
		...p,
		balance: p.currentValue,
		capital: p.currentValue,
	}));

	const globalTarget = portfolios.reduce((sum, p) => sum + p.targetValue, 0);
	let globalBalance = portfolios.reduce((sum, p) => sum + p.currentValue, 0);

	while (globalBalance < globalTarget && months < maxMonths) {
		if (months % 12 === 0) {
			const point: any = {
				name: `Rok ${months / 12}`,
				totalCapital: 0,
				totalValue: 0,
			};
			state.forEach((p) => {
				point[p.id] = Math.round(p.balance); // Do wykresów warstwowych
				point.totalCapital += Math.round(p.capital);
				point.totalValue += Math.round(p.balance);
			});
			point.profit = point.totalValue - point.totalCapital;
			data.push(point);
		}

		globalBalance = 0;
		state.forEach((p) => {
			p.balance = p.balance * (1 + monthlyRate) + p.monthlyDeposit;
			p.capital += p.monthlyDeposit;
			globalBalance += p.balance;
		});
		months++;
	}

	// Dodanie ostatniego punktu 'CEL'
	const finalPoint: any = { name: "CEL", totalCapital: 0, totalValue: 0 };
	state.forEach((p) => {
		finalPoint[p.id] = Math.round(p.balance);
		finalPoint.totalCapital += Math.round(p.capital);
		finalPoint.totalValue += Math.round(p.balance);
	});
	finalPoint.profit = finalPoint.totalValue - finalPoint.totalCapital;
	data.push(finalPoint);

	return {
		data,
		years: (months / 12).toFixed(1),
		isUnreachable: months >= maxMonths && globalBalance < globalTarget,
		globalTarget,
	};
}

const CustomTooltip = ({ active, payload, label, isMulti }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-t-bg-panel border border-t-border rounded-xl p-3 shadow-xl min-w-[200px]">
				<p className="text-[10px] text-t-text-tertiary font-bold uppercase tracking-widest mb-2 border-b border-t-border-subtle pb-2">
					{label}
				</p>
				<div className="space-y-1.5">
					{payload.map((entry: any, index: number) => {
						// Ukrywamy wyświetlanie osobnego profitu/kapitału w tooltipie jeśli jesteśmy w widoku Multi,
						// chyba że jest to główna linia sumaryczna
						if (
							isMulti &&
							(entry.dataKey === "profit" || entry.dataKey === "totalValue")
						)
							return null;

						return (
							<div
								key={index}
								className="flex justify-between items-center gap-4 text-xs font-bold"
							>
								<div className="flex items-center gap-1.5 text-t-text-secondary">
									<div
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: entry.color }}
									/>
									{entry.name}
								</div>
								<span className="font-mono text-t-text-primary">
									{entry.value?.toLocaleString("pl-PL")} PLN
								</span>
							</div>
						);
					})}
					{isMulti && (
						<div className="pt-2 mt-2 border-t border-t-border-subtle flex justify-between items-center gap-4 text-xs font-black">
							<span className="text-t-text-primary">Suma Wartości</span>
							<span className="font-mono text-blue-500">
								{payload[0].payload.totalValue.toLocaleString("pl-PL")} PLN
							</span>
						</div>
					)}
				</div>
			</div>
		);
	}
	return null;
};

export function GoalProjectionChart({ portfolios }: GoalProjectionChartProps) {
	const { data, years, isUnreachable, globalTarget } = useMemo(
		() => generateProjection(portfolios),
		[portfolios],
	);

	const isMulti = portfolios.length > 1;

	return (
		<div className="space-y-4 h-full flex flex-col">
			<div className="flex justify-between items-baseline px-1">
				<div className="text-right">
					<span className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums tracking-tighter">
						{isUnreachable ? "30+" : years}
					</span>
					<span className="text-[10px] font-bold ml-1.5 uppercase tracking-widest text-t-text-tertiary">
						lat do celu
					</span>
				</div>
			</div>

			<div className="flex-1 w-full min-h-[250px]">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={data}
						margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
					>
						<defs>
							<linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
								<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
							</linearGradient>
							<linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
								<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
							</linearGradient>
						</defs>

						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							stroke="#94a3b8"
							strokeOpacity={0.15}
						/>
						<XAxis
							dataKey="name"
							fontSize={10}
							tickLine={false}
							axisLine={false}
							tick={{ fill: "#64748b", fontWeight: 600 }}
							dy={10}
						/>
						<YAxis hide domain={[0, "dataMax + 10000"]} />

						<Tooltip
							content={<CustomTooltip isMulti={isMulti} />}
							cursor={{
								stroke: "#94a3b8",
								strokeWidth: 1,
								strokeDasharray: "3 3",
								opacity: 0.5,
							}}
						/>

						<ReferenceLine
							y={globalTarget}
							stroke="#3b82f6"
							strokeDasharray="4 4"
							strokeOpacity={0.8}
							label={{
								position: "top",
								value: "CEL",
								fill: "#3b82f6",
								fontSize: 10,
								fontWeight: "900",
							}}
						/>

						{isMulti ? (
							<>
								{/* Wiele portfeli: Stos aktywów jeden na drugim */}
								{portfolios.map((p, index) => (
									<Area
										key={p.id}
										type="monotone"
										dataKey={p.id}
										name={p.name}
										stackId="1"
										stroke={CHART_COLORS[index % CHART_COLORS.length]}
										fill={CHART_COLORS[index % CHART_COLORS.length]}
										fillOpacity={0.6}
										strokeWidth={2}
									/>
								))}
								{/* Linia pokazująca sam goły kapitał (bez odsetek) w tle */}
								<Line
									type="monotone"
									dataKey="totalCapital"
									name="Wpłacony kapitał (suma)"
									stroke="#64748b"
									strokeDasharray="5 5"
									strokeWidth={2}
									dot={false}
								/>
							</>
						) : (
							<>
								{/* Pojedynczy portfel: Podział na kapitał (niebieski) i nakładający się zysk (zielony) */}
								<Area
									type="monotone"
									dataKey="totalValue"
									name="Zysk (7%)"
									stroke="#10b981"
									fill="url(#colorProfit)"
									strokeWidth={3}
								/>
								<Area
									type="monotone"
									dataKey="totalCapital"
									name="Wpłacony kapitał"
									stroke="#3b82f6"
									fill="url(#colorCapital)"
									strokeWidth={3}
								/>
							</>
						)}
					</ComposedChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

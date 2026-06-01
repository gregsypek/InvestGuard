"use client";

import {
	Area,
	AreaChart,
	CartesianGrid,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { useMemo } from "react";

// Logika projekcji (Compound Interest)
function generateProjection(current: number, target: number, deposit: number) {
	const data = [];
	let balance = current;
	const annualRate = 0.07; // Założone 7% rocznie (średnia rynkowa)
	const monthlyRate = annualRate / 12;
	let months = 0;

	// Symulacja do momentu osiągnięcia celu lub max 30 lat
	while (balance < target && months < 360) {
		if (months % 12 === 0) {
			data.push({
				name: `Rok ${months / 12}`,
				value: Math.round(balance),
			});
		}
		balance = balance * (1 + monthlyRate) + deposit;
		months++;
	}

	data.push({ name: "CEL", value: Math.round(balance) });

	return {
		data,
		years: (months / 12).toFixed(1),
		isUnreachable: months >= 360 && balance < target,
	};
}
const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-t-bg-panel border border-t-border rounded-xl p-3 shadow-xl">
				<p className="text-[10px] text-t-text-tertiary font-bold uppercase tracking-widest mb-1">
					{label}
				</p>
				<p className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono tracking-tighter">
					{payload[0].value?.toLocaleString("pl-PL")}{" "}
					<span className="text-[10px] font-bold">PLN</span>
				</p>
			</div>
		);
	}
	return null;
};

export function GoalProjectionChart({
	currentValue,
	targetValue,
	monthlyDeposit,
}: {
	currentValue: number;
	targetValue: number;
	monthlyDeposit: number;
}) {
	const { data, years, isUnreachable } = useMemo(
		() => generateProjection(currentValue, targetValue, monthlyDeposit),
		[currentValue, targetValue, monthlyDeposit],
	);

	return (
		<div className="space-y-4 h-full flex flex-col">
			<div className="flex justify-between items-baseline px-1">
				<div className="text-right">
					<span className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums tracking-tighter">
						{isUnreachable ? "30+" : years}
					</span>
					<span className="text-[10px] font-bold ml-1.5 uppercase tracking-widest text-t-text-tertiary">
						lat
					</span>
				</div>
			</div>

			<div className="flex-1 w-full min-h-[250px]">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={data}
						margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
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
							stroke="#94a3b8" // Neutralny szary (slate-400), który ładnie zniknie przez opacity
							strokeOpacity={0.15}
						/>
						<XAxis
							dataKey="name"
							fontSize={10}
							tickLine={false}
							axisLine={false}
							tick={{ fill: "#64748b", fontWeight: 600 }} // slate-500
							dy={10}
						/>
						<YAxis hide domain={[0, "dataMax + 5000"]} />

						<Tooltip
							content={<CustomTooltip />}
							cursor={{
								stroke: "#3b82f6",
								strokeWidth: 1,
								strokeDasharray: "3 3",
								opacity: 0.5,
							}}
						/>

						<ReferenceLine
							y={targetValue}
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
						<Area
							type="monotone"
							dataKey="value"
							stroke="#3b82f6"
							fill="url(#colorValue)"
							strokeWidth={3} // Lekko pogrubiona linia dla lepszego akcentu
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

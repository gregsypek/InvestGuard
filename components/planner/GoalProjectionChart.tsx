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
		<div className="space-y-4">
			<div className="flex justify-between items-baseline px-1">
				<div className="text-right">
					<span className="text-2xl font-bold text-primary">
						{isUnreachable ? "30+" : years}
					</span>
					<span className="text-[10px] font-black ml-1 uppercase opacity-60">
						lat
					</span>
				</div>
			</div>

			<div className="h-[350px] w-full">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={data}
						margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
					>
						<defs>
							<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--primary)"
									stopOpacity={0.2}
								/>
								<stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							strokeOpacity={0.05}
						/>
						<XAxis
							dataKey="name"
							fontSize={9}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis hide domain={[0, "dataMax + 5000"]} />
						<Tooltip
							contentStyle={{
								borderRadius: "16px",
								backgroundColor: "var(--card)",
								border: "1px solid var(--border)",
								fontSize: "10px",
							}}
							formatter={(v: any) => [
								`${v?.toLocaleString() || 0} zł`,
								"Kapitał",
							]}
						/>
						<ReferenceLine
							y={targetValue}
							stroke="var(--primary)"
							strokeDasharray="5 5"
							label={{
								position: "top",
								value: "CEL",
								fill: "var(--primary)",
								fontSize: 9,
								fontWeight: "bold",
							}}
						/>
						<Area
							type="monotone"
							dataKey="value"
							stroke="var(--primary)"
							fill="url(#colorValue)"
							strokeWidth={2}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

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

import { AlphaPoint } from "../InteractiveChartSection";

export function AlphaChart({ data }: { data: AlphaPoint[] }) {
	// Odcinamy ostatni punkt jeśli duplikuje przedostatni
	const cleanData =
		data && data.length > 1
			? data.filter((point, i, arr) => {
					if (i === arr.length - 1) {
						const prev = arr[i - 1];
						return point.wycena !== prev.wycena || point.wkład !== prev.wkład;
					}
					return true;
				})
			: data;

	if (!cleanData || cleanData.length === 0) return null;

	return (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart
				data={cleanData}
				margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
			>
				<defs>
					<linearGradient id="colorWycena" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
						<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid
					strokeDasharray="3 3"
					vertical={false}
					stroke="var(--border)"
					opacity={0.3}
				/>
				<XAxis
					dataKey="name"
					fontSize={10}
					tickLine={false}
					axisLine={false}
					tick={{ fill: "#94a3b8" }}
				/>
				<YAxis
					width={60}
					fontSize={10}
					tickLine={false}
					axisLine={false}
					tickFormatter={(v) =>
						v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
					}
					tick={{ fill: "#94a3b8" }}
				/>
				<Tooltip
					cursor={{
						stroke: "var(--primary)",
						strokeWidth: 1,
						strokeDasharray: "4 4",
					}}
					contentStyle={{
						backgroundColor: "var(--background)",
						borderRadius: "12px",
						border: "1px solid var(--border)",
						fontSize: "12px",
					}}
				/>
				{/* Linia wkładu */}
				<Area
					type="monotone" //
					dataKey="wkład"
					stroke="#94a3b8"
					fill="transparent" //
					strokeWidth={2}
					strokeDasharray="5 5"
					isAnimationActive={false}
					dot={false}
				/>
				{/* Linia wyceny */}
				<Area
					type="monotone" //
					dataKey="wycena"
					stroke="#10b981"
					fill="url(#colorWycena)"
					strokeWidth={3}
					isAnimationActive={false}
					dot={false}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}

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
import { useEffect, useState } from "react";

interface AlphaChartProps {
	name: string;
	wkład: number;
	wycena: number;
}
export function AlphaChart({ data }: { data: AlphaChartProps[] }) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		// EN: Using requestAnimationFrame to avoid "cascading renders" error in strict ESLint
		// UI: Używamy rAF, aby uniknąć błędu lintera i problemów z Safari
		const frame = requestAnimationFrame(() => {
			setIsMounted(true);
		});
		return () => cancelAnimationFrame(frame);
	}, []);

	// EN: While mounting, show a placeholder with the same height
	if (!isMounted) {
		return <div className="h-88 w-full bg-muted/5 animate-pulse rounded-2xl" />;
	}

	if (!data || data.length === 0) {
		return (
			<div className="flex h-88 items-center justify-center text-xs text-muted-foreground italic">
				Brak danych do wyświetlenia
			</div>
		);
	}

	return (
		<div className="h-87 w-full">
			{" "}
			{/* EN: Fixed height is mandatory for ResponsiveContainer */}
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart
					data={data}
					margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
				>
					<defs>
						<linearGradient id="colorWycena" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
							<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid
						strokeDasharray="3 3"
						vertical={false}
						stroke="#e2e8f0"
					/>
					<XAxis
						dataKey="name"
						fontSize={10}
						tickLine={false}
						axisLine={false}
						tick={{ fill: "#94a3b8" }}
					/>
					<YAxis
						fontSize={10}
						tickLine={false}
						axisLine={false}
						tickFormatter={(value) => `${value.toLocaleString()} zł`}
						tick={{ fill: "#94a3b8" }}
					/>
					<Tooltip
						contentStyle={{
							borderRadius: "16px",
							border: "none",
							boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
							fontSize: "12px",
						}}
					/>
					{/* EN: Invested capital line (dashed) */}
					<Area
						type="monotone"
						dataKey="wkład"
						stroke="#64748b"
						fill="transparent"
						strokeWidth={2}
						strokeDasharray="5 5"
					/>
					{/* EN: Current valuation line (solid with gradient) */}
					<Area
						type="monotone"
						dataKey="wycena"
						stroke="#10b981"
						fillOpacity={1}
						fill="url(#colorWycena)"
						strokeWidth={3}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}

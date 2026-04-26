"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useEffect, useState } from "react";

interface MonthlyDepositProps {
	month: string;
	amount: number;
}
export function MonthlyDepositsChart({ data }: { data: MonthlyDepositProps[] }) {
	console.log("🚀 ~ MonthlyDepositsChart ~ data:", data);
	const [isMounted, setIsMounted] = useState(false);
useEffect(() => {
	// setTimeout(..., 0) jest bardziej "cierpliwy" niż rAF dla Recharts
	const timer = setTimeout(() => {
		setIsMounted(true);
	}, 0);

	return () => clearTimeout(timer);
}, []);

	if (!isMounted)
		return (
			<div className="h-full w-full bg-muted/10 animate-pulse rounded-2xl" />
		);

	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart
				data={data}
				margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
			>
				<CartesianGrid
					strokeDasharray="3 3"
					vertical={false}
					strokeOpacity={0.1}
				/>
				<XAxis
					dataKey="month"
					fontSize={10}
					tickLine={false}
					axisLine={false}
					tick={{ fill: "#94a3b8" }}
				/>
				<YAxis
					fontSize={10}
					tickLine={false}
					axisLine={false}
					tick={{ fill: "#94a3b8" }}
					tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
				/>
				<Tooltip
					cursor={{ fill: "rgba(255,255,255,0.05)" }}
					// formatter={(value: number) => [`${value.toFixed(2)} PLN`, "Wpłata"]}
					contentStyle={{
						borderRadius: "12px",
						border: "none",
						backgroundColor: "#1e1e1e",
						boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
						fontSize: "12px",
					}}
				/>
				<Bar
					dataKey="amount"
					fill="#f59e0b" // Bursztynowy pasujący do Twojego UI
					radius={[4, 4, 0, 0]}
					barSize={32}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
}

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

export function MonthlyDepositsChart({
	data,
}: {
	data: MonthlyDepositProps[];
}) {
	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		// setTimeout(..., 0) jest bardziej "cierpliwy" niż rAF dla Recharts
		const timer = setTimeout(() => {
			setIsMounted(true);
		}, 0);

		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => setIsMounted(true), 0);
		return () => clearTimeout(timer);
	}, []);

	if (!isMounted)
		return (
			<div className="h-full w-full bg-muted/10 animate-pulse rounded-2xl" />
		);

	if (!data || data.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-xs text-muted-foreground italic ">
				Brak danych do wyświetlenia
			</div>
		);
	}

	return (
		<div className="h-[350px] w-full min-h-75">
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
						tickFormatter={(v: number) =>
							v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
						}
					/>
					<Tooltip
						cursor={{ fill: "rgba(255,255,255,0.05)" }}
						contentStyle={{
							backgroundColor: "#ffffff",
							borderRadius: "12px",
							border: "none",
							boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
							padding: "8px 12px",
						}}
						itemStyle={{
							color: "#0f172a",
							fontSize: "11px",
							fontWeight: "bold",
							textTransform: "uppercase",
						}}
						labelStyle={{
							color: "#64748b",
							fontSize: "10px",
							marginBottom: "4px",
						}}
						formatter={(value) => {
							// ✅ Fix: ValueType może być undefined lub string
							const num =
								typeof value === "number" ? value : Number(value ?? 0);
							return [`${num.toLocaleString("pl-PL")} PLN`, "Wpłata"];
						}}
					/>
					<Bar
						dataKey="amount"
						fill="#f59e0b"
						radius={[4, 4, 0, 0]}
						barSize={32}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

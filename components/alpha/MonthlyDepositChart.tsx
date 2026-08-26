"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	ReferenceLine,
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

	// 🚀 NOWOŚĆ: Obliczanie średniej wpłaty
	const averageAmount =
		data.reduce((sum, item) => sum + item.amount, 0) / data.length;

	return (
		<div className="h-[350px] w-full min-h-75">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
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
					{/* <Tooltip
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
							const num =
								typeof value === "number" ? value : Number(value ?? 0);
							return [`${num.toLocaleString("pl-PL")} PLN`, "Wpłata"];
						}}
					/> */}
					<Tooltip
						cursor={{ fill: "rgba(255,255,255,0.05)" }}
						contentStyle={{
							backgroundColor: "var(--t-bg-panel)", // 👈 Zmiana
							borderRadius: "12px",
							borderColor: "var(--t-border-subtle)", // 👈 Zmiana
							boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
							padding: "8px 12px",
						}}
						itemStyle={{
							color: "var(--t-text-primary)", // 👈 Zmiana
							fontSize: "11px",
							fontWeight: "bold",
							textTransform: "uppercase",
						}}
						labelStyle={{
							color: "var(--t-text-tertiary)", // 👈 Zmiana
							fontSize: "10px",
							marginBottom: "4px",
						}}
						formatter={(value) => {
							const num =
								typeof value === "number" ? value : Number(value ?? 0);
							return [`${num.toLocaleString("pl-PL")} PLN`, "Wpłata"];
						}}
					/>

					{/* 🚀 NOWOŚĆ: Linia referencyjna pokazująca średnią */}
					{/* 1. Najpierw rysujemy kolumny */}
					<Bar
						dataKey="amount"
						fill="#f59e0b"
						radius={[4, 4, 0, 0]}
						barSize={32}
					/>

					{/* 2. Następnie rysujemy linię (będzie na wierzchu) w kontrastowym kolorze */}
					<ReferenceLine
						y={averageAmount}
						stroke="#64748b" // Uniwersalny szary (Slate 500) - czytelny w obu motywach
						strokeDasharray="4 4"
						strokeOpacity={0.8}
						label={{
							position: "insideTopLeft",
							value: `ŚREDNIA: ${averageAmount.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} PLN`,
							fill: "#64748b", // Ciemniejszy szary dla tekstu
							fontSize: 10,
							fontWeight: "bold",
							opacity: 1,
						}}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

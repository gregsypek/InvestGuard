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
import React, { useMemo } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

import { ChartContainer } from "../shared/ChartContainer";

// ----------------------------------------------------------------------
// TYPY DLA TOOLTIPA
// ----------------------------------------------------------------------
interface TooltipPayloadItem {
	name: string;
	value: number | string;
	color: string;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl flex flex-col gap-2 min-w-[180px]">
				<span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800 pb-2 mb-1">
					Miesiąc: {label}
				</span>
				{payload.map((entry, index) => (
					<div
						key={index}
						className="flex items-center gap-2 text-xs font-bold"
					>
						<div
							className="w-2 h-2 rounded-full shadow-sm"
							style={{ backgroundColor: entry.color }}
						/>
						<span className="text-slate-300">{entry.name}:</span>
						<span className="text-white ml-auto">
							{Number(entry.value).toFixed(2)}%
						</span>
					</div>
				))}
			</div>
		);
	}
	return null;
};

interface InflationRecord {
	yearMonth: string;
	value: number;
}

interface BondAsset {
	currentValue: number;
	interestRate?: number | null;
}

interface Props {
	inflationData: InflationRecord[];
	bonds: BondAsset[];
}

export function InflationShieldClient({ inflationData, bonds }: Props) {
	// 1. Obliczanie średniej ważonej oprocentowania obecnego portfela
	const { weightedYield, totalValue } = useMemo(() => {
		const totalVal = bonds.reduce((sum, b) => sum + (b.currentValue || 0), 0);
		if (totalVal === 0) return { weightedYield: 0, totalValue: 0 };

		const yieldSum = bonds.reduce(
			(sum, b) => sum + (b.currentValue || 0) * (b.interestRate || 0),
			0,
		);
		return { weightedYield: yieldSum / totalVal, totalValue: totalVal };
	}, [bonds]);

	// 2. Przygotowanie danych do wykresu (łączymy inflację z naszym oprocentowaniem)
	const chartData = useMemo(() => {
		// Bierzemy maksymalnie ostatnie 24 miesiące, żeby wykres był czytelny
		const recentInflation = [...inflationData].slice(-24);

		return recentInflation.map((record) => ({
			date: record.yearMonth,
			inflation: record.value,
			portfolioYield: weightedYield,
		}));
	}, [inflationData, weightedYield]);

	const latestInflation = chartData[chartData.length - 1]?.inflation || 0;
	const realYield = weightedYield - latestInflation;
	const isProtected = realYield > 0;

	if (chartData.length === 0) {
		return (
			<div className="flex h-64 items-center justify-center bg-t-bg-panel border border-t-border-subtle rounded-2xl">
				<span className="text-sm font-bold text-t-text-tertiary">
					Brak odczytów inflacji w bazie danych.
				</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 bg-t-bg-panel border border-t-border rounded-2xl shadow-sm">
			{/* Karta z Podsumowaniem Realnego Zysku */}
			<div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-xl">
				<div className="flex items-center gap-3">
					<div
						className={`p-3 rounded-xl ${
							isProtected
								? "bg-emerald-500/10 text-emerald-500"
								: "bg-rose-500/10 text-rose-500"
						}`}
					>
						{isProtected ? (
							<ShieldCheck size={24} />
						) : (
							<ShieldAlert size={24} />
						)}
					</div>
					<div className="flex flex-col">
						<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest">
							Obecny status portfela
						</span>
						<span className="text-lg font-black text-t-text-primary">
							{isProtected ? "Kapitał Chroniony" : "Kapitał Traci na Wartości"}
						</span>
					</div>
				</div>

				<div className="flex gap-6">
					<div className="flex flex-col items-end">
						<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-1">
							Inflacja GUS
						</span>
						<span className="text-sm font-bold text-rose-500">
							{latestInflation.toFixed(2)}%
						</span>
					</div>
					<div className="flex flex-col items-end">
						<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-1">
							Średnie Oprocentowanie
						</span>
						<span className="text-sm font-bold text-blue-500">
							{weightedYield.toFixed(2)}%
						</span>
					</div>
					<div className="flex flex-col items-end pl-6 border-l border-t-border-subtle">
						<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-1">
							Zysk Realny
						</span>
						<span
							className={`text-xl font-black ${
								isProtected ? "text-emerald-500" : "text-rose-500"
							}`}
						>
							{realYield > 0 ? "+" : ""}
							{realYield.toFixed(2)}%
						</span>
					</div>
				</div>
			</div>

			{/* Wykres */}
			<div className="h-75 w-full">
				{/* NOTE: Każdy przodek na drodze do ResponsiveContainer musi mieć albo jawną wysokość (h-75, h-[350px]), albo h-full/flex-1 w kontenerze, który sam ma jawną wysokość. min-h-* samo w sobie nigdy nie wystarczy jako źródło wysokości dla flex-grow. */}
				<div className=" flex flex-col h-full  min-h-[250px]">
					<ChartContainer className="flex-1 min-h-0 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={chartData}
								margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
							>
								<defs>
									<linearGradient
										id="colorInflation"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#334155"
									opacity={0.2}
									vertical={false}
								/>
								<XAxis
									dataKey="date"
									tick={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }}
									tickLine={false}
									axisLine={false}
									dy={10}
								/>
								<YAxis
									tickFormatter={(val) => `${val}%`}
									tick={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }}
									tickLine={false}
									axisLine={false}
									dx={-10}
								/>
								<Tooltip content={<CustomTooltip />} />
								<Area
									type="monotone"
									dataKey="inflation"
									name="Inflacja GUS"
									stroke="#f43f5e"
									strokeWidth={2}
									fillOpacity={1}
									fill="url(#colorInflation)"
								/>
								<Area
									type="step"
									dataKey="portfolioYield"
									name="Moje Oprocentowanie"
									stroke="#10b981"
									strokeWidth={2}
									strokeDasharray="5 5"
									fill="none"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</ChartContainer>
				</div>
			</div>
		</div>
	);
}

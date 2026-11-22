"use client";

import {
	Area,
	AreaChart,
	Brush,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import React, { useMemo, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

import { ChartContainer } from "../shared/ChartContainer";
import { cn } from "@/lib/utils";

type RangeOption = "1Y" | "2Y" | "3Y" | "MAX";

const RANGE_OPTIONS: {
	id: RangeOption;
	label: string;
	months: number | null;
}[] = [
	{ id: "1Y", label: "1Y", months: 12 },
	{ id: "2Y", label: "2Y", months: 24 },
	{ id: "3Y", label: "3Y", months: 36 },
	{ id: "MAX", label: "MAX", months: null },
];

// ----------------------------------------------------------------------
// TOOLTIP TYPES & COMPONENT
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
	const [selectedRange, setSelectedRange] = useState<RangeOption>("MAX");

	// 1. Calculate weighted average yield of the current bond portfolio
	const weightedYield = useMemo(() => {
		const totalVal = bonds.reduce((sum, b) => sum + (b.currentValue || 0), 0);
		if (totalVal === 0) return 0;

		const yieldSum = bonds.reduce(
			(sum, b) => sum + (b.currentValue || 0) * (b.interestRate || 0),
			0,
		);
		return yieldSum / totalVal;
	}, [bonds]);

	// 2. Sort inflation chronologically so newly backfilled historical records appear in order
	const sortedInflation = useMemo(() => {
		return [...inflationData].sort((a, b) =>
			a.yearMonth.localeCompare(b.yearMonth),
		);
	}, [inflationData]);

	// 3. Slice data according to selected range filter
	const chartData = useMemo(() => {
		const activeOption = RANGE_OPTIONS.find((opt) => opt.id === selectedRange);
		const filtered =
			activeOption && activeOption.months !== null
				? sortedInflation.slice(-activeOption.months)
				: sortedInflation;

		return filtered.map((record) => ({
			date: record.yearMonth,
			inflation: record.value,
			portfolioYield: weightedYield,
		}));
	}, [sortedInflation, selectedRange, weightedYield]);

	const latestInflation =
		sortedInflation[sortedInflation.length - 1]?.value || 0;
	const realYield = weightedYield - latestInflation;
	const isProtected = realYield > 0;

	if (sortedInflation.length === 0) {
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
			{/* Summary Card */}
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

				<div className="flex flex-wrap gap-x-4 gap-y-3 sm:gap-6 w-full md:w-auto pt-3 md:pt-0 border-t border-t-border-subtle md:border-none mt-2 md:mt-0">
					<div className="flex flex-col items-start sm:items-end flex-1 sm:flex-none">
						<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-1">
							Inflacja GUS
						</span>
						<span className="text-sm font-bold text-theme-primary">
							{latestInflation.toFixed(2)}%
						</span>
					</div>
					<div className="flex flex-col items-end sm:items-end flex-1 sm:flex-none">
						<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest mb-1 truncate">
							Oprocentowanie
						</span>
						<span className="text-sm font-bold text-blue-500">
							{weightedYield.toFixed(2)}%
						</span>
					</div>
					<div className="flex flex-col items-end pl-0 sm:pl-6 border-l-0 sm:border-l border-t-border-subtle w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 mt-1 sm:mt-0">
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

			{/* Chart with Brush */}
			<div className="h-80 w-full">
				<div className="flex flex-col h-full min-h-[280px]">
					<ChartContainer className="flex-1 min-h-0 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={chartData}
								margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
							>
								<defs>
									<linearGradient
										id="colorInflation"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--theme-primary)"
											stopOpacity={0.3}
										/>
										<stop
											offset="95%"
											stopColor="var(--theme-primary)"
											stopOpacity={0}
										/>
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
									stroke="var(--theme-primary)"
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
								<Brush
									dataKey="date"
									height={22}
									stroke="#475569"
									fill="rgba(15, 23, 42, 0.45)"
									travellerWidth={8}
									tickFormatter={() => ""}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</ChartContainer>
				</div>
			</div>

			{/* Range Filter Controls */}
			<div className="flex items-center justify-between pt-2 border-t border-t-border-subtle">
				<div className="flex items-center gap-1.5">
					{RANGE_OPTIONS.map((option) => {
						const isActive = selectedRange === option.id;
						return (
							<button
								key={option.id}
								type="button"
								onClick={() => setSelectedRange(option.id)}
								className={cn(
									"px-3 py-1.5 rounded-lg text-xs font-bold transition-all border hover:cursor-pointer",
									isActive
										? "bg-blue-500/15 text-blue-400 border-blue-500/40"
										: "bg-black/5 dark:bg-white/5 text-t-text-tertiary border-t-border-subtle hover:text-t-text-primary",
								)}
							>
								{option.label}
							</button>
						);
					})}
				</div>
				<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
					{chartData.length} mies. na wykresie
				</span>
			</div>
		</div>
	);
}

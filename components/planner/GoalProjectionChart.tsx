"use client";

import {
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import AccordionInfo from "../shared/AccordionInfo";
import { ChartContainer } from "../shared/ChartContainer";
import { Input } from "@/components/ui/input";
import { useChartContext } from "../providers/ChartProvider";

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

interface ProjectionPoint {
	name: string;
	yearIndex: number;
	baselineValue: number;
	baselineCapital: number;
	customValue: number;
	customCapital: number;
	[key: string]: number | string;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: any[];
	label?: string;
}

// 🚀 Inteligentny generator symulacji obsługujący oba cele (z bazy i niestandardowy)
function generateComparisonProjection(
	portfolios: PortfolioSim[],
	annualRate: number,
	extraMonthlyDeposit: number,
	customTargetValue: number,
) {
	const monthlyRate = annualRate / 12;
	const realDatabaseTarget = portfolios.reduce(
		(sum, p) => sum + p.targetValue,
		0,
	);
	const effectiveCustomTarget = Math.max(realDatabaseTarget, customTargetValue);
	const initialBalance = portfolios.reduce((sum, p) => sum + p.currentValue, 0);

	if (initialBalance >= effectiveCustomTarget) {
		return {
			data: [
				{
					name: "Start",
					yearIndex: 0,
					baselineValue: initialBalance,
					baselineCapital: initialBalance,
					customValue: initialBalance,
					customCapital: initialBalance,
				},
				{
					name: "CEL",
					yearIndex: 1,
					baselineValue: initialBalance,
					baselineCapital: initialBalance,
					customValue: initialBalance,
					customCapital: initialBalance,
				},
			],
			baseline: {
				years: 0,
				totalValue: initialBalance,
				totalCapital: initialBalance,
				isUnreachable: false,
			},
			custom: {
				years: 0,
				totalValue: initialBalance,
				totalCapital: initialBalance,
				isUnreachable: false,
			},
			realDatabaseTarget,
			effectiveCustomTarget,
		};
	}

	// 1. Symulacja BAZOWA (do celu z bazy)
	const baseState = portfolios.map((p) => ({
		balance: p.currentValue,
		capital: p.currentValue,
		deposit: p.monthlyDeposit,
	}));
	let baseMonths = 0;
	let baseBalance = initialBalance;
	while (baseBalance < realDatabaseTarget && baseMonths < 360) {
		baseBalance = 0;
		baseState.forEach((s) => {
			s.balance = s.balance * (1 + monthlyRate) + s.deposit;
			s.capital += s.deposit;
			baseBalance += s.balance;
		});
		baseMonths++;
	}
	const baselineYears = Number((baseMonths / 12).toFixed(1));
	const baseFinalVal = baseState.reduce((sum, s) => sum + s.balance, 0);
	const baseFinalCap = baseState.reduce((sum, s) => sum + s.capital, 0);

	// 2. Symulacja ZOPTYMALIZOWANEJ + WŁASNY CEL (z dodatkową wpłatą do customTarget)
	const customState = portfolios.map((p) => ({
		balance: p.currentValue,
		capital: p.currentValue,
		deposit:
			p.monthlyDeposit +
			(portfolios.length > 0 ? extraMonthlyDeposit / portfolios.length : 0),
	}));
	let customMonths = 0;
	let customBalance = initialBalance;
	while (customBalance < effectiveCustomTarget && customMonths < 360) {
		customBalance = 0;
		customState.forEach((s) => {
			s.balance = s.balance * (1 + monthlyRate) + s.deposit;
			s.capital += s.deposit;
			customBalance += s.balance;
		});
		customMonths++;
	}
	const customYears = Number((customMonths / 12).toFixed(1));
	const customFinalVal = customState.reduce((sum, s) => sum + s.balance, 0);
	const customFinalCap = customState.reduce((sum, s) => sum + s.capital, 0);

	const targetReachedMonths = Math.max(baseMonths, customMonths);
	const chartMonths = Math.min(360, Math.max(24, targetReachedMonths + 6));

	const baseSimState = portfolios.map((p) => ({
		balance: p.currentValue,
		capital: p.currentValue,
		deposit: p.monthlyDeposit,
	}));
	const customSimState = portfolios.map((p) => ({
		balance: p.currentValue,
		capital: p.currentValue,
		deposit:
			p.monthlyDeposit +
			(portfolios.length > 0 ? extraMonthlyDeposit / portfolios.length : 0),
	}));

	const pointsMap: Record<number, ProjectionPoint> = {};

	pointsMap[0] = {
		name: "Start",
		yearIndex: 0,
		baselineValue: Math.round(initialBalance),
		baselineCapital: Math.round(initialBalance),
		customValue: Math.round(initialBalance),
		customCapital: Math.round(initialBalance),
	};

	for (let m = 1; m <= chartMonths; m++) {
		let bVal = 0;
		let bCap = 0;
		baseSimState.forEach((s) => {
			if (s.balance < realDatabaseTarget) {
				s.balance = s.balance * (1 + monthlyRate) + s.deposit;
				s.capital += s.deposit;
			}
			bVal += s.balance;
			bCap += s.capital;
		});

		let cVal = 0;
		let cCap = 0;
		customSimState.forEach((s) => {
			if (s.balance < effectiveCustomTarget) {
				s.balance = s.balance * (1 + monthlyRate) + s.deposit;
				s.capital += s.deposit;
			}
			cVal += s.balance;
			cCap += s.capital;
		});

		if (m % 12 === 0 || m === chartMonths) {
			const yearIdx = Number((m / 12).toFixed(1));
			const isFinal = m === chartMonths;
			pointsMap[yearIdx] = {
				name: isFinal ? "CEL" : `Rok ${Math.ceil(yearIdx)}`,
				yearIndex: yearIdx,
				baselineValue: Math.round(bVal),
				baselineCapital: Math.round(bCap),
				customValue: Math.round(cVal),
				customCapital: Math.round(cCap),
			};
		}
	}

	const sortedData = Object.values(pointsMap).sort(
		(a, b) => a.yearIndex - b.yearIndex,
	);

	return {
		data: sortedData,
		baseline: {
			years: baselineYears,
			totalValue: baseFinalVal,
			totalCapital: baseFinalCap,
			isUnreachable: baseMonths >= 360,
		},
		custom: {
			years: customYears,
			totalValue: customFinalVal,
			totalCapital: customFinalCap,
			isUnreachable: customMonths >= 360,
		},
		realDatabaseTarget,
		effectiveCustomTarget,
	};
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	if (active && payload && payload.length) {
		return (
			<div className="bg-t-bg-panel border border-t-border rounded-xl p-3 shadow-xl min-w-[220px]">
				<p className="text-[10px] text-t-text-tertiary font-bold uppercase tracking-widest mb-2 border-b border-t-border-subtle pb-2">
					{label}
				</p>
				<div className="space-y-2">
					{payload.map((entry: any, index: number) => (
						<div
							key={index}
							className="flex justify-between items-center gap-4 text-xs font-bold"
						>
							<div className="flex items-center gap-1.5 text-t-text-secondary">
								<div
									className="w-2.5 h-2.5 rounded-full"
									style={{ backgroundColor: entry.color }}
								/>
								<span>{entry.name}</span>
							</div>
							<span className="font-mono text-t-text-primary">
								{formatCurrency(convertPLN(entry.value))} {currencySymbol}
							</span>
						</div>
					))}
				</div>
			</div>
		);
	}
	return null;
};

export function GoalProjectionChart({
	portfolios = [],
}: GoalProjectionChartProps) {
	const { currency, convertPLN } = useChartContext();

	// Obliczamy domyślny cel z bazy
	const initialDbTarget = useMemo(
		() => portfolios.reduce((sum, p) => sum + p.targetValue, 0),
		[portfolios],
	);

	const [annualRate, setAnnualRate] = useState<number>(0.07);
	const [extraDeposit, setExtraDeposit] = useState<number>(500);
	const [customTarget, setCustomTarget] = useState<number>(initialDbTarget);

	// Synchronizacja, gdy portfele się zmienią
	useEffect(() => {
		setCustomTarget(initialDbTarget);
	}, [initialDbTarget]);

	const { data, baseline, custom, realDatabaseTarget, effectiveCustomTarget } =
		useMemo(
			() =>
				generateComparisonProjection(
					portfolios,
					annualRate,
					extraDeposit,
					customTarget,
				),
			[portfolios, annualRate, extraDeposit, customTarget],
		);

	const timeDiff = Number((baseline.years - custom.years).toFixed(1));

	return (
		<div className="space-y-6 h-full flex flex-col">
			{/* GÓRNY PANEL STEROWANIA - 4 KOLUMNY */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-t-border-subtle">
				{/* Horyzont Czasowy */}
				<div>
					<span className="text-xs font-bold text-t-text-tertiary uppercase tracking-wider block mb-1">
						Czas do Celu (Własny)
					</span>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-black text-theme-primary tabular-nums tracking-tight">
							{custom.isUnreachable ? "30+" : custom.years} lat
						</span>
						{extraDeposit > 0 && timeDiff > 0 && (
							<span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
								-{timeDiff} lat szybciej
							</span>
						)}
					</div>
					<span className="text-[11px] text-t-text-secondary mt-0.5 block">
						Cel z bazy:{" "}
						<strong className="text-t-text-primary">
							{baseline.years} lat
						</strong>{" "}
						({formatCurrency(convertPLN(realDatabaseTarget), 0)}{" "}
						{getCurrencySymbol(currency)})
					</span>
				</div>

				{/* Własny Cel Finansowy (Interactive Sandbox) */}
				<div>
					<span className="text-xs font-bold text-t-text-tertiary uppercase tracking-wider block mb-1">
						Własny Cel (Symulacja)
					</span>
					<div className="relative">
						<Input
							type="number"
							value={customTarget || ""}
							onChange={(e) =>
								setCustomTarget(Math.max(0, Number(e.target.value)))
							}
							className="h-9 font-mono font-bold text-sm bg-t-bg-base border-t-border-subtle pr-12"
							placeholder="Wpisz cel"
						/>
						<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-t-text-tertiary font-bold">
							{getCurrencySymbol(currency)}
						</span>
					</div>
					<span className="text-[10px] text-t-text-secondary mt-1 block">
						Testuj różne kwoty na żywo
					</span>
				</div>

				{/* Dodatkowa Wpłata */}
				<div>
					<span className="text-xs font-bold text-t-text-tertiary uppercase tracking-wider block mb-1">
						+ Wpłata miesięczna
					</span>
					<div className="relative">
						<Input
							type="number"
							value={extraDeposit || ""}
							onChange={(e) =>
								setExtraDeposit(Math.max(0, Number(e.target.value)))
							}
							className="h-9 font-mono font-bold text-sm bg-t-bg-base border-t-border-subtle pr-12"
							placeholder="0"
						/>
						<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-t-text-tertiary font-bold">
							{getCurrencySymbol(currency)}
						</span>
					</div>
					<span className="text-[10px] text-t-text-secondary mt-1 block">
						Łączy się z planem bazowym
					</span>
				</div>

				{/* Stopa Zwrotu */}
				<div>
					<span className="text-xs font-bold text-t-text-tertiary uppercase tracking-wider block mb-1">
						Stopa Zwrotu
					</span>
					<div className="flex items-center gap-1 bg-t-bg-base p-1 rounded-xl border border-t-border-subtle h-9">
						{[0.04, 0.07, 0.1].map((rate) => {
							const isSelected = annualRate === rate;
							return (
								<button
									key={rate}
									type="button"
									onClick={() => setAnnualRate(rate)}
									className={`flex-1 h-full rounded-lg text-xs font-bold transition-all ${
										isSelected
											? "bg-theme-primary text-white shadow-sm"
											: "text-t-text-secondary hover:text-t-text-primary"
									}`}
								>
									{(rate * 100).toFixed(0)}%
								</button>
							);
						})}
					</div>
					<span className="text-[10px] text-t-text-secondary mt-1 block">
						Składnik roczny
					</span>
				</div>
			</div>

			{/* WYKRES */}
			<div className="flex-1 w-full min-h-[320px]">
				<ChartContainer className="h-full min-h-0 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart
							data={data}
							margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
						>
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
							<YAxis hide domain={[0, "dataMax + 20000"]} />

							<Tooltip
								content={<CustomTooltip />}
								cursor={{
									stroke: "#94a3b8",
									strokeWidth: 1,
									strokeDasharray: "3 3",
									opacity: 0.5,
								}}
							/>

							{/* Linia Celu z Bazy Danych */}
							<ReferenceLine
								y={realDatabaseTarget}
								stroke="#3b82f6"
								strokeDasharray="4 4"
								strokeOpacity={0.8}
								label={{
									position: "top",
									value: `CEL Z BAZY: ${formatCurrency(convertPLN(realDatabaseTarget), 0)}`,
									fill: "#3b82f6",
									fontSize: 10,
									fontWeight: "900",
								}}
							/>

							{/* Linia Własnego/Niestandardowego Celu (jeśli różni się od bazy) */}
							{effectiveCustomTarget !== realDatabaseTarget && (
								<ReferenceLine
									y={effectiveCustomTarget}
									stroke="#8b5cf6"
									strokeDasharray="3 3"
									strokeOpacity={0.9}
									label={{
										position: "top",
										value: `WŁASNY CEL: ${formatCurrency(convertPLN(effectiveCustomTarget), 0)}`,
										fill: "#8b5cf6",
										fontSize: 10,
										fontWeight: "900",
									}}
								/>
							)}

							<Line
								type="monotone"
								dataKey="baselineValue"
								name="Plan Bazowy"
								stroke="#94a3b8"
								strokeWidth={2}
								strokeDasharray="4 4"
								dot={false}
							/>

							<Line
								type="monotone"
								dataKey="customValue"
								name={`Zoptymalizowany (+${extraDeposit} zł)`}
								stroke="#10b981"
								strokeWidth={3}
								dot={false}
							/>

							<Line
								type="monotone"
								dataKey="customCapital"
								name="Faktycznie wpłacony kapitał"
								stroke="#3b82f6"
								strokeWidth={1.5}
								strokeDasharray="2 2"
								dot={false}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</ChartContainer>
			</div>

			<AccordionInfo des="Wizualizacja pozwala na zestawienie oficjalnego celu finansowego pobranego bezpośrednio z bazy danych portfela z Twoimi własnymi, eksperymentalnymi założeniami w trybie piaskownicy (sandbox). Możesz płynnie zmieniać docelową kwotę bogactwa oraz dodatkowe wpłaty miesięczne, obserwując na wykresie obie linie celów oraz dokładny horyzont czasowy potrzebny do ich realizacji." />
		</div>
	);
}

"use client";

import { DashboardAsset, Transaction } from "@/lib/types";
import { useMemo, useState } from "react";

import { AlphaChart } from "./alpha/AlphaChart";
import { COLORS } from "@/lib/constants";
import { MonthlyDepositsChart } from "./alpha/MonthlyDepositChart";
import { prepareChartAnalytics } from "@/lib/chart-helpers";

interface Props {
	transactions: Transaction[];
	assets: DashboardAsset[];
}

export function InteractiveChartSection({
	transactions = [],
	assets = [],
}: Props) {
	const availableCategories = useMemo(() => {
		const cats = assets
			.filter(
				(a) =>
					a.category !== "BOND" &&
					a.category !== "OBLIGACJE" &&
					a.category !== "CASH", // 🚀 Ignorujemy gotówkę w trendzie
			)
			.map((a) => a.category);
		return Array.from(new Set(cats));
	}, [assets]);

	const [selectedCats, setSelectedCats] =
		useState<string[]>(availableCategories);

	const { areaPoints, barPoints } = useMemo(() => {
		if (!Array.isArray(transactions)) return { areaPoints: [], barPoints: [] };

		// 1. Filtrujemy historię dla wykresu TRENDU (AreaChart)
		// Chcemy tu widzieć tylko pracujące aktywa (bez gotówki i obligacji)
		const filteredTx = transactions.filter(
			(t) =>
				selectedCats.includes(t.category) &&
				t.category !== "BOND" &&
				t.category !== "OBLIGACJE" &&
				t.category !== "CASH", // Gotówka nie buduje "wartości aktywów"
		);

		// 2. Pobieramy tylko te aktywa, które mają kategorię wybraną w filtrach
		const selectedAssets = assets.filter((a) =>
			selectedCats.includes(a.category),
		);

		// 3. Obliczamy ROI tylko dla aktywnych/wybranych aktywów
		const totalInvoiced = selectedAssets.reduce(
			(sum, a) => sum + Number(a.investedCapital),
			0,
		);
		const totalValue = selectedAssets.reduce(
			(sum, a) => sum + Number(a.currentValue),
			0,
		);

		const currentRoiFactor = totalInvoiced > 0 ? totalValue / totalInvoiced : 1;

		// 4. Generujemy dane do obu wykresów
		return prepareChartAnalytics(filteredTx, currentRoiFactor);
	}, [transactions, selectedCats, assets]);
	console.log("🚀 ~ InteractiveChartSection ~ areaPoints:", areaPoints);

	const toggleCategory = (cat: string) => {
		setSelectedCats((prev) =>
			prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
		);
	};

	return (
		<div className="space-y-6">
			{/* Selektor Kategorii z Kolorami */}
			<div className="flex flex-wrap gap-3 px-1">
				{availableCategories.map((cat) => {
					const isActive = selectedCats.includes(cat);
					const catColor = COLORS[cat as keyof typeof COLORS] || "#94a3b8";
					console.log("🚀 ~ InteractiveChartSection ~ catColor:", catColor);

					return (
						<button
							key={cat}
							onClick={() => toggleCategory(cat)}
							className={`group flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${
								isActive
									? "shadow-sm scale-105 opacity-100"
									: "border-gray-600 opacity-60 hover:opacity-80 bg-muted/10"
							}`}
							style={
								isActive
									? {
											backgroundColor: `${catColor}15`, // Lekkie zabarwienie tła kolorem (15% opacity)
											borderColor: catColor,
											color: "var(--foreground)",
										}
									: {
											color: "var(--muted-foreground)", // Przygaszony tekst dla nieaktywnych
										}
							}
						>
							<div
								className={`w-2 h-2 rounded-full shrink-0 transition-transform ${
									isActive ? "scale-110" : "scale-100 grayscale-[1]"
								}`}
								style={{ backgroundColor: catColor }}
							/>
							<span className="tracking-wider">{cat}</span>
						</button>
					);
				})}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 bg-card/40 p-6 rounded-3xl border border-border/50 shadow-sm h-80">
					<AlphaChart data={areaPoints} />
				</div>
				<div className="bg-card/40 p-6 rounded-3xl border border-border/50 shadow-sm h-80">
					<MonthlyDepositsChart data={barPoints} />
				</div>
			</div>
		</div>
	);
}

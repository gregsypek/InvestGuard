"use client";

import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
import { DashboardAsset, Transaction } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

import { AlphaChart } from "./alpha/AlphaChart";
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
	// 1. HOOK: Obliczamy dostępne kategorie
	const availableCategories = useMemo(() => {
		if (!assets || assets.length === 0) return [];
		return Array.from(new Set(assets.map((a) => a.category)));
	}, [assets]);

	// 2. HOOK: Stan wybranych kategorii
	const [selectedCats, setSelectedCats] =
		useState<string[]>(availableCategories);

	// 3. Używamy useEffect zamiast useMemo do zmiany stanu!
	useEffect(() => {
		setSelectedCats(availableCategories);
	}, [availableCategories]);

	// 4. HOOK: Przenosimy to wyżej, przed "if (...) return"
	const { areaPoints, barPoints } = useMemo(() => {
		if (!Array.isArray(transactions) || transactions.length === 0) {
			return { areaPoints: [], barPoints: [] };
		}

		const filteredTx = transactions.filter((t) =>
			selectedCats.includes(t.category),
		);

		if (filteredTx.length === 0) return { areaPoints: [], barPoints: [] };

		// Obliczamy prawdziwy mnożnik na podstawie realnych danych

		const selectedAssets = assets.filter((a) =>
			selectedCats.includes(a.category),
		);

		const totalInvoiced = selectedAssets.reduce(
			(sum, a) => sum + Number(a.investedCapital),
			0,
		);
		const totalValue = selectedAssets.reduce(
			(sum, a) => sum + Number(a.currentValue),
			0,
		);

		const currentRoiFactor = totalInvoiced > 0 ? totalValue / totalInvoiced : 1;

		return prepareChartAnalytics(filteredTx, currentRoiFactor);
	}, [transactions, selectedCats, assets]);

	// Walidacja "No Data" oparta tylko na tym, co zaznaczone w selectedCats
	const validChartTransactions =
		transactions?.filter((t) => availableCategories.includes(t.category)) || [];

	// 5. WCZESNE ZAKOŃCZENIE (Early Return) - Zawsze na samym dole, po wszystkich Hookach!
	if (validChartTransactions.length === 0) {
		return (
			<div className="w-full bg-card/30 p-12 rounded-3xl border border-dashed border-border/60 flex flex-col items-center justify-center text-center space-y-2 my-4">
				<p className="text-sm font-semibold text-foreground">
					Brak historii transakcji dla tego widoku
				</p>
				<p className="text-xs text-muted-foreground">
					Nie masz jeszcze transakcji rynkowych dla aktywów przypisanych do tego
					wykresu.
				</p>
			</div>
		);
	}

	const toggleCategory = (category: string) => {
		setSelectedCats((prev) =>
			prev.includes(category)
				? prev.filter((c) => c !== category)
				: [...prev, category],
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

					const labelKey = cat as keyof typeof CATEGORY_LABELS;

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
							<span className="tracking-wider">
								{CATEGORY_LABELS[labelKey] || cat}
							</span>
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

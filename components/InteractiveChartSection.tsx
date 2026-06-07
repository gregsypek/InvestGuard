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

export interface AlphaPoint {
	name: string; // np. "03.26" (miesiąc i rok)
	wkład: number; // np. 429 (kapitał zainwestowany)
	wycena: number; // np. 506 (aktualna wartość rynkowa)
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
			// ZMIANA: Mroczny stan pusty wtapiający się w tło
			<div className="w-full bg-t-bg-panel border-t-border p-12 rounded-2xl   flex flex-col items-center justify-center text-center space-y-3 my-4">
				<p className="text-sm font-semibold text-slate-300">
					Brak historii transakcji dla tego widoku
				</p>
				<p className="text-xs text-slate-500 max-w-md leading-relaxed">
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
			{/* Selektor Kategorii w stylu Trading UI */}
			<div className="flex flex-wrap gap-2.5 px-1">
				{availableCategories.map((cat) => {
					const isActive = selectedCats.includes(cat);
					// ZMIANA: Zabezpieczenie koloru (fallback na neutralny slate)
					const catColor = COLORS[cat as keyof typeof COLORS] || "#64748b";
					const labelKey = cat as keyof typeof CATEGORY_LABELS;

					return (
						<button
							key={cat}
							onClick={() => toggleCategory(cat)}
							className={`group flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase hover:cursor-pointer tracking-widest transition-all duration-300 border opacity-70${
								isActive
									? "text-slate-600 "
									: "border-white/5   text-slate-700 bg-transparent hover:bg-white/2"
							}`}
							style={
								isActive
									? {
											backgroundColor: `${catColor}15`, // Bardzo delikatne tło (15% krycia)
											borderColor: `${catColor}10`, // Lekko widoczna
											// ramka w kolorze
											color: `${catColor}20`,
											boxShadow: `0 0 10px ${catColor}10`, // Delikatna poświata przycisku
										}
									: {}
							}
						>
							{/* NEONOWA KROPKA */}
							<div
								className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300"
								style={
									isActive
										? {
												backgroundColor: catColor,
												boxShadow: `0 0 8px ${catColor}`, // Świecenie kropki
											}
										: {
												backgroundColor: "#334155", // Zgaszona szara kropka dla nieaktywnych
											}
								}
							/>
							<span>{CATEGORY_LABELS[labelKey] || cat}</span>
						</button>
					);
				})}
			</div>

			{/* KONTENERY WYKRESÓW */}
			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
				{/* Wykres Liniowy (Alpha) */}
				<div className="xl:col-span-2 bg-t-bg-panel p-4 md:p-6 rounded-2xl border border-t-border h-[350px] min-h-[350px] relative w-full flex flex-col">
					<AlphaChart data={areaPoints} />
				</div>

				{/* Wykres Słupkowy (Wpłaty) */}
				<div className="bg-t-bg-panel p-4 md:p-6 rounded-2xl border border-t-border h-[350px] min-h-[350px] relative w-full flex flex-col">
					<MonthlyDepositsChart data={barPoints} />
				</div>
			</div>
		</div>
	);
}

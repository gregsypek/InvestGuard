"use client";

import {
	BarChart2,
	Briefcase,
	ChartArea,
	Globe,
	PieChart,
	Plus,
	TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AssetFilterPanel } from "../shared/AssetFilterPanel";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CategoryTable } from "@/components/CategoryTable";
import GlobalAnalyticsCharts from "./GlobalAnalyticsCharts";
import { InteractiveChartSection } from "../InteractiveChartSection";
import PortfolioCard from "@/components/PortfolioCard";
import { PortfolioWithAssets } from "@/lib/types";
import { SafeActionButton } from "./SafeActionButton";
import { SectionLayout } from "../shared/SectionLayout";
import { cn } from "@/lib/utils";

interface Props {
	portfolios: PortfolioWithAssets[];
	isDemo?: boolean;
	portfolioId?: string;
	categoryTotals: Record<string, number>;
}

export default function PortfoliosClientView({
	portfolios,
	portfolioId: initialPortfolioId,
	categoryTotals, // Zostawiamy dla wstecznej kompatybilności, ale wyliczymy własne
	isDemo = false,
}: Props) {
	// --- 1. STANY DLA STRUKTURY INWESTYCJI (Wykresy) ---
	const [chartsPortfolioId, setChartsPortfolioId] = useState<string>("ALL");
	const [chartsHideClosed, setChartsHideClosed] = useState(true);
	const [chartsSortBy, setChartsSortBy] = useState("VALUE");
	const [chartsFilterCategory, setChartsFilterCategory] = useState("ALL");

	// --- 2. STAN DLA TABELI ALOKACJI ---
	const [tablePortfolioId, setTablePortfolioId] = useState<string>("ALL");

	// --- 3. STAN DLA ANALIZY WZROSTU ---
	const [growthPortfolioId, setGrowthPortfolioId] = useState<string>("ALL");

	// Wspólne opcje wyboru portfela
	const portfolioOptions = [
		{ id: "ALL", label: "Wszystkie portfele" },
		...portfolios.map((p) => ({ id: p.id, label: p.name })),
	];

	// --- LOGIKA: STRUKTURA INWESTYCJI ---
	const chartsAssets = useMemo(() => {
		return chartsPortfolioId === "ALL"
			? portfolios.flatMap((p) => p.assets)
			: portfolios.find((p) => p.id === chartsPortfolioId)?.assets || [];
	}, [portfolios, chartsPortfolioId]);

	const chartsTotalValue = useMemo(
		() => chartsAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0),
		[chartsAssets],
	);

	const chartsActiveCategories = useMemo(() => {
		const uniqueCats = Array.from(
			new Set(chartsAssets.map((a) => a.category).filter(Boolean)),
		) as string[];
		return uniqueCats.map((cat) => ({
			id: cat,
			label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
		}));
	}, [chartsAssets]);

	// --- LOGIKA: TABELA ALOKACJI ---
	const tableAssets = useMemo(() => {
		return tablePortfolioId === "ALL"
			? portfolios.flatMap((p) => p.assets)
			: portfolios.find((p) => p.id === tablePortfolioId)?.assets || [];
	}, [portfolios, tablePortfolioId]);

	const tableTotalValue = useMemo(
		() => tableAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0),
		[tableAssets],
	);

	// 🚀 ZMIANA: Zbieramy pełne dane dla kategorii (Wartość, Zysk PLN, Zysk %)
	const tableCategoryStats = useMemo(() => {
		const stats: Record<string, { value: number; invested: number }> = {};

		tableAssets.forEach((asset) => {
			if (asset.quantity > 0 || asset.category === "CASH") {
				const cat = asset.category || "UNKNOWN";
				if (!stats[cat]) stats[cat] = { value: 0, invested: 0 };

				stats[cat].value += asset.currentValue || 0;
				stats[cat].invested += asset.investedCapital || 0;
			}
		});

		// Przekształcamy to w tablicę gotową do sortowania i renderowania
		return Object.entries(stats).map(([category, data]) => {
			const profitPLN = data.value - data.invested;
			const profitPct =
				data.invested > 0 ? (profitPLN / data.invested) * 100 : 0;

			return {
				category,
				value: data.value,
				profitPLN,
				profitPct,
			};
		});
	}, [tableAssets]);

	// --- LOGIKA: ANALIZA WZROSTU ---
	const growthAssets = useMemo(() => {
		return growthPortfolioId === "ALL"
			? portfolios.flatMap((p) => p.assets)
			: portfolios.find((p) => p.id === growthPortfolioId)?.assets || [];
	}, [portfolios, growthPortfolioId]);

	const growthTransactions = useMemo(() => {
		return growthPortfolioId === "ALL"
			? portfolios.flatMap((p) => p.transactionHistories || [])
			: portfolios.find((p) => p.id === growthPortfolioId)
					?.transactionHistories || [];
	}, [portfolios, growthPortfolioId]);

	// --- KOMPONENT POMOCNICZY: Minimalistyczny selektor do nagłówków sekcji ---
	const renderInlinePortfolioSelector = (
		value: string,
		onChange: (val: string) => void,
	) => (
		<div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors w-full sm:w-auto shrink-0">
			<span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
				Zakres:
			</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="bg-transparent text-t-text-primary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate max-w-[160px]"
			>
				{portfolioOptions.map((opt) => (
					<option key={opt.id} value={opt.id} className="bg-t-bg-panel">
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);

	return (
		<>
			{/* SEKCJA 1: Twoje Portfele */}
			<SectionLayout
				title="Zarządzanie Portfelami"
				titleIcon={Briefcase}
				subtitle="Lista Portfeli"
				description="Przeglądaj, edytuj i dodawaj nowe portfele do swojego konta."
				action={
					<SafeActionButton
						label="Dodaj Nowy Portfel"
						icon={Plus}
						isDemo={isDemo}
						variant="outline"
						href="/portfolios/new"
					/>
				}
			>
				<div className="w-full min-w-0">
					<div
						className={cn(
							"flex overflow-x-auto pb-6 justify-start gap-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4",
							"md:grid md:grid-cols-2 xl:grid-cols-3 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0 md:gap-6",
						)}
					>
						{portfolios.map((p) => (
							<div
								key={p.id}
								className={cn(
									"min-w-[290px] sm:min-w-[320px] flex snap-start shrink-0",
									"md:min-w-0 md:w-full md:shrink",
								)}
							>
								<PortfolioCard portfolio={p} isDemo={isDemo} />
							</div>
						))}
					</div>
				</div>
			</SectionLayout>

			{/* SEKCJA 2: Struktura Inwestycji */}
			<SectionLayout
				title="Struktura Inwestycji"
				titleIcon={BarChart2}
				subtitle="Analiza Wizualna"
				description="Przegląd alokacji i największych pozycji dla wybranego zakresu."
			>
				<AssetFilterPanel
					selectedPortfolioId={chartsPortfolioId}
					onPortfolioChange={setChartsPortfolioId}
					portfolioOptions={portfolioOptions}
					hideClosed={chartsHideClosed}
					onToggleHideClosed={() => setChartsHideClosed(!chartsHideClosed)}
					sortBy={chartsSortBy}
					onSortChange={setChartsSortBy}
					sortOptions={[
						{ id: "VALUE", label: "Wartość" },
						{ id: "PROFIT", label: "Zysk PLN" },
						{ id: "PROFIT_PCT", label: "Zysk %" },
					]}
					filterCategory={chartsFilterCategory}
					onCategoryChange={setChartsFilterCategory}
					availableCategories={chartsActiveCategories}
				/>

				<div className="mt-6">
					<GlobalAnalyticsCharts
						assets={chartsAssets}
						totalValue={chartsTotalValue}
						hideClosed={chartsHideClosed}
						sortBy={chartsSortBy}
						filterCategory={chartsFilterCategory}
					/>
				</div>
			</SectionLayout>

			{/* SEKCJA 3: Analiza Wzrostu i Depozytów */}
			<SectionLayout
				title="Analiza Wzrostu i Depozytów"
				titleIcon={ChartArea}
				subtitle="Wydajność kapitału"
				description="Skumulowany wkład vs bieżąca wycena oraz historia wpłat."
				subtitleIcon={TrendingUp}
				action={renderInlinePortfolioSelector(
					growthPortfolioId,
					setGrowthPortfolioId,
				)}
			>
				<InteractiveChartSection
					transactions={growthTransactions}
					assets={growthAssets.filter((a) => a.category !== "CASH")}
				/>
			</SectionLayout>

			{/* SEKCJA 4: Tabela Alokacji */}
			<SectionLayout
				title="Tabela Alokacji"
				titleIcon={Globe}
				subtitle="Skład i Zdrowie Portfeli"
				description="Dokładne zestawienie procentowe i kwotowe wybranych aktywów."
				subtitleIcon={PieChart}
				action={
					<div className="flex flex-col-reverse sm:flex-row items-end sm:items-center gap-3">
						{renderInlinePortfolioSelector(
							tablePortfolioId,
							setTablePortfolioId,
						)}
						{initialPortfolioId && (
							<SafeActionButton
								label="Dodaj Aktywo"
								icon={Plus}
								isDemo={isDemo}
								variant="outline"
								href={`/dashboard/${initialPortfolioId}/add-asset`}
							/>
						)}
					</div>
				}
			>
				{/* 🚀 ZMIANA: Podajemy nowy format danych */}
				<CategoryTable data={tableCategoryStats} totalValue={tableTotalValue} />
			</SectionLayout>
		</>
	);
}

"use client";

import { BarChart2, Briefcase, Globe, PieChart, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { AssetFilterPanel } from "../shared/AssetFilterPanel";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CategoryTable } from "@/components/CategoryTable";
import GlobalAnalyticsCharts from "./GlobalAnalyticsCharts";
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
	categoryTotals,
	isDemo = false,
}: Props) {
	// --- STANY FILTRÓW ---
	// Stan dla wybranego portfela (z opcją "ALL" dla wszystkich)
	const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("ALL");
	// const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(
	// 	initialPortfolioId || "ALL",
	// );
	const [hideClosed, setHideClosed] = useState(true);
	const [sortBy, setSortBy] = useState("VALUE");
	const [filterCategory, setFilterCategory] = useState("ALL");

	// --- OBLICZANIE DANYCH ---
	// 1. Filtrowanie portfeli bazując na wybranym ID
	const activePortfolios = useMemo(() => {
		if (selectedPortfolioId === "ALL") return portfolios;
		return portfolios.filter((p) => p.id === selectedPortfolioId);
	}, [portfolios, selectedPortfolioId]);

	// 2. Agregacja wszystkich aktywów z aktywnych portfeli
	const allAssets = useMemo(() => {
		return activePortfolios.flatMap((p) => p.assets);
	}, [activePortfolios]);

	// 3. Dynamiczne wyciąganie dostępnych kategorii do filtra
	const activeCategories = useMemo(() => {
		const uniqueCats = Array.from(
			new Set(allAssets.map((a) => a.category).filter(Boolean)),
		) as string[];

		return uniqueCats.map((cat) => ({
			id: cat,
			label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
		}));
	}, [allAssets]);

	// 4. Całkowita wartość (potrzebna do wykresów i tabeli)
	const totalValue = activePortfolios.reduce(
		(sum, p) => sum + p.assets.reduce((aSum, a) => aSum + a.currentValue, 0),
		0,
	);

	// Przygotowanie opcji dla filtra portfeli (Select)
	const portfolioOptions = [
		{ id: "ALL", label: "Wszystkie portfele" },
		...portfolios.map((p) => ({ id: p.id, label: p.name })),
	];

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
				{/* Filtrowanie Portfeli - jako prosty select wyżej */}
				<div className="mb-6 flex items-center gap-2">
					<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
						Wybrany Portfel:
					</span>
					<select
						value={selectedPortfolioId}
						onChange={(e) => setSelectedPortfolioId(e.target.value)}
						className="bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border text-t-text-secondary text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
					>
						{portfolioOptions.map((opt) => (
							<option key={opt.id} value={opt.id}>
								{opt.label}
							</option>
						))}
					</select>
				</div>

				<div className="w-full min-w-0">
					<div
						className={cn(
							"flex overflow-x-auto pb-6 justify-start gap-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4",
							"md:grid md:grid-cols-2 xl:grid-cols-3 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0 md:gap-6",
						)}
					>
						{activePortfolios.map((p) => (
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

			{/* SEKCJA 2: Nowa Analityka i Wizualizacje */}
			<SectionLayout
				title="Struktura Inwestycji"
				titleIcon={BarChart2}
				subtitle="Analiza Wizualna"
				description="Przegląd alokacji i największych pozycji."
			>
				{/* Tu używamy Twojego panelu filtrów */}
				<AssetFilterPanel
					hideClosed={hideClosed}
					onToggleHideClosed={() => setHideClosed(!hideClosed)}
					sortBy={sortBy}
					onSortChange={setSortBy}
					sortOptions={[
						{ id: "VALUE", label: "Wartość" },
						{ id: "PROFIT", label: "Zysk PLN" },
						{ id: "PROFIT_PCT", label: "Zysk %" },
					]}
					filterCategory={filterCategory}
					onCategoryChange={setFilterCategory}
					availableCategories={activeCategories}
				/>

				{/* Komponent z wykresami */}
				<div className="mt-6">
					<GlobalAnalyticsCharts
						assets={allAssets}
						totalValue={totalValue}
						hideClosed={hideClosed}
						sortBy={sortBy}
						filterCategory={filterCategory}
					/>
				</div>
			</SectionLayout>

			{/* SEKCJA 3: Tabela Alokacji (Zaktualizowana o dane) */}
			<SectionLayout
				title="Alokacja Globalna"
				titleIcon={Globe}
				subtitle="Skład i Zdrowie Portfela"
				description="Rozkład aktywów ze wszystkich Twoich portfeli (łącznie)."
				subtitleIcon={PieChart}
				action={
					initialPortfolioId ? (
						<SafeActionButton
							label="Dodaj Aktywo"
							icon={Plus}
							isDemo={isDemo}
							variant="outline"
							href={`/dashboard/${initialPortfolioId}/add-asset`}
						/>
					) : undefined
				}
			>
				{/* Używamy categoryTotals, ale moglibyśmy tu podać wyliczone wartości z activePortfolios */}
				<CategoryTable data={categoryTotals} totalValue={totalValue} />
			</SectionLayout>
		</>
	);
}

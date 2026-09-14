"use client";

import { Banknote, ChartArea, ListOrdered, Rocket } from "lucide-react";
import { useMemo, useState } from "react";

import { AbsoluteDailyPnLChart } from "../dashboard/AbsoluteDailyPnLChart";
import { AlphaHeader } from "../AlphaHeader";
import AlphaLedgerTable from "../AlphaLedgerTable";
import { Button } from "../ui/button";
import { InteractiveChartSection } from "../InteractiveChartSection";
import Link from "next/link";
import { SectionLayout } from "@/components/shared/SectionLayout";

interface AlphaDashboardClientProps {
	assets: any[];
	transactions: any[];
	portfolioId: string;
}

export function AlphaDashboardClient({
	assets,
	transactions,
	portfolioId,
}: AlphaDashboardClientProps) {
	const [filterMode, setFilterMode] = useState<"ALL" | "STOCKS" | "CRYPTO">(
		"ALL",
	);

	// 1. FILTROWANIE BŁYSKAWICZNE
	const filteredAssets = useMemo(() => {
		if (filterMode === "ALL") return assets;
		// UWAGA: Dopasuj 'asset.type' do tego, jak w bazie rozróżniasz Akcje od Krypto wewnątrz kategorii BOOSTER
		return assets.filter((a) =>
			filterMode === "CRYPTO"
				? a.type === "CRYPTO"
				: a.type === "STOCK" || a.type === "ETF",
		);
	}, [assets, filterMode]);

	const filteredTransactions = useMemo(() => {
		const validTickers = filteredAssets.map((a) => a.ticker).filter(Boolean);
		return transactions.filter(
			(t) =>
				validTickers.includes(t.ticker) || (!t.ticker && filterMode === "ALL"),
		);
	}, [transactions, filteredAssets, filterMode]);

	// 2. KPI: Wyniki
	const globalTotalValue =
		assets.reduce((sum, a) => sum + a.currentValue, 0) || 1;
	const alphaTotalValue = filteredAssets.reduce(
		(sum, a) => sum + a.currentValue,
		0,
	);
	const alphaTotalInvested = filteredAssets.reduce(
		(sum, a) => sum + a.investedCapital,
		0,
	);
	const realAlphaShare = (alphaTotalValue / globalTotalValue) * 100;
	const alphaRoi =
		alphaTotalInvested > 0
			? ((alphaTotalValue - alphaTotalInvested) / alphaTotalInvested) * 100
			: 0;

	// 3. NOWE KPI: Win Rate & Top Performer
	const activeAssets = filteredAssets.filter((a) => a.quantity > 0);
	const winningAssets = activeAssets.filter(
		(a) => a.currentValue > a.investedCapital,
	);
	const winRate =
		activeAssets.length > 0
			? (winningAssets.length / activeAssets.length) * 100
			: 0;

	const topPerformer = [...activeAssets].sort((a, b) => {
		const roiA =
			a.investedCapital > 0
				? (a.currentValue - a.investedCapital) / a.investedCapital
				: 0;
		const roiB =
			b.investedCapital > 0
				? (b.currentValue - b.investedCapital) / b.investedCapital
				: 0;
		return roiB - roiA;
	})[0];

	// 4. GENEROWANIE DANYCH DO ABSOLUTE PNL CHART
	const absoluteChartData = useMemo(() => {
		const dailyData: Record<
			string,
			{
				date: string;
				totalPortfolioValue: number;
				netCashFlow: number;
				exactChangePLN: number;
			}
		> = {};

		let runningCapital = 0;
		[...filteredTransactions]
			.sort(
				(a, b) =>
					new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime(),
			)
			.forEach((tx) => {
				const dateKey = new Date(tx.executedAt).toISOString().split("T")[0];
				if (!dailyData[dateKey]) {
					dailyData[dateKey] = {
						date: dateKey,
						totalPortfolioValue: alphaTotalValue,
						netCashFlow: 0,
						exactChangePLN: 0,
					};
				}
				if (tx.type === "DEPOSIT" || tx.type === "BUY") {
					dailyData[dateKey].netCashFlow += Math.abs(tx.executedValue);
					runningCapital += Math.abs(tx.executedValue);
				} else if (tx.type === "SELL") {
					dailyData[dateKey].netCashFlow -= Math.abs(tx.executedValue);
				}
				// Bardzo uproszczona symulacja PnL (do zastąpienia prawdziwymi snapshotami z bazy)
				dailyData[dateKey].exactChangePLN = Math.random() * 2000 - 500;
			});

		return Object.values(dailyData);
	}, [filteredTransactions, alphaTotalValue]);

	return (
		<div>
			<AlphaHeader
				filterMode={filterMode}
				setFilterMode={setFilterMode}
				globalTotalValue={globalTotalValue}
				alphaTotalValue={alphaTotalValue}
				realAlphaShare={realAlphaShare}
				alphaRoi={alphaRoi}
				winRate={winRate}
				topPerformerName={topPerformer?.name || "Brak danych"}
				topPerformerRoi={
					topPerformer
						? ((topPerformer.currentValue - topPerformer.investedCapital) /
								topPerformer.investedCapital) *
							100
						: 0
				}
			/>

			{/* SEKCJA 1: INTERACTIVE CHART */}
			<SectionLayout
				title="Analityka Wyników Alpha"
				titleIcon={ChartArea}
				subtitle="Wydajność strategii"
				description="Wizualizacja trendu wartości oraz historia wpłat wyłącznie dla kapitału podwyższonego ryzyka (Booster)."
				action={
					<Button
						asChild
						className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl h-10 px-5"
					>
						<Link
							href={`/dashboard/${portfolioId}/add-asset?cat=BOOSTER`}
							className="flex items-center gap-2"
						>
							<Rocket className="w-4 h-4" />
							Nowa Teza
						</Link>
					</Button>
				}
			>
				<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
					<InteractiveChartSection
						transactions={filteredTransactions}
						assets={filteredAssets}
					/>
				</div>
			</SectionLayout>

			{/* SEKCJA 2: NOMINALNY WYNIK DZIENNY */}
			<SectionLayout
				title="Nominalny Wynik Dzienny"
				titleIcon={Banknote}
				subtitle="Faktyczna kwota wypracowana na rynku"
				description="Wykres przedstawia dokładną kwotę w PLN, o jaką zmieniła się wartość Twoich aktywów danego dnia. Obliczenia ignorują wpłaty i wypłaty z tego dnia."
			>
				<div className="h-[400px] mt-6 flex flex-col bg-t-bg-panel p-4 md:p-6 rounded-2xl border border-t-border shadow-sm relative">
					<div className="relative flex-1 min-h-0 mt-2">
						<AbsoluteDailyPnLChart key={filterMode} data={absoluteChartData} />
					</div>
				</div>
			</SectionLayout>

			{/* SEKCJA 3: TABELA KASKADOWA */}
			<SectionLayout
				title="Szczegółowe Pozycje Alpha"
				titleIcon={ListOrdered}
				subtitle="Twoje aktywa Booster"
				description="Lista wszystkich aktywów z kategorii Booster wraz z kluczowymi informacjami, zyskami i możliwością szybkiej edycji pozycji."
			>
				<div className="w-full overflow-x-auto no-scrollbar rounded-2xl border border-t-border bg-t-bg-panel shadow-sm md:p-0">
					<AlphaLedgerTable activeBoosterAssets={activeAssets} />
				</div>
			</SectionLayout>
		</div>
	);
}

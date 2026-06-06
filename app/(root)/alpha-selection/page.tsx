import { ChartArea, ListOrdered, Rocket, Wrench } from "lucide-react";
import {
	getPortfolioAssets,
	getPortfolioCategories,
} from "@/lib/actions/portfolio.actions";

import { AlphaHeader } from "@/components/AlphaHeader";
import AlphaLedgerTable from "@/components/AlphaLedgerTable";
import { Button } from "@/components/ui/button";
// import type { Category } from "@prisma/client";
import { InteractiveChartSection } from "@/components/InteractiveChartSection";
import Link from "next/link";
import { MigrationTool } from "@/components/alpha/MigrationTool";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { getGuardedPortfolio } from "@/components/shared/portfolio-guard";
import { redirect } from "next/navigation";

export default async function AlphaSelectionPage({
	searchParams,
}: {
	searchParams: Promise<{ portfolioId?: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	// =====================================================================
	// 1. WYWOŁANIE STRAŻNIKA (Pobiera portfel, aktywa i historię za 1 razem!)
	// =====================================================================
	const { portfolio, portfolioId, errorComponent } = await getGuardedPortfolio({
		searchParams,
		userId: session.user.id,
	});

	if (errorComponent) {
		return errorComponent;
	}

	// Od tego miejsca mamy 100% pewności, że portfolio istnieje
	const activeId = portfolioId;
	const targetUrl = `/dashboard/${activeId}/add-asset?cat=BOOSTER`;

	// =====================================================================
	// 2. PRZYGOTOWANIE DANYCH (Rzutowanie z Decimal do Number)
	// =====================================================================
	const formattedAssets = portfolio.assets.map((asset) => ({
		...asset,
		investedCapital: Number(asset.investedCapital),
		currentValue: Number(asset.currentValue),
		ticker: asset.ticker || null,
	}));

	const formattedTransactions = portfolio.transactionHistories.map((tx) => ({
		...tx,
		type: tx.type,
		executedValue: Number(tx.executedValue),
		ticker: tx.ticker || null,
	}));

	// =====================================================================
	// 3. OBLICZENIA (Wykonywane błyskawicznie w pamięci RAM, bez DB)
	// =====================================================================

	// Całkowita wartość portfela (zabezpieczenie na dzielenie przez 0)
	const globalTotalValue =
		formattedAssets.reduce((sum, a) => sum + a.currentValue, 0) || 1;

	// Aktywa Alpha
	const alphaCategories = ["BOOSTER"];
	const alphaAssets = formattedAssets
		.filter((a) => alphaCategories.includes(a.category))
		.sort((a, b) => b.currentValue - a.currentValue);

	// KPI
	const alphaTotalValue = alphaAssets.reduce(
		(sum, a) => sum + a.currentValue,
		0,
	);
	const alphaTotalInvested = alphaAssets.reduce(
		(sum, a) => sum + a.investedCapital,
		0,
	);

	const realAlphaShare = (alphaTotalValue / globalTotalValue) * 100;

	const alphaRoi =
		alphaTotalInvested > 0
			? ((alphaTotalValue - alphaTotalInvested) / alphaTotalInvested) * 100
			: 0;

	// =====================================================================
	// 4. WYKRES: Agregacja transakcji
	// =====================================================================
	const boosterTransactions = formattedTransactions.filter(
		(t) => t.category === "BOOSTER",
	);

	const aggregatedData: Record<string, { name: string; wklad: number }> = {};
	let cumulative = 0;

	boosterTransactions.forEach((t) => {
		const dateKey = new Date(t.executedAt).toLocaleDateString("pl-PL", {
			day: "2-digit",
			month: "2-digit",
		});

		cumulative += t.executedValue;
		aggregatedData[dateKey] = {
			name: dateKey,
			wklad: cumulative,
		};
	});

	// =====================================================================
	// 5. MIGRACJA: Narzędzia do migracji innych aktywów
	// =====================================================================
	const [categoriesResult, assetsResult] = await Promise.all([
		getPortfolioCategories(activeId),
		getPortfolioAssets(activeId),
	]);

	const filteredAssets = assetsResult.success
		? assetsResult.data.filter(
				(asset) => asset.category !== "BONDS" && asset.category !== "CASH",
			)
		: [];

	const filteredCategories = categoriesResult.success
		? categoriesResult.categories.filter(
				(cat) => cat !== "BONDS" && cat !== "CASH",
			)
		: [];

	// =====================================================================
	// 6. RENDEROWANIE WIDOKU
	// =====================================================================
	return (
		<div className="">
			<AlphaHeader
				globalTotalValue={globalTotalValue}
				alphaTotalValue={alphaTotalValue}
				realAlphaShare={realAlphaShare}
				alphaRoi={alphaRoi}
				// opcjonalnie: activePositions={4}
				customBreadcrumbs={
					<div className="flex items-center gap-2 mb-2">
						<nav className="text-sm text-slate-400 italic">
							Narzędzia /{" "}
							<span className="text-rose-400 font-medium lowercase">Alpha</span>
						</nav>
					</div>
				}
			/>

			{/* GŁÓWNA SEKCJA: Analityka i Wykres w nowym standardzie */}
			<SectionLayout
				title="Analityka Wyników Alpha"
				titleIcon={ChartArea}
				subtitle="Wydajność strategii"
				description="Wizualizacja trendu wartości oraz historia wpłat wyłącznie dla kapitału podwyższonego ryzyka (Booster)."
				action={
					<Button
						asChild
						className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-sm transition-colors h-10 px-5"
					>
						<Link href={targetUrl} className="flex items-center gap-2">
							<Rocket className="w-4 h-4" />
							Nowa Teza
						</Link>
					</Button>
				}
			>
				{/* Kontener systemowy z tłem panelu (Glassmorphism w trybie ciemnym) */}
				<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
					<InteractiveChartSection
						// Przekazujemy wszystkie transakcje zgodnie z zaleceniem
						transactions={formattedTransactions}
						// Aktywa filtrowane dla wykresu
						assets={formattedAssets.filter((a) => a.category === "BOOSTER")}
					/>
				</div>
			</SectionLayout>
			{/* SEKCJA NARZĘDZIA (Tymczasowo tutaj, gotowe na przeniesienie w przyszłości) */}
			<SectionLayout
				title="Narzędzia Administracyjne"
				titleIcon={Wrench}
				subtitle="Konserwacja danych"
				description="Narzędzie pozwala na masową korektę błędnie przypisanych kategorii dla konkretnego aktywa, aktualizując jednocześnie całą historię jego transakcji."
			>
				<MigrationTool
					assets={filteredAssets}
					categories={filteredCategories}
					portfolioId={portfolioId}
				/>
			</SectionLayout>

			{/* SEKCJA TABELA LEDGERA */}
			<SectionLayout
				title="Szczegółowe Pozycje Alpha"
				titleIcon={ListOrdered}
				subtitle="Twoje aktywa Booster"
				description="Lista wszystkich aktywów z kategorii Booster wraz z kluczowymi informacjami, zyskami i możliwością szybkiej edycji pozycji."
			>
				{/* Pudełko systemowe dla tabeli (identyczne jak na stronie Historii) */}
				<div className="w-full overflow-x-auto no-scrollbar rounded-2xl border border-t-border bg-t-bg-panel shadow-sm p-1 md:p-0">
					<AlphaLedgerTable portfolioId={activeId} />
				</div>
			</SectionLayout>
		</div>
	);
}

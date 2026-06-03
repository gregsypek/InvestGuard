import {
	ChartArea,
	ListOrdered,
	Rocket,
	Target,
	TrendingUp,
	Wrench,
} from "lucide-react";
import {
	getPortfolioAssets,
	getPortfolioCategories,
} from "@/lib/actions/portfolio.actions";

import AddButton from "@/components/ui/AddButton";
import { AlphaHeader } from "@/components/AlphaHeader";
import AlphaLedgerTable from "@/components/AlphaLedgerTable";
import { BondStatCard } from "@/components/shared/BondStatCard";
import { Button } from "@/components/ui/button";
import { Category } from "@prisma/client";
// import type { Category } from "@prisma/client";
import { InteractiveChartSection } from "@/components/InteractiveChartSection";
import Link from "next/link";
import { MigrationTool } from "@/components/alpha/MigrationTool";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { SubHeader } from "@/components/shared/SubHeader";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getActivePortfolioId } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AlphaSelectionPage({
	searchParams,
}: {
	searchParams: Promise<{ portfolioId?: string }>;
}) {
	const activeId = await getActivePortfolioId(searchParams);
	// if (!activeId) redirect("/dashboard");
	if (!activeId) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	// Jeśli nie ma żadnego portfela, kierujemy do domyślnego dashboardu,
	// ale zakładamy, że użytkownik Alpha ma już portfel.
	const targetUrl = activeId
		? `/dashboard/${activeId}/add-asset?cat=BOOSTER`
		: "/dashboard";
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	// 1. SUMA CAŁEGO PORTFELA (Mianownik: Obligacje + Gotówka + Alpha)
	const globalTotalResult = await db.asset.aggregate({
		where: { portfolioId: activeId },
		_sum: { currentValue: true },
	});
	const globalTotalValue = globalTotalResult._sum.currentValue || 1;

	// 2. AKTYWA ALPHA (Licznik: Tylko wybrane kategorie w tym portfelu)
	const alphaCategories = ["BOOSTER"];
	// console.log("🚀 ~ AlphaSelectionPage ~ alphaCategories:", alphaCategories);
	const alphaAssets = await db.asset.findMany({
		where: {
			portfolioId: activeId,
			category: { in: alphaCategories as Category[] },
		},
		orderBy: { currentValue: "desc" },
	});

	// 3. OBLICZENIA KPI DLA ALPHA
	const alphaTotalValue = alphaAssets.reduce(
		(sum, a) => sum + a.currentValue,
		0,
	);
	const alphaTotalInvested = alphaAssets.reduce(
		(sum, a) => sum + a.investedCapital,
		0,
	);

	// REALNY UDZIAŁ: Ile % całego portfela (np. emerytalnego) stanowią "Boostery"
	const realAlphaShare = (alphaTotalValue / globalTotalValue) * 100;

	const alphaRoi =
		alphaTotalInvested > 0
			? ((alphaTotalValue - alphaTotalInvested) / alphaTotalInvested) * 100
			: 0;

	/// 1. Pobieramy historię (to już masz)
	const transactions = await db.transactionHistory.findMany({
		where: {
			portfolioId: activeId,
			category: {
				in: ["BOOSTER"],
			},
		},
		orderBy: { executedAt: "asc" },
	});

	// 2. AGREGACJA DANYCH (Poprawka: używamy DD.MM, aby uniknąć nakładania się dat)
	const aggregatedData: Record<string, { name: string; wklad: number }> = {};
	let cumulative = 0;

	transactions.forEach((t) => {
		// Używamy dnia i miesiąca, aby każdy dzień był osobnym punktem na wykresie
		const dateKey = new Date(t.executedAt).toLocaleDateString("pl-PL", {
			day: "2-digit",
			month: "2-digit",
		});

		cumulative += Number(t.executedValue);

		// Zapisujemy skumulowaną wartość dla danego dnia
		aggregatedData[dateKey] = {
			name: dateKey,
			wklad: cumulative,
		};
	});

	const [categoriesResult, assetsResult] = await Promise.all([
		getPortfolioCategories(activeId),
		getPortfolioAssets(activeId), // Pobieramy aktywa: { id, name, ticker, category }
	]);

	// 1. Filtrujemy aktywa: wykluczamy obligacje i gotówkę z narzędzia migracji
	const filteredAssets = assetsResult.success
		? assetsResult.data.filter(
				(asset) => asset.category !== "BONDS" && asset.category !== "CASH",
			)
		: [];

	const filteredCategories = categoriesResult.success
		? categoriesResult.categories.filter(
				(asset) => asset !== "BONDS" && asset !== "CASH",
			)
		: [];

	const portfolioId = await getActivePortfolioId(searchParams);

	// if (portfolioId) {
	// 	return (
	// 		<PortfolioEmptyState variant="NOT_SELECTED" portfolioId={portfolioId} />
	// 	);
	// }
	if (!portfolioId) {
		return <PortfolioEmptyState variant="NOT_FOUND" />;
	}

	const portfolio = await db.portfolio.findUnique({
		where: {
			id: portfolioId,
			userId: session.user.id,
		},
		include: {
			assets: true,
			transactionHistories: {
				orderBy: {
					executedAt: "asc",
				},
			},
		},
	});
	if (!portfolio) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	// if (!portfolio) redirect("/dashboard");

	// Przygotowanie danych (rzutowanie Decimal -> Number) dla TS i builda
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

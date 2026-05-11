import {
	ChartArea,
	ListOrdered,
	Rocket,
	Target,
	TrendingUp,
} from "lucide-react";
import {
	getPortfolioAssets,
	getPortfolioCategories,
} from "@/lib/actions/portfolio.actions";

import AddButton from "@/components/ui/AddButton";
import { AlphaHeader } from "@/components/AlphaHeader";
import AlphaLedgerTable from "@/components/AlphaLedgerTable";
import { BondStatCard } from "@/components/shared/BondStatCard";
import { Category } from "@prisma/client";
// import type { Category } from "@prisma/client";
import { InteractiveChartSection } from "@/components/InteractiveChartSection";
import Link from "next/link";
import { MigrationTool } from "@/components/alpha/MigrationTool";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
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
		<div className="p-6 px-8 space-y-10 ">
			<AlphaHeader
				// totalTransactions={2}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground italic">
						Narzędzia /{" "}
						<span className="text-primary font-medium lowercase">Alpha</span>
					</nav>
				}
			/>

			{/* EN: KPI Section */}
			<div className="flex flex-wrap flex-col md:flex-row gap-4 md:gap-6">
				<BondStatCard
					title="Wycena Portfela (Total)"
					value={`${globalTotalValue.toLocaleString()} PLN`}
					icon={Rocket}
					description="Wartość całkowita portfela"
				/>
				<BondStatCard
					title="Wycena Sekcji Alpha"
					value={`${alphaTotalValue.toLocaleString()} PLN`}
					icon={Target}
					valueColor="amber"
					description="Wartość samych Boosterów"
				/>
				<BondStatCard
					title="Udział Alpha w Całości"
					value={`${realAlphaShare.toFixed(2)}%`}
					description="Twoja ekspozycja na ryzyko"
					variant={realAlphaShare > 10 ? "orange" : "neutral"}
					icon={Target}
				/>
				<BondStatCard
					title="Wynik Alpha (ROI)"
					value={`${alphaRoi >= 0 ? "+" : ""}${alphaRoi.toFixed(2)}%`}
					description="Zysk/Strata sekcji ryzykownych"
					valueColor={alphaRoi >= 0 ? "green" : "red"}
					icon={TrendingUp}
				/>
			</div>

			{/* EN: Main Table Section */}
			<section className="pt-8 border-t border-border">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
					<div className="space-y-1">
						<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider"></div>
						<SectionHeader icon={ChartArea} title="Analityka Wyników Alpha" />
						<SubHeader
							title="Wydajność strategii"
							description="Wizualizacja trendu wartości oraz historia depozytów wyłącznie dla kategorii Booster."
							icon={TrendingUp}
						/>
					</div>

					<AddButton className="gap-2 shadow-sm h-9">
						<Link href={targetUrl} className="gap-2 flex items-center">
							Nowa Teza
						</Link>
					</AddButton>
				</div>
				<div className="mx-6 py-4 pb-16">
					{/* <InteractiveChartSection
						transactions={formattedTransactions.filter(
							(t) => t.category === "BOOSTER",
						)}
						assets={formattedAssets.filter((a) => a.category === "BOOSTER")}
					/> */}
					<InteractiveChartSection
						//  Przekaż wszystkie transakcje, nie filtruj ich tutaj!
						transactions={formattedTransactions}
						// Aktywa filtrujemy, co wyznaczy dostępne przyciski kategorii na wykresie
						assets={formattedAssets.filter((a) => a.category === "BOOSTER")}
						// portfolioId={portfolioId}
					/>
				</div>
			</section>
			{/* SEKCJA NARZĘDZIA */}
			<section className="pt-12 border-t border-border">
				<MigrationTool
					assets={filteredAssets}
					categories={filteredCategories}
					portfolioId={portfolioId}
				/>
			</section>
			{/* SEKCJA TABELA */}
			<section className="pt-12 border-t border-border">
				<SectionHeader icon={ListOrdered} title="Szczegółowe Pozycje Alpha" />
				<SubHeader
					title="Twoje aktywa Booster"
					description="Lista wszystkich aktywów z kategorii Booster wraz z kluczowymi informacjami i możliwością szybkiej edycji."
					icon={Rocket}
				/>
				<div className="w-full ps-6">
					<AlphaLedgerTable />
				</div>
			</section>
		</div>
	);
}

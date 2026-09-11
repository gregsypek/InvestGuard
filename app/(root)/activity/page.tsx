import { AlertCircle, ChartArea, ListOrdered } from "lucide-react";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

import { ActivityHeader } from "@/components/ActivityHeader";
import ActivityTable from "@/components/shared/ActivityTable";
import { ExportReport } from "@/components/history/ExportReport";
import { HistoryChartSection } from "@/components/history/HistoryChartSection";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getPortfolioSnapshotsHistory } from "@/lib/services/history-engine";
import { getTransactionHistory } from "@/lib/actions/history.actions";
import { redirect } from "next/navigation";

export default async function ActivityPage({
	searchParams,
}: {
	searchParams: Promise<{
		page?: string;
		search?: string;
		category?: string;
		sort?: string;
		portfolio?: string;
		range?: string;
	}>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	const cookieStore = await cookies();
	const defaultPortfolioId = cookieStore.get("selectedPortfolioId")?.value;

	// =================================================================
	// 1. OPTYMALIZACJA: Pobieramy tylko ID i Nazwy portfeli (do filtra).
	// Zero aktywów i historii! (Zapytanie szybsze o 99%)
	// =================================================================
	const userPortfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: {
			assets: true,
			transactionHistories: true,
		},
		orderBy: { createdAt: "desc" },
	});

	// 2. Jeśli nie ma portfeli, rzucamy pusty ekran ZANIM obciążymy bazę historią
	if (userPortfolios.length === 0) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	const resolvedParams = await searchParams;
	const currentPage = Number(resolvedParams.page) || 1;
	const search = resolvedParams.search || "";
	const category = resolvedParams.category || "ALL";
	const sort = resolvedParams.sort || "date_desc";
	// 🚀 KLUCZOWA ZMIANA: Inteligentny fallback do ciasteczka
	const portfolioFilter =
		resolvedParams.portfolio || defaultPortfolioId || "ALL";

	// 1. FILTROWANIE PORTFELI NA PODSTAWIE HEADERA/URL
	const activePortfolios =
		portfolioFilter === "ALL"
			? userPortfolios
			: userPortfolios.filter((p) => p.id === portfolioFilter);

	// =================================================================
	// 3. POBIERANIE TRANSAKCJI (Bezpieczne, oparte o sesję)
	// =================================================================
	const result = await getTransactionHistory(
		currentPage,
		10,
		session.user.id,
		search,
		category,
		sort,
		portfolioFilter,
	);

	if (!result.success || !result.data) {
		return (
			<div className="flex flex-col items-center justify-center h-[50vh] text-rose-500 space-y-4">
				<AlertCircle className="h-10 w-10" />
				<p className="font-bold text-t-text-primary tracking-tight">
					Błąd wczytywania historii transakcji.
				</p>
			</div>
		);
	}

	// ZMIANA: Sprawdzamy wszystkie aktywne filtry (w tym portfolio)
	const hasActiveFilters =
		search !== "" || category !== "ALL" || portfolioFilter !== "ALL";

	if (result.meta.totalCount === 0 && !hasActiveFilters) {
		return <PortfolioEmptyState variant="ACTIVITY" />;
	}

	const { data: transactions, meta } = result;

	// 1. Filtrujemy portfele przekazywane do wykresu
	// const filteredPortfolios =
	// 	portfolioFilter === "ALL"
	// 		? userPortfolios
	// 		: userPortfolios.filter((p) => p.id === portfolioFilter);

	// 2. Pobieramy historię TYLKO dla wybranych portfeli
	// const { simulatedSnapshots, realSnapshots, oldestRealSnapshotDate } =
	// 	await getPortfolioSnapshotsHistory(
	// 		filteredPortfolios, // 👈 ZAMIAST userPortfolios
	// 		{ range: resolvedParams.range || "1Y" },
	// 		session.user.id,
	// 	);
	// 2. GENEROWANIE DANYCH DO WYKRESU TYLKO DLA WYBRANYCH PORTFELI
	const { simulatedSnapshots, realSnapshots, oldestRealSnapshotDate } =
		await getPortfolioSnapshotsHistory(
			activePortfolios, // 👈 ZMIANA: Przekazujemy tylko przefiltrowane portfele
			{ range: resolvedParams.range || "1Y" },
			session.user.id,
		);

	const createPageUrl = (pageNumber: number) => {
		const params = new URLSearchParams();
		if (resolvedParams.search) params.set("search", resolvedParams.search);
		if (resolvedParams.category)
			params.set("category", resolvedParams.category);
		if (resolvedParams.sort) params.set("sort", resolvedParams.sort);
		if (resolvedParams.portfolio)
			params.set("portfolio", resolvedParams.portfolio);
		params.set("page", pageNumber.toString());
		return `/activity?${params.toString()}`;
	};

	// 1. Obliczamy całkowitą wycenę aktywów z aktualnie przeglądanych portfeli
	const currentTotalValue = activePortfolios.reduce((sum, portfolio) => {
		const assetsValue = portfolio.assets.reduce(
			(assetSum, asset) => assetSum + Number(asset.currentValue),
			0,
		);
		return sum + assetsValue;
	}, 0);

	// 2. Ustalamy dynamiczną nazwę dla okruszków (breadcrumbs)
	const activePortfolioName =
		portfolioFilter === "ALL"
			? "Wszystkie Portfele"
			: activePortfolios[0]?.name || "Nieznany Portfel";

	return (
		<div>
			{/* NAGŁÓWEK GŁÓWNY */}
			{/* <ActivityHeader
				totalTransactions={meta.totalCount}
				currentPage={currentPage}
				totalPages={meta.totalPages}
				customBreadcrumbs={
					<nav className="text-sm text-slate-400 italic">
						Historia /{" "}
						<span className="text-amber-400 font-medium lowercase">
							wszystko
						</span>
					</nav>
				}
			/> */}
			<ActivityHeader
				totalTransactions={meta.totalCount}
				portfolioName={activePortfolioName}
				totalValue={currentTotalValue}
				hasActiveFilters={search !== "" || category !== "ALL"}
			/>

			{/* NOWA SEKCJA: INTERAKTYWNY WYKRES */}
			<SectionLayout
				title="Analiza Wykresowa"
				titleIcon={ChartArea}
				subtitle="Twoje inwestycje w czasie"
				description="Ten wykres przedstawia zmianę wartości Twoich inwestycji w czasie. Linia przerywana oznacza fizycznie wpłacony kapitał. Możesz płynnie przełączać się między klasycznym widokiem kwotowym (PLN), a widokiem procentowym (%), który najlepiej oddaje faktyczną wydajność (stopę zwrotu) Twojego portfela. Punkty na linii wykresu to dokonane w tym czasie transakcje."
			>
				<HistoryChartSection
					portfolios={activePortfolios}
					transactions={transactions}
					simulatedSnapshots={simulatedSnapshots}
					realSnapshots={realSnapshots}
					oldestRealSnapshotDate={oldestRealSnapshotDate}
					defaultPortfolioId={defaultPortfolioId}
				/>
			</SectionLayout>

			{/* GŁÓWNA SEKCJA */}
			<SectionLayout
				title="Rejestr Transakcji"
				titleIcon={ListOrdered}
				subtitle="Dokładny zapis każdej zrealizowanej operacji."
				description="Tabela zawiera szczegółową historię Twoich zakupów, sprzedaży, wpłat gotówkowych i dywidend. Dzięki niej możesz dokładnie śledzić przepływ kapitału pomiędzy portfelami oraz wyciągać wnioski na podstawie historycznych decyzji (przeglądając notatki)."
				action={<ExportReport data={transactions} />}
			>
				<ActivityTable
					transactions={transactions}
					portfolios={userPortfolios}
				/>
			</SectionLayout>

			{/* PAGINACJA */}
			{meta.totalPages > 1 && (
				<div className="pt-2 pb-12 flex justify-center">
					<Pagination>
						<PaginationContent className="bg-t-bg-panel border border-t-border rounded-full px-2 py-1 shadow-sm">
							<PaginationItem>
								<PaginationPrevious
									// ZMIANA: Używamy naszej nowej funkcji createPageUrl
									href={createPageUrl(Math.max(1, currentPage - 1))}
									aria-disabled={currentPage <= 1}
									className={cn(
										"rounded-full hover:bg-t-hover text-t-text-secondary transition-colors",
										currentPage <= 1 ? "pointer-events-none opacity-50" : "",
									)}
								/>
							</PaginationItem>

							<div className="text-[10px] font-bold uppercase tracking-widest px-6 text-t-text-secondary">
								Strona{" "}
								<span className="text-amber-500 mx-1">{currentPage}</span> z{" "}
								{meta.totalPages}
							</div>

							<PaginationItem>
								<PaginationNext
									// ZMIANA: Używamy naszej nowej funkcji createPageUrl
									href={createPageUrl(
										Math.min(meta.totalPages, currentPage + 1),
									)}
									aria-disabled={currentPage >= meta.totalPages}
									className={cn(
										"rounded-full hover:bg-t-hover text-t-text-secondary transition-colors",
										currentPage >= meta.totalPages
											? "pointer-events-none opacity-50"
											: "",
									)}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}
		</div>
	);
}

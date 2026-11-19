import { AlertCircle, BarChart3, ChartArea, ListOrdered } from "lucide-react";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { SectionNavTabs, SectionTab } from "@/components/shared/SectionNavTabs";

import { ActivityHeader } from "@/components/ActivityHeader";
import ActivityTable from "@/components/shared/ActivityTable";
import { HistoryChartSection } from "@/components/history/HistoryChartSection";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/format-currency";
import { getPortfolioSnapshotsHistory } from "@/lib/history-engine";
import { getTransactionHistory } from "@/lib/actions/history.actions";
import { redirect } from "next/navigation";

// Define dedicated sections for the Activity page using icon names as strings
const ACTIVITY_SECTIONS: SectionTab[] = [
	{ id: "section-stats", label: "Statystyki", iconName: "BarChart3" },
	{ id: "section-history-chart", label: "Wykres", iconName: "ChartArea" },
	{ id: "section-activity-table", label: "Rejestr", iconName: "ListOrdered" },
];

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

	// Fetch user portfolios with assets and transaction history for KPI calculations and filters
	const userPortfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: {
			assets: true,
			transactionHistories: true,
		},
		orderBy: { createdAt: "desc" },
	});

	if (userPortfolios.length === 0) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	const resolvedParams = await searchParams;
	const currentPage = Number(resolvedParams.page) || 1;
	const search = resolvedParams.search || "";
	const category = resolvedParams.category || "ALL";
	const sort = resolvedParams.sort || "date_desc";
	const portfolioFilter =
		resolvedParams.portfolio || defaultPortfolioId || "ALL";

	const hasActiveFilters =
		search !== "" || category !== "ALL" || portfolioFilter !== "ALL";

	const { simulatedSnapshots, realSnapshots, oldestRealSnapshotDate } =
		await getPortfolioSnapshotsHistory(
			userPortfolios,
			{ range: resolvedParams.range || "1Y" },
			session.user.id,
		);

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

	if (result.meta.totalCount === 0 && !hasActiveFilters) {
		return <PortfolioEmptyState variant="ACTIVITY" />;
	}

	const { data: transactions, meta } = result;

	// Filter all transactions across selected portfolios to compute accurate global KPIs
	const activePortfolios =
		portfolioFilter === "ALL"
			? userPortfolios
			: userPortfolios.filter((p) => p.id === portfolioFilter);

	const allFilteredTransactions = activePortfolios
		.flatMap((p) => p.transactionHistories)
		.filter((t) => {
			const matchesCategory = category === "ALL" || t.category === category;
			const matchesSearch =
				!search ||
				t.assetName?.toLowerCase().includes(search.toLowerCase()) ||
				t.ticker?.toLowerCase().includes(search.toLowerCase());
			return matchesCategory && matchesSearch;
		});

	// Exclude technical balance adjustments (UPDATE) and zero-value entries
	const meaningfulTransactions = allFilteredTransactions.filter(
		(t) => t.type !== "UPDATE" && Math.abs(Number(t.executedValue)) > 0,
	);

	// Sum of absolute executed values across all meaningful operations
	const totalVolumeValue = meaningfulTransactions.reduce(
		(sum, t) => sum + Math.abs(Number(t.executedValue)),
		0,
	);

	const avgTransactionValue =
		meaningfulTransactions.length > 0
			? totalVolumeValue / meaningfulTransactions.length
			: 0;

	const buyCount = allFilteredTransactions.filter(
		(t) => t.type === "BUY" || t.type === "DEPOSIT",
	).length;

	const sellCount = allFilteredTransactions.filter(
		(t) => t.type === "SELL",
	).length;

	const totalPassiveIncome = allFilteredTransactions
		.filter((t) => t.type === "INTEREST" && Number(t.executedValue) > 0)
		.reduce((sum, t) => sum + Number(t.executedValue), 0);

	const volumeTooltipText = `Suma wartości bezwzględnych (${meaningfulTransactions.length} operacji z pominięciem korekt UPDATE) dla aktywnych filtrów: kupno, sprzedaż, wpłaty, dywidendy i odsetki w PLN.`;

	const createPageUrl = (pageNumber: number) => {
		const params = new URLSearchParams();
		if (resolvedParams.search) params.set("search", resolvedParams.search);
		if (resolvedParams.category)
			params.set("category", resolvedParams.category);
		if (resolvedParams.sort) params.set("sort", resolvedParams.sort);
		if (portfolioFilter !== "ALL") params.set("portfolio", portfolioFilter);
		params.set("page", pageNumber.toString());
		return `/activity?${params.toString()}`;
	};

	return (
		<div>
			<ActivityHeader
				totalTransactions={meta.totalCount}
				hasActiveFilters={hasActiveFilters}
				portfolios={userPortfolios}
			/>

			<div className="mt-10">
				<SectionNavTabs sections={ACTIVITY_SECTIONS} />
			</div>

			{/* KPI summary cards for transaction history */}
			<div id="section-stats" className="scroll-mt-20 mt-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* Card 1: Total Operations Volume */}
					<div
						className="bg-t-bg-panel border border-t-border rounded-2xl p-4 shadow-sm cursor-help"
						title={volumeTooltipText}
					>
						<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest block mb-1 underline decoration-dotted decoration-t-text-tertiary">
							Łączny Wolumen Operacji
						</span>
						<span className="text-2xl font-black text-t-text-primary tabular-nums tracking-tight">
							{formatCurrency(totalVolumeValue, 0)}{" "}
							<span className="text-xs font-bold text-t-text-tertiary">
								PLN
							</span>
						</span>
						<span className="text-[10px] text-t-text-secondary mt-1 block">
							Suma obrotów ({meaningfulTransactions.length} operacji)
						</span>
					</div>

					{/* Card 2: Average Single Transaction Value */}
					<div className="bg-t-bg-panel border border-t-border rounded-2xl p-4 shadow-sm">
						<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest block mb-1">
							Średnia Transakcja
						</span>
						<span className="text-2xl font-black text-blue-500 tabular-nums tracking-tight">
							{formatCurrency(avgTransactionValue, 0)}{" "}
							<span className="text-xs font-bold text-t-text-tertiary">
								PLN
							</span>
						</span>
						<span className="text-[10px] text-t-text-secondary mt-1 block">
							Średnia wartość pojedynczej operacji
						</span>
					</div>

					{/* Card 3: Buy vs Sell Ratio */}
					<div className="bg-t-bg-panel border border-t-border rounded-2xl p-4 shadow-sm">
						<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest block mb-1">
							Zakupy / Sprzedaże
						</span>
						<div className="flex items-baseline gap-2 tabular-nums tracking-tight">
							<span className="text-2xl font-black text-emerald-500">
								{buyCount}
							</span>
							<span className="text-sm font-bold text-t-text-tertiary">/</span>
							<span className="text-xl font-black text-rose-500">
								{sellCount}
							</span>
						</div>
						<span className="text-[10px] text-t-text-secondary mt-1 block">
							Akumulacja vs redukcja pozycji
						</span>
					</div>

					{/* Card 4: Realized Dividends & Interest */}
					<div className="bg-t-bg-panel border border-t-border rounded-2xl p-4 shadow-sm">
						<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest block mb-1">
							Dywidendy i Odsetki
						</span>
						<span className="text-2xl font-black text-purple-500 tabular-nums tracking-tight">
							+{formatCurrency(totalPassiveIncome, 0)}{" "}
							<span className="text-xs font-bold text-t-text-tertiary">
								PLN
							</span>
						</span>
						<span className="text-[10px] text-t-text-secondary mt-1 block">
							Zaksięgowany dochód pasywny
						</span>
					</div>
				</div>
			</div>

			{/* SEKCJA 2: ANALIZA WYKRESOWA */}
			<div id="section-history-chart" className="scroll-mt-20">
				<SectionLayout
					title="Analiza Wykresowa"
					titleIcon={ChartArea}
					subtitle="Twoje inwestycje w czasie"
					description="Ten wykres przedstawia zmianę wartości Twoich inwestycji w czasie. Linia przerywana oznacza fizycznie wpłacony kapitał. Możesz płynnie przełączać się między klasycznym widokiem kwotowym (PLN), a widokiem procentowym (%), który najlepiej oddaje faktyczną wydajność (stopę zwrotu) Twojego portfela. Punkty na linii wykresu to dokonane w tym czasie transakcje."
				>
					<HistoryChartSection
						portfolios={userPortfolios}
						transactions={transactions}
						simulatedSnapshots={simulatedSnapshots}
						realSnapshots={realSnapshots}
						oldestRealSnapshotDate={oldestRealSnapshotDate}
					/>
				</SectionLayout>
			</div>

			{/* SEKCJA 3: REJESTR TRANSAKCJI */}
			<div id="section-activity-table" className="scroll-mt-20">
				<SectionLayout
					title="Rejestr Transakcji"
					titleIcon={ListOrdered}
					subtitle="Dokładny zapis każdej zrealizowanej operacji."
					description="Tabela zawiera szczegółową historię Twoich zakupów, sprzedaży, wpłat gotówkowych i dywidend. Dzięki niej możesz dokładnie śledzić przepływ kapitału pomiędzy portfelami oraz wyciągać wnioski na podstawie historycznych decyzji (przeglądając notatki)."
				>
					<ActivityTable
						transactions={transactions}
						portfolios={userPortfolios}
					/>
				</SectionLayout>
			</div>

			{/* PAGINACJA */}
			{meta.totalPages > 1 && (
				<div className="pt-2 pb-12 flex justify-center">
					<Pagination>
						<PaginationContent className="bg-t-bg-panel border border-t-border rounded-full px-2 py-1 shadow-sm">
							<PaginationItem>
								<PaginationPrevious
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
								<span className="text-theme-primary mx-1">{currentPage}</span> z{" "}
								{meta.totalPages}
							</div>

							<PaginationItem>
								<PaginationNext
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

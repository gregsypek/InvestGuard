import { AlertCircle, BarChart3, ChartArea, ListOrdered } from "lucide-react";
import { Category, Prisma } from "@prisma/client";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { SectionNavTabs, SectionTab } from "@/components/shared/SectionNavTabs";
import {
	calculateLiveBondValue,
	getBondDictionaries,
} from "@/lib/bond-calculations";

import { ActivityHeader } from "@/components/ActivityHeader";
import ActivityTable from "@/components/shared/ActivityTable";
import { HistoryChartSection } from "@/components/history/HistoryChartSection";
import { MonthlyPurchasesSection } from "@/components/history/MonthlyPurchaseSection";
// import { MonthlyPurchasesSection } from "@/components/history/MonthlyPurchasesSection";
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

const ACTIVITY_SECTIONS: SectionTab[] = [
	{ id: "section-stats", label: "Statystyki", iconName: "BarChart3" },
	{ id: "section-history-chart", label: "Wykres", iconName: "ChartArea" },
	{ id: "section-monthly-cards", label: "Zakupy", iconName: "History" },
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
		portfolioId?: string;
		range?: string;
	}>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	const cookieStore = await cookies();
	const defaultPortfolioId = cookieStore.get("selectedPortfolioId")?.value;

	const rawUserPortfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: {
			assets: true,
			transactionHistories: {
				orderBy: { executedAt: "desc" },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	if (rawUserPortfolios.length === 0) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	// Enrich bond assets with live accrued interest so monthly bond purchases show accurate profit
	const hasBonds = rawUserPortfolios.some((p) =>
		p.assets.some((a) => a.category === "BONDS"),
	);
	let userPortfolios = rawUserPortfolios;

	if (hasBonds) {
		const { inflationMap, configMap } = await getBondDictionaries();
		userPortfolios = rawUserPortfolios.map((portfolio) => ({
			...portfolio,
			assets: portfolio.assets.map((asset) => {
				if (asset.category === "BONDS") {
					const cleanTicker = asset.ticker
						? asset.ticker.split("_")[0]
						: "UNKNOWN";
					const calculated = calculateLiveBondValue(
						Number(asset.investedCapital),
						asset.interestRate ?? 0,
						asset.purchaseDate,
						cleanTicker,
						inflationMap,
						configMap,
					);
					return { ...asset, currentValue: calculated.value };
				}
				return asset;
			}),
		}));
	}

	const resolvedParams = await searchParams;
	const currentPage = Number(resolvedParams.page) || 1;
	const search = resolvedParams.search || "";
	const category = resolvedParams.category || "ALL";
	const sort = resolvedParams.sort || "date_desc";
	const portfolioFilter =
		resolvedParams.portfolio ||
		resolvedParams.portfolioId ||
		defaultPortfolioId ||
		"ALL";

	const hasActiveFilters =
		search !== "" || category !== "ALL" || portfolioFilter !== "ALL";

	const kpiWhereClause: Prisma.TransactionHistoryWhereInput = {
		portfolio: { userId: session.user.id },
		...(portfolioFilter !== "ALL" ? { portfolioId: portfolioFilter } : {}),
		...(category !== "ALL" ? { category: category as Category } : {}),
		...(search
			? {
					OR: [
						{ assetName: { contains: search, mode: "insensitive" } },
						{ ticker: { contains: search, mode: "insensitive" } },
					],
				}
			: {}),
	};

	const buyWhereClause: Prisma.TransactionHistoryWhereInput = {
		portfolio: { userId: session.user.id },
		type: "BUY",
		category: { not: "CASH" },
		...(portfolioFilter !== "ALL" ? { portfolioId: portfolioFilter } : {}),
		...(category !== "ALL" ? { category: category as Category } : {}),
	};

	const [snapshotsResult, result, kpiGrouped, buyTransactions] =
		await Promise.all([
			getPortfolioSnapshotsHistory(
				userPortfolios,
				{ range: resolvedParams.range || "1Y" },
				session.user.id,
			),
			getTransactionHistory(
				currentPage,
				10,
				session.user.id,
				search,
				category,
				sort,
				portfolioFilter,
			),
			db.transactionHistory.groupBy({
				by: ["type"],
				where: kpiWhereClause,
				_count: { _all: true },
				_sum: { executedValue: true },
			}),
			db.transactionHistory.findMany({
				where: buyWhereClause,
				orderBy: { executedAt: "desc" },
				select: {
					id: true,
					portfolioId: true,
					assetName: true,
					ticker: true,
					category: true,
					quantity: true,
					executedValue: true,
					executedAt: true,
				},
			}),
		]);

	const { simulatedSnapshots, realSnapshots, oldestRealSnapshotDate } =
		snapshotsResult;

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

	let meaningfulCount = 0;
	let totalVolumeValue = 0;
	let buyCount = 0;
	let sellCount = 0;
	let totalPassiveIncome = 0;

	for (const group of kpiGrouped) {
		const count = group._count?._all ?? 0;
		const sumVal = Number(group._sum?.executedValue ?? 0);

		if (group.type !== "UPDATE" && Math.abs(sumVal) > 0) {
			meaningfulCount += count;
			totalVolumeValue += Math.abs(sumVal);
		}
		if (group.type === "BUY" || group.type === "DEPOSIT") {
			buyCount += count;
		}
		if (group.type === "SELL") {
			sellCount += count;
		}
		if (group.type === "INTEREST" && sumVal > 0) {
			totalPassiveIncome += sumVal;
		}
	}

	const avgTransactionValue =
		meaningfulCount > 0 ? totalVolumeValue / meaningfulCount : 0;

	const volumeTooltipText = `Suma wartości bezwzględnych (${meaningfulCount} operacji z pominięciem korekt UPDATE) dla aktywnych filtrów: kupno, sprzedaż, wpłaty, dywidendy i odsetki w PLN.`;

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

			<SectionNavTabs sections={ACTIVITY_SECTIONS} />

			{/* KPI summary cards for transaction history */}
			<div id="section-stats" className="scroll-mt-20 section-padding">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
							Suma obrotów ({meaningfulCount} operacji)
						</span>
					</div>

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

			{/* SECTION 2: CHART ANALYSIS */}
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

			{/* SECTION 3: MONTHLY PURCHASES CARDS */}
			<MonthlyPurchasesSection
				buyTransactions={buyTransactions.map((tx) => ({
					...tx,
					executedValue: Number(tx.executedValue),
					quantity: tx.quantity != null ? Number(tx.quantity) : null,
				}))}
				portfolios={userPortfolios}
			/>

			{/* SECTION 4: TRANSACTION LEDGER */}
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

			{/* PAGINATION */}
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

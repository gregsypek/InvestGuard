import { AlertCircle, ListOrdered } from "lucide-react";
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
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
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
	}>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	// =================================================================
	// 1. OPTYMALIZACJA: Pobieramy tylko ID i Nazwy portfeli (do filtra).
	// Zero aktywów i historii! (Zapytanie szybsze o 99%)
	// =================================================================
	const userPortfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		select: { id: true, name: true },
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
	const portfolioFilter = resolvedParams.portfolio || "ALL";

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

	return (
		<div>
			{/* NAGŁÓWEK GŁÓWNY */}
			<ActivityHeader
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
			/>

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

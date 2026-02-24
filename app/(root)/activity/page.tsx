// app/(root)/activity/page.tsx
import {
	deleteHistoryItem,
	getTransactionHistory,
} from "@/lib/actions/history.actions";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { ExportReport } from "@/components/history/ExportReport";
// import { ActivityHeader } from "@/components/history/ActivityHeader";
import { ListOrdered, AlertCircle } from "lucide-react";
import { COLORS, CATEGORY_LABELS } from "@/lib/constants";
import { ActivityHeader } from "@/components/ActivityHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";

export default async function ActivityPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	const resolvedParams = await searchParams;
	const currentPage = Number(resolvedParams.page) || 1;
	const take = 10;

	const result = await getTransactionHistory(
		currentPage,
		take,
		session.user.id,
	);

	if (!result.success || !result.data) {
		return (
			<div className="flex flex-col items-center justify-center h-[50vh] text-red-500 space-y-4">
				<AlertCircle className="h-10 w-10" />
				<p className="font-bold">Błąd wczytywania historii transakcji.</p>
			</div>
		);
	}
	// OBSŁUGA PUSTEGO STANU
	if (result.meta.totalCount === 0) {
		return <PortfolioEmptyState variant="ACTIVITY" />;
	}

	const { data: transactions, meta } = result;

	return (
		<div className="space-y-10 pb-20 ">
			<ActivityHeader
				totalTransactions={meta.totalCount} // EN: Assuming your meta returns totalCount
				currentPage={currentPage}
				totalPages={meta.totalPages}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground mb-2 italic">
						Narzędzia /{" "}
						<span className="text-primary font-medium">Historia</span>
					</nav>
				}
			/>
			{/* EN: Parent container needs min-h-screen (or enough height) and
			flex-col. UI: Kontener nadrzędny musi mieć flex-col i flex-1, aby
			justify-between zadziałało.  */}
			<div className="flex flex-col min-h-[calc(100vh-200px)] space-y-10">
				{/* EN: Wrapping the main content in flex-1 to push footer down */}
				{/* UI: Owijamy główną treść w flex-1, co wypchnie paginację na dół */}
				<div className="flex-1 space-y-6">
					{/* Toolbar */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
						<h2 className="h2-bold flex items-center gap-2">
							<ListOrdered className="h-5 w-5 text-primary" /> Rejestr
							Transakcji
						</h2>
						<ExportReport data={transactions} />
					</div>

					{/* EN: Table Container with styling */}

					<Table>
						<TableHeader className="bg-muted/30">
							<TableRow className="border-border hover:bg-transparent">
								<TableHead className="font-bold">Data</TableHead>
								<TableHead className="font-bold">Aktywo</TableHead>
								<TableHead className="font-bold">Kategoria</TableHead>
								<TableHead className="text-right font-bold">Wartość</TableHead>
								<TableHead className="font-bold">Notatka</TableHead>
								<TableHead className="w-12 text-right"></TableHead>
							</TableRow>{" "}
						</TableHeader>
						<TableBody>
							{transactions.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-12 text-muted-foreground"
									>
										Brak zarejestrowanych transakcji w historii.
									</TableCell>
								</TableRow>
							) : (
								transactions.map((t) => {
									const categoryColor =
										COLORS[t.category as keyof typeof COLORS] ||
										"var(--primary)";
									const categoryLabel =
										CATEGORY_LABELS[t.category] || t.category;

									return (
										<TableRow
											key={t.id}
											className="border-border hover:bg-muted/20 transition-colors"
										>
											<TableCell className="font-medium font-mono text-sm">
												{new Date(t.executedAt).toLocaleDateString("pl-PL", {
													year: "numeric",
													month: "2-digit",
													day: "2-digit",
												})}
											</TableCell>

											<TableCell>
												<div className="font-bold text-sm">{t.assetName}</div>
												{t.ticker && (
													<div className="text-[10px] text-muted-foreground font-mono bg-muted inline-block px-1.5 py-0.5 rounded mt-0.5">
														{t.ticker}
													</div>
												)}
											</TableCell>

											<TableCell>
												<div className="flex items-center gap-1.5">
													<div
														className="w-2 h-2 rounded-full border border-border shadow-xs"
														style={{ backgroundColor: categoryColor }}
													/>
													<span className="text-[10px] uppercase  tracking-wider text-muted-foreground font-semibold">
														{categoryLabel}
													</span>
												</div>
											</TableCell>

											<TableCell className="text-right font-mono font-semibold text-sm">
												{t.executedValue.toLocaleString(undefined, {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}{" "}
												<span className="text-xs text-muted-foreground">
													PLN
												</span>
											</TableCell>

											<TableCell className="max-w-40 xl:max-w-64 truncate text-xs text-muted-foreground italic">
												{t.rationale ? `"${t.rationale}"` : "—"}
											</TableCell>

											<TableCell className="text-right">
												<DeleteButton
													id={t.id}
													onDelete={deleteHistoryItem}
													confirmMsg="Czy napewno chcesz usunąć transakcję z historii"
												/>
											</TableCell>
										</TableRow>
									);
								})
							)}{" "}
						</TableBody>
					</Table>
				</div>

				{/* EN: Pagination - always pushed to the bottom because of flex-1 above */}
				{meta.totalPages > 1 && (
					<div className="pt-8 flex justify-center  ">
						<Pagination>
							<PaginationContent className="bg-card/50 border border-primary/20  rounded-full px-2 shadow-sm">
								<PaginationItem>
									<PaginationPrevious
										href={`/activity?page=${Math.max(1, currentPage - 1)}`}
										aria-disabled={currentPage <= 1}
										className={
											currentPage <= 1 ? "pointer-events-none opacity-50" : ""
										}
									/>
								</PaginationItem>

								<div className="text-xs font-bold uppercase tracking-widest px-6 text-muted-foreground">
									Strona {currentPage} z {meta.totalPages}
								</div>

								<PaginationItem>
									<PaginationNext
										href={`/activity?page=${Math.min(meta.totalPages, currentPage + 1)}`}
										aria-disabled={currentPage >= meta.totalPages}
										className={
											currentPage >= meta.totalPages
												? "pointer-events-none opacity-50"
												: ""
										}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</div>
		</div>
	);
}

// import { ActivityHeader } from "@/components/history/ActivityHeader";
import { AlertCircle, ListOrdered } from "lucide-react";
import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
// app/(root)/activity/page.tsx
import {
	deleteHistoryItem,
	getTransactionHistory,
} from "@/lib/actions/history.actions";

import { ActivityHeader } from "@/components/ActivityHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { ExportReport } from "@/components/history/ExportReport";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

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
		<div className="space-y-10 pb-20">
			<ActivityHeader
				totalTransactions={meta.totalCount}
				currentPage={currentPage}
				totalPages={meta.totalPages}
			/>

			<div className="flex flex-col min-h-[calc(100vh-200px)] space-y-10">
				<div className="flex-1 space-y-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
						<h2 className="h2-bold flex items-center gap-2">
							<ListOrdered className="h-5 w-5 text-primary" /> Rejestr
							Transakcji
						</h2>
						<ExportReport data={transactions} />
					</div>

					<Table>
						<TableHeader className="bg-muted/30">
							<TableRow className="border-border hover:bg-transparent">
								<TableHead className="font-bold text-xs uppercase">
									Data
								</TableHead>
								<TableHead className="font-bold text-xs uppercase">
									Aktywo
								</TableHead>
								<TableHead className="font-bold text-xs uppercase">
									Kategoria
								</TableHead>
								<TableHead className="text-right font-bold text-xs uppercase">
									Wartość
								</TableHead>
								<TableHead className="font-bold text-xs uppercase">
									Notatka
								</TableHead>
								<TableHead className="w-12 text-right"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{transactions.map((t) => {
								const categoryColor =
									COLORS[t.category as keyof typeof COLORS] || "var(--primary)";
								const isBuy = t.quantity > 0;
								// Obliczamy cenę jednostkową na podstawie łącznej wartości i ilości
								const unitPrice =
									t.quantity !== 0 ? Math.abs(t.executedValue / t.quantity) : 0;

								return (
									<TableRow
										key={t.id}
										className="border-border hover:bg-muted/20 transition-colors"
									>
										<TableCell className="font-medium font-mono text-[13px]">
											{new Date(t.executedAt).toLocaleDateString("pl-PL")}
										</TableCell>

										<TableCell>
											<div className="font-bold text-sm">{t.assetName}</div>
											{t.ticker && (
												<div className="text-[10px] text-muted-foreground font-mono bg-muted inline-block px-1.5 py-0.5 rounded mt-0.5 uppercase">
													{t.ticker}
												</div>
											)}
										</TableCell>

										<TableCell>
											<div className="flex items-center gap-1.5">
												<div
													className="w-2 h-2 rounded-full border border-border"
													style={{ backgroundColor: categoryColor }}
												/>
												<span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
													{CATEGORY_LABELS[t.category] || t.category}
												</span>
											</div>
										</TableCell>

										{/* KOLUMNA WARTOŚĆ: Stacking Mono z Plusem i Kolorem */}
										<TableCell className="text-right">
											<div className="flex flex-col items-end font-mono">
												<span
													className={cn(
														"font-bold text-sm",
														isBuy ? "text-emerald-500" : "text-orange-500",
													)}
												>
													{isBuy ? "+" : "-"}
													{t.executedValue.toLocaleString(undefined, {
														minimumFractionDigits: 2,
													})}{" "}
													PLN
												</span>
												<span className="text-[10px] text-muted-foreground">
													{Math.abs(t.quantity).toFixed(4)} szt. @{" "}
													{unitPrice.toFixed(2)}
												</span>
											</div>
										</TableCell>

										<TableCell className="max-w-40 xl:max-w-64 truncate text-xs text-muted-foreground italic">
											{t.rationale ? `"${t.rationale}"` : "—"}
										</TableCell>

										<TableCell className="text-right">
											<DeleteButton
												id={t.id}
												onDelete={deleteHistoryItem}
												confirmMsg="Usunąć z historii?"
											/>
										</TableCell>
									</TableRow>
								);
							})}
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

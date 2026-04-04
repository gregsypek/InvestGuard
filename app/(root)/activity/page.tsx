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

import { ActivityHeader } from "@/components/ActivityHeader";
import { ExportReport } from "@/components/history/ExportReport";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { getTransactionHistory } from "@/lib/actions/history.actions";
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
		<div className="py-2 px-8 space-y-10 pb-20">
			<ActivityHeader
				totalTransactions={meta.totalCount}
				currentPage={currentPage}
				totalPages={meta.totalPages}
			/>

			<div className="flex flex-col min-h-[calc(100vh-200px)] space-y-10">
				<div className="flex-1 space-y-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
						<SectionHeader title="Rejestr Transakcji" icon={ListOrdered} />
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
									Portfel
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
								{/* <TableHead className="w-12 text-right"></TableHead> */}
							</TableRow>
						</TableHeader>
						<TableBody>
							{transactions.map((t) => {
								const categoryColor =
									COLORS[t.category as keyof typeof COLORS] || "var(--primary)";

								// ZMIANA 3: Koniec zgadywania po słowach i znakach. Używamy Enuma:
								const isBuy = t.type === "BUY";
								const isCorrection = t.type === "UPDATE";

								return (
									<TableRow
										key={t.id}
										className="border-border hover:bg-muted/20 transition-colors"
									>
										{/* 1. DATA I TYP TRANSAKCJI */}
										<TableCell>
											<div className="flex flex-col gap-1.5 items-start">
												<span className="font-medium font-mono text-[13px]">
													{new Date(t.executedAt).toLocaleDateString("pl-PL")}
												</span>
												<span
													className={cn(
														"w-fit px-1.5 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-tighter",
														isCorrection
															? "bg-blue-500/10 text-blue-600"
															: isBuy
																? "bg-emerald-500/10 text-emerald-600"
																: "bg-orange-500/10 text-orange-600",
													)}
												>
													{isCorrection
														? "Korekta"
														: isBuy
															? "Kupno"
															: "Sprzedaż"}
												</span>
											</div>
										</TableCell>

										{/* 2. KOLUMNA: AKTYWO */}
										<TableCell>
											<div className="font-bold text-sm">{t.assetName}</div>
											{t.ticker && (
												<div className="text-[10px] text-muted-foreground font-mono bg-muted inline-block px-1.5 py-0.5 rounded mt-0.5 uppercase">
													{t.ticker}
												</div>
											)}
										</TableCell>

										{/* 2. KOLUMNA: PORTFEL */}
										<TableCell>
											<div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
												{t.portfolio.name}
											</div>
										</TableCell>

										{/* 3. KOLUMNA: KATEGORIA */}
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

										{/* 4. KOLUMNA: WARTOŚĆ I ILOŚĆ */}
										<TableCell className="text-right font-mono font-bold">
											<div
												className={cn(
													isCorrection
														? t.executedValue >= 0
															? "text-blue-600"
															: "text-red-500" // Kolor dla wyniku korekty
														: isBuy
															? "text-emerald-600"
															: "text-orange-600",
												)}
											>
												{/* ZMIANA 4: Dynamiczny znak dla UPDATE na podstawie zapisanej Delty */}
												{isCorrection
													? t.executedValue > 0
														? "+"
														: ""
													: isBuy
														? "+"
														: "-"}
												{Math.abs(t.executedValue).toLocaleString("pl-PL", {
													minimumFractionDigits: 2,
												})}{" "}
												PLN
											</div>
											<div className="text-[10px] text-muted-foreground font-normal">
												{/* Sztuki: Korekta to zawsze 0 */}
												{isCorrection
													? "0.0000"
													: (isBuy ? "+" : "") + t.quantity.toFixed(4)}{" "}
												szt.
											</div>
										</TableCell>

										{/* 6. NOTATKA */}
										<TableCell className="max-w-40 xl:max-w-64 truncate text-xs text-muted-foreground italic">
											{t.rationale ? `"${t.rationale}"` : "—"}
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

import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Rocket, Target, TrendingUp } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import AddButton from "@/components/ui/AddButton";
import { AlphaHeader } from "@/components/AlphaHeader";
import { BondStatCard } from "@/components/shared/BondStatCard";
import { BoosterActionsClient } from "@/components/alpha/BoosterActionsClient";
import BulbTip from "@/components/shared/BulbTip";
import { Category } from "@prisma/client";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SubHeader } from "@/components/shared/SubHeader";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { getActivePortfolioId } from "@/lib/session";
import { redirect } from "next/navigation";

// Dodano import DropdownMenu

export default async function AlphaSelectionPage({
	searchParams,
}: {
	searchParams: Promise<{ portfolioId?: string }>;
}) {
	// Pobieramy ID aktywnego portfela
	const activeId = await getActivePortfolioId(searchParams);

	// Jeśli nie ma żadnego portfela, kierujemy do domyślnego dashboardu,
	// ale zakładamy, że użytkownik Alpha ma już portfel.
	const targetUrl = activeId
		? `/dashboard/${activeId}/add-asset?cat=BOOSTER`
		: "/dashboard";
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	// const userPortfolio = await db.portfolio.findFirst({
	// 	where: { userId: session.user.id },
	// });

	// const targetPortfolioId = userPortfolio?.id || "default";

	// 1. FETCH DATA: Get only Booster assets for this user
	const boosterAssets = await db.asset.findMany({
		where: {
			category: "BOOSTER" as Category,
			portfolio: { userId: session.user.id },
		},
		include: { portfolio: true },
		orderBy: { conviction: "desc" },
	});
	// console.log("🚀 ~ AlphaSelectionPage ~ boosterAssets:", boosterAssets);

	// 2. FETCH TOTAL PORTFOLIO VALUE: For the "Share" KPI
	const allAssets = await db.asset.findMany({
		where: { portfolio: { userId: session.user.id } },
		select: { currentValue: true },
	});

	const totalPortfolioValue = allAssets.reduce(
		(sum, a) => sum + a.currentValue,
		0,
	);
	const totalBoosterValue = boosterAssets.reduce(
		(sum, a) => sum + a.currentValue,
		0,
	);

	// 3. CALCULATE KPIs
	// EN: Portfolio share calculation
	const sharePercentage =
		totalPortfolioValue > 0
			? (totalBoosterValue / totalPortfolioValue) * 100
			: 0;

	// EN: Aggregate ROI for the Booster segment
	const totalInvested = boosterAssets.reduce(
		(sum, a) => sum + a.investedCapital,
		0,
	);
	const totalCurrent = boosterAssets.reduce(
		(sum, a) => sum + a.currentValue,
		0,
	);
	const boosterRoi =
		totalInvested > 0
			? ((totalCurrent - totalInvested) / totalInvested) * 100
			: 0;

	// EN: Mock variables for pagination
	const currentPage = 1;
	const totalPages = 5;

	return (
		<div className="space-y-10 ">
			<AlphaHeader
				totalTransactions={2}
				currentPage={currentPage}
				totalPages={totalPages}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground mb-2 italic">
						Narzędzia / <span className="text-primary font-medium">Alpha</span>
					</nav>
				}
			/>

			{/* EN: KPI Section */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<BondStatCard
					title="Udział w Portfelu"
					value={`${sharePercentage.toFixed(1)}%`}
					description="Sugerowany limit: 10%"
					variant={sharePercentage > 10 ? "orange" : "neutral"}
					iconColor="text-orange-600"
				/>
				<BondStatCard
					title="Wynik Selekcji (ROI)"
					value={`${boosterRoi >= 0 ? "+" : ""}${boosterRoi.toFixed(2)}%`}
					description="Całkowity zwrot segmentu"
					valueColor={boosterRoi >= 0 ? "green" : "red"}
					icon={TrendingUp}
				/>
				<BondStatCard
					title="Liczba Pozycji"
					value={boosterAssets.length.toString()}
					description="Aktywne tezy inwestycyjne"
					variant="neutral"
					icon={Target}
				/>
			</div>

			{/* EN: Main Table Section */}
			<div className="flex flex-col min-h-[calc(100vh-350px)] space-y-6 justify-between pt-4">
				{/* EN: Toolbar with integrated inline BulbTip */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
					<div className="space-y-1">
						{/* <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<Target className="h-5 w-5 text-primary" /> Aktywne Pozycje
						</h2> */}
						<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
							<BulbTip
								title="Zasada:"
								content="Weryfikuj kwartalnie. Brak aktualności = wyjście."
							/>
						</div>
						<SectionHeader title="Aktywne Pozycje" icon={Target} />
						<SubHeader
							title="Analiza ryzykownych aktywów"
							description="Tabela uzasadnia zakup i określa stope zwrotu ryzykownych aktywów z kategori 'Booster'"
							icon={Rocket}
						/>
					</div>

					<AddButton className="gap-2 shadow-sm h-9">
						<Link href={targetUrl} className="gap-2 flex items-center">
							<Plus className="h-4 w-4" />
							Nowa Teza
						</Link>
					</AddButton>
				</div>

				{/* EN: Table Container - Poprawiono wyrównanie kolumn i dodano menu Akcji */}
				<div className="w-full ps-6">
					<Table>
						<TableHeader className="bg-muted/30">
							<TableRow className="border-border hover:bg-transparent">
								<TableHead className="font-bold">Aktywo</TableHead>
								<TableHead className="font-bold">Ryzyko</TableHead>
								<TableHead className="font-bold w-48">Przekonanie</TableHead>
								<TableHead className="font-bold">Teza (Skrót)</TableHead>

								{/* NOWA KOLUMNA: WARTOŚĆ (Header 5) */}
								<TableHead className="text-right font-bold">Wartość</TableHead>

								<TableHead className="text-right font-bold">
									Wynik (ROI)
								</TableHead>
								<TableHead className="w-12 text-right"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{boosterAssets.map((asset) => {
								const individualRoi =
									asset.investedCapital > 0
										? ((asset.currentValue - asset.investedCapital) /
												asset.investedCapital) *
											100
										: 0;

								const convictionColor =
									asset.conviction && asset.conviction > 70
										? "bg-emerald-600"
										: "bg-amber-500";

								return (
									<TableRow
										key={asset.id}
										className="border-border hover:bg-muted/20 transition-colors group"
									>
										{/* 1. AKTYWO */}
										<TableCell>
											<div className="font-bold text-sm">{asset.name}</div>
											<div className="text-[10px] text-muted-foreground font-mono bg-muted inline-block px-1.5 py-0.5 rounded mt-0.5">
												{asset.ticker}
											</div>
										</TableCell>

										{/* 2. RYZYKO */}
										<TableCell>
											<div className="flex items-center gap-2">
												<div
													className={cn(
														"h-1.5 w-1.5 rounded-full border border-border shadow-xs",
														convictionColor,
													)}
												/>
												<span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground opacity-90">
													{asset.conviction && asset.conviction > 70
														? "Niskie"
														: "Średnie"}
												</span>
											</div>
										</TableCell>

										{/* 3. PRZEKONANIE */}
										<TableCell>
											<div className="space-y-1.5 pr-4">
												<div className="flex justify-between text-[10px] font-bold text-muted-foreground">
													<span>PEWNOŚĆ</span>
													<span>{asset.conviction}%</span>
												</div>
												<Progress
													value={asset.conviction || 0}
													className="h-1.5 bg-muted"
													indicatorColor={convictionColor}
												/>
											</div>
										</TableCell>

										{/* 4. TEZA */}
										<TableCell className="max-w-40 xl:max-w-64">
											<p className="text-xs text-muted-foreground italic truncate">
												&quot;{asset.rationale || "Brak opisanej tezy..."}&quot;
											</p>
										</TableCell>

										{/* 5. NOWA KOMÓRKA: WARTOŚĆ (Wyrównana z Header 5) */}
										<TableCell className="text-right">
											<div className="text-sm font-bold font-mono">
												{asset.currentValue.toLocaleString()}{" "}
												<span className="text-[10px] text-muted-foreground">
													PLN
												</span>
											</div>
											<div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">
												Wkład: {asset.investedCapital.toLocaleString()}
											</div>
										</TableCell>

										{/* 6. ROI */}
										<TableCell
											className={cn(
												"text-right font-mono font-bold text-sm",
												individualRoi >= 0 ? "text-green-600" : "text-red-500",
											)}
										>
											{individualRoi > 0 && "+"}
											{individualRoi.toFixed(1)}%
										</TableCell>

										{/* 7. AKCJE */}
										<TableCell className="text-right">
											<BoosterActionsClient asset={asset} />
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>

				{/* EN: Pagination - pushed to bottom via mt-auto */}
				{totalPages > 1 && (
					<div className="mt-auto pt-8 flex justify-center">
						<Pagination>
							<PaginationContent className="bg-card/50 border border-border rounded-full px-2 shadow-sm">
								<PaginationItem>
									<PaginationPrevious
										href={`/alpha?page=${Math.max(1, currentPage - 1)}`}
										aria-disabled={currentPage <= 1}
										className={
											currentPage <= 1 ? "pointer-events-none opacity-50" : ""
										}
									/>
								</PaginationItem>

								<div className="text-xs font-bold uppercase tracking-widest px-6 text-muted-foreground">
									Strona {currentPage} z {totalPages}
								</div>

								<PaginationItem>
									<PaginationNext
										href={`/alpha?page=${Math.min(totalPages, currentPage + 1)}`}
										aria-disabled={currentPage >= totalPages}
										className={
											currentPage >= totalPages
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

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
import {
	getPortfolioAssets,
	getPortfolioCategories,
} from "@/lib/actions/portfolio.actions";

import AddButton from "@/components/ui/AddButton";
import { AlphaChart } from "@/components/alpha/AreaChart";
import { AlphaHeader } from "@/components/AlphaHeader";
import { BondStatCard } from "@/components/shared/BondStatCard";
import { BoosterActionsClient } from "@/components/alpha/BoosterActionsClient";
import { Category } from "@prisma/client";
import Link from "next/link";
import { MigrationTool } from "@/components/alpha/MigrationTool";
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
	const activeId = await getActivePortfolioId(searchParams);
	if (!activeId) redirect("/dashboard");
	// Pobieramy ID aktywnego portfela

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

	// EN: Mock variables for pagination
	const currentPage = 1;
	const totalPages = 5;

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
				// in: ["BOOSTER", "CRYPTO", "COMMODITIES", "DEVELOPED", "EMERGING"],
			},
		},
		orderBy: { executedAt: "asc" },
	});
	// console.log("🚀 ~ AlphaSelectionPage ~ transactions:", transactions);

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

	// 3. Formujemy tablicę punktów
	const chartPoints = Object.values(aggregatedData);

	// DEFINICJA roiFactor (Upewnij się, że te zmienne są zdefiniowane powyżej)
	const roiFactor =
		alphaTotalInvested > 0 ? alphaTotalValue / alphaTotalInvested : 1;

	// PRZYGOTOWANIE preparedChartData
	const preparedChartData = chartPoints.map((point) => ({
		name: point.name,
		Wkład: point.wklad,
		// Liczymy wycenę na podstawie aktualnego ROI, aby pokazać trend zysku
		Wycena: Math.round(point.wklad * roiFactor),
	}));

	// Jeśli mamy tylko jeden punkt danych, dodajemy punkt "0" na start,
	// aby Recharts mógł narysować linię zamiast jednej kropki
	if (preparedChartData.length === 1 && transactions.length > 0) {
		const startDate = new Date(transactions[0].executedAt);
		startDate.setDate(startDate.getDate() - 1);

		preparedChartData.unshift({
			name: startDate.toLocaleDateString("pl-PL", {
				day: "2-digit",
				month: "2-digit",
			}),
			Wkład: 0,
			Wycena: 0,
		});
	}
	// console.log(
	// 	"🚀 ~ AlphaSelectionPage ~ preparedChartData:",
	// 	preparedChartData,
	// );

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

	return (
		<div className="p-6 px-8 space-y-10 ">
			<AlphaHeader
				totalTransactions={2}
				currentPage={currentPage}
				totalPages={totalPages}
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
			<div className="flex flex-col min-h-[calc(100vh-350px)] space-y-6 justify-between pt-4">
				{/* EN: Toolbar with integrated inline BulbTip */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
					<div className="space-y-1">
						{/* <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<Target className="h-5 w-5 text-primary" /> Aktywne Pozycje
						</h2> */}
						<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider"></div>
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
				<div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
					<div className="mb-6">
						<h3 className="text-sm font-black uppercase tracking-widest text-primary">
							Dynamika Wzrostu Alpha
						</h3>
					</div>

					{/* EN: Parent MUST have a defined height for Recharts to work */}
					<div className="h-87 w-full">
						<AlphaChart data={preparedChartData} />
					</div>
				</div>
				<MigrationTool
					assets={filteredAssets}
					categories={filteredCategories}
				/>
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
												{asset.currentValue.toLocaleString("pl-PL", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
												<span className="text-[10px] text-muted-foreground">
													{" "}
													PLN
												</span>
											</div>
											<div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">
												Wkład: {asset.investedCapital}
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

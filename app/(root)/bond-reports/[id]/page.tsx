import {
	Banknote,
	ChartArea,
	History,
	Landmark,
	Plus,
	ShieldCheck,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import AssetCard from "@/components/ui/assets/RecentActivityCard";
import { BondHeader } from "@/components/BondHeader";
import BondLedgerTable from "@/components/BondLedgerTable";
import { BondPnLClient } from "@/components/bonds/BondPnLClient";
import { Button } from "@/components/ui/button";
import { InflationShieldClient } from "@/components/bonds/InflationShieldClient";
import { InteractiveChartSection } from "@/components/InteractiveChartSection";
import Link from "next/link";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBondsData } from "@/lib/actions/bond-actions";
import { getGuardedPortfolio } from "@/components/shared/portfolio-guard";

interface Props {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function BondReportsPage({ params, searchParams }: Props) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	const { id } = await params;

	// =====================================================================
	// 1. STRAŻNIK: Bezpieczne pobranie portfela (zastępuje findUnique!)
	// =====================================================================
	const { portfolio, errorComponent } = await getGuardedPortfolio({
		searchParams: Promise.resolve({ portfolioId: id }),
		userId: session.user.id,
	});

	// Jeśli ktoś wpisze ID cudzego portfela -> dostanie błąd
	if (errorComponent || !portfolio) return errorComponent;

	// =====================================================================
	// 2. Pobieranie danych dla tego widoku
	// =====================================================================
	const allPortfoliosWithCash = await db.portfolio.findMany({
		where: {
			userId: session.user.id,
			targetCash: { gt: 0 },
		},
		select: { id: true, name: true },
	});

	const resolvedParams = await searchParams;
	const highlightedId = resolvedParams?.portfolioId || null;

	// Zostawiamy funkcję do specyficznych kalkulacji obligacji
	const data = await getBondsData(id);
	if (!data) return notFound();

	// POBIERAMY INFLACJĘ (Sortujemy rosnąco, żeby najstarsze były na początku dla wykresu)
	const inflationHistory = await db.inflationRate.findMany({
		orderBy: { yearMonth: "asc" },
	});

	const { bonds, stats, portfolioName } = data;
	const recentBonds = [...bonds].slice(0, 6);
	const isEmpty = bonds.length === 0;

	// Sumujemy fizyczną ilość wszystkich obligacji
	const totalBondsQuantity = bonds.reduce(
		(sum, b) => sum + (b.quantity || 0),
		0,
	);
	// =====================================================================
	// 2. POBRANIE HISTORII Z BAZY (Dla kształtu wykresu Nominalnego PnL)
	// =====================================================================
	const rawSnapshots = await db.portfolioSnapshot.findMany({
		where: { portfolioId: portfolio.id },
		orderBy: { date: "asc" },
	});

	let prevTotal = 0;
	let prevInvested = 0;
	const absoluteChartData = rawSnapshots.map((snap, index) => {
		const netCashFlow = Number(snap.investedValue) - prevInvested;
		const exactChangePLN = Number(snap.totalValue) - prevTotal - netCashFlow;

		prevTotal = Number(snap.totalValue);
		prevInvested = Number(snap.investedValue);

		return {
			date: snap.date.toISOString(),
			globalChangePLN: index === 0 ? 0 : exactChangePLN, // Kształt zmienności z całego portfela
			globalTotalValue: Number(snap.totalValue),
		};
	});

	return (
		<div>
			{/* NAGŁÓWEK GŁÓWNY (Z zintegrowanymi statystykami) */}
			<BondHeader
				title="Moje Obligacje"
				totalBonds={totalBondsQuantity}
				stats={stats}
				portfolioName={portfolioName}
			/>
			<SectionLayout
				title="Historia Aktywności"
				titleIcon={History}
				subtitle="Ostatnio dodane serie"
				description="Lista ostatnio zakupionych transz obligacji z możliwością szybkiego podglądu."
				// Przyciski w nowym standardzie (outline pasujący do design systemu)
				action={
					<Button
						asChild
						className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-sm transition-colors h-10 px-5"
					>
						<Link
							href={`/bond-reports/${id}/add-asset`}
							className="flex items-center gap-2"
						>
							<Plus className="w-4 h-4" />
							Dodaj Serię
						</Link>
					</Button>
				}
			>
				<div className="flex flex-wrap gap-4">
					{recentBonds.length === 0 ? (
						<div className="flex flex-col items-center justify-center p-8 border border-t-border-subtle rounded-2xl bg-t-bg-base/30 text-center w-full shadow-sm">
							<p className="text-sm font-bold text-t-text-primary">
								Brak aktywności
							</p>
							<p className="text-xs text-t-text-tertiary mt-2 max-w-md">
								Twój portfel obligacji jest obecnie pusty. Kliknij &quot;Dodaj
								Serię&quot;, aby zarejestrować pierwszą inwestycję.
							</p>
						</div>
					) : (
						recentBonds.map((bond) => {
							// ZMIANA: Tworzymy obiekt zgodny z interfejsem Asset "w locie"
							const assetFromBond: any = {
								...bond,
								category: "BONDS",
								targetPercentage: 55, // Domyślna wartość
								dailyChange: 0,
								nominalValue: bond.currentValue ?? null,
								rationale: null,
								timeHorizon: null,
								expectedRoi: null,
								conviction: null,
								riskLevel: null,
								rateType: null,
							};

							return (
								<AssetCard
									asset={assetFromBond}
									isHighlighted={bond.id === highlightedId}
									key={bond.id}
								/>
							);
						})
					)}
				</div>
			</SectionLayout>
			<SectionLayout
				title="Analityka Wyników Obligacji"
				titleIcon={ChartArea}
				subtitle="Wydajność portfela"
				description="Wizualizacja trendu wartości oraz historia wpłat kapitału wyłącznie dla bezpiecznych aktywów."
			>
				{/* Pudełko systemowe dla wykresu (Glassmorphism) */}
				<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
					<InteractiveChartSection
						// Przekaż wszystkie transakcje, które pobierasz na tej stronie
						transactions={portfolio?.transactionHistories || []}
						// Upewnij się, że filtrujesz aktywa tylko dla obligacji
						// (jeśli przekazujesz z głównej puli, to wyfiltruj, jeśli masz już tablicę 'bonds', użyj jej)
						assets={portfolio.assets.filter((a) => a.category === "BONDS")}
					/>
				</div>
			</SectionLayout>

			<SectionLayout
				title="Nominalny Wynik Dzienny"
				titleIcon={Banknote}
				subtitle="Faktyczna kwota wypracowana na odsetkach"
				description="Wykres przedstawia dokładną kwotę w PLN, o jaką zmieniła się wartość Twoich obligacji danego dnia."
			>
				<BondPnLClient
					snapshotsData={absoluteChartData} // Pamiętaj, by pobrać zrzuty z DB tak samo jak na stronie Alpha
					transactions={portfolio?.transactionHistories || []}
					assets={portfolio.assets}
				/>
			</SectionLayout>

			<SectionLayout
				title="Tarcza Antyinflacyjna"
				titleIcon={ShieldCheck}
				subtitle="Ochrona siły nabywczej"
				description="Porównanie uśrednionego oprocentowania Twojego portfela obligacji z oficjalnymi odczytami inflacji GUS. Sprawdź, czy generujesz realny zysk."
			>
				<InflationShieldClient inflationData={inflationHistory} bonds={bonds} />
			</SectionLayout>

			{/* GŁÓWNA SEKCJA (Z tabelą i przyciskiem) */}
			<SectionLayout
				title="Portfel Obligacji"
				titleIcon={Landmark}
				subtitle="Analiza bezpiecznych aktywów"
				description="Tabela przedstawia wszystkie obligacje skarbowe z Twojego portfela, posegregowane rodzajami i aktualizowane z uwzględnieniem narosłych odsetek."
				action={
					<Button
						asChild
						className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-sm transition-colors h-10 px-5"
					>
						<Link
							href={`/bond-reports/${id}/add-asset`}
							className="flex items-center gap-2"
						>
							<Plus className="w-4 h-4" />
							Dodaj Serię
						</Link>
					</Button>
				}
			>
				{isEmpty ? (
					<PortfolioEmptyState variant="BONDS" portfolioId={id} />
				) : (
					<div className="w-full overflow-x-auto no-scrollbar rounded-2xl border border-t-border bg-t-bg-panel shadow-sm p-1 md:p-0">
						<BondLedgerTable
							initialBonds={bonds}
							portfolioId={id}
							allPortfolios={allPortfoliosWithCash}
						/>
					</div>
				)}
			</SectionLayout>
		</div>
	);
}

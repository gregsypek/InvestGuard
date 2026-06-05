import { ChartArea, History, Landmark, Plus } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import AssetCard from "@/components/ui/assets/RecentActivityCard";
import { BondHeader } from "@/components/BondHeader";
import BondLedgerTable from "@/components/BondLedgerTable";
import { Button } from "@/components/ui/button";
import { InteractiveChartSection } from "@/components/InteractiveChartSection";
import Link from "next/link";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBondsData } from "@/lib/actions/bond-actions";

interface Props {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ portfolioId?: string }>; // 🆕 Dodajemy obsługę query params
}

export default async function BondReportsPage({ params, searchParams }: Props) {
	// Fetch the current user session
	const session = await auth();

	// Redirect to sign-in if the user is not authenticated
	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	const allPortfoliosWithCash = await db.portfolio.findMany({
		where: {
			userId: session.user.id,
			// Szukamy portfeli, które mają zdefiniowany cel na gotówkę większy niż 0%
			targetCash: {
				gt: 0,
			},
		},
		select: {
			id: true,
			name: true,
		},
	});

	// 1. Odczytujemy parametry URL z propsów serwerowych (zamiast useSearchParams)
	const resolvedParams = await searchParams;
	console.log("🚀 ~ BondReportsPage ~ resolvedParams:", resolvedParams);
	const highlightedId = resolvedParams?.portfolioId || null; // To jest ID, które chcemy podświetlić w tabeli (jeśli jest obecne)

	const { id: pathId } = await params;
	// 🚀 DEFINIUJEMY portfolioId na podstawie pathId
	const portfolioId = pathId;
	const activeId = pathId; // Jeśli używasz też activeId w Linkach
	// if (!pathId) return <PortfolioEmptyState variant="NOT_FOUND" />;

	// EN: Fetch bonds again (Next.js automatically deduplicates identical fetch requests in the background)
	const data = await getBondsData(activeId);
	// console.log("🚀 ~ BondReportsPage ~ data:", data);
	if (!data) {
		return notFound();
	}

	const { bonds, stats, portfolioName } = data;

	// 2. Sortujemy i ucinamy tablicę zwykłym JavaScriptem (na serwerze nie ma potrzeby używania useMemo)
	const recentBonds = [...bonds].slice(0, 6);

	const isEmpty = bonds.length === 0;

	if (!portfolioId) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	// Fetch the specific portfolio ensuring it belongs to the current user
	const portfolio = await db.portfolio.findUnique({
		where: {
			id: portfolioId,
			userId: session.user.id,
		},
		include: {
			assets: true, // Pobieramy listę aktywów
			transactionHistories: {
				orderBy: {
					executedAt: "desc", // Chcemy najnowsze transakcje na górze listy
				},
			},
		},
	});

	if (!portfolio || !portfolio.assets) {
		return (
			<div className="flex flex-col items-center justify-center p-20 border border-white/5 rounded-2xl bg-slate-900/20 ">
				<div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
				<p className="text-slate-400 font-medium tracking-wide text-sm">
					Wczytywanie danych portfela...
				</p>
			</div>
		);
	}
	return (
		<div>
			{/* NAGŁÓWEK GŁÓWNY (Z zintegrowanymi statystykami) */}
			<BondHeader
				title="Moje Obligacje"
				totalBonds={bonds.length}
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
							href={`/bond-reports/${activeId}/add-asset`}
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
							href={`/bond-reports/${activeId}/add-asset`}
							className="flex items-center gap-2"
						>
							<Plus className="w-4 h-4" />
							Dodaj Serię
						</Link>
					</Button>
				}
			>
				{isEmpty ? (
					<PortfolioEmptyState variant="BONDS" portfolioId={activeId} />
				) : (
					<div className="w-full overflow-x-auto no-scrollbar rounded-2xl border border-t-border bg-t-bg-panel shadow-sm p-1 md:p-0">
						<BondLedgerTable
							initialBonds={bonds}
							portfolioId={activeId}
							allPortfolios={allPortfoliosWithCash}
						/>
					</div>
				)}
			</SectionLayout>
		</div>
	);
}

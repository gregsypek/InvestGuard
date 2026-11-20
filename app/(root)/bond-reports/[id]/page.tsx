import {
	Banknote,
	ChartArea,
	History,
	Landmark,
	Plus,
	ShieldCheck,
} from "lucide-react";
import { SectionNavTabs, SectionTab } from "@/components/shared/SectionNavTabs";
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
import { unstable_cache } from "next/cache";

interface Props {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ portfolioId?: string }>;
}

// Sections mapped to the bonds view blocks
const BONDS_SECTIONS: SectionTab[] = [
	{ id: "section-bond-history", label: "Historia", iconName: "History" },
	{ id: "section-bond-analytics", label: "Analityka", iconName: "ChartArea" },
	{ id: "section-bond-daily-pnl", label: "Wynik", iconName: "Banknote" },
	{ id: "section-bond-inflation", label: "Inflacja", iconName: "ShieldCheck" },
	{ id: "section-bond-ledger", label: "Portfel", iconName: "Landmark" },
];

// Cached snapshot query selecting only required numeric fields to minimize database egress
const getCachedBondSnapshots = unstable_cache(
	async (portfolioId: string) => {
		const rawSnapshots = await db.portfolioSnapshot.findMany({
			where: { portfolioId },
			orderBy: { date: "asc" },
			select: {
				date: true,
				totalValue: true,
				investedValue: true,
			},
		});

		let prevTotal = 0;
		let prevInvested = 0;

		return rawSnapshots.map((snap, index) => {
			const currentTotal = Number(snap.totalValue);
			const currentInvested = Number(snap.investedValue);
			const netCashFlow = currentInvested - prevInvested;
			const exactChangePLN = currentTotal - prevTotal - netCashFlow;

			prevTotal = currentTotal;
			prevInvested = currentInvested;

			return {
				date: snap.date.toISOString(),
				globalChangePLN: index === 0 ? 0 : exactChangePLN, // Volatility curve derived from the entire portfolio
				globalTotalValue: currentTotal,
			};
		});
	},
	["bonds-portfolio-snapshots"],
	{
		revalidate: 300, // Cache for 5 minutes
		tags: ["snapshots"],
	},
);

// Cache monthly GUS inflation readings for 24 hours
const getCachedInflationHistory = unstable_cache(
	async () => {
		return db.inflationRate.findMany({
			orderBy: { yearMonth: "asc" },
		});
	},
	["gus-inflation-history"],
	{
		revalidate: 86400, // Cache for 24 hours
		tags: ["inflation"],
	},
);

export default async function BondReportsPage({ params, searchParams }: Props) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	const { id } = await params;

	// =====================================================================
	// 1. PORTFOLIO GUARD: Securely fetch portfolio (replaces findUnique)
	// =====================================================================
	const { portfolio, errorComponent } = await getGuardedPortfolio({
		searchParams: Promise.resolve({ portfolioId: id }),
		userId: session.user.id,
	});

	// Return error component if user attempts to access another user's portfolio ID
	if (errorComponent || !portfolio) return errorComponent;

	// =====================================================================
	// 2. PARALLEL DATA FETCHING FOR BONDS VIEW
	// =====================================================================
	const [
		allPortfoliosWithCash,
		resolvedParams,
		data,
		inflationHistory,
		absoluteChartData,
	] = await Promise.all([
		db.portfolio.findMany({
			where: {
				userId: session.user.id,
				targetCash: { gt: 0 },
			},
			select: { id: true, name: true },
		}),
		searchParams,
		getBondsData(id),
		getCachedInflationHistory(),
		getCachedBondSnapshots(portfolio.id),
	]);

	if (!data) return notFound();

	const highlightedId = resolvedParams?.portfolioId || null;
	const { bonds, stats, portfolioName } = data;
	const recentBonds = [...bonds].slice(0, 6);
	const isEmpty = bonds.length === 0;

	// Sum physical quantity across all bond series
	const totalBondsQuantity = bonds.reduce(
		(sum, b) => sum + (b.quantity || 0),
		0,
	);

	return (
		<div>
			{/* MAIN HEADER (Interactive with smart ticker filtering) */}
			<BondHeader
				title="Moje Obligacje"
				totalBonds={totalBondsQuantity}
				stats={stats}
				portfolioName={portfolioName}
				bonds={bonds}
			/>

			<SectionNavTabs sections={BONDS_SECTIONS} />

			<div id="section-bond-history" className="scroll-mt-20">
				<SectionLayout
					title="Historia Aktywności"
					titleIcon={History}
					subtitle="Ostatnio dodane serie"
					description="Lista ostatnio zakupionych transz obligacji z możliwością szybkiego podglądu."
					action={
						<Button
							asChild
							className="bg-[color-mix(in_srgb,var(--theme-primary),black_10%)] text-white hover:bg-[color-mix(in_srgb,var(--theme-primary),black_10%)] hover:opacity-90 hover:shadow-[0_4px_20px_var(--theme-soft)] cursor-pointer font-bold rounded-xl shadow-sm transition-all h-10 px-5"
						>
							<Link
								href={`/dashboard/${id}/add-asset?cat=BONDS&source=bonds`}
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
								const assetFromBond: any = {
									...bond,
									category: "BONDS",
									targetPercentage: 55,
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
			</div>

			<div id="section-bond-analytics" className="scroll-mt-20">
				<SectionLayout
					title="Analityka Wyników Obligacji"
					titleIcon={ChartArea}
					subtitle="Wydajność portfela"
					description="Wizualizacja trendu wartości oraz historia wpłat kapitału wyłącznie dla bezpiecznych aktywów."
				>
					<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
						<InteractiveChartSection
							transactions={portfolio?.transactionHistories || []}
							assets={portfolio.assets.filter((a) => a.category === "BONDS")}
						/>
					</div>
				</SectionLayout>
			</div>

			<div id="section-bond-daily-pnl" className="scroll-mt-20">
				<SectionLayout
					title="Nominalny Wynik Dzienny"
					titleIcon={Banknote}
					subtitle="Faktyczna kwota wypracowana na odsetkach"
					description="Wykres przedstawia dokładną kwotę w PLN, o jaką zmieniła się wartość Twoich obligacji danego dnia."
				>
					<BondPnLClient
						snapshotsData={absoluteChartData}
						transactions={portfolio?.transactionHistories || []}
						assets={portfolio.assets}
					/>
				</SectionLayout>
			</div>

			<div id="section-bond-inflation" className="scroll-mt-20">
				<SectionLayout
					title="Tarcza Antyinflacyjna"
					titleIcon={ShieldCheck}
					subtitle="Ochrona siły nabywczej"
					description="Porównanie uśrednionego oprocentowania Twojego portfela obligacji z oficjalnymi odczytami inflacji GUS. Sprawdź, czy generujesz realny zysk."
				>
					<InflationShieldClient
						inflationData={inflationHistory}
						bonds={bonds}
					/>
				</SectionLayout>
			</div>

			{/* MAIN SECTION (Ledger table and action button) */}
			<div id="section-bond-ledger" className="scroll-mt-20">
				<SectionLayout
					title="Portfel Obligacji"
					titleIcon={Landmark}
					subtitle="Analiza bezpiecznych aktywów"
					description="Tabela przedstawia wszystkie obligacje skarbowe z Twojego portfela, posegregowane rodzajami i aktualizowane z uwzględnieniem narosłych odsetek."
					action={
						<Button
							asChild
							className="bg-[color-mix(in_srgb,var(--theme-primary),black_10%)] text-white hover:bg-[color-mix(in_srgb,var(--theme-primary),black_10%)] hover:opacity-90 hover:shadow-[0_4px_20px_var(--theme-soft)] cursor-pointer font-bold rounded-xl shadow-sm transition-all h-10 px-5"
						>
							<Link
								href={`/dashboard/${id}/add-asset?cat=BONDS&source=bonds`}
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
		</div>
	);
}

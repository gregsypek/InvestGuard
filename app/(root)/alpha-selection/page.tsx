import {
	Activity,
	Banknote,
	ChartArea,
	ListOrdered,
	Rocket,
} from "lucide-react";
import { SectionNavTabs, SectionTab } from "@/components/shared/SectionNavTabs";

import { AlphaHeader } from "@/components/AlphaHeader";
import AlphaLedgerTable from "@/components/AlphaLedgerTable";
import { AlphaPnLClient } from "@/components/alpha/AlphaPnLClient";
import { AlphaStressTest } from "@/components/alpha/AlphaStressTest";
import { Button } from "@/components/ui/button";
import { InteractiveChartSection } from "@/components/InteractiveChartSection";
import Link from "next/link";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getGuardedPortfolio } from "@/components/shared/portfolio-guard";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";

// Sections mapped to the Alpha view blocks
const ALPHA_SECTIONS: SectionTab[] = [
	{ id: "section-alpha-analytics", label: "Analityka", iconName: "ChartArea" },
	{ id: "section-alpha-daily-pnl", label: "Wynik", iconName: "Banknote" },
	{
		id: "section-alpha-stress-test",
		label: "Stress Test",
		iconName: "Activity",
	},
	{ id: "section-alpha-ledger", label: "Pozycje", iconName: "ListOrdered" },
];

// Cached snapshot query selecting only required numeric fields to minimize database egress
const getCachedAlphaSnapshots = unstable_cache(
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
	["alpha-portfolio-snapshots"],
	{
		revalidate: 300, // Cache for 5 minutes
		tags: ["snapshots"],
	},
);

export default async function AlphaSelectionPage({
	searchParams,
}: {
	searchParams: Promise<{ portfolioId?: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	// =====================================================================
	// 1. PORTFOLIO GUARD (Fetches portfolio, assets, and history)
	// =====================================================================
	const { portfolio, portfolioId, errorComponent } = await getGuardedPortfolio({
		searchParams,
		userId: session.user.id,
		transactionCategories: ["BOOSTER", "CRYPTO"],
	});

	if (errorComponent) return errorComponent;

	// =====================================================================
	// 2. FETCH CACHED SNAPSHOT HISTORY (For Nominal PnL chart curve)
	// =====================================================================
	const absoluteChartData = await getCachedAlphaSnapshots(portfolioId);

	// =====================================================================
	// 3. DATA PREPARATION (Filtering Booster and Crypto assets)
	// =====================================================================
	const formattedAssets = portfolio.assets.map((asset) => ({
		...asset,
		investedCapital: Number(asset.investedCapital),
		currentValue: Number(asset.currentValue),
		ticker: asset.ticker || null,
	}));

	const formattedTransactions = portfolio.transactionHistories.map((tx) => ({
		...tx,
		type: tx.type,
		executedValue: Number(tx.executedValue),
		ticker: tx.ticker || null,
	}));

	const globalTotalValue =
		formattedAssets.reduce((sum, a) => sum + a.currentValue, 0) || 1;

	// Extract only categories relevant to the Alpha section
	const alphaCategories = ["BOOSTER", "CRYPTO"];
	const alphaAssets = formattedAssets.filter((a) =>
		alphaCategories.includes(a.category),
	);
	const alphaTransactions = formattedTransactions.filter((t) =>
		alphaCategories.includes(t.category),
	);

	const targetUrl = `/dashboard/${portfolioId}/add-asset?cat=BOOSTER&source=alpha`;

	// =====================================================================
	// 4. VIEW RENDERING
	// =====================================================================
	return (
		<div>
			<AlphaHeader assets={alphaAssets} globalTotalValue={globalTotalValue} />

			<SectionNavTabs sections={ALPHA_SECTIONS} />

			{/* MAIN SECTION: Analytics and Interactive Chart */}
			<div id="section-alpha-analytics" className="scroll-mt-20">
				<SectionLayout
					title="Analityka Wyników Alpha"
					titleIcon={ChartArea}
					subtitle="Wydajność strategii"
					description="Wizualizacja trendu wartości oraz historia wpłat dla kapitału podwyższonego ryzyka (Booster i Krypto)."
					action={
						<Button
							asChild
							className="bg-[color-mix(in_srgb,var(--theme-primary),black_10%)] text-white hover:bg-[color-mix(in_srgb,var(--theme-primary),black_10%)] hover:opacity-90 hover:shadow-[0_4px_20px_var(--theme-soft)] cursor-pointer font-bold rounded-xl shadow-sm transition-all h-10 px-5"
						>
							<Link href={targetUrl} className="flex items-center gap-2">
								<Rocket className="w-4 h-4" />
								Nowa Teza
							</Link>
						</Button>
					}
				>
					<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
						<InteractiveChartSection
							transactions={alphaTransactions}
							assets={alphaAssets}
						/>
					</div>
				</SectionLayout>
			</div>

			{/* SECTION: Nominal Daily PnL with hybrid calculation */}
			<div id="section-alpha-daily-pnl" className="scroll-mt-20">
				<SectionLayout
					title="Nominalny Wynik Dzienny"
					titleIcon={Banknote}
					subtitle="Faktyczna kwota wypracowana na rynku"
					description="Wykres przedstawia dokładną kwotę w PLN, o jaką zmieniła się wartość Twoich aktywów danego dnia. Obliczenia ignorują wpłaty i wypłaty z tego dnia."
				>
					<AlphaPnLClient
						snapshotsData={absoluteChartData}
						transactions={alphaTransactions}
						assets={alphaAssets}
					/>
				</SectionLayout>
			</div>

			{/* SECTION: Market Shock Simulator (Stress Test) */}
			<div id="section-alpha-stress-test" className="scroll-mt-20">
				<SectionLayout
					title="Symulacja Szoków Rynkowych"
					titleIcon={Activity}
					subtitle="Stress-test portfela Alpha"
					description="Sprawdź, jak potencjalne tąpnięcia lub rajdy w wybranych sektorach wpłyną na Twoją ogólną wycenę i ROI."
				>
					<AlphaStressTest assets={alphaAssets} />
				</SectionLayout>
			</div>

			{/* SECTION: Ledger Table */}
			<div id="section-alpha-ledger" className="scroll-mt-20">
				<SectionLayout
					title="Szczegółowe Pozycje Alpha"
					titleIcon={ListOrdered}
					subtitle="Twoje aktywa Booster i Krypto"
					description="Lista wszystkich aktywów o podwyższonym ryzyku wraz z kluczowymi informacjami, zyskami i możliwością szybkiej edycji pozycji."
				>
					<div className="w-full overflow-x-auto no-scrollbar rounded-2xl border border-t-border bg-t-bg-panel shadow-sm p-1 md:p-0">
						<AlphaLedgerTable activeBoosterAssets={alphaAssets} />
					</div>
				</SectionLayout>
			</div>
		</div>
	);
}

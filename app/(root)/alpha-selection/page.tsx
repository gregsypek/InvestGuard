import {
	Activity,
	Banknote,
	ChartArea,
	ListOrdered,
	Rocket,
} from "lucide-react";

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

export default async function AlphaSelectionPage({
	searchParams,
}: {
	searchParams: Promise<{ portfolioId?: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	// =====================================================================
	// 1. WYWOŁANIE STRAŻNIKA (Pobiera portfel, aktywa i historię)
	// =====================================================================
	const { portfolio, portfolioId, errorComponent } = await getGuardedPortfolio({
		searchParams,
		userId: session.user.id,
	});

	if (errorComponent) return errorComponent;

	// =====================================================================
	// 2. POBRANIE HISTORII Z BAZY (Dla kształtu wykresu Nominalnego PnL)
	// =====================================================================
	const rawSnapshots = await db.portfolioSnapshot.findMany({
		where: { portfolioId: portfolioId },
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

	// =====================================================================
	// 3. PRZYGOTOWANIE DANYCH (Filtrowanie Akcji Booster i Krypto)
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

	// Wyciągamy tylko interesujące nas kategorie dla sekcji Alpha
	const alphaCategories = ["BOOSTER", "CRYPTO"];
	const alphaAssets = formattedAssets.filter((a) =>
		alphaCategories.includes(a.category),
	);
	const alphaTransactions = formattedTransactions.filter((t) =>
		alphaCategories.includes(t.category),
	);

	const targetUrl = `/dashboard/${portfolioId}/add-asset?cat=BOOSTER`;

	// =====================================================================
	// 4. RENDEROWANIE WIDOKU
	// =====================================================================
	return (
		<div>
			<AlphaHeader assets={alphaAssets} globalTotalValue={globalTotalValue} />

			{/* GŁÓWNA SEKCJA: Analityka i Wykres Interaktywny */}
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

			{/* NOWA SEKCJA: Nominalny Wynik Dzienny z wyliczaniem hybrydowym */}
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

			{/* NOWA SEKCJA: Symulator Szoków (Stress Test) */}
			<SectionLayout
				title="Symulacja Szoków Rynkowych"
				titleIcon={Activity}
				subtitle="Stress-test portfela Alpha"
				description="Sprawdź, jak potencjalne tąpnięcia lub rajdy w wybranych sektorach wpłyną na Twoją ogólną wycenę i ROI."
			>
				<AlphaStressTest assets={alphaAssets} />
			</SectionLayout>

			{/* SEKCJA: Tabela Ledger */}
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
	);
}

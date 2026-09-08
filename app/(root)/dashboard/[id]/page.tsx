import {
	calculateLiveBondValue,
	getBondDictionaries,
} from "@/lib/bond-calculations";

import DashboardClientView from "@/components/ui/DashboardClientView";
import { auth } from "@/auth";
import { calculateGapAnalysis } from "@/lib/calculations";
import { db } from "@/lib/db";
import { getGuardedPortfolio } from "@/components/shared/portfolio-guard";
import { getPortfolioSnapshotsHistory } from "@/lib/services/history-engine";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
	params: Promise<{ id: string }>; // ZMIANA: Z searchParams na params (jesteśmy w [id] czyli dynamicznym segmencie)
	searchParams: Promise<{ range?: string; from?: string; to?: string }>; //ponieważ nasz nowy serwis historyczny potrzebuje wiedzieć, jaki zakres dat użytkownik wybrał w URL (np. ?range=1M)
}

export default async function DashboardPage({ params, searchParams }: Props) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/sign-in");
	}
	// 1. Oczekujemy na parametry (wymóg w Next.js 15)
	const resolvedSearchParams = await searchParams;
	const { id } = await params;

	const guardedResult = await getGuardedPortfolio({
		searchParams: Promise.resolve({ portfolioId: id }),
		userId: session.user.id,
	});

	// Wczesny zwrot błędu
	if (guardedResult.errorComponent || !guardedResult.portfolio) {
		return guardedResult.errorComponent;
	}

	// 2. Wyciągamy portfolio do zmiennej modyfikowalnej (let)
	let portfolio = guardedResult.portfolio;

	// Przeliczamy obligacje z użyciem GUS przed wysłaniem do tabeli

	const hasBonds = portfolio.assets.some((a) => a.category === "BONDS");

	if (hasBonds) {
		const { inflationMap, configMap } = await getBondDictionaries();
		// Aktualizujemy wycenę w locie
		portfolio = {
			...portfolio,
			assets: portfolio.assets.map((asset) => {
				if (asset.category === "BONDS") {
					const cleanTicker = asset.ticker
						? asset.ticker.split("_")[0]
						: "UNKNOWN";
					const calculated = calculateLiveBondValue(
						Number(asset.investedCapital),
						asset.interestRate ?? 0,
						asset.purchaseDate,
						cleanTicker,
						inflationMap,
						configMap,
					);

					return {
						...asset,
						currentValue: calculated.value, // 🚀 Nadpisujemy statyczną bazę dynamicznym wynikiem z inflacji!
					};
				}
				return asset;
			}),
		};
	}
	// =====================================================================

	// 3. Pobieramy portfele z celem gotówkowym (do przelewów wewnętrznych)
	const allPortfoliosWithCash = await db.portfolio.findMany({
		where: {
			userId: session.user.id,
			targetCash: { gt: 0 },
		},
		select: {
			id: true,
			name: true,
		},
	});

	// 4. Obliczenia i render
	const portfolioStatus = calculateGapAnalysis(portfolio);

	// 2. 🚀 WYWOŁANIE NASZEGO SERWISU HISTORYCZNEGO DLA 1 PORTFELA
	const { simulatedSnapshots, realSnapshots, oldestRealSnapshotDate } =
		await getPortfolioSnapshotsHistory(
			[portfolio], // Przekazujemy ten jeden portfel
			resolvedSearchParams,
			session.user.id,
		);
	return (
		<DashboardClientView
			portfolio={portfolio}
			portfolioStatus={portfolioStatus}
			allPortfoliosWithCash={allPortfoliosWithCash}
			transactions={portfolio.transactionHistories}
			snapshots={simulatedSnapshots} // 👈 PRZEKAZUJEMY DO KLIENTA
			realSnapshots={realSnapshots}
			oldestRealSnapshotDate={oldestRealSnapshotDate}
		/>
	);
}

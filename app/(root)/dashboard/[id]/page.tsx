import { calculateGapAnalysis, getPortfolioStats } from "@/lib/calculations"; // 🚀 DODANO getPortfolioStats
import {
	calculateLiveBondValue,
	getBondDictionaries,
} from "@/lib/bond-calculations";

import { DashboardBreadcrumbs } from "@/components/DashboardBreadcrumbs"; // 🚀 DODANY IMPORT
import DashboardClientView from "@/components/ui/DashboardClientView";
import DashboardGoal from "@/components/DashboardGoal"; // 🚀 DODANY IMPORT
import { DashboardHeader } from "@/components/DashboardHeader"; // 🚀 DODANY IMPORT
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getGuardedPortfolio } from "@/components/shared/portfolio-guard";
import { getPortfolioSnapshotsHistory } from "@/lib/services/history-engine";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}

export default async function DashboardPage({ params, searchParams }: Props) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	const resolvedSearchParams = await searchParams;
	const { id } = await params;

	const guardedResult = await getGuardedPortfolio({
		searchParams: Promise.resolve({ portfolioId: id }),
		userId: session.user.id,
	});

	if (guardedResult.errorComponent || !guardedResult.portfolio) {
		return guardedResult.errorComponent;
	}

	let portfolio = guardedResult.portfolio;
	const hasBonds = portfolio.assets.some((a) => a.category === "BONDS");

	if (hasBonds) {
		const { inflationMap, configMap } = await getBondDictionaries();
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
					return { ...asset, currentValue: calculated.value };
				}
				return asset;
			}),
		};
	}

	const allPortfoliosWithCash = await db.portfolio.findMany({
		where: { userId: session.user.id, targetCash: { gt: 0 } },
		select: { id: true, name: true },
	});

	const portfolioStatus = calculateGapAnalysis(portfolio);

	const { simulatedSnapshots, realSnapshots, oldestRealSnapshotDate } =
		await getPortfolioSnapshotsHistory(
			[portfolio],
			resolvedSearchParams,
			session.user.id,
		);

	// 🚀 OBLICZAMY STATYSTYKI DLA NAGŁÓWKA
	const { name, totalValue, progress, remaining, goal } =
		getPortfolioStats(portfolio);

	return (
		<div className="space-y-10">
			{/* Nagłówek jest teraz częścią głównej strony! */}
			<DashboardHeader
				portfolio={portfolio as any}
				name={name}
				totalValue={totalValue}
				customBreadcrumbs={<DashboardBreadcrumbs name={name} id={id} />}
			/>

			{goal > 0 && (
				<DashboardGoal progress={progress} remaining={remaining} goal={goal} />
			)}

			<DashboardClientView
				portfolio={portfolio as any}
				portfolioStatus={portfolioStatus}
				allPortfoliosWithCash={allPortfoliosWithCash}
				transactions={portfolio.transactionHistories}
				snapshots={simulatedSnapshots}
				realSnapshots={realSnapshots}
				oldestRealSnapshotDate={oldestRealSnapshotDate}
			/>
		</div>
	);
}

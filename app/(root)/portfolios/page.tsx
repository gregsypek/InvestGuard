import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import PortfoliosClientView from "@/components/ui/PortfolioClientView";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getActivePortfolioId } from "@/lib/session";
import { getGlobalStats } from "@/lib/calculations";
import { getPortfolioSnapshotsHistory } from "@/lib/history-engine";
import { redirect } from "next/navigation";

interface Props {
	searchParams: Promise<{
		portfolioId?: string;
		range?: string;
		from?: string;
		to?: string;
	}>;
}

export default async function PortfoliosPage({ searchParams }: Props) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	const resolvedSearchParams = await searchParams;
	const isFromOverview = resolvedSearchParams?.from === "overview";
	const historySearchParams = isFromOverview
		? { ...resolvedSearchParams, from: undefined }
		: resolvedSearchParams;

	// Fetch portfolios (with lightweight transactionHistories projection), user settings, and active portfolio ID in parallel
	const [portfolios, user, rawPortfolioId] = await Promise.all([
		db.portfolio.findMany({
			where: { userId: session.user.id },
			include: {
				assets: true,
				transactionHistories: {
					orderBy: { executedAt: "desc" },
					take: 300,
					select: {
						id: true,
						type: true,
						assetName: true,
						ticker: true,
						executedValue: true,
						category: true,
						executedAt: true,
						quantity: true,
						portfolioId: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		}),
		db.user.findUnique({
			where: { id: session.user.id },
			select: { defaultPortfolioId: true },
		}),
		getActivePortfolioId(searchParams),
	]);

	if (portfolios.length === 0) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	const activePortfolio = portfolios.find((p) => p.id === rawPortfolioId);
	const portfolioId = activePortfolio ? rawPortfolioId : null;
	const { totalValue, portfoliosCount, assetsCount, categoryTotals } =
		getGlobalStats(portfolios as any);

	const { simulatedSnapshots, realSnapshots, oldestRealSnapshotDate } =
		await getPortfolioSnapshotsHistory(
			portfolios,
			resolvedSearchParams,
			session.user.id,
		);

	return (
		<div className="space-y-10">
			<PortfoliosClientView
				portfolios={portfolios as any}
				portfolioId={portfolioId ?? undefined}
				categoryTotals={categoryTotals}
				realSnapshots={realSnapshots}
				snapshots={simulatedSnapshots}
				oldestRealSnapshotDate={oldestRealSnapshotDate}
				globalStats={{
					totalValue,
					portfoliosCount,
					assetsCount,
				}}
				defaultPortfolioId={user?.defaultPortfolioId}
				fromOverview={isFromOverview}
			/>
		</div>
	);
}

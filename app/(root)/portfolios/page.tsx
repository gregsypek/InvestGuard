import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import PortfoliosClientView from "@/components/ui/PortfolioClientView";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getActivePortfolioId } from "@/lib/session";
import { getGlobalStats } from "@/lib/calculations";
import { getPortfolioSnapshotsHistory } from "@/lib/services/history-engine";
import { redirect } from "next/navigation";

// 1. Rozszerzony interfejs Props o parametry dla zakresów dat
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

	// 2. Oczekujemy na parametry z URL (wymóg dla Promise w Next.js)
	const resolvedSearchParams = await searchParams;

	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true, transactionHistories: true },
		orderBy: { createdAt: "desc" },
	});

	if (portfolios.length === 0) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	const rawPortfolioId = await getActivePortfolioId(searchParams);
	const activePortfolio = portfolios.find((p) => p.id === rawPortfolioId);
	const portfolioId = activePortfolio ? rawPortfolioId : null;

	const { totalValue, portfoliosCount, assetsCount, categoryTotals } =
		getGlobalStats(portfolios);

	const { simulatedSnapshots, realSnapshots, oldestRealSnapshotDate } =
		await getPortfolioSnapshotsHistory(
			portfolios, // Przekazujemy ten jeden portfel
			resolvedSearchParams,
			session.user.id,
		);
	return (
		<div className="space-y-10">
			<PortfoliosHeader
				title="Moje Portfele"
				totalValue={totalValue}
				portfoliosCount={portfoliosCount}
				assetsCount={assetsCount}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground flex items-center gap-2 italic">
						Portfele
						<span className="text-muted-foreground">/</span>
						<span className="text-primary font-medium lowercase italic">
							Wszystkie
						</span>
					</nav>
				}
			/>
			<PortfoliosClientView
				portfolios={portfolios}
				portfolioId={portfolioId ?? undefined}
				categoryTotals={categoryTotals}
				realSnapshots={realSnapshots}
				snapshots={simulatedSnapshots}
				oldestRealSnapshotDate={oldestRealSnapshotDate}
			/>
		</div>
	);
}

import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import PortfoliosClientView from "@/components/ui/PortfolioClientView";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getActivePortfolioId } from "@/lib/session";
import { getGlobalStats } from "@/lib/calculations";
import { redirect } from "next/navigation";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function PortfoliosPage({ searchParams }: Props) {
	// EN: Fetch all portfolios with their assets for global aggregation
	const session = await auth();

	// Redirect to sign-in if the user is not authenticated
	if (!session?.user?.id) {
		redirect("/sign-in");
	}
	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true, transactionHistories: true },
		orderBy: { createdAt: "desc" },
	});

	// EN: Resolve portfolioId from URL or fallback to cookies for "Add Asset" context
	const portfolioId = await getActivePortfolioId(searchParams);

	// EN: SCENARIO: No portfolios exist in the database
	if (portfolios.length === 0) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	if (!portfolioId) {
		return <PortfolioEmptyState variant="NOT_SELECTED"/>
	}

	const { totalValue, portfoliosCount, assetsCount, categoryTotals } =
		getGlobalStats(portfolios);

	return (
		<div className="space-y-10 pb-20">
			<PortfoliosHeader
				title="Moje Portfele"
				totalValue={totalValue}
				portfoliosCount={portfoliosCount}
				assetsCount={assetsCount}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground mb-2">
						Portfele /{" "}
						<span className="text-primary font-medium ">Wszystkie</span>
					</nav>
				}
			/>
			<PortfoliosClientView
				portfolios={portfolios}
				portfolioId={portfolioId}
				categoryTotals={categoryTotals}
			/>
		</div>
	);
}

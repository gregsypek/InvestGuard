import { db } from "@/lib/db";
import { calculateGapAnalysis } from "@/lib/calculations";
import DashboardClientView from "@/components/ui/DashboardClientView";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { getActivePortfolioId } from "@/lib/session";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
	// Fetch the current user session
	const session = await auth();

	// Redirect to sign-in if the user is not authenticated
	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	// Count portfolios belonging ONLY to the logged-in user
	const totalPortfoliosCount = await db.portfolio.count({
		where: {
			userId: session.user.id,
		},
	});

	// Render the empty state if the user has no portfolios yet
	if (totalPortfoliosCount === 0) {
		return (
			<PortfolioEmptyState
				variant="NOT_SELECTED"
				userName={session.user.name}
			/>
		);
	}

	// Resolve the active portfolio ID from URL or Cookies
	const portfolioId = await getActivePortfolioId(searchParams);

	if (!portfolioId) {
		return (
			<PortfolioEmptyState
				variant="NOT_SELECTED"
				userName={session.user.name}
			/>
		);
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
	// console.log("🚀 ~ DashboardPage ~ portfolio:", portfolio);

	// Handle case where the portfolio doesn't exist or belongs to someone else
	if (!portfolio) {
		return (
			<PortfolioEmptyState variant="NOT_FOUND" userName={session.user.name} />
		);
	}

	// Perform calculations and render the view
	const portfolioStatus = calculateGapAnalysis(portfolio);

	return (
		<DashboardClientView
			portfolio={portfolio}
			portfolioStatus={portfolioStatus}
		/>
	);
}

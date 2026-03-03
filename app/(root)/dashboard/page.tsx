import DashboardClientView from "@/components/ui/DashboardClientView";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { auth } from "@/auth";
import { calculateGapAnalysis } from "@/lib/calculations";
import { db } from "@/lib/db";
import { getActivePortfolioId } from "@/lib/session";
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

	// 2. EN: FETCH ALL PORTFOLIOS WITH CASH CATEGORY
	// PL: Pobieramy wszystkie portfele użytkownika, które mają jakiekolwiek aktywo "CASH"
	const allPortfoliosWithCash = await db.portfolio.findMany({
		where: {
			userId: session.user.id,
			// Szukamy portfeli, które mają zdefiniowany cel na gotówkę większy niż 0%
			// lub po prostu wszystkie portfele użytkownika, jeśli dopuszczasz wpłatę do każdego
			targetCash: {
				gt: 0,
			},
		},
		select: {
			id: true,
			name: true,
		},
	});
	console.log(
		"🚀 ~ DashboardPage ~ allPortfoliosWithCash:",
		allPortfoliosWithCash,
	);

	// Perform calculations and render the view
	const portfolioStatus = calculateGapAnalysis(portfolio);

	return (
		<DashboardClientView
			portfolio={portfolio}
			portfolioStatus={portfolioStatus}
			allPortfoliosWithCash={allPortfoliosWithCash}
		/>
	);
}

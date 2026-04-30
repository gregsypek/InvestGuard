import { auth } from "@/auth";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { db } from "@/lib/db";
import { getActivePortfolioId } from "@/lib/session";
import { redirect } from "next/navigation";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function BondReportsLanding({ searchParams }: Props) {
	// 1. Próbujemy znaleźć aktywne ID portfela (z ciasteczek lub URL)
	const portfolioId = await getActivePortfolioId(searchParams);

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
	console.log("🚀 ~ BondReportsLanding ~ portfolios:", portfolios);

	if (!portfolioId) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	// if (portfolios.length === 0) {
	// 	return <PortfolioEmptyState variant="PORTFOLIOS" />;
	// }

	// if (portfolios.length !== 0) {
	// 	return <PortfolioEmptyState variant="PLANNER" portfolioId={portfolioId} />;
	// }

	// 2. Jeśli mamy ID, AUTOMATYCZNIE przekierowujemy do folderu [id]
	if (portfolioId) {
		redirect(`/bond-reports/${portfolioId}`);
	}

	// 3. Jeśli użytkownik naprawdę nie ma żadnego wybranego portfela, prosimy o wybór
	return (
		<main className="container mx-auto py-10">
			<div>
				<PortfolioEmptyState variant="NOT_SELECTED" />
			</div>
		</main>
	);
}

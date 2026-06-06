import DashboardClientView from "@/components/ui/DashboardClientView";
import { auth } from "@/auth";
import { calculateGapAnalysis } from "@/lib/calculations";
import { db } from "@/lib/db";
import { getGuardedPortfolio } from "@/components/shared/portfolio-guard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
	params: Promise<{ id: string }>; // ZMIANA: Z searchParams na params (jesteśmy w [id] czyli dynamicznym segmencie)
}

export default async function DashboardPage({ params }: Props) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	const { id } = await params;

	// 1. ODPALAMY STRAŻNIKA (Wymuszamy ID ze ścieżki)
	const { portfolio, errorComponent } = await getGuardedPortfolio({
		searchParams: Promise.resolve({ portfolioId: id }),
		userId: session.user.id,
	});

	// 2. Jeśli portfel nie istnieje, strażnik wyrzuci ładny modal NOT_FOUND
	if (errorComponent || !portfolio) {
		return errorComponent;
	}

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

	return (
		<DashboardClientView
			portfolio={portfolio}
			portfolioStatus={portfolioStatus}
			allPortfoliosWithCash={allPortfoliosWithCash}
			transactions={portfolio.transactionHistories}
		/>
	);
}

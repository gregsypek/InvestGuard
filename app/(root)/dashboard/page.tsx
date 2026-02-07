import { db } from "@/lib/db";
import { calculateGapAnalysis } from "@/lib/calculations";
import DashboardClientView from "@/components/ui/DashboardClientView";
import { cookies } from "next/headers";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
	// 1. Czekamy na parametry z URL
	const { portfolioId: urlPortfolioId } = await searchParams;

	// 2. Pobieramy ciasteczka (jako zapas)
	const cookieStore = await cookies();
	const cookiePortfolioId = cookieStore.get("selectedPortfolioId")?.value;

	// 3. Ustalamy końcowe ID (URL ma pierwszeństwo)

	const portfolioId = urlPortfolioId || cookiePortfolioId;

	const portfolio = await db.portfolio.findUnique({
		where: { id: portfolioId },
		include: { assets: true },
	});

	if (!portfolioId || !portfolio) {
		return (
			<div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
				<div className="text-6xl">🏜️</div>
				<h2 className="text-2xl font-bold">Wybierz portfel z menu powyżej</h2>
				<p className="text-muted-foreground">
					Musisz wybrać konkretny portfel, aby zobaczyć swoje inwestycje.
				</p>
			</div>
		);
	}

	// Używamy Twojej istniejącej metody

	const portfolioStatus = calculateGapAnalysis(portfolio?.assets);

	return (
		<DashboardClientView
			portfolio={portfolio}
			portfolioStatus={portfolioStatus}
		/>
	);
}

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
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true, transactionHistories: true },
		orderBy: { createdAt: "desc" },
	});

	// 1. Jeśli nie ma żadnych portfeli (usunięto ostatni), od razu pokaż stan pusty
	if (portfolios.length === 0) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	// 2. Pobierz ID z URL lub ciasteczka
	const rawPortfolioId = await getActivePortfolioId(searchParams);

	// 🚀 KLUCZOWA POPRAWKA: Sprawdź, czy portfolioId z ciasteczka/URL faktycznie istnieje w pobranych portfelach
	// Zapobiega to pętli, gdy w ciasteczku siedzi ID usuniętego portfela
	const activePortfolio = portfolios.find((p) => p.id === rawPortfolioId);
	const portfolioId = activePortfolio ? rawPortfolioId : null;

	// 3. Jeśli portfel został usunięty (brak activePortfolio), pokaż pozostałe portfele i zresetuj selection (nie pokazuj stanu pustego, bo są inne portfele)
	// if (!portfolioId) {
	// 	return <PortfolioEmptyState variant="NOT_SELECTED" />;
	// }

	// 4. Dopiero tutaj licz statystyki, gdy mamy pewność, że portfel istnieje
	const { totalValue, portfoliosCount, assetsCount, categoryTotals } =
		getGlobalStats(portfolios);

	return (
		<div className="space-y-10 pb-20 mb-2">
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
				portfolioId={portfolioId}
				categoryTotals={categoryTotals}
			/>
		</div>
	);
}

import { db } from "@/lib/db";
import { calculateGapAnalysis } from "@/lib/calculations";
import DashboardClientView from "@/components/ui/DashboardClientView";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { getActivePortfolioId } from "@/lib/session";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
	// EN: 1. Check global portfolio count for fresh onboarding
	// UI: 1. Sprawdzamy ogólną liczbę portfeli dla nowych użytkowników
	const totalPortfoliosCount = await db.portfolio.count();

	if (totalPortfoliosCount === 0) {
		// EN: Reuse the empty state for the "Fresh Start" scenario
		// UI: Używamy stanu pustego dla scenariusza "Zacznij tutaj"
		return <PortfolioEmptyState variant="NOT_SELECTED" />;
	}

	// EN: 2. Resolve the active portfolio ID (URL or Cookies)
	// UI: 2. Ustalamy aktywne ID portfela
	const portfolioId = await getActivePortfolioId(searchParams);

	if (!portfolioId) {
		return <PortfolioEmptyState variant="NOT_SELECTED" />;
	}

	// EN: 3. Fetch specific portfolio data
	// UI: 3. Pobieramy dane konkretnego portfela
	const portfolio = await db.portfolio.findUnique({
		where: { id: portfolioId },
		include: { assets: true },
	});

	// EN: Handle case where ID exists but portfolio is not in the DB
	// UI: Obsługa przypadku, gdy ID istnieje, ale portfela nie ma w bazie (np. został usunięty)
	if (!portfolio) {
		return <PortfolioEmptyState variant="NOT_FOUND" />;
	}

	// EN: Success Scenario - Perform calculations and render the view
	// UI: Scenariusz sukcesu - wykonujemy obliczenia i renderujemy widok
	const portfolioStatus = calculateGapAnalysis(portfolio);

	return (
		<DashboardClientView
			portfolio={portfolio}
			portfolioStatus={portfolioStatus}
		/>
	);
}

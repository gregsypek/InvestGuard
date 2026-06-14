import GuestOnboarding from "@/components/GuestOnboarding";
import { UserDashboard } from "@/components/UserDashboard";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generatePortfolioHistory } from "../lib/history-engine";

export default async function HomePage() {
	const session = await auth();

	if (!session?.user?.id) {
		return <GuestOnboarding />;
	}

	// 1. Pobieramy portfele z aktywami
	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true, transactionHistories: true },
	});
	// Przekazujemy CAŁE portfele bezpośrednio do silnika
	const simulatedSnapshots = generatePortfolioHistory(portfolios, 30);
	// Generujemy wygładzoną historię (np. dla ostatnich 30 dni)
	// W przyszłości możesz połączyć to z parametrami z URL (np. ?range=1Y -> daysBack: 365)
	// const simulatedSnapshots = generatePortfolioHistory(allAssets, 30);
	// -------------------------------------------------------------

	// 3. Pobieramy listę indeksów z profilu usera
	const dbUser = await db.user.findUnique({
		where: { id: session.user.id },
		select: { observedIndices: true },
	});
	const userIndices = dbUser?.observedIndices || [];

	// 4. Pobieramy gotowe wyceny indeksów
	const dbIndices = await db.marketIndex.findMany({
		where: { symbol: { in: userIndices } },
	});

	const indexQuotes: Record<string, number> = {};
	dbIndices.forEach((idx) => {
		indexQuotes[idx.symbol] = idx.dailyChange;
	});

	// 5. Wyciągamy czas ostatniej aktualizacji
	let latestUpdate = new Date(0);
	portfolios.forEach((a) => {
		if (a.updatedAt > latestUpdate) latestUpdate = a.updatedAt;
	});

	const lastUpdated =
		latestUpdate.getTime() > 0 ? latestUpdate.toISOString() : null;

	return (
		<UserDashboard
			portfolios={portfolios}
			snapshots={simulatedSnapshots} // <-- WSTRZYKUJEMY ZREKONSTRUOWANĄ HISTORIĘ
			userIndices={userIndices}
			indexQuotes={indexQuotes}
			lastUpdated={lastUpdated}
		/>
	);
}

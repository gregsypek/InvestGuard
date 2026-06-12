import GuestOnboarding from "@/components/GuestOnboarding";
import { UserDashboard } from "@/components/UserDashboard";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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

	// 2. Pobieramy snapshoty
	const snapshots = await db.portfolioSnapshot.findMany({
		where: {
			portfolioId: { in: portfolios.map((p) => p.id) },
			date: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
		},
		orderBy: { date: "asc" },
	});

	// 3. Pobieramy listę indeksów z profilu usera
	const dbUser = await db.user.findUnique({
		where: { id: session.user.id },
		select: { observedIndices: true },
	});
	const userIndices = dbUser?.observedIndices || [];

	// 4. Pobieramy gotowe wyceny indeksów z naszej nowej tabeli
	const dbIndices = await db.marketIndex.findMany({
		where: { symbol: { in: userIndices } },
	});

	const indexQuotes: Record<string, number> = {};
	dbIndices.forEach((idx) => {
		indexQuotes[idx.symbol] = idx.dailyChange;
	});

	// 5. Wyciągamy czas ostatniej aktualizacji na podstawie aktywów
	let latestUpdate = new Date(0);
	const allAssets = portfolios.flatMap((p) => p.assets);

	allAssets.forEach((a) => {
		if (a.updatedAt > latestUpdate) latestUpdate = a.updatedAt;
	});

	const lastUpdated =
		latestUpdate.getTime() > 0 ? latestUpdate.toISOString() : null;

	// 6. Przekazujemy WSZYSTKIE dane do Dashboardu (koniecznie z 'return'!)
	return (
		<UserDashboard
			portfolios={portfolios}
			snapshots={snapshots}
			userIndices={userIndices}
			indexQuotes={indexQuotes}
			lastUpdated={lastUpdated}
		/>
	);
}

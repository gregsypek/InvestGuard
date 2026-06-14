import GuestOnboarding from "@/components/GuestOnboarding";
import { UserDashboard } from "@/components/UserDashboard";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generatePortfolioHistory } from "../lib/history-engine";

// 1. Odbieramy searchParams z Next.js
export default async function HomePage({
	searchParams,
}: {
	searchParams: { range?: string };
}) {
	const session = await auth();

	if (!session?.user?.id) {
		return <GuestOnboarding />;
	}

	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true, transactionHistories: true },
	});

	const allAssets = portfolios.flatMap((p) => p.assets);

	// 2. Logika zakresów czasowych (Filtry)
	const range = searchParams.range || "1M"; // Domyślnie 1 miesiąc
	let daysBack = 30;
	const today = new Date();

	switch (range) {
		case "1W":
			daysBack = 7;
			break;
		case "1M":
			daysBack = 30;
			break;
		case "3M":
			daysBack = 90;
			break;
		case "YTD":
			const startOfYear = new Date(today.getFullYear(), 0, 1);
			daysBack = Math.ceil(
				(today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
			);
			break;
		case "1Y":
			daysBack = 365;
			break;
		case "3Y":
			daysBack = 1095;
			break;
		case "5Y":
			daysBack = 1825;
			break;
		case "MAX":
			// Znajdujemy najstarsze aktywo w portfelu, aby określić początek historii
			const oldestDate = allAssets.reduce((oldest, asset) => {
				const assetDate = new Date(asset.purchaseDate || asset.createdAt);
				return assetDate < oldest ? assetDate : oldest;
			}, today);
			daysBack = Math.ceil(
				(today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24),
			);
			daysBack = Math.max(30, daysBack + 5); // Minimum 30 dni + mały bufor
			break;
	}

	// 3. Generujemy historię z dynamiczną liczbą dni
	const simulatedSnapshots = generatePortfolioHistory(portfolios, daysBack);

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
			snapshots={simulatedSnapshots}
			userIndices={userIndices}
			indexQuotes={indexQuotes}
			lastUpdated={lastUpdated}
			currentRange={range} // <--- Przekazujemy obecny zakres do klienta
		/>
	);
}

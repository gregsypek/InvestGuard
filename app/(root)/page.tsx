import GuestOnboarding from "@/components/GuestOnboarding";
import { UserDashboard } from "@/components/UserDashboard";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generatePortfolioHistory } from "../lib/history-engine";

// WYMUSZENIE ODŚWIEŻANIA Z BAZY DANYCH (Wyłącza agresywny cache Next.js)
export const dynamic = "force-dynamic";

// Zabezpieczenie asynchronicznych parametrów dla Next.js 15
type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default async function HomePage(props: { searchParams: SearchParams }) {
	// ODKODOWANIE URL - TO NAPRAWIA ZAWIESZANIE SIĘ APLIKACJI!
	const searchParams = await props.searchParams;

	const session = await auth();

	if (!session?.user?.id) {
		return <GuestOnboarding />;
	}

	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true, transactionHistories: true },
	});

	const allAssets = portfolios.flatMap((p) => p.assets);

	// Logika zakresów czasowych z URL
	const range = searchParams.range || "1M";
	let daysBack = 30;
	let endDate = new Date();
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
			const oldestDate = allAssets.reduce((oldest, asset) => {
				const assetDate = new Date(asset.purchaseDate || asset.createdAt);
				return assetDate < oldest ? assetDate : oldest;
			}, today);
			daysBack = Math.ceil(
				(today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24),
			);
			daysBack = Math.max(30, daysBack + 5);
			break;
		case "CUSTOM":
			if (searchParams.to) endDate = new Date(searchParams.to);
			if (searchParams.from) {
				const fromDate = new Date(searchParams.from);
				daysBack = Math.ceil(
					(endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
				);
				daysBack = Math.max(1, daysBack);
			}
			break;
	}

	// Silnik Historii (z datą OD i DO)
	const simulatedSnapshots = generatePortfolioHistory(
		portfolios,
		daysBack,
		endDate,
	);

	const dbUser = await db.user.findUnique({
		where: { id: session.user.id },
		select: { observedIndices: true },
	});
	const userIndices = dbUser?.observedIndices || [];

	const dbIndices = await db.marketIndex.findMany({
		where: { symbol: { in: userIndices } },
	});

	const indexQuotes: Record<string, number> = {};
	dbIndices.forEach((idx) => {
		indexQuotes[idx.symbol] = idx.dailyChange;
	});

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
			currentRange={range}
		/>
	);
}

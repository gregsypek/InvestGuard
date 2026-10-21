import GuestOnboarding from "@/components/GuestOnboarding";
import { UserDashboard } from "@/components/UserDashboard";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPortfolioSnapshotsHistory } from "../../lib/history-engine";
import { syncBondsWithMarket } from "@/lib/actions/bond-actions";

// WYMUSZENIE ODŚWIEŻANIA Z BAZY DANYCH (Wyłącza agresywny cache Next.js)
export const dynamic = "force-dynamic";

// Zabezpieczenie asynchronicznych parametrów dla Next.js 15
type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default async function HomePage(props: { searchParams: SearchParams }) {
	const searchParams = await props.searchParams;
	const session = await auth();

	if (!session?.user?.id) {
		return <GuestOnboarding />;
	}

	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true, transactionHistories: true },
	});

	// 🚀 Synchronizujemy obligacje z rynkiem
	for (const p of portfolios) {
		await syncBondsWithMarket(p.id);
	}

	const allAssets = portfolios.flatMap((p) => p.assets);

	// =========================================================
	// 🚀 UŻYCIE WYDZIELONEGO SILNIKA (HISTORY ENGINE)	//
	// =========================================================
	const { simulatedSnapshots, realSnapshots, startDate, endDate } =
		await getPortfolioSnapshotsHistory(
			portfolios,
			searchParams,
			session.user.id,
		);

	// =========================================================
	// POBIERANIE WSKAŹNIKÓW (RADAR RYNKOWY)
	// =========================================================
	const dbUser = await db.user.findUnique({
		where: { id: session.user.id },
		select: { observedIndices: true },
	});

	const userIndices = dbUser?.observedIndices || [];
	let latestUpdate = new Date(0);

	const dbIndices = await db.marketIndex.findMany({
		where: { symbol: { in: userIndices } },
	});

	const indexQuotes: Record<string, number> = {};
	dbIndices.forEach((idx) => {
		indexQuotes[idx.symbol] = idx.dailyChange;
		if (idx.updatedAt > latestUpdate) latestUpdate = idx.updatedAt;
	});

	allAssets.forEach((asset) => {
		if (asset.updatedAt > latestUpdate) latestUpdate = asset.updatedAt;
	});

	const lastUpdated =
		latestUpdate.getTime() > 0 ? latestUpdate.toISOString() : null;

	// Pobieramy historyczne wyceny indeksów do wykresów (Benchmark)
	const rawIndexHistory = await db.indexHistory.findMany({
		where: {
			symbol: { in: userIndices },
			date: {
				gte: startDate, // Zwrócone z Twojej funkcji!
				lte: endDate,
			},
		},
		orderBy: { date: "asc" },
	});

	const indexQuotesHistory: Record<string, Record<string, number>> = {};
	userIndices.forEach((idx) => {
		indexQuotesHistory[idx] = {};
	});

	rawIndexHistory.forEach((record) => {
		const dateStr = record.date.toISOString().split("T")[0];
		if (indexQuotesHistory[record.symbol]) {
			indexQuotesHistory[record.symbol][dateStr] = record.closePrice;
		}
	});

	return (
		<UserDashboard
			portfolios={portfolios}
			snapshots={simulatedSnapshots}
			realSnapshots={realSnapshots}
			userIndices={userIndices}
			indexQuotes={indexQuotes}
			indexQuotesHistory={indexQuotesHistory}
			lastUpdated={lastUpdated}
			currentRange={searchParams.range || "1M"}
			role={session.user.role} // 🚀 Upewnij się, że rola (np. "ADMIN") trafia do widoku do odblokowania Refresh!
		/>
	);
}

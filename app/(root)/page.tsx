import GuestOnboarding from "@/components/GuestOnboarding";
import { UserDashboard } from "@/components/UserDashboard";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPortfolioSnapshotsHistory } from "../../lib/history-engine";
import { syncBondsWithMarket } from "@/lib/actions/bond-actions";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

// Cache 5-year market index & observed asset history for 1 hour (drastically cuts Neon egress)
const getCachedMarketHistory = unstable_cache(
	async (symbols: string[]) => {
		if (symbols.length === 0) return {};

		const marketHistoryStartDate = new Date();
		marketHistoryStartDate.setFullYear(
			marketHistoryStartDate.getFullYear() - 5,
		);

		const rawIndexHistory = await db.indexHistory.findMany({
			where: {
				symbol: { in: symbols },
				date: { gte: marketHistoryStartDate },
			},
			orderBy: { date: "asc" },
			select: {
				symbol: true,
				date: true,
				closePrice: true,
			},
		});

		const indexQuotesHistory: Record<string, Record<string, number>> = {};
		symbols.forEach((symbol) => {
			indexQuotesHistory[symbol] = {};
		});

		rawIndexHistory.forEach((record) => {
			const dateStr = record.date.toISOString().split("T")[0];
			if (indexQuotesHistory[record.symbol]) {
				indexQuotesHistory[record.symbol][dateStr] = record.closePrice;
			}
		});

		return indexQuotesHistory;
	},
	["dashboard-market-history-5y"],
	{
		revalidate: 3600, // 1 hour
		tags: ["market-history"],
	},
);

export default async function HomePage(props: { searchParams: SearchParams }) {
	const searchParams = await props.searchParams;
	const session = await auth();

	if (!session?.user?.id) {
		return <GuestOnboarding />;
	}

	// Fetch portfolios + user's observed indices in parallel
	const [portfolios, dbUser] = await Promise.all([
		db.portfolio.findMany({
			where: { userId: session.user.id },
			include: {
				assets: true,
				// Limit transaction history payload on dashboard to recent records
				transactionHistories: {
					orderBy: { executedAt: "desc" },
					take: 150,
				},
			},
		}),
		db.user.findUnique({
			where: { id: session.user.id },
			select: { observedIndices: true },
		}),
	]);

	// Sync bonds with market in parallel across portfolios
	await Promise.all(portfolios.map((p) => syncBondsWithMarket(p.id)));

	const allAssets = portfolios.flatMap((p) => p.assets);
	const userIndices = dbUser?.observedIndices || [];

	const observedAssetTickers = allAssets
		.filter((a) => a.isObserved && a.ticker)
		.map((a) => a.ticker as string);

	const combinedSymbolsForHistory = Array.from(
		new Set([...userIndices, ...observedAssetTickers]),
	).sort();

	// Execute snapshots history, current market indices, and cached 5Y benchmark history in parallel
	const [snapshotsResult, dbIndices, indexQuotesHistory] = await Promise.all([
		getPortfolioSnapshotsHistory(portfolios, searchParams, session.user.id),
		db.marketIndex.findMany({
			where: { symbol: { in: userIndices } },
			select: {
				symbol: true,
				dailyChange: true,
				updatedAt: true,
			},
		}),
		getCachedMarketHistory(combinedSymbolsForHistory),
	]);

	const { simulatedSnapshots, realSnapshots } = snapshotsResult;

	let latestUpdate = new Date(0);
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
			role={session.user.role}
		/>
	);
}

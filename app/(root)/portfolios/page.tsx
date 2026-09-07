import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import PortfoliosClientView from "@/components/ui/PortfolioClientView";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generatePortfolioHistory } from "@/app/lib/history-engine";
import { getActivePortfolioId } from "@/lib/session";
import { getGlobalStats } from "@/lib/calculations";
import { redirect } from "next/navigation";

// 1. Rozszerzony interfejs Props o parametry dla zakresów dat
interface Props {
	searchParams: Promise<{
		portfolioId?: string;
		range?: string;
		from?: string;
		to?: string;
	}>;
}

export default async function PortfoliosPage({ searchParams }: Props) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	// 2. Oczekujemy na parametry z URL (wymóg dla Promise w Next.js)
	const resolvedSearchParams = await searchParams;

	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true, transactionHistories: true },
		orderBy: { createdAt: "desc" },
	});

	if (portfolios.length === 0) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	const rawPortfolioId = await getActivePortfolioId(searchParams);
	const activePortfolio = portfolios.find((p) => p.id === rawPortfolioId);
	const portfolioId = activePortfolio ? rawPortfolioId : null;

	const { totalValue, portfoliosCount, assetsCount, categoryTotals } =
		getGlobalStats(portfolios);

	// --- 3. Wklejona logika wyliczania DAYS BACK ---
	const allAssets = portfolios.flatMap((p) => p.assets); // Wymagane dla filtra "MAX"
	const range = resolvedSearchParams.range || "1M";
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
				// Jeśli Twoje aktywa mają inne pole daty, zmień to na odpowiednie (np. asset.createdAt)
				const assetDate = new Date(
					(asset as any).purchaseDate || asset.createdAt,
				);
				return assetDate < oldest ? assetDate : oldest;
			}, today);
			daysBack = Math.ceil(
				(today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24),
			);
			daysBack = Math.max(30, daysBack + 5);
			break;
		case "CUSTOM":
			if (resolvedSearchParams.to) endDate = new Date(resolvedSearchParams.to);
			if (resolvedSearchParams.from) {
				const fromDate = new Date(resolvedSearchParams.from);
				daysBack = Math.ceil(
					(endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
				);
				daysBack = Math.max(1, daysBack);
			}
			break;
	}

	const startDate = new Date(endDate);
	startDate.setDate(endDate.getDate() - daysBack);

	// --- 4. Zastosowanie dni w danych ---

	// Filtrujemy z bazy tylko te snapshoty, które mieszczą się w wyliczonym zakresie!
	const realDbSnapshots = await db.portfolioSnapshot.findMany({
		where: {
			portfolio: { userId: session.user.id },
			date: {
				gte: startDate,
				lte: endDate,
			},
		},
		orderBy: { date: "asc" },
	});

	const realSnapshots = realDbSnapshots.map((s) => ({
		id: s.id,
		portfolioId: s.portfolioId,
		date: s.date,
		totalValue: Number(s.totalValue),
		investedValue: Number(s.investedValue),
		dailyChange: 0,
		isPositive: true,
	}));

	// Pamiętaj o użyciu zmiennej `daysBack` zamiast wpisanego wcześniej `30`
	const simulatedSnapshots = generatePortfolioHistory(
		portfolios,
		daysBack,
		endDate,
	);

	return (
		<div className="space-y-10">
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
				portfolioId={portfolioId ?? undefined}
				categoryTotals={categoryTotals}
				realSnapshots={realSnapshots}
				snapshots={simulatedSnapshots}
			/>
		</div>
	);
}

import AddAssetClient from "./AddAssetClient";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPortfolioCategories } from "@/lib/actions/portfolio.actions";

interface Props {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ cat?: string; source?: string; view?: string }>;
}

export default async function AddAssetPage({ params, searchParams }: Props) {
	const session = await auth();
	const { id } = await params;
	const resolvedParams = await searchParams;

	// 🚀 POBIERAMY DANE BEZPOŚREDNIO Z BAZY DLA WYBRANEGO PORTFELA
	const [categoriesResult, portfolio, assets] = await Promise.all([
		getPortfolioCategories(id),
		db.portfolio.findUnique({ where: { id }, select: { name: true } }),
		db.asset.findMany({ where: { portfolioId: id } }), // Pełna pula aktywów tego portfela
	]);

	const categories = categoriesResult.success
		? categoriesResult.categories
		: [];
	const portfolioName = portfolio?.name || "Nieznany Portfel";

	// 🚀 DOKŁADNE PRZELICZENIE WYNIKÓW DLA TEGO PORTFELA
	const portfolioTotalValue = assets.reduce(
		(sum, a) => sum + Number(a.currentValue || 0),
		0,
	);
	const portfolioInvested = assets.reduce(
		(sum, a) => sum + Number(a.investedCapital || 0),
		0,
	);

	return (
		<AddAssetClient
			id={id}
			portfolioName={portfolioName}
			categories={categories}
			assets={assets}
			userRole={session?.user?.role || "REGULAR"}
			source={resolvedParams?.source}
			initialView={resolvedParams?.view}
			portfolioTotalValue={portfolioTotalValue}
			portfolioInvested={portfolioInvested}
		/>
	);
}

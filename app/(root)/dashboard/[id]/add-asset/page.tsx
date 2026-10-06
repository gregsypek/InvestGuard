import AddAssetClient from "./AddAssetClient";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPortfolioCategories } from "@/lib/actions/portfolio.actions";
import { redirect } from "next/navigation";

interface Props {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ cat?: string; source?: string; view?: string }>;
}

export default async function AddAssetPage({ params, searchParams }: Props) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	const { id } = await params;
	const resolvedParams = await searchParams;

	// 🚀 POBIERAMY DANE BEZPOŚREDNIO Z BAZY DLA WYBRANEGO PORTFELA
	// ORAZ DODATKOWO LISTĘ WSZYSTKICH PORTFELI UŻYTKOWNIKA DLA PLANERA
	const [categoriesResult, portfolio, assets, allUserPortfolios] =
		await Promise.all([
			getPortfolioCategories(id),
			db.portfolio.findUnique({ where: { id }, select: { name: true } }),
			db.asset.findMany({ where: { portfolioId: id } }), // Pełna pula aktywów tego portfela
			db.portfolio.findMany({
				// 🚀 NOWE: Wszystkie portfele usera (id i name do listy w Planerze)
				where: { userId: session.user.id },
				select: { id: true, name: true },
			}),
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
			// MAGIA: Kiedy zmienia się URL, React automatycznie resetuje CAŁY komponent
			// do ustawień fabrycznych (odpalając domyślną zakładkę ze stanu), bez użycia useEffect!
			key={`${resolvedParams?.source}-${resolvedParams?.view}`}
			id={id}
			portfolioName={portfolioName}
			categories={categories}
			assets={assets}
			userRole={session?.user?.role || "REGULAR"}
			source={resolvedParams?.source}
			initialView={resolvedParams?.view}
			portfolioTotalValue={portfolioTotalValue}
			portfolioInvested={portfolioInvested}
			// 🚀 PRZEKAZUJEMY PORTFELE DO KLIENTA! (Wymagane przez PlannerForm)
			allUserPortfolios={allUserPortfolios}
		/>
	);
}

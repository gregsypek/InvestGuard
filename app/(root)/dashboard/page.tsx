import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getActivePortfolioId } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardRootPage({
	searchParams,
}: {
	searchParams: Promise<{ portfolioId?: string }>;
}) {
	const session = await auth();

	// 1. Zabezpieczenie sesji
	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	// 2. Pobieramy ID z ciasteczka/URL
	const rawPortfolioId = await getActivePortfolioId(searchParams);

	// 3. POBIERAMY LISTĘ PORTFELI UŻYTKOWNIKA
	// To jest kluczowe, by sprawdzić czy ID jest poprawne
	const userPortfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		select: { id: true },
	});

	// 4. WALIDACJA: Czy portfolioId z ciasteczka faktycznie istnieje w bazie?
	const portfolioExists = userPortfolios.some((p) => p.id === rawPortfolioId);
	const validPortfolioId = portfolioExists ? rawPortfolioId : null;
	console.log("🚀 ~ DashboardRootPage ~ validPortfolioId:", validPortfolioId);

	// 5. SCENARIUSZ: Brak jakichkolwiek portfeli
	if (userPortfolios.length === 0) {
		return (
			<main className="container mx-auto py-10">
				<PortfolioEmptyState variant="PORTFOLIOS" />
			</main>
		);
	}

	// 7. Dopiero gdy mamy PEWNOŚĆ, że ID istnieje w bazie danych, robimy redirect
	if (validPortfolioId) {
		redirect(`/dashboard/${validPortfolioId}`);
	}
	return null;
}

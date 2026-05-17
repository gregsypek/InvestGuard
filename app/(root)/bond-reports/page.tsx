// app/(root)/bond-reports/page.tsx

import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { auth } from "@/auth";
import { db } from "@/lib/db"; // Importuj dostęp do bazy danych
import { getActivePortfolioId } from "@/lib/session";
import { redirect } from "next/navigation";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function BondReportsLanding({ searchParams }: Props) {
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

	// 5. SCENARIUSZ: Brak jakichkolwiek portfeli
	if (userPortfolios.length === 0) {
		return (
			<main className="container mx-auto ">
				<PortfolioEmptyState variant="PORTFOLIOS" />
			</main>
		);
	}

	// 6. SCENARIUSZ: ID z ciasteczka jest nieprawidłowe (np. usunięte) lub go brak
	if (!validPortfolioId) {
		return (
			<main className="container mx-auto ">
				<PortfolioEmptyState variant="NOT_SELECTED" />
			</main>
		);
	}

	// 7. Dopiero gdy mamy PEWNOŚĆ, że ID istnieje w bazie danych, robimy redirect
	if (validPortfolioId) {
		redirect(`/bond-reports/${validPortfolioId}`);
	}

	return null;
}

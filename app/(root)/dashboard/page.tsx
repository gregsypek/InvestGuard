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
	// 1. Sprawdź sesję
	const session = await auth();
	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	// 2. Sprawdź, czy użytkownik ma jakiekolwiek portfele
	const firstPortfolio = await db.portfolio.findFirst({
		where: { userId: session.user.id },
		select: { id: true },
	});

	// 3. Jeśli nie ma portfeli, pokaż stan pusty
	if (!firstPortfolio) {
		return (
			<PortfolioEmptyState variant="PORTFOLIOS" userName={session.user.name} />
		);
	}
	// if (firstPortfolio) {
	// 	return (
	// 		<PortfolioEmptyState variant="PLANNER" portfolioId={firstPortfolio.id} />
	// 	);
	// }

	// 4. Spróbuj pobrać ID z parametrów lub ciasteczek
	const portfolioId = await getActivePortfolioId(searchParams);

	// 5. PRZEKIEROWANIE: Wyślij użytkownika na stronę konkretnego portfela
	// To naprawi błąd 404 dla adresu /dashboard
	if (portfolioId) {
		redirect(`/dashboard/${portfolioId}`);
	} else {
		redirect(`/dashboard/${firstPortfolio.id}`);
	}
}

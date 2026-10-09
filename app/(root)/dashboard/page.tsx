import { auth } from "@/auth";
import { db } from "@/lib/db"; // 🚀 DODANY IMPORT BAZY DANYCH
import { getGuardedPortfolio } from "@/components/shared/portfolio-guard";
import { redirect } from "next/navigation";

export default async function DashboardRootPage({
	searchParams,
}: {
	searchParams: Promise<{ portfolioId?: string }>;
}) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	const { portfolioId, errorComponent } = await getGuardedPortfolio({
		searchParams,
		userId: session.user.id,
	});

	// 🚀 ZMIANA: Jeśli strażnik nie znalazł portfela i chce pokazać pusty ekran (NOT_SELECTED)...
	if (errorComponent) {
		// Szukamy w bazie profilu użytkownika
		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { defaultPortfolioId: true },
		});

		// Jeśli ma zdefiniowany domyślny portfel, robimy ciche przekierowanie! (Użytkownik nie zobaczy pustego ekranu)
		if (user?.defaultPortfolioId) {
			redirect(`/dashboard/${user.defaultPortfolioId}`);
		}

		// Dopiero jeśli nie ma domyślnego, faktycznie pokazujemy pusty ekran
		return <main className="container mx-auto">{errorComponent}</main>;
	}

	if (portfolioId) {
		redirect(`/dashboard/${portfolioId}`);
	}

	return null;
}

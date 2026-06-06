import { auth } from "@/auth";
import { getGuardedPortfolio } from "@/components/shared/portfolio-guard";
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

	// 2. Strażnik załatwia WSZYSTKO (sprawdza URL, ciasteczka i czy user ma portfele)
	const { portfolioId, errorComponent } = await getGuardedPortfolio({
		searchParams,
		userId: session.user.id,
	});

	// 3. Jeśli brakuje portfela, strażnik wyrzuci idealny ekran (np. PORTFOLIOS)
	if (errorComponent) {
		return <main className="container mx-auto">{errorComponent}</main>;
	}

	// 4. Dopiero gdy mamy PEWNOŚĆ, że ID istnieje, robimy bezpieczny redirect
	if (portfolioId) {
		redirect(`/dashboard/${portfolioId}`);
	}

	return null;
}

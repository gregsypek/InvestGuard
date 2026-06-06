import { auth } from "@/auth";
import { getGuardedPortfolio } from "@/components/shared/portfolio-guard";
import { redirect } from "next/navigation";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function BondReportsLanding({ searchParams }: Props) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	// 1. Strażnik weryfikuje ciasteczka, bazę i puste konta
	const { portfolioId, errorComponent } = await getGuardedPortfolio({
		searchParams,
		userId: session.user.id,
	});

	// 2. Jeśli brakuje portfela, strażnik wyrzuci idealny ekran (np. PORTFOLIOS)
	if (errorComponent) {
		return <main className="container mx-auto">{errorComponent}</main>;
	}

	// 3. Przekierowanie do właściwego portfela
	if (portfolioId) {
		redirect(`/bond-reports/${portfolioId}`);
	}

	return null;
}

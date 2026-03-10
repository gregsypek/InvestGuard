import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { getActivePortfolioId } from "@/lib/session";
import { redirect } from "next/navigation";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function BondReportsLanding({ searchParams }: Props) {
	// 1. Próbujemy znaleźć aktywne ID portfela (z ciasteczek lub URL)
	const portfolioId = await getActivePortfolioId(searchParams);

	// 2. Jeśli mamy ID, AUTOMATYCZNIE przekierowujemy do folderu [id]
	if (portfolioId) {
		redirect(`/bond-reports/${portfolioId}`);
	}

	// 3. Jeśli użytkownik naprawdę nie ma żadnego wybranego portfela, prosimy o wybór
	return (
		<main className="container mx-auto py-10">
			<div className="mt-12">
				<PortfolioEmptyState variant="NOT_SELECTED" />
			</div>
		</main>
	);
}

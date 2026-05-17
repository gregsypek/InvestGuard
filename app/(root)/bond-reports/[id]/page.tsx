import { Banknote, Landmark, Plus } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import AddButton from "@/components/ui/AddButton";
import { BondHeader } from "@/components/BondHeader";
import BondLedgerTable from "@/components/BondLedgerTable";
import Link from "next/link";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SubHeader } from "@/components/shared/SubHeader";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBondsData } from "@/lib/actions/bond-actions";

interface Props {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ portfolioId?: string }>; // 🆕 Dodajemy obsługę query params
}

export default async function BondReportsPage({ params, searchParams }: Props) {
	// Fetch the current user session
	const session = await auth();

	// Redirect to sign-in if the user is not authenticated
	if (!session?.user?.id) {
		redirect("/sign-in");
	}
	const allPortfoliosWithCash = await db.portfolio.findMany({
		where: {
			userId: session.user.id,
			// Szukamy portfeli, które mają zdefiniowany cel na gotówkę większy niż 0%
			targetCash: {
				gt: 0,
			},
		},
		select: {
			id: true,
			name: true,
		},
	});
	const { id: pathId } = await params;
	// 🚀 DEFINIUJEMY portfolioId na podstawie pathId
	const portfolioId = pathId;
	const activeId = pathId; // Jeśli używasz też activeId w Linkach
	// if (!pathId) return <PortfolioEmptyState variant="NOT_FOUND" />;

	// EN: Fetch bonds again (Next.js automatically deduplicates identical fetch requests in the background)
	const data = await getBondsData(activeId);
	// console.log("🚀 ~ BondReportsPage ~ data:", data);
	if (!data) {
		return notFound();
	}

	const { bonds, stats, portfolioName } = data;
	const isEmpty = bonds.length === 0;

	if (!portfolioId) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}
	return (
		<div className="space-y-10">
			<BondHeader
				title="Moje Obligacje"
				totalBonds={bonds.length}
				stats={stats}
				portfolioName={portfolioName}
			/>
			{/* PASEK AKCJI (Dodaj Serię) */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
				<div className="space-y-1">
					<SectionHeader title="Portfel Obligacji" icon={Landmark} />
					<SubHeader
						title="Analiza bezpiecznych aktywów"
						description="Tabela przedstawia wszystkie obligacje z portfela posegregowane rodzajami"
						icon={Banknote}
					/>
				</div>

				<AddButton className="gap-2 shadow-sm h-9">
					<Link
						href={`/bond-reports/${activeId}/add-asset`}
						className="gap-2 flex items-center"
					>
						<Plus className="h-4 w-4" />
						Dodaj Serię
					</Link>
				</AddButton>
			</div>
			{isEmpty ? (
				<PortfolioEmptyState
					variant="BONDS"
					// title="Brak obligacji w tym portfelu"
					// description="Nie dodałeś jeszcze żadnych obligacji skarbowych. Kliknij 'Dodaj Serię', aby rozpocząć."
					portfolioId={activeId}
				/>
			) : (
				<BondLedgerTable
					initialBonds={bonds}
					portfolioId={activeId}
					allPortfolios={allPortfoliosWithCash}
				/>
			)}
		</div>
	);
}

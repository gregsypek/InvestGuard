import { Landmark, Plus } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import AddButton from "@/components/ui/AddButton";
import { BondHeader } from "@/components/BondHeader";
import BondLedgerTable from "@/components/BondLedgerTable";
import BulbTip from "@/components/shared/BulbTip";
import Link from "next/link";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBondsData } from "@/lib/actions/bond-actions";

interface Props {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ portfolioId?: string }>; // 🆕 Dodajemy obsługę query params
}

export default async function BondReportsPage({ params, searchParams }: Props) {
	// // 2. Fetch all portfolios to display global stats in the header
	// const allPortfolios = await db.portfolio.findMany({
	// 	select: {
	// 		id: true,
	// 		name: true,
	// 	},
	// });

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
			// lub po prostu wszystkie portfele użytkownika, jeśli dopuszczasz wpłatę do każdego
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
	const { portfolioId: queryId } = await searchParams; // 🆕 Pobieramy ID z ?portfolioId=...
	if (!pathId) return <PortfolioEmptyState variant="NOT_FOUND" />;

	// 1. LOGIKA SYNCHRONIZACJI:
	// Jeśli w URL jest portfolioId, to ono jest "ważniejsze" (wybrane z selektora).
	// Jeśli nie ma, używamy ID ze ścieżki.
	const activeId = queryId || pathId;

	// EN: Fetch bonds again (Next.js automatically deduplicates identical fetch requests in the background)
	const data = await getBondsData(activeId);
	console.log("🚀 ~ BondReportsPage ~ data:", data);
	if (!data) {
		return notFound();
	}

	const { bonds, stats, portfolioName } = data;
	const isEmpty = bonds.length === 0;

	return (
		<div className="space-y-10 pb-20">
			<BondHeader
				title="Moje Obligacje"
				totalBonds={bonds.length}
				stats={stats}
				portfolioName={portfolioName}
			/>
			{/* PASEK AKCJI (Dodaj Serię) */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
				<div className="space-y-1">
					<h2 className="text-xl font-bold tracking-tight  flex items-center gap-2">
						<Landmark className="h-5 w-5 text-primary" /> Portfel Obligacji
					</h2>
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
						<BulbTip
							title="Pamiętaj: "
							content="Wcześniejszy wykup to koszt ok. 0.70-3.00 PLN za sztukę."
						/>
					</div>
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
				<div className="mt-12">
					<PortfolioEmptyState
						variant="PLANNER"
						title="Brak obligacji w tym portfelu"
						description="Nie dodałeś jeszcze żadnych obligacji skarbowych. Kliknij 'Dodaj Serię', aby rozpocząć."
					/>
				</div>
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

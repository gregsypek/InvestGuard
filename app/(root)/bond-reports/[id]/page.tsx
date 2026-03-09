import { Landmark, Plus } from "lucide-react";

import AddButton from "@/components/ui/AddButton";
import { BondHeader } from "@/components/BondHeader";
import BondLedgerTable from "@/components/BondLedgerTable";
import BulbTip from "@/components/shared/BulbTip";
import Link from "next/link";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { getBondsData } from "@/lib/actions/bond-actions";
import { notFound } from "next/navigation";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function BondReportsPage({ params }: Props) {
	const { id } = await params;
	if (!id) return <PortfolioEmptyState variant="NOT_FOUND" />;

	// EN: Fetch bonds again (Next.js automatically deduplicates identical fetch requests in the background)
	const data = await getBondsData(id);
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
						href={`/bond-reports/${id}/add-asset`}
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
				<BondLedgerTable initialBonds={bonds} portfolioId={id} />
			)}
		</div>
	);
}

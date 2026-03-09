import { Landmark, Plus } from "lucide-react";

import AddButton from "@/components/ui/AddButton";
import { Bond } from "@/lib/types";
import BondLedgerTable from "@/components/BondLedgerTable";
import BulbTip from "@/components/shared/BulbTip";
import Link from "next/link";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { getBonds } from "@/lib/actions/bond-actions";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function BondReportsPage({ params }: Props) {
	const { id: portfolioId } = await params;

	// EN: Fetch bonds again (Next.js automatically deduplicates identical fetch requests in the background)
	const rawBonds = await getBonds(portfolioId);
	const isEmpty = rawBonds.length === 0;

	// EN: Map data to conform to the Bond interface for the table
	const bonds: Bond[] = rawBonds.map((b) => {
		const cleanTicker = b.ticker ? b.ticker.split("_")[0] : "NIEZNANY";
		return {
			id: b.id,
			ticker: cleanTicker,
			name: b.name,
			purchaseDate:
				b.purchaseDate instanceof Date
					? b.purchaseDate.toISOString()
					: String(b.purchaseDate),
			maturityDate: b.maturityDate
				? b.maturityDate instanceof Date
					? b.maturityDate.toISOString()
					: String(b.maturityDate)
				: null,
			investedCapital: Number(b.investedCapital) ?? 0,
			currentValue: Number(b.currentValue) ?? 0,
			interestRate: b.interestRate ?? 0,
		};
	});

	return (
		<div className="space-y-10">
			{/* PASEK AKCJI (Dodaj Serię) */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
				<div className="space-y-1">
					<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 ">
						<Landmark className="h-6 w-6 text-primary" /> Portfel Obligacji
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
						href={`/bond-reports/${portfolioId}/add-asset`}
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
				<BondLedgerTable initialBonds={bonds} portfolioId={portfolioId} />
			)}
		</div>
	);
}

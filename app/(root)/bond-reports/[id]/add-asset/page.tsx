import { FileText, Form, LibrarySquareIcon } from "lucide-react";

import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import AddBondForm from "@/components/ui/assets/AddBondForm";
import { BondHeader } from "@/components/BondHeader";
import { BondImporter } from "@/components/ui/BondImporter";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SubHeader } from "@/components/shared/SubHeader";
import { getBondsData } from "@/lib/actions/bond-actions";
import { notFound } from "next/navigation";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function AddBondPage({ params }: Props) {
	const { id } = await params;
	const data = await getBondsData(id); // Wywołujesz to samo - Next.js to zoptymalizuje
	if (!data) return notFound();
	if (!id) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}
	return (
		<div className="space-y-10 pb-20">
			<BondHeader
				title="Moje Obligacje"
				portfolioName={data.portfolioName}
				stats={data.stats}
				totalBonds={data.bonds.length}
				backHref={`/bond-reports/${id}`}
			/>
			{/* <div className="flex justify-between items-center mb-6">
				<h2 className="text-xl font-bold tracking-tight  flex items-center gap-2">
					<LibrarySquareIcon className="h-5 w-5 text-primary" />
				</h2>
			</div>
			<AddBondForm portfolioId={id} /> */}
			<section className="pt-8 border-t border-border">
				<div className="flex justify-between">
					<SectionHeader
						icon={FileText}
						title="Import obligacji z raportu - PKO BP"
					/>
				</div>
				<SubHeader
					title="Automatyczne dodawanie obligacji"
					description="Wygeneruj raport w banku PKO i zaimportuj go tutaj, aby szybko dodać swoje obligacje i przeliczyć aktualne saldo"
					icon={Form}
				/>
				<div className="mx-6 py-2">
					<BondImporter portfolioId={id} />{" "}
				</div>
			</section>
			<section className="pt-8 border-t border-border">
				<div className="flex justify-between">
					<SectionHeader
						icon={LibrarySquareIcon}
						title="Ręczne dodawanie aktywów"
					/>
				</div>

				<AddBondForm portfolioId={id} />
			</section>
		</div>
	);
}

import AddBondForm from "@/components/ui/assets/AddBondForm";
import { BondHeader } from "@/components/BondHeader";
import { LibrarySquareIcon } from "lucide-react";
import { getBondsData } from "@/lib/actions/bond-actions";
import { notFound } from "next/navigation";
interface Props {
	params: Promise<{ id: string }>;
}

export default async function AddBondPage({ params }: Props) {
	const { id } = await params;
	const data = await getBondsData(id); // Wywołujesz to samo - Next.js to zoptymalizuje
	if (!data) return notFound();

	return (
		<div className="p-6 px-8 space-y-10 pb-20">
			<BondHeader
				title="Moje Obligacje"
				portfolioName={data.portfolioName}
				stats={data.stats}
				totalBonds={data.bonds.length}
				backHref={`/bond-reports/${id}`}
			/>
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-xl font-bold tracking-tight  flex items-center gap-2">
					<LibrarySquareIcon className="h-5 w-5 text-primary" />
					{/* Formularz dodawania obligacji */}
				</h2>
			</div>
			<AddBondForm portfolioId={id} />
		</div>
	);
}

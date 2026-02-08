import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import AddAssetForm from "@/components/ui/assets/AddAssetForm";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function AddAssetPage({ params }: Props) {
	const { id } = await params;

	// Opcjonalnie sprawdzamy, czy portfel istnieje, by pokazać ładny breadcrumb
	const portfolio = await db.portfolio.findUnique({
		where: { id },
		select: { name: true },
	});

	if (!portfolio) notFound();

	return (
		<div className="space-y-10">
			<div>
				{/* Breadcrumbs / Powrót */}
				<nav className="flex items-center  text-sm text-muted-foreground mb-1">
					<Link
						href={`/dashboard?portfolioId=${id}`}
						className="hover:text-primary transition-colors "
					>
						Dashboard
					</Link>
					<span>/</span>
					<span className="text-foreground font-medium">{portfolio.name}</span>
					<span>/</span>
					<span>Add Asset</span>
				</nav>

				<div className="flex  justify-startitems-center gap-3">
					<Link href={`/dashboard?portfolioId=${id}`}>
						<div className="hover:bg-secondary rounded-full transition-colors">
							<ChevronLeft className="h-6 w-6" />
						</div>
					</Link>
					<h1 className="h1-bold text-3xl uppercase">Add New Asset</h1>
				</div>
			</div>
			<div className=" ">
				{/* Przekazujemy id bezpośrednio do formularza */}
				<AddAssetForm portfolioId={id} />
			</div>
		</div>
	);
}

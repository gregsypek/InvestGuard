// app/(root)/portfolios/edit/[id]/page.tsx
import PortfolioForm from "@/components/PortfolioForm";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function EditPortfolioPage({ params }: Props) {
	const { id } = await params;

	// Pobieramy dane portfela z bazy danych
	const portfolio = await db.portfolio.findUnique({
		where: { id },
	});
	console.log("🚀 ~ EditPortfolioPage ~ portfolio:", portfolio);

	// Jeśli portfel nie istnieje, pokazujemy stronę 404
	if (!portfolio) {
		notFound();
	}

	return (
		<div className="max-w-2xl mx-auto">
			<h1 className="h1-bold mb-8">Edit Portfolio</h1>
			{/* Przekazujemy pobrane dane do formularza jako initialData */}
			<PortfolioForm initialData={portfolio} portfolioId={id} />
		</div>
	);
}

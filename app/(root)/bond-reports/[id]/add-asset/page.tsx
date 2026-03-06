// app / root / bond - reports / [id] / add - asset / page.tsx;

import AddBondForm from "@/components/ui/assets/AddBondForm";
import { LibrarySquareIcon } from "lucide-react";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function AddBondPage({ params }: Props) {
	// Pobieramy id z parametrów ścieżki
	const { id } = await params;
	console.log("🚀 ~ AddBondPage ~ id:", id);
	// const result = await getPortfolioCategories(id);
	// console.log("🚀 ~ AddBondPage ~ result:", result);

	// EN: Handle the result and prepare categories for the form
	// UI: Obsługa wyniku i przygotowanie kategorii dla formularza
	// const categories = result.success ? result.categories : [];
	return (
		<section className="w-full flex flex-col justify-start  md:px-0 overflow-x-hidden">
			<div className=" mb-4">
				<h2 className="h2-bold flex items-center gap-2">
					<LibrarySquareIcon className="h-5 w-5 text-primary" /> Formularz
					dodawania obligacji
				</h2>
			</div>
			z
			<AddBondForm portfolioId={id} />
		</section>
	);
}

import {
	getPortfolioAssets,
	getPortfolioCategories,
} from "@/lib/actions/portfolio.actions";

import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import { LibrarySquareIcon } from "lucide-react";
import { XtbImporter } from "@/components/ui/XtbImporter";

interface Props {
	params: Promise<{ id: string }>;
	// searchParams: Promise<{ portfolioId?: string }>; // Dodajemy obsługę query params
}

export default async function AddAssetPage({ params }: Props) {
	// Pobieramy ID wyłącznie z trasy - to jest jedyne słuszne źródło
	const { id } = await params;
	// Pobieramy dane równolegle, żeby było szybciej ⚡
	const [categoriesResult, assetsResult] = await Promise.all([
		getPortfolioCategories(id),
		getPortfolioAssets(id), // Pobieramy aktywa: { id, name, ticker, category }
	]);

	const categories = categoriesResult.success
		? categoriesResult.categories
		: [];
	const assets = assetsResult.success ? assetsResult.data : [];
	return (
		<section className="w-full flex flex-col justify-start  md:px-0 overflow-x-hidden">
			<div className=" mb-4">
				<h2 className="text-xl font-bold tracking-tight  flex items-center gap-2">
					<LibrarySquareIcon className="h-4 w-4 text-primary" /> Formularze
					dodawania aktywów
				</h2>
			</div>
			<AddAssetForm
				portfolioId={id}
				allowedCategories={categories}
				existingAssets={assets}
				key={id}
			/>

			<XtbImporter portfolioId={id} />
		</section>
	);
}

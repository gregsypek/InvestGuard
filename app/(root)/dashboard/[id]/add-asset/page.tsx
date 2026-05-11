import {
	getPortfolioAssets,
	getPortfolioCategories,
} from "@/lib/actions/portfolio.actions";

import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import { LibrarySquareIcon } from "lucide-react";
import { QuickDepositForm } from "@/components/ui/QuickDepositForm";
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
		<section className="w-full space-y-8 pb-20">
			<div className="flex flex-col gap-1">
				<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
					<LibrarySquareIcon className="h-5 w-5 text-primary" />
					Zarządzanie Aktywami
				</h2>
				<p className="text-xs text-muted-foreground uppercase font-medium">
					Dodaj środki lub zaimportuj historię transakcji
				</p>
			</div>

			{/* 🚀 Sekcja Szybkiego Zasilenia */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<QuickDepositForm portfolioId={id} />
				{/* Możesz tu dodać drugi mały widżet np. Info o aktualnym saldo CASH */}
			</div>

			<div className="pt-4 border-t border-border/50">
				<h3 className="text-sm font-bold uppercase tracking-widest mb-6 opacity-70">
					Ręczne dodawanie aktywów
				</h3>
				<AddAssetForm portfolioId={id} allowedCategories={categories} />
			</div>

			<div className="pt-4 border-t border-border/50">
				<h3 className="text-sm font-bold uppercase tracking-widest mb-6 opacity-70">
					Import z platformy XTB
				</h3>
				<XtbImporter portfolioId={id} />
			</div>
		</section>
	);
}

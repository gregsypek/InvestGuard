import { Coins, FileText, LibrarySquareIcon } from "lucide-react";
import {
	getPortfolioAssets,
	getPortfolioCategories,
} from "@/lib/actions/portfolio.actions";

import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import { BondImporter } from "@/components/ui/BondImporter";
import { QuickDepositForm } from "@/components/ui/QuickDepositForm";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { XtbImporter } from "@/components/ui/XtbImporter";
import { auth } from "@/auth";

interface Props {
	params: Promise<{ id: string }>;
	// searchParams: Promise<{ portfolioId?: string }>; // Dodajemy obsługę query params
}

export default async function AddAssetPage({ params }: Props) {
	const session = await auth();
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
		<div className="space-y-12 pb-20">
			{/* 1. SEKCJA: RĘCZNE DODAWANIE */}
			<SectionLayout
				title="Ręczne dodawanie aktywów"
				titleIcon={LibrarySquareIcon}
				subtitle="Wybierz odpowiednią zakładkę"
				description="Dodaj środki krok po kroku, wybierając osobny formularz dedykowany dla aktywów, gotówki lub obligacji."
			>
				<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
					<AddAssetForm
						portfolioId={id}
						allowedCategories={categories}
						existingAssets={assets}
						userRole={session?.user?.role || "REGULAR"}
					/>
				</div>
			</SectionLayout>

			{/* 2. SEKCJA: IMPORT XTB */}
			<SectionLayout
				title="Import raportu giełdowego (XTB)"
				titleIcon={FileText} // Możesz tu użyć np. UploadCloud
				subtitle="Automatyczne księgowanie transakcji"
				description="Wygeneruj i pobierz raport CSV ze swojej platformy XTB, a następnie zaimportuj go tutaj. System automatycznie rozpozna i doda Twoje aktywa oraz przeliczy saldo."
			>
				<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
					<XtbImporter portfolioId={id} />
				</div>
			</SectionLayout>

			{/* 3. SEKCJA: IMPORT PKO BP (Obligacje) */}
			<SectionLayout
				title="Import obligacji skarbowych (PKO BP)"
				titleIcon={FileText} // Możesz tu użyć np. UploadCloud
				subtitle="Automatyczne dodawanie bezpiecznych aktywów"
				description="Pobierz zestawienie swoich obligacji z konta PKO BP i wgraj plik tutaj. Portfel automatycznie zarejestruje Twoje serie i zaktualizuje stan kapitału."
			>
				<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
					<BondImporter portfolioId={id} />
				</div>
			</SectionLayout>

			{/* 4. SEKCJA: SZYBKA GOTÓWKA */}
			<SectionLayout
				title="Szybkie Zasilenie Gotówki"
				titleIcon={Coins}
				subtitle="Dodaj wolne środki do portfela"
				description="Gotówka jest automatycznie księgowana jako depozyt. To najszybszy sposób na aktualizację stanu konta i uwzględnienie nowego kapitału w analizach oraz wykresach, bez konieczności przypisywania go do konkretnego aktywa."
			>
				<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
					<QuickDepositForm portfolioId={id} />
				</div>
			</SectionLayout>
		</div>
	);
}

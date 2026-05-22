import {
	Coins,
	FileText,
	Form,
	LibrarySquareIcon,
	PieChart,
} from "lucide-react";
import {
	getPortfolioAssets,
	getPortfolioCategories,
} from "@/lib/actions/portfolio.actions";

import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import { BondImporter } from "@/components/ui/BondImporter";
import { QuickDepositForm } from "@/components/ui/QuickDepositForm";
import { SafeActionButton } from "@/components/ui/SafeActionButton";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SubHeader } from "@/components/shared/SubHeader";
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
		<div className="space-y-10 pb-20">
			<section className="pt-8 border-t border-border">
				<div className="flex justify-between">
					<SectionHeader
						icon={LibrarySquareIcon}
						title="Ręczne dodawanie aktywów"
					/>
				</div>
				<SubHeader
					title="Wybierz odpowiednią zakładkę "
					description="Dodaj środki wybierając osobny formularz do aktywów/gotówki lub obligacji"
					icon={Form}
				/>
				<div className="mx-6 py-2">
					<AddAssetForm
						portfolioId={id}
						allowedCategories={categories}
						existingAssets={assets}
					/>
				</div>
			</section>
			<section className="pt-8 border-t border-border">
				<div className="flex justify-between">
					<SectionHeader
						icon={FileText}
						title="Import aktywów z raportu - XTB"
					/>
				</div>
				<SubHeader
					title="Automatyczne dodawanie aktywów z raportu XTB"
					description="Wygeneruj raport na platformie XTB i zaimportuj go tutaj, aby szybko dodać swoje aktywa i przeliczyć aktualne saldo"
					icon={Form}
				/>
				<div className="mx-6 py-2">
					<XtbImporter portfolioId={id} />
				</div>
			</section>
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
					<SectionHeader icon={FileText} title="Szybkie Zasilenia Gotówki" />
				</div>
				<SubHeader
					title="Dodaj środki do portfela"
					description="Gotówka jest automatycznie księgowania jako depozyt, więc będzie uwzględniana w analizach i wykresach. To szybki sposób na aktualizację stanu portfela bez konieczności dodawania poszczególnych aktywów."
					icon={Coins}
				/>
				<div className="mx-6 py-2">
					<QuickDepositForm portfolioId={id} />{" "}
				</div>
			</section>
		</div>
	);
}

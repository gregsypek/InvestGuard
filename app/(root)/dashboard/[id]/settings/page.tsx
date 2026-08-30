import {
	AlertTriangle,
	ArrowLeft,
	Banknote,
	Coins,
	FileText,
	LibrarySquareIcon,
	UploadCloud,
	Wrench,
} from "lucide-react";

import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import { BondImporter } from "@/components/ui/BondImporter"; // Upewnij się, że ścieżka jest poprawna
import { BulkMigrationTool } from "@/components/alpha/MigrationTool";
import { Category } from "@prisma/client";
import { HardEraseTool } from "@/components/shared/HardEraseTool";
import Link from "next/link";
import { QuickDepositForm } from "@/components/ui/QuickDepositForm";
import { RevertLastTrancheTool } from "@/components/shared/RevertLastTrancheTool";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { XtbImporter } from "@/components/ui/XtbImporter"; // Upewnij się, że ścieżka jest poprawna
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function PortfolioSettingsPage(props: {
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;
	const portfolioId = params.id;
	const session = await auth();

	if (!session?.user?.id) redirect("/sign-in");

	const portfolio = await db.portfolio.findFirst({
		where: {
			id: portfolioId,
			userId: session.user.id,
		},
		select: {
			id: true,
			name: true,
			assets: {
				select: {
					id: true,
					name: true,
					category: true,
					ticker: true,
					createdAt: true,
				},
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!portfolio) redirect("/");

	const allCategories = Object.values(Category);

	// EN: Filter out bonds from the migration tool
	const assetsForMigration = portfolio.assets.filter(
		(a) => a.category !== "BONDS",
	);

	return (
		<div className="max-w-7xl mx-auto w-full space-y-10 animate-in fade-in duration-500 pb-24">
			{/* === HEADER SECTION === */}
			<div className="flex gap-4 border-b border-t-border pb-6 bg-t-bg-sticky rounded-2xl p-4 ">
				<Link
					href={`/dashboard/${portfolioId}`}
					className="mt-1 p-2 aspect-square flex items-center bg-slate-700 border border-slate-700/50 rounded-xl text-slate-400 hover:text-white transition-all duration-300"
					title="Powrót do portfela"
				>
					<ArrowLeft className="w-6 h-6" />
				</Link>

				<div className="flex flex-1 align-middle flex-wrap justify-between">
					<h1 className="text-2xl md:text-3xl font-black flex items-center gap-3 tracking-tight">
						<Wrench className="w-7 h-7 text-blue-500" />
						Narzędzia i Ustawienia
					</h1>
					<p className="text-xs md:text-sm text-slate-400 mt-2 font-medium">
						Panel administracyjny portfela:{" "}
						<strong className="text-blue-500 font-bold">
							{portfolio.name}
						</strong>
					</p>
				</div>
			</div>

			{/* === TOOLS SECTION (Using CSS Grid for 2 columns on xl screens) === */}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
				{/* KOLUMNA LEWA: AUTOMATYZACJA I ZASILANIE (Najczęściej używane) */}
				<div className="space-y-8 min-w-0 w-full">
					<SectionLayout
						title="Import raportu (XTB)"
						titleIcon={UploadCloud}
						subtitle="Automatyczne księgowanie transakcji"
						description="Wygeneruj raport CSV z XTB i zaimportuj go tutaj. System automatycznie rozpozna aktywa, dywidendy oraz przeliczy saldo gotówkowe."
					>
						<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
							<XtbImporter portfolioId={portfolioId} />
						</div>
					</SectionLayout>

					<SectionLayout
						title="Import obligacji (PKO BP)"
						titleIcon={FileText}
						subtitle="Automatyczne dodawanie bezpiecznych aktywów"
						description="Pobierz zestawienie swoich obligacji z konta PKO BP i wgraj plik. Portfel automatycznie zarejestruje serie i wyliczy w tle odpowiednią gotówkę."
					>
						<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
							<BondImporter portfolioId={portfolioId} />
						</div>
					</SectionLayout>

					<SectionLayout
						title="Szybkie Zasilenie Gotówki"
						titleIcon={Coins}
						subtitle="Zastrzyk kapitału"
						description="Najszybszy sposób na aktualizację stanu konta i uwzględnienie nowego kapitału w analizach, bez ręcznego przypisywania do aktywów."
					>
						<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
							<QuickDepositForm portfolioId={portfolioId} />
						</div>
					</SectionLayout>
				</div>

				{/* KOLUMNA PRAWA: RĘCZNE OPERACJE I ADMINISTRACJA (Rzadziej używane) */}
				<div className="space-y-8 min-w-0 w-full">
					<SectionLayout
						title="Ręczne dodawanie aktywów"
						titleIcon={LibrarySquareIcon}
						subtitle="Wybierz odpowiednią zakładkę"
						description="Dodaj środki krok po kroku, wybierając osobny formularz dedykowany dla akcji, kryptowalut, gotówki lub obligacji."
					>
						<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
							<AddAssetForm
								portfolioId={portfolioId}
								allowedCategories={allCategories}
								existingAssets={portfolio.assets}
								userRole={session?.user?.role || "REGULAR"}
							/>
						</div>
					</SectionLayout>

					<SectionLayout
						title="Narzędzia Administracyjne"
						titleIcon={Wrench}
						subtitle="Konwersja danych"
						description="Narzędzie pozwala na masową korektę błędnie przypisanych kategorii, aktualizując jednocześnie całą historię transakcji (z pominięciem obligacji)."
					>
						<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
							<BulkMigrationTool
								assets={assetsForMigration as any}
								categories={allCategories}
								portfolioId={portfolioId}
							/>
						</div>
					</SectionLayout>
				</div>
			</div>
			{/* STREFA ZAGROŻENIA - Zawsze na samym dole! */}
			<SectionLayout
				title="Strefa Zagrożenia"
				titleIcon={AlertTriangle}
				subtitle="Całkowite wymazanie aktywa"
				description="Operacje w tej sekcji bezpowrotnie usuną aktywo z bazy danych wraz z całą jego historią. Wykresy zostaną natychmiast przeliczone na nowo."
			>
				<div className="w-full bg-red-500/5 border border-red-500/20 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
					<HardEraseTool assets={portfolio.assets} />

					<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 shadow-sm">
						<p className="text-[11px] text-red-400/80 leading-relaxed font-medium">
							<strong className="text-red-500 uppercase tracking-wider text-[10px] block mb-1">
								Ważna informacja
							</strong>
							System zarządzania automatycznie obsługuje re-kalkulację
							wszystkich zysków i strat (P&L). Po wymazaniu aktywa, odświeżenie
							wykresów może zająć do kilku sekund.
						</p>
					</div>
				</div>
			</SectionLayout>
			<SectionLayout
				title="Strefa Zagrożenia"
				titleIcon={AlertTriangle}
				subtitle="Całkowite wymazanie pojedynczej transzy"
				description="Operacje w tej sekcji bezpowrotnie usuną transzę z historii. Operacja nie wpływa na inne transakcje. Wykresy jak i obliczenia dla  pozostałych aktywówzostaną natychmiast przeliczone na nowo."
			>
				<div className="w-full bg-red-500/5 border border-red-500/20 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
					<RevertLastTrancheTool assets={portfolio.assets} />

					<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 shadow-sm">
						<p className="text-[11px] text-red-400/80 leading-relaxed font-medium">
							<strong className="text-red-500 uppercase tracking-wider text-[10px] block mb-1">
								Ważna informacja
							</strong>
							System zarządzania automatycznie obsługuje re-kalkulację
							wszystkich zysków i strat (P&L). Po wymazaniu aktywa, odświeżenie
							wykresów może zająć do kilku sekund.
						</p>
					</div>
				</div>
			</SectionLayout>
		</div>
	);
}

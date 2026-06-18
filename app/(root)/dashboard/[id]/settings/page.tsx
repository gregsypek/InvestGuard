import { AlertTriangle, ArrowLeft, Banknote, Wrench } from "lucide-react";

import { BulkMigrationTool } from "@/components/alpha/MigrationTool";
import { Category } from "@prisma/client";
import { HardEraseTool } from "@/components/shared/HardEraseTool";
import Link from "next/link";
import { QuickDepositForm } from "@/components/ui/QuickDepositForm";
import { SectionLayout } from "@/components/shared/SectionLayout";
// EN: Make sure the path to SectionLayout matches your project structure
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
			{/* EN: Integrated Back button right next to the title for a cleaner look */}
			<div className="flex items-start gap-4 border-b border-t-border pb-6 bg-t-bg-sticky rounded-2xl p-4">
				<Link
					href={`/dashboard/${portfolioId}`}
					className="mt-1 p-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 rounded-xl text-slate-400 hover:text-white transition-all duration-300"
					title="Powrót do portfela"
				>
					<ArrowLeft className="w-6 h-6" />
				</Link>

				<div>
					<h1 className="text-2xl md:text-3xl font-black flex items-center gap-3 tracking-tight">
						<Wrench className="w-7 h-7 text-blue-500" />
						Zarządzanie Portfelem
					</h1>
					<p className="text-xs md:text-sm text-slate-400 mt-2 font-medium">
						Panel administracyjny portfela:{" "}
						<strong className="text-blue-500 font-bold">
							{portfolio.name}
						</strong>
					</p>
				</div>
			</div>

			{/* === TOOLS SECTION (Using SectionLayout) === */}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
				{/* EN: Left Column */}
				<div className="space-y-8 min-w-0 w-full">
					<SectionLayout
						title="Zasilenie Gotówkowe"
						titleIcon={Banknote}
						subtitle="Zastrzyk kapitału"
						description="Dodaj wolne środki do portfela, aby zaktualizować saldo gotówkowe przeznaczone na przyszłe inwestycje."
					>
						<QuickDepositForm portfolioId={portfolioId} />
					</SectionLayout>

					<SectionLayout
						title="Narzędzia Administracyjne"
						titleIcon={Wrench}
						subtitle="Konserwacja danych"
						description="Narzędzie pozwala na masową korektę błędnie przypisanych kategorii, aktualizując jednocześnie całą historię transakcji."
					>
						<BulkMigrationTool
							assets={assetsForMigration as any}
							categories={allCategories}
							portfolioId={portfolioId}
						/>
					</SectionLayout>
				</div>

				{/* EN: Right Column (Danger Zone) */}
				<div className="space-y-8 min-w-0 w-full">
					<SectionLayout
						title="Strefa Zagrożenia"
						titleIcon={AlertTriangle}
						subtitle="Całkowite wymazanie"
						description="Operacje w tej sekcji bezpowrotnie usuną aktywo z bazy danych wraz z całą jego historią. Wykresy zostaną natychmiast przeliczone na nowo."
					>
						<div className="space-y-6">
							<HardEraseTool assets={portfolio.assets} />

							{/* EN: Extra system info neatly placed inside the SectionLayout */}
							<div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 shadow-sm">
								<p className="text-[11px] text-slate-400 leading-relaxed font-medium">
									<strong className="text-blue-400 uppercase tracking-wider text-[10px] block mb-1">
										Ważna informacja
									</strong>
									System zarządzania automatycznie obsługuje re-kalkulację
									wszystkich P&L (zysków i strat) oraz wykresów historycznych po
									wymazaniu aktywa. Odświeżenie danych może zająć do kilku
									sekund.
								</p>
							</div>
						</div>
					</SectionLayout>
				</div>
			</div>
		</div>
	);
}

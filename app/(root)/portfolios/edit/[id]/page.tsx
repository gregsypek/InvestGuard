import { ChevronLeft, Settings2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import Link from "next/link";
import PortfolioForm from "@/components/PortfolioForm";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getGlobalStats } from "@/lib/calculations";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function EditPortfolioPage({ params }: Props) {
	// 1. Zabezpieczenie sesji
	const session = await auth();
	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	const { id } = await params;

	// 2. ZABEZPIECZENIE: Pobieramy portfel TYLKO jeśli należy do tego usera
	const portfolio = await db.portfolio.findUnique({
		where: {
			id: id,
			userId: session.user.id,
		},
	});

	// Jeśli ktoś wpisał losowe ID lub ID cudzego portfela -> 404
	if (!portfolio) {
		notFound();
	}

	// 3. ZABEZPIECZENIE: Pobieramy do statystyk TYLKO portfele tego usera
	const allPortfolios = await db.portfolio.findMany({
		where: {
			userId: session.user.id,
		},
		include: { assets: true, transactionHistories: true },
	});

	// 4. Kalkulacja bezpiecznych danych
	const { totalValue, portfoliosCount, assetsCount } =
		getGlobalStats(allPortfolios);

	return (
		// 🚀 ZMIANA: Animacja wejścia i odstępy zgodne z nowym standardem
		<div className="space-y-8 animate-in fade-in duration-500 pb-20">
			<PortfoliosHeader
				title="Edytuj portfel"
				totalValue={totalValue}
				portfoliosCount={portfoliosCount}
				assetsCount={assetsCount}
				customBreadcrumbs={
					// 🚀 ZMIANA: Responsywne okruszki (Breadcrumbs)
					<nav className="flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-slate-400 italic">
						<Link
							href="/portfolios"
							className="inline-flex items-center transition-opacity text-theme-primary hover:opacity-80 cursor-pointer font-medium mr-1"
						>
							<ChevronLeft className="h-4 w-4" />
							<span>Portfele</span>
						</Link>
						<span className="text-slate-500">/</span>
						<span className="text-slate-300 lowercase">edycja</span>
						<span className="text-slate-500">/</span>
						<span className="text-slate-200 font-medium lowercase">
							{portfolio.name}
						</span>
					</nav>
				}
			/>

			<SectionLayout
				title={portfolio ? `Edycja: ${portfolio.name}` : "Nowy Portfel"}
				titleIcon={Settings2}
				subtitle="Konfiguracja parametrów"
				description={
					portfolio
						? "Zaktualizuj główne założenia, cel finansowy oraz docelową alokację procentową dla tego portfela."
						: "Zdefiniuj podstawowe parametry, cel finansowy i idealną alokację kapitału dla swojej nowej strategii."
				}
			>
				<PortfolioForm initialData={portfolio} portfolioId={id} />
			</SectionLayout>
		</div>
	);
}

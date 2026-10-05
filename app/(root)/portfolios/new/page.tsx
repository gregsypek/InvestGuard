import { ChevronLeft, FolderPlus } from "lucide-react";

import Link from "next/link";
import PortfolioForm from "@/components/PortfolioForm";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getGlobalStats } from "@/lib/calculations";
import { redirect } from "next/navigation";

export default async function NewPortfolioPage() {
	// 1. Zabezpieczenie strony i pobranie ID użytkownika
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/sign-in");
	}

	// 2. Pobranie TYLKO portfeli przypisanych do tego użytkownika
	const allPortfolios = await db.portfolio.findMany({
		where: {
			userId: session.user.id,
		},
		include: { assets: true, transactionHistories: true },
	});

	// Funkcja getGlobalStats dostaje teraz bezpieczne dane!
	const { totalValue, portfoliosCount, assetsCount } =
		getGlobalStats(allPortfolios);

	return (
		<div className="space-y-8 animate-in fade-in duration-500 pb-20">
			<PortfoliosHeader
				title="Stwórz nowy portfel"
				totalValue={totalValue}
				portfoliosCount={portfoliosCount}
				assetsCount={assetsCount}
				customBreadcrumbs={
					<nav className="flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-slate-400 italic">
						<Link
							href="/portfolios"
							className="inline-flex items-center transition-opacity text-theme-primary hover:opacity-80 cursor-pointer font-medium mr-1"
						>
							<ChevronLeft className="h-4 w-4" />
							<span>Portfele</span>
						</Link>
						<span className="text-slate-500">/</span>
						<span className="text-slate-200 font-medium lowercase">Nowy</span>
					</nav>
				}
			/>
			<SectionLayout
				title="Nowy Portfel"
				titleIcon={FolderPlus}
				subtitle="Kreator strategii"
				description="Zdefiniuj podstawowe parametry, cel finansowy i idealną alokację kapitału dla swojej nowej strategii inwestycyjnej."
			>
				<PortfolioForm />
			</SectionLayout>
		</div>
	);
}

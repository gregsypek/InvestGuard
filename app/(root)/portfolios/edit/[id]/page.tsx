import { ChevronLeft, Settings2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import Link from "next/link";
import PortfolioForm from "@/components/PortfolioForm";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
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
		<div>
			<PortfoliosHeader
				title="Edytuj portfel"
				totalValue={totalValue}
				portfoliosCount={portfoliosCount}
				assetsCount={assetsCount}
				customBreadcrumbs={
					<nav className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
						<Link
							href="/portfolios"
							className={cn(
								"inline-flex items-center transition-all h-5 text-amber-600 underline decoration-amber-600/40 underline-offset-4 cursor-pointer font-medium",
							)}
						>
							<ChevronLeft
								className="w-4 h-4 mr-0.5 no-underline"
								strokeWidth={2.5}
							/>
							<span>Portfele</span>
						</Link>
						<span className="text-muted-foreground/40">/</span>
						<span className="lowercase">edycja</span>
						<span className="text-muted-foreground/40">/</span>
						<span className="text-primary font-medium lowercase">
							{portfolio.name}
						</span>
					</nav>
				}
			/>
			{/* 
			<section className="w-full flex flex-col justify-start md:px-0 overflow-x-hidden">
				<PortfolioForm initialData={portfolio} portfolioId={id} />
			</section> */}
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

import { Globe, Plus } from "lucide-react";

import AddButton from "@/components/ui/AddButton";
import { CategoryTable } from "@/components/CategoryTable";
import Link from "next/link";
import PortfolioCard from "@/components/PortfolioCard";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
// app/(root)/portfolios/page.tsx
import { db } from "@/lib/db";
import { getGlobalStats } from "@/lib/calculations";
import { redirect } from "next/navigation";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function PortfoliosPage({ searchParams }: Props) {
	// EN: Fetch all portfolios with their assets for global aggregation
	const session = await auth();

	// Redirect to sign-in if the user is not authenticated
	if (!session?.user?.id) {
		redirect("/sign-in");
	}
	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true },
		orderBy: { createdAt: "desc" },
	});

	// EN: Resolve portfolioId from URL or fallback to cookies for "Add Asset" context
	const { portfolioId: urlPortfolioId } = await searchParams;
	const cookieStore = await cookies();
	const cookiePortfolioId = cookieStore.get("selectedPortfolioId")?.value;
	const portfolioId = urlPortfolioId || cookiePortfolioId;

	// EN: SCENARIO: No portfolios exist in the database
	if (portfolios.length === 0) {
		return <PortfolioEmptyState variant="PORTFOLIOS" />;
	}

	const { totalValue, portfoliosCount, assetsCount, categoryTotals } =
		getGlobalStats(portfolios);

	return (
		<div className="space-y-10 pb-20">
			<PortfoliosHeader
				title="Moje Portfele"
				totalValue={totalValue}
				portfoliosCount={portfoliosCount}
				assetsCount={assetsCount}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground mb-2">
						Portfele /{" "}
						<span className="text-primary font-medium ">Wszystkie</span>
					</nav>
				}
			/>

			{/* EN: Portfolios Section with Sticky "Dock" for AddButton on Desktop */}
			<div className="flex flex-col lg:flex-row gap-6 items-start relative ">
				{/* EN: Main container for portfolio cards with horizontal scroll on mobile */}
				{/* UI: Główny kontener na karty portfeli */}
				<div className="flex-1 w-full min-w-0">
					<div
						className={cn(
							"flex overflow-x-auto pb-6 justify-start gap-2",
							"snap-x snap-mandatory no-scrollbar",
							"-mx-4 px-4 md:mx-0 md:px-0", // EN: Negative margin offset by padding / UI: Przesunięcie marginesem i wyrównanie paddingiem
						)}
					>
						{portfolios.map((p) => (
							<div
								key={p.id}
								className="min-w-70 md:min-w-[320px] flex snap-start shrink-0"
							>
								<PortfolioCard portfolio={p} />
							</div>
						))}
					</div>
				</div>

				{/* EN: The "Dock" - Sticky action button that stays visible during scroll */}
				{/* UI: "Dock" - Przyklejony przycisk dodawania, widoczny przy skrolowaniu */}
				<div className="w-full lg:w-auto xl:sticky justify-end flex self-end  ">
					<AddButton className="h-10 px-4 py-0">
						<Link href="/portfolios/new" className="gap-2 flex items-center">
							<Plus className="h-4 w-4" /> Dodaj Nowy Portfel
						</Link>
					</AddButton>
				</div>
			</div>

			{/* EN: Global Asset Allocation Table (Aggregated View) */}
			<div className="pt-8 border-t border-border">
				<div className="flex justify-between ">
					<SectionHeader icon={Globe} title="Alokacja Globalna" />

					{/* EN: Only show add asset button if we have a portfolio context */}
					{portfolioId && (
						<AddButton className="h-10 px-4 py-0">
							<Link
								href={`/dashboard/${portfolioId}/add-asset`}
								className="gap-2 flex items-center"
							>
								<Plus className="h-4 w-4" /> Dodaj Aktywo
							</Link>
						</AddButton>
					)}
				</div>

				<CategoryTable data={categoryTotals} totalValue={totalValue} />
			</div>
		</div>
	);
}

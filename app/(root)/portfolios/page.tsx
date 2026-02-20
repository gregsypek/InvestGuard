// app/(root)/portfolios/page.tsx
import { db } from "@/lib/db";
import { Plus, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PortfolioCard from "@/components/PortfolioCard";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { getGlobalStats } from "@/lib/calculations";
import { CategoryTable } from "@/components/CategoryTable";
import AddButton from "@/components/ui/AddButton";
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function PortfoliosPage({ searchParams }: Props) {
	// EN: Fetch all portfolios with their assets for global aggregation
	const portfolios = await db.portfolio.findMany({
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
		return (
			<div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 max-w-md mx-auto px-6">
				<div className="p-4 bg-blue-500/10 rounded-full">
					<LayoutGrid className="h-12 w-12 text-blue-500" />
				</div>
				<div className="space-y-2">
					<h2 className="text-3xl font-bold tracking-tight">
						Twoja lista jest pusta
					</h2>
					<p className="text-muted-foreground">
						Nie stworzyłeś jeszcze żadnego portfela inwestycyjnego. Dodaj go
						teraz, aby zacząć grupować swoje aktywa.
					</p>
				</div>
				<Button
					variant="outline"
					asChild
					className="gap-2 shadow-lg cursor-pointer hover:bg-primary/40"
				>
					<Link href="/portfolios/new">
						<Plus className="h-5 w-5" />
						Stwórz pierwszy portfel
					</Link>
				</Button>
			</div>
		);
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
			<div className="pt-10 border-t border-border2">
				<div className="flex justify-between items-end mb-6">
					<div>
						<h2 className="text-2xl font-bold italic">Alokacja Globalna</h2>
						<p className="text-muted-foreground text-sm">
							Rozkład aktywów ze wszystkich Twoich portfeli (łącznie)
						</p>
					</div>

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

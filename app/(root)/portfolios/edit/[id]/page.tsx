import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import PortfolioForm from "@/components/PortfolioForm";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { db } from "@/lib/db";
import { getGlobalStats } from "@/lib/calculations";
import { notFound } from "next/navigation";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function EditPortfolioPage({ params }: Props) {
	const { id } = await params;

	// 1. Fetch the specific portfolio for the form
	const portfolio = await db.portfolio.findUnique({
		where: { id },
	});

	// 2. Fetch all portfolios to display global stats in the header
	const allPortfolios = await db.portfolio.findMany({
		include: { assets: true, transactionHistories: true },
	});

	// 3. Handle 404 if portfolio doesn't exist
	if (!portfolio) {
		notFound();
	}

	// 4. Calculate global context stats
	const { totalValue, portfoliosCount, assetsCount } =
		getGlobalStats(allPortfolios);

	return (
		<div className="space-y-8">
			{/* Reusable header with global stats and custom back navigation */}
			<PortfoliosHeader
				title="Edytuj portfel"
				totalValue={totalValue}
				portfoliosCount={portfoliosCount}
				assetsCount={assetsCount}
				customBreadcrumbs={
					<div className="flex items-center gap-2 mb-2">
						<Link
							href="/portfolios"
							className="text-muted-foreground hover:text-primary transition-colors"
						>
							<ChevronLeft className="h-4 w-4" />
						</Link>
						<nav className="text-sm text-muted-foreground">
							Portfele / Edycja /
							<span className="text-primary">{portfolio.name}</span>
						</nav>
					</div>
				}
			/>

			<section className="w-full flex flex-col justify-start  md:px-0 overflow-x-hidden">
				<PortfolioForm initialData={portfolio} portfolioId={id} />
			</section>
		</div>
	);
}

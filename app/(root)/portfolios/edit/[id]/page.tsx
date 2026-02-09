// app/(root)/portfolios/edit/[id]/page.tsx
import PortfolioForm from "@/components/PortfolioForm";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getGlobalStats } from "@/lib/calculations";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
		include: { assets: true },
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
				title="Edit Portfolio"
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
							Portfolios / Edit / {portfolio.name}
						</nav>
					</div>
				}
			/>

			<div>
				{/* The actual editing form */}
				<PortfolioForm initialData={portfolio} portfolioId={id} />
			</div>
		</div>
	);
}

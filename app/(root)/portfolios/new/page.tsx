import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import PortfolioForm from "@/components/PortfolioForm";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { getGlobalStats } from "@/lib/calculations";

export default async function NewPortfolioPage() {
	const allPortfolios = await db.portfolio.findMany({
		include: { assets: true, transactionHistories: true },
	});

	const { totalValue, portfoliosCount, assetsCount } =
		getGlobalStats(allPortfolios);

	return (
		<div className="space-y-8">
			<PortfoliosHeader
				title="Stwórz nowy portfel"
				totalValue={totalValue}
				portfoliosCount={portfoliosCount}
				assetsCount={assetsCount}
				customBreadcrumbs={
					<nav className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
						<Link
							href="/portfolios"
							className={cn(
								"inline-flex items-center transition-all h-5 italic text-amber-600 underline decoration-amber-600/40 underline-offset-4 cursor-pointer font-medium",
							)}
						>
							<ChevronLeft
								className="w-4 h-4 mr-0.5 no-underline"
								strokeWidth={2.5}
							/>
							<span>Portfele</span>
						</Link>
						<span className="text-muted-foreground">/</span>
						<span className="text-primary font-medium lowercase italic">
							Nowy
						</span>
					</nav>
				}
			/>

			<div>
				<PortfolioForm />
			</div>
		</div>
	);
}

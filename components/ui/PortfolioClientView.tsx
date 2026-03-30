"use client";

import { Globe, Plus } from "lucide-react";

import { CategoryTable } from "@/components/CategoryTable";
import PortfolioCard from "@/components/PortfolioCard";
import { PortfolioWithAssets } from "@/lib/types";
import { SafeActionButton } from "./SafeActionButton";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { cn } from "@/lib/utils";

interface Props {
	portfolios: PortfolioWithAssets[];
	isDemo?: boolean;
	portfolioId?: string;
	categoryTotals: Record<string, number>;
}

export default function PortfoliosClientView({
	portfolios,
	portfolioId,
	categoryTotals,
	isDemo = false,
}: Props) {
	// Logic for global allocation stays here to be shared
	const totalValue = portfolios.reduce(
		(sum, p) => sum + p.assets.reduce((aSum, a) => aSum + a.currentValue, 0),
		0,
	);

	return (
		<>
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
								className="min-w-72 md:min-w-[320px] flex snap-start shrink-0"
							>
								<PortfolioCard portfolio={p} isDemo={isDemo} />
							</div>
						))}
					</div>
				</div>

				{/* EN: The "Dock" - Sticky action button that stays visible during scroll */}
				{/* UI: "Dock" - Przyklejony przycisk dodawania, widoczny przy skrolowaniu */}
				<div className="w-full lg:w-auto xl:sticky justify-end flex self-end  ">
					<SafeActionButton
						label="Dodaj Nowy Portfel"
						icon={Plus}
						isDemo={isDemo}
						variant="outline"
						href="/portfolios/new"
					/>
				</div>
			</div>

			{/* EN: Global Asset Allocation Table (Aggregated View) */}
			<div className="pt-8 border-t border-border">
				<div className="flex justify-between ">
					<SectionHeader icon={Globe} title="Alokacja Globalna" />

					{/* EN: Only show add asset button if we have a portfolio context */}
					{portfolioId && (
						<SafeActionButton
							label="Dodaj Aktywo"
							icon={Plus}
							isDemo={isDemo}
							variant="outline"
							href={`/dashboard/${portfolioId}/add-asset`}
						/>
					)}
				</div>

				<CategoryTable data={categoryTotals} totalValue={totalValue} />
			</div>
		</>
	);
}

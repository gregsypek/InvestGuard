import { Briefcase, LayoutGrid } from "lucide-react";

import { ValueCard } from "./shared/ValueCard";

interface PortfoliosHeaderProps {
	title: string;
	totalValue: number;
	portfoliosCount: number;
	assetsCount: number;
	customBreadcrumbs?: React.ReactNode;
}

export const PortfoliosHeader = ({
	title,
	totalValue,
	portfoliosCount,
	assetsCount,
	customBreadcrumbs,
}: PortfoliosHeaderProps) => {
	return (
		<header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 ">
			<div>
				{/* Render navigation if passed from the page */}
				{customBreadcrumbs}
				<h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
					{title}
				</h1>
				<p className="text-muted-foreground font-medium mt-1">
					Zarządzaj wszystkimi portfelami i dokonuj zmian w swoich inwestycjach.
				</p>
			</div>

			{/* Stats container with horizontal scroll on mobile */}
			<div className="flex self-start justify-end flex-wrap gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar ">
				{/* Total global value across all portfolios */}

				<ValueCard
					label="Wartość portfeli"
					value={totalValue}
					suffix="PLN"
					formatString
					// className="border-amber-500/20 text-amber-600"
				/>

				{/* Number of existing portfolios */}

				<ValueCard
					label="Liczba portfeli"
					icon={Briefcase}
					value={portfoliosCount}
					suffix="SZT."
					// className="border-amber-500/20 text-amber-600"
				/>

				{/* Total number of assets combined */}
				<ValueCard
					label="Liczba aktywów"
					value={assetsCount}
					suffix="SZT."
					className="border-green-500/20 text-green-600"
					icon={LayoutGrid}
				/>
			</div>
		</header>
	);
};

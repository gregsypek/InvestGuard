// components/PortfoliosHeader.tsx
import { Wallet2, Briefcase, LayoutGrid } from "lucide-react";

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
		<header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
			<div>
				{/* Render navigation if passed from the page */}
				{customBreadcrumbs}
				<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
			</div>

			{/* Stats container with horizontal scroll on mobile */}
			<div className="flex items-center justify-end flex-wrap gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
				{/* Total global value across all portfolios */}
				<div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20 shrink-0">
					<Wallet2 className="h-4 w-4" />
					<span className="font-bold whitespace-nowrap">
						{totalValue.toLocaleString()} PLN
					</span>
				</div>

				{/* Number of existing portfolios */}
				<div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full border border-border shrink-0">
					<Briefcase className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm font-medium whitespace-nowrap">
						{portfoliosCount} Portfolios
					</span>
				</div>

				{/* Total number of assets combined */}
				<div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full border border-border shrink-0">
					<LayoutGrid className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm font-medium whitespace-nowrap">
						{assetsCount} Assets
					</span>
				</div>
			</div>
		</header>
	);
};

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
		<header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
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
			<div className="flex items-center justify-end flex-wrap gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
				{/* Total global value across all portfolios */}
				<div className="flex items-center gap-2  text-primary px-4 py-2 rounded-full border border-primary/20 shrink-0">
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

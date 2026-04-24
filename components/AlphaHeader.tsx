import { FileText, History } from "lucide-react";

import { ValueCard } from "./shared/ValueCard";

interface AlphaHeaderProps {
	totalTransactions: number;
	currentPage: number;
	totalPages: number;
	customBreadcrumbs?: React.ReactNode;
}

export function AlphaHeader({
	totalTransactions,
	currentPage,
	totalPages,
	customBreadcrumbs,
}: AlphaHeaderProps) {
	return (
		<div className="mb-8">
			<div className="flex  md:flex-1 flex-col md:flex-row justify-between items-start md:items-start gap-6 ">
				<div>
					{customBreadcrumbs}
					<h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 mt-2 lowercase">
						Selekcja Alpha
					</h1>
					<p className="text-muted-foreground font-medium mt-1">
						Aktywne zarządzanie i selekcja aktywów o podniesionym ryzyku które
						kategoryzujemy jako BOOSTER.
					</p>
				</div>

				{/* EN: Quick stats matching the planner/portfolio style */}
				<div className="flex flex-wrap gap-4 p-4 justify-end">
					<ValueCard
						label="Liczba operacji"
						icon={History}
						value={totalTransactions}
					/>
					<ValueCard
						className="text-portfolio-emerging"
						label="Strona"
						icon={FileText}
						value={currentPage}
						suffix={`z ${totalPages}`}
					/>
				</div>
			</div>
		</div>
	);
}

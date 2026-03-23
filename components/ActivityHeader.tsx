// components/history/ActivityHeader.tsx
import { FileText, History } from "lucide-react";

import { ValueCard } from "./shared/ValueCard";

interface ActivityHeaderProps {
	totalTransactions: number;
	currentPage: number;
	totalPages: number;
	customBreadcrumbs?: React.ReactNode;
}

export function ActivityHeader({
	totalTransactions,
	currentPage,
	totalPages,
	customBreadcrumbs,
}: ActivityHeaderProps) {
	return (
		<div className="mb-8">
			{customBreadcrumbs}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
				<div>
					<h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
						Historia Operacji
					</h1>
					<p className="text-muted-foreground font-medium mt-1">
						Zapis wszystkich zatwierdzonych transakcji z karty planowanie
					</p>
				</div>

				{/* EN: Quick stats matching the planner/portfolio style */}
				<div className="flex flex-wrap gap-4 md:gap-8 p-4 rounded-2xl">
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

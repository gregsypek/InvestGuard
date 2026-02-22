// components/history/ActivityHeader.tsx
import { History, FileText } from "lucide-react";

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
					<div className="flex items-center gap-2  text-primary px-4 py-2 rounded-full border border-primary/20 shrink-0">
						<span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
							<History className="h-3 w-3 text-blue-500" />
							Liczba Operacji
						</span>
						<span className="text-xl font-mono font-bold">
							{totalTransactions}{" "}
						</span>
					</div>
					<div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full border border-border shrink-0">
						<span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
							<FileText className="h-3 w-3 text-portfolio-emerging" />
							Strona
						</span>
						<span className="text-xl font-mono font-bold">
							{currentPage}{" "}
							<span className="text-xs text-muted-foreground">
								z {totalPages}
							</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

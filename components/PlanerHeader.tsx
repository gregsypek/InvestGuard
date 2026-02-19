// components/planner/PlannerHeader.tsx
import { CalendarClock, TrendingUp } from "lucide-react";

interface PlannerHeaderProps {
	totalPlannedValue: number;
	plannedCount: number;
	customBreadcrumbs?: React.ReactNode;
}

export function PlannerHeader({
	totalPlannedValue,
	plannedCount,
	customBreadcrumbs,
}: PlannerHeaderProps) {
	return (
		<div className="mb-8">
			{customBreadcrumbs}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
				<div>
					<h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
						Planer Inwestycyjny
					</h1>
					<p className="text-muted-foreground font-medium mt-1">
						Zarządzaj przyszłymi zakupami i kontroluj przepływ gotówki.
					</p>
				</div>

				{/* EN: Quick stats matching the portfolio style */}
				{/* UI: Szybkie statystyki pasujące do stylu portfeli */}
				<div className="flex flex-wrap gap-4 p-4 justify-end">
					<div className="flex items-center gap-2  text-primary px-4 py-2 rounded-full border border-primary/20 shrink-0">
						<TrendingUp className="h-4 w-4" />
						<span className="font-bold whitespace-nowrap">
							{totalPlannedValue.toLocaleString()} PLN
						</span>
					</div>

					<div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full border border-border shrink-0">
						<CalendarClock className="h-4 w-4 text-portfolio-emerging" />
						<span className="text-sm font-mono font-bold text-muted-foreground">
							{plannedCount} <span className="text-xs">pozycje</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

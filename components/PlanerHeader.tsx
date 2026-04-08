// components/planner/PlannerHeader.tsx
import { CalendarClock, TrendingUp } from "lucide-react";

import { ValueCard } from "./shared/ValueCard";

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
		<div>
			<header className="flex flex-col md:flex-row justify-between items-start md:items-end ">
				<div>
					{customBreadcrumbs}
					<h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 lowercase mt-2">
						Planer Inwestycyjny
					</h1>
					<p className="text-muted-foreground font-medium mt-1">
						Zarządzaj przyszłymi zakupami i kontroluj przepływ gotówki.
					</p>
				</div>

				{/* EN: Quick stats matching the portfolio style */}
				{/* UI: Szybkie statystyki pasujące do stylu portfeli */}
				<div className="flex flex-wrap gap-4 p-4 justify-end">
					<ValueCard
						value={totalPlannedValue}
						suffix="PLN"
						formatString
						icon={TrendingUp}
						label="Całkowita wartość"
					/>

					<ValueCard
						className="text-portfolio-emerging"
						value={plannedCount}
						suffix="pozycje"
						icon={CalendarClock}
						label="Zaplanowane aktywa"
					/>
				</div>
			</header>
		</div>
	);
}

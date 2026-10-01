import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
	title: string;
	icon?: LucideIcon;
	className?: string;
	children?: React.ReactNode;
}

export function SectionHeader({
	title,
	icon: Icon,
	className,
	children,
}: SectionHeaderProps) {
	return (
		// USUNIĘTO: sztywne mb-6. Marginesami zarządza teraz rodzic.
		<div className={cn("flex justify-between items-center", className)}>
			{/* DODANO: text-fluid-h2 (z globals.css) do płynnego skalowania */}
			<h2 className="text-fluid-h2 text-t-text-primary flex items-center gap-2 md:gap-3">
				{Icon && (
					<Icon className="h-5 w-5 md:h-6 md:w-6 text-theme-primary shrink-0" />
				)}
				{title}
			</h2>

			{/* Miejsce na dodatkowe akcje, np. przyciski "Filtruj" lub "Export" */}
			{children && <div className="flex items-center gap-2">{children}</div>}
		</div>
	);
}

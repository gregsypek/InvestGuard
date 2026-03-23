import { LucideIcon } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
	title: string;
	icon?: LucideIcon;
	className?: string;
	children?: React.ReactNode; // Na opcjonalne przyciski po prawej stronie
}

export function SectionHeader({
	title,
	icon: Icon,
	className,
	children,
}: SectionHeaderProps) {
	return (
		<div className={cn("flex justify-between items-center mb-6", className)}>
			<h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
				{Icon && <Icon className="h-5 w-5 text-primary" />}
				{title}
			</h2>

			{/* Miejsce na dodatkowe akcje, np. przyciski "Filtruj" lub "Export" */}
			{children && <div className="flex items-center gap-2">{children}</div>}
		</div>
	);
}

import { LucideIcon } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface SubHeaderProps {
	title: string;
	description?: string;
	icon?: LucideIcon;
	className?: string;
	children?: React.ReactNode; // Na przyciski/akcje po prawej stronie
}

export function SubHeader({
	title,
	description,
	icon: Icon,
	className,
	children,
}: SubHeaderProps) {
	return (
		<div className={cn("pb-2 mx-6", className)}>
			<div className="flex items-center justify-between">
				<h3 className="text-md font-bold text-foreground flex items-center gap-2">
					{Icon && <Icon className="h-4 w-4 text-primary" />}
					{title}
				</h3>

				{children && <div className="flex items-center gap-2">{children}</div>}
			</div>

			{description && (
				<p className="text-xs text-muted-foreground mt-1">{description}</p>
			)}
		</div>
	);
}

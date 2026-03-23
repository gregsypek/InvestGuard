import { CardHeader, CardTitle } from "@/components/ui/card";

import { LucideIcon } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface CustomCardHeaderProps {
	title: string;
	description?: string;
	icon?: LucideIcon;
	className?: string;
	children?: React.ReactNode; // Na przyciski/akcje po prawej stronie
}

export function CustomCardHeader({
	title,
	description,
	icon: Icon,
	className,
	children,
}: CustomCardHeaderProps) {
	return (
		<CardHeader className={cn("pb-2", className)}>
			<div className="flex items-center justify-between">
				<CardTitle className="text-md font-bold text-foreground flex items-center gap-2">
					{Icon && <Icon className="h-4 w-4 text-primary " />}
					<h2 className="text-xl font-bold tracking-tight  flex items-center gap-2">
						{title}
					</h2>
				</CardTitle>

				{children && <div className="flex items-center gap-2">{children}</div>}
			</div>

			{description && (
				<p className="text-xs text-muted-foreground">{description}</p>
			)}
		</CardHeader>
	);
}

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubHeaderProps {
	title: string;
	description?: string;
	icon?: LucideIcon;
	className?: string;
	children?: React.ReactNode;
}

export function SubHeader({
	title,
	description,
	icon: Icon,
	className,
	children,
}: SubHeaderProps) {
	return (
		// ZMIANA: dodano spójny padding z dołu
		<div className={cn("pb-4", className)}>
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
					{Icon && <Icon className="h-4 w-4 text-slate-500" />}
					{title}
				</h3>

				{children && <div className="flex items-center gap-2">{children}</div>}
			</div>

			{description && (
				<p className="text-xs font-medium text-slate-500 mt-1.5">
					{description}
				</p>
			)}
		</div>
	);
}

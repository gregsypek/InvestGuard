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
		<div className={cn("pb-4", className)}>
			<div className="flex items-center justify-between">
				{/* DODANO: Skalowanie czcionki i ikon dla mobile (text-[10px] sm:text-xs) */}
				<h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-t-text-secondary flex items-center gap-1.5 md:gap-2">
					{Icon && (
						<Icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-t-text-tertiary shrink-0" />
					)}
					{title}
				</h3>

				{children && <div className="flex items-center gap-2">{children}</div>}
			</div>

			{description && (
				// DODANO: leading-relaxed dla lepszej czytelności oraz max-w-3xl aby tekst nie rozciągał się w nieskończoność na monitorach 4K
				<p className="text-xs md:text-sm font-medium text-t-text-tertiary mt-1.5 leading-relaxed max-w-3xl">
					{description}
				</p>
			)}
		</div>
	);
}

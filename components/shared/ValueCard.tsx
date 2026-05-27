import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValueCardProps {
	label: string;
	value?: number;
	icon?: LucideIcon;
	className?: string;
	suffix?: string;
	formatString?: boolean;
	children?: React.ReactNode;
}

export function ValueCard({
	label,
	value,
	icon: Icon,
	className,
	suffix,
	formatString = false,
	children,
}: ValueCardProps) {
	return (
		<div className={cn("flex flex-col gap-1 shrink-0", className)}>
			{/* Mała, techniczna etykieta */}
			<p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
				{Icon && <Icon className="h-3 w-3" />}
				{label}
			</p>

			{/* Wartość */}
			<div className="flex items-center gap-2 text-slate-200">
				{children ? (
					children
				) : (
					<span className="font-mono text-lg font-semibold tracking-tight">
						{/* FIX: Bezpieczna obsługa undefined dla value */}
						{formatString && typeof value === "number"
							? value.toLocaleString("pl-PL", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})
							: value}
						{suffix && (
							<span className="ml-1.5 text-[11px] font-bold text-slate-500">
								{suffix}
							</span>
						)}
					</span>
				)}
			</div>
		</div>
	);
}

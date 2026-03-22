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
		<div
			className={cn(
				"flex items-start flex-col text-primary p-2 rounded-xl border border-primary/20 shrink-0 bg-background/50",
				className,
			)}
		>
			<p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">
				{label}
			</p>
			<div className="flex items-center gap-2">
				{Icon && <Icon className="h-4 w-4" />}
				{children ? (
					children
				) : (
					<span className="font-mono font-black">
						{/* FIX: Bezpieczna obsługa undefined dla value */}
						{formatString && typeof value === "number"
							? value.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})
							: value}
						{suffix && (
							<span className="ml-1 text-[10px] font-normal opacity-70">
								{suffix}
							</span>
						)}
					</span>
				)}
			</div>
		</div>
	);
}

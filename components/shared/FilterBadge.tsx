import { CheckCircle2, Circle } from "lucide-react";

import React from "react";
import { cn } from "@/lib/utils";

interface FilterBadgeProps {
	label: string;
	id: string; // ID potrzebne do funkcji toggle
	isSelected: boolean;
	onToggle: (id: string) => void;
	className?: string;
}

export function FilterBadge({
	label,
	id,
	isSelected,
	onToggle,
	className,
}: FilterBadgeProps) {
	return (
		<button
			onClick={() => onToggle(id)}
			className={cn(
				"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border hover:cursor-pointer",
				isSelected
					? "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30 shadow-sm hover:border-blue-500"
					: "bg-slate-600/20   text-slate-500 border-none",
				className ? className : "",
			)}
		>
			{isSelected ? (
				<CheckCircle2 className="w-3.5 h-3.5" />
			) : (
				<Circle className="w-3.5 h-3.5" />
			)}
			{label}
		</button>
	);
}

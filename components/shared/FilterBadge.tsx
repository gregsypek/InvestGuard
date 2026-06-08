import { CheckCircle2, Circle } from "lucide-react";

import React from "react";
import { cn } from "@/lib/utils";

interface FilterBadgeProps {
	label: string;
	id: string; // ID potrzebne do funkcji toggle
	isSelected: boolean;
	onToggle: (id: string) => void;
}

export function FilterBadge({
	label,
	id,
	isSelected,
	onToggle,
}: FilterBadgeProps) {
	return (
		<button
			onClick={() => onToggle(id)}
			className={cn(
				"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border hover:cursor-pointer",
				isSelected
					? "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-sm hover:bg-blue-600/10"
					: "bg-slate-900/20 text-slate-400 border-slate-700/60 hover:text-slate-600 hover:border-slate-400",
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

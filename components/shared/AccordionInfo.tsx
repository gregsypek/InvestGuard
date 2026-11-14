import { ChevronDown, Info } from "lucide-react";
import React, { useState } from "react";

import { cn } from "@/lib/utils";

interface AccordionInfoProps {
	des?: string;
}

export default function AccordionInfo({ des }: AccordionInfoProps) {
	const [showInfo, setShowInfo] = useState(false);

	return (
		<div className="flex flex-col rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-sm mt-2 overflow-hidden transition-all duration-300">
			<button
				type="button"
				onClick={() => setShowInfo(!showInfo)}
				className="flex items-center justify-between w-full p-4 text-left outline-none hover:bg-blue-500/5 transition-colors"
			>
				<div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
					<Info className="w-5 h-5 shrink-0" />
					<span className="text-sm font-bold tracking-tight">
						Jak czytać ten wykres?
					</span>
				</div>
				<ChevronDown
					className={cn(
						"w-4 h-4 text-blue-600/70 dark:text-blue-400/70 transition-transform duration-300",
						showInfo && "rotate-180",
					)}
				/>
			</button>
			<div
				className={cn(
					"grid transition-all duration-300 ease-in-out px-4 text-blue-600 dark:text-blue-400",
					showInfo
						? "grid-rows-[1fr] pb-4 opacity-100"
						: "grid-rows-[0fr] opacity-0",
				)}
			>
				<div className="overflow-hidden">
					<p className="text-xs mt-1 leading-relaxed opacity-90 font-medium">
						{des}
					</p>
				</div>
			</div>
		</div>
	);
}

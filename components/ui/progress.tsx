"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SimpleProgressProps {
	value?: number;
	className?: string;
}

function Progress({ value = 0, className }: SimpleProgressProps) {
	// Upewniamy się, że wartość jest w przedziale 0-100
	const safeValue = Math.min(100, Math.max(0, value));

	return (
		<div
			className={cn(
				"w-full h-3 bg-zinc-200 rounded-full overflow-hidden shadow-inner",
				className,
			)}
		>
			<div
				className="h-full bg-linear-to-r from-blue-600 to-cyan-600 transition-all rounded-md duration-500 ease-in-out"
				style={{ width: `${safeValue}%` }}
			/>
		</div>
	);
}

export { Progress };

"use client";

import Image from "next/image";
import { useState } from "react";

export function TickerIcon({
	ticker,
	logoUrl,
}: {
	ticker: string;
	logoUrl?: string | null;
}) {
	const [error, setError] = useState(false);

	// Fallback do litery
	if (!logoUrl || error) {
		return (
			<div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
				{ticker[0].toUpperCase()}
			</div>
		);
	}

	return (
		<div className="relative w-5 h-5 shrink-0">
			<Image
				src={logoUrl}
				alt={ticker}
				fill // Wypełnia nadrzędny div (w-5 h-5)
				sizes="20px"
				className="rounded-full object-contain bg-white p-0.5 border border-border"
				onError={() => setError(true)}
				unoptimized={false} // Next.js zoptymalizuje to pod wymiar 20px
			/>
		</div>
	);
}

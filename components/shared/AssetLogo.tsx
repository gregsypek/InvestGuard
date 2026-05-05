// components/shared/AssetLogo.tsx
"use client";

import Image from "next/image";
import { getStockLogo } from "@/lib/utils";
import { useState } from "react";

interface AssetLogoProps {
	ticker: string | null;
	className?: string;
}

export const AssetLogo = ({ ticker, className }: AssetLogoProps) => {
	const [error, setError] = useState(false);
	const logoUrl = ticker ? getStockLogo(ticker) : "/fallback-asset.png";

	return (
		<div
			className={`relative shrink-0 bg-muted rounded-full overflow-hidden ${className}`}
		>
			<Image
				src={error ? "/fallback-asset.png" : logoUrl || "/fallback-asset.png"}
				alt={ticker || "Asset"}
				fill // EN: Fill parent container | PL: Wypełnij kontener nadrzędny
				className="object-cover"
				sizes="16px" // EN: Tell Next.js the exact size to optimize | PL: Podaj Next.js dokładny rozmiar
				onError={() => setError(true)}
			/>
		</div>
	);
};

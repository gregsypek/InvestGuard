// components/RefreshButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { refreshPortfolioPrices } from "@/lib/actions/refresh-prices";
import { toast } from "sonner";
import { useState } from "react";

export function RefreshButton({
	portfolioId,
	role,
}: {
	portfolioId: string;
	role: string;
}) {
	const [isLoading, setIsLoading] = useState(false);

	const handleRefresh = async () => {
		setIsLoading(true);
		const result = await refreshPortfolioPrices(portfolioId);

		if (result.success) {
			toast.success(result.success);
		} else if (result.error) {
			toast.error(result.error);
		}
		setIsLoading(false);
	};

	// Logika Premium: Zawsze widoczny lub ukryty (zależnie od Twojej wizji)
	const isPremium = role === "ADMIN" || role === "SUBSCRIBER";

	return (
		<div className="flex flex-col items-end gap-1">
			<Button
				onClick={handleRefresh}
				disabled={isLoading}
				variant="ghost"
				size="sm"
			>
				<RefreshCw
					className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
				/>
				{isPremium ? "Aktualizuj kursy" : "Aktualizuj (1x na dobę)"}
			</Button>
			{!isPremium && (
				<span className="text-[10px] text-muted-foreground italic">
					Opcja darmowa ma limit odświeżania 24h.
				</span>
			)}
		</div>
	);
}

"use client";

import { differenceInMinutes, format } from "date-fns";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { pl } from "date-fns/locale";
import { refreshPortfolioPrices } from "@/lib/actions/refresh-prices";
import { toast } from "sonner";
import { useState } from "react";

interface RefreshButtonProps {
	portfolioId: string;
	role: string;
	lastUpdated?: Date | null;
}
export function RefreshButton({
	portfolioId,
	role,
	lastUpdated,
}: RefreshButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const isPremium = role === "ADMIN" || role === "SUBSCRIBER";

	// Sprawdzamy blokadę czasową na frontendzie (dla bezpieczeństwa i UX)
	const isRateLimited =
		!isPremium && lastUpdated
			? differenceInMinutes(new Date(), new Date(lastUpdated)) < 6 * 60
			: false;

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

	let tooltipText = "Odśwież wyceny";
	if (isPremium) tooltipText += " (Brak limitu)";
	else if (isRateLimited) tooltipText += " (Dostępne za kilka godzin)";
	else tooltipText += " (Limit: 1x na 6h)";

	return (
		<div className="flex flex-col items-center gap-0.5 ">
			<Button
				onClick={handleRefresh}
				disabled={isLoading || isRateLimited} // Blokada jeśli trwa ładowanie ALBO limit 6h nie minął
				variant="ghost"
				size="sm"
				title={tooltipText}
				className={cn(
					"h-9 px-2 md:w-auto md:px-3 transition-all rounded-md bg-muted/30 md:bg-transparent hover:bg-muted",
					(isLoading || isRateLimited) && "opacity-50 cursor-not-allowed",
				)}
			>
				<RefreshCw
					className={cn(
						"h-4 w-4 transition-all mr-1.5 md:mr-2",
						isLoading ? "animate-spin text-blue-500" : "md:text-foreground",
					)}
				/>
				<span className="font-medium">
					<span className="md:hidden text-[9px] uppercase tracking-wider">
						Odśwież
					</span>
					<span className="hidden md:inline text-sm">
						{isPremium ? "Aktualizuj kursy" : "Aktualizuj (Limit 6h)"}
					</span>
				</span>
			</Button>

			{lastUpdated && (
				<span className="text-[8px] md:text-[10px] text-muted-foreground/60 pr-1 tracking-wider uppercase font-medium">
					Stan z:{" "}
					{format(new Date(lastUpdated), "HH:mm, dd MMM", { locale: pl })}
				</span>
			)}
		</div>
	);
}

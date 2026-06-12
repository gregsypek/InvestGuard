// components/RefreshButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { refreshPortfolioPrices } from "@/lib/actions/refresh-prices";
import { toast } from "sonner";
import { useState } from "react";

// 1. Definiujemy, co przyjmuje przycisk (dodajemy lastUpdated)
interface RefreshButtonProps {
	portfolioId: string;
	role: string;
	lastUpdated?: string | null;
}

export function RefreshButton({
	portfolioId,
	role,
	lastUpdated, // 2. Odbieramy nową zmienną
}: RefreshButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const isPremium = role === "ADMIN" || role === "SUBSCRIBER";

	const handleRefresh = async () => {
		setIsLoading(true);
		const result = await refreshPortfolioPrices(portfolioId);

		if (result.success) {
			toast.success(result.success);
			if (!isPremium) {
				toast.info(
					"Pamiętaj: Aktualizacja na koncie darmowym działa raz na 24h.",
				);
			}
		} else if (result.error) {
			toast.error(result.error);
		}
		setIsLoading(false);
	};

	const tooltipText = isPremium
		? "Odśwież wyceny (Brak limitu)"
		: "Odśwież wyceny (Limit: 1x na dobę)";

	return (
		<div className="flex flex-col items-end gap-0.5">
			<Button
				onClick={handleRefresh}
				disabled={isLoading}
				variant="ghost"
				size="sm"
				title={tooltipText}
				className={cn(
					"h-9 px-2 md:w-auto md:px-3 transition-all rounded-md bg-muted/30 md:bg-transparent hover:bg-muted",
					isLoading && "opacity-70 cursor-not-allowed",
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
						{isPremium ? "Aktualizuj kursy" : "Aktualizuj (1x na dobę)"}
					</span>
				</span>
			</Button>

			{/* 3. Wyświetlamy czas pod przyciskiem, jeśli zmienna istnieje */}
			{lastUpdated && (
				<span className="text-[8px] md:text-[10px] text-muted-foreground/60 pr-1 tracking-wider uppercase font-medium">
					Stan z: {format(new Date(lastUpdated), "HH:mm")}
				</span>
			)}
		</div>
	);
}

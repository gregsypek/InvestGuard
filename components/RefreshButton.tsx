// components/RefreshButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
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
	const isPremium = role === "ADMIN" || role === "SUBSCRIBER";

	const handleRefresh = async () => {
		setIsLoading(true);
		const result = await refreshPortfolioPrices(portfolioId);

		if (result.success) {
			toast.success(result.success);
			// Dodatkowa informacja edukacyjna w toascie dla darmowych użytkowników
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

	// Tekst wyświetlany w systemowym dymku po najechaniu/przytrzymaniu
	const tooltipText = isPremium
		? "Odśwież wyceny (Brak limitu)"
		: "Odśwież wyceny (Limit: 1x na dobę)";

	return (
		<div className="flex flex-col items-end gap-1">
			<Button
				onClick={handleRefresh}
				disabled={isLoading}
				variant="ghost"
				size="sm"
				title={tooltipText}
				className={cn(
					// Węższy padding na mobile (px-2), normalny na desktopie (md:px-3)
					"h-9 px-2 md:w-auto md:px-3 transition-all rounded-md bg-muted/30 md:bg-transparent hover:bg-muted",
					isLoading && "opacity-70 cursor-not-allowed",
				)}
			>
				<RefreshCw
					className={cn(
						"h-4 w-4 transition-all mr-1.5 md:mr-2", // Margines jest teraz wszędzie
						isLoading
							? "animate-spin text-blue-500"
							: "text-slate-400 md:text-foreground",
					)}
				/>

				{/* Kontener na tekst przycisku */}
				<span className="font-medium">
					{/* Wersja na telefony: krótka, wielkie litery, mała czcionka */}
					<span className="md:hidden text-[9px] uppercase tracking-wider text-slate-400">
						Odśwież
					</span>

					{/* Wersja na komputery: pełny tekst */}
					<span className="hidden md:inline text-sm">
						{isPremium ? "Aktualizuj kursy" : "Aktualizuj (1x na dobę)"}
					</span>
				</span>
			</Button>

			{/* {!isPremium && (
				<span className="hidden md:block text-[10px] text-muted-foreground/70 italic text-right -mt-0.5">
					Limit darmowy: raz na 24h.
				</span>
			)} */}
		</div>
	);
}

"use client";

import { differenceInMinutes, format } from "date-fns";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { pl } from "date-fns/locale";
import { refreshPortfolioPrices } from "@/lib/actions/refresh-prices";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // 🚀 DODANO IMPORT ROUTERA

interface RefreshButtonProps {
	portfolioId: string;
	role: string;
	lastUpdated?: Date | null;
}

// Interwał odświeżania (np. 5 minut = 300 sekund)
const REFRESH_INTERVAL_SEC = 5 * 60;

export function RefreshButton({
	portfolioId,
	role,
	lastUpdated,
}: RefreshButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	// 🚀 STAN DLA ODLICZANIA PASKA
	const [timeLeft, setTimeLeft] = useState(REFRESH_INTERVAL_SEC);

	const isPremium = role === "ADMIN" || role === "SUBSCRIBER";
	const router = useRouter(); // 🚀 INICJALIZACJA ROUTERA

	// 🚀 LOGIKA CICHEGO AUTO-ODŚWIEŻANIA I PASKA POSTĘPU
	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					// Kiedy czas minie: pobieramy nowe dane z NASZEJ bazy i resetujemy pasek
					router.refresh();
					return REFRESH_INTERVAL_SEC;
				}
				return prev - 1;
			});
		}, 1000); // Odpala co 1 sekundę, by płynnie animować pasek

		return () => clearInterval(timer);
	}, [router]);

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
			// 🚀 Wymuszamy pokazanie nowych danych natychmiast i resetujemy pasek
			router.refresh();
			setTimeLeft(REFRESH_INTERVAL_SEC);
		} else if (result.error) {
			toast.error(result.error);
		}
		setIsLoading(false);
	};

	let tooltipText = "Odśwież wyceny";
	if (isPremium) tooltipText += " (Brak limitu)";
	else if (isRateLimited) tooltipText += " (Dostępne za kilka godzin)";
	else tooltipText += " (Limit: 1x na 6h)";

	// 🚀 OBLICZANIE SZEROKOŚCI PASKA POSTĘPU (w procentach)
	const progressPercentage = (timeLeft / REFRESH_INTERVAL_SEC) * 100;

	return (
		<div className="flex flex-col items-center gap-0.5 w-full md:w-auto">
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
				<div className="flex flex-col items-center w-full px-1">
					<span className="text-[8px] md:text-[10px] text-muted-foreground/60 tracking-wider uppercase font-medium">
						Stan z:{" "}
						{format(new Date(lastUpdated), "HH:mm, dd MMM", { locale: pl })}
					</span>

					{/* 🚀 PASEK ODLICZANIA */}
					<div
						className="w-[80%] md:w-full max-w-[120px] h-[2px] bg-muted mt-0.5 rounded-full overflow-hidden"
						title="Czas do automatycznego załadowania najnowszych danych z bazy"
					>
						<div
							className="h-full bg-blue-500/40 transition-all duration-1000 ease-linear"
							style={{ width: `${progressPercentage}%` }}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

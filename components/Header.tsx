"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { usePathname, useSearchParams } from "next/navigation";

import Cookies from "js-cookie";
import Menu from "./shared/Menu";
import { WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
	portfolios: { id: string; name: string }[];
	userButton: React.ReactNode;
	selectedPortfolioId: string;
}

export default function Header({
	portfolios = [],
	userButton,
	selectedPortfolioId,
}: HeaderProps) {
	const searchParams = useSearchParams();
	const pathname = usePathname();

	// 1. Pobieranie ID z parametrów lub ścieżki
	const idFromParams = searchParams.get("portfolioId");

	// Inteligentne wyciąganie ID ze ścieżki
	const segments = pathname.split("/");
	let idFromPath = "";

	if (segments.includes("edit")) {
		// Jeśli ścieżka to /portfolios/edit/[id], bierzemy segment po "edit"
		const editIndex = segments.indexOf("edit");
		idFromPath = segments[editIndex + 1];
	} else if (segments.includes("dashboard")) {
		// Jeśli ścieżka to /dashboard/[id], bierzemy segment po "dashboard"
		const dashboardIndex = segments.indexOf("dashboard");
		idFromPath = segments[dashboardIndex + 1];
	}

	// 2. Łączenie logiki (Parametr > Ścieżka > Ciasteczko)
	const rawId = idFromParams || idFromPath || selectedPortfolioId || "";
	const isValidId = portfolios.some((p) => p.id === rawId);
	const displayValue = isValidId ? rawId : "";

	// 3. Funkcja obsługi zmiany
	const handlePortfolioChange = (id: string) => {
		// 1. Zapisujemy wybór w ciastku
		Cookies.set("selectedPortfolioId", id, { expires: 30, path: "/" });

		// 2. Pobieramy aktualną ścieżkę
		const segments = window.location.pathname.split("/");
		const dashboardIndex = segments.indexOf("dashboard");

		if (dashboardIndex !== -1 && segments[dashboardIndex + 1]) {
			// Podmieniamy segment ID (zaraz po 'dashboard')
			segments[dashboardIndex + 1] = id;
			const newPath = segments.join("/");

			// 3. Twarde przeładowanie na nowy adres bez pytajników
			window.location.href = newPath;
		} else {
			// Jeśli jesteśmy na /dashboard, idziemy do konkretnego portfela
			window.location.href = `/dashboard/${id}`;
		}
	};
	return (
		<header className="flex justify-between items-center p-2 border-b border-border bg-background text-foreground sticky top-0 z-50">
			<div className="px-5 flex items-center gap-3">
				<Select
					value={displayValue || undefined}
					onValueChange={handlePortfolioChange}
					disabled={portfolios.length === 0}
				>
					<SelectTrigger
						className={cn(
							"w-55 bg-muted/50 border-border2 font-bold text-[11px] uppercase tracking-widest h-9 transition-all",
							!displayValue && portfolios.length > 0
								? "border-primary/50 animate-pulse"
								: "border-border2",
						)}
					>
						<div className="flex items-center gap-2 overflow-hidden">
							<WalletCards
								className={cn(
									"h-4 w-4 shrink-0",
									displayValue ? "text-primary" : "text-muted-foreground",
								)}
							/>
							<div className="truncate">
								<SelectValue
									placeholder={
										portfolios.length === 0
											? "Brak portfeli"
											: "Wybierz portfel..."
									}
								/>
							</div>
						</div>
					</SelectTrigger>

					<SelectContent>
						{portfolios.map((p) => (
							<SelectItem
								key={p.id}
								value={p.id}
								className="text-xs font-medium focus:bg-primary/10"
							>
								{p.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="px-5 flex items-center gap-4">
				<Menu userButton={userButton} />
			</div>
		</header>
	);
}

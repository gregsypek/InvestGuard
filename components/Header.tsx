"use client";

import { GraduationCap, Wallet2, WalletCards } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Cookies from "js-cookie";
import Menu from "./shared/Menu";
import { RefreshButton } from "./RefreshButton";
import { cn } from "@/lib/utils";

interface HeaderProps {
	portfolios: { id: string; name: string }[];
	userButton: React.ReactNode;
	selectedPortfolioId: string;
	userRole: string;
}

export default function Header({
	portfolios,
	userButton,
	selectedPortfolioId,
	userRole,
}: HeaderProps) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const isDemoMode = pathname.startsWith("/demo");
	const router = useRouter();

	// 1. Pobieramy ID z URL (to jest nadrzędne nad ciasteczkiem!)
	const urlPortfolioId = searchParams.get("portfolioId");

	// 2. Szukamy ID w ścieżce dla wszystkich modułów
	const segments = pathname.split("/");
	const getPathId = () => {
		const keys = ["dashboard", "edit", "planner", "bond-reports"];
		const key = keys.find((k) => segments.includes(k));
		if (key) return segments[segments.indexOf(key) + 1];
		return null;
	};

	const idFromPath = getPathId();

	// 3. Finalne ID do wyświetlenia
	// Priorytet: 1. URL (?portfolioId) | 2. Ścieżka (/dashboard/ID) | 3. Prop z serwera/ciasteczka
	const rawId = urlPortfolioId || idFromPath || selectedPortfolioId || "";
	const displayValue = isDemoMode ? "" : rawId;
	const handlePortfolioChange = (id: string) => {
		// Obsługa nowej opcji wejścia w demo z listy
		if (id === "enter-demo") {
			router.push("/demo?s=dalio");
			return;
		}

		Cookies.set("selectedPortfolioId", id, { expires: 30, path: "/" });
		router.push(`/dashboard/${id}`);
	};

	return (
		<header className="flex justify-between items-center p-2 border-b border-border bg-background text-foreground sticky top-0 z-50">
			<div className="px-5 flex items-center gap-3">
				<Select
					// KLUCZOWE: Dodanie key opartego na displayValue wymusza
					// przerysowanie Selecta, gdy zmieniasz portfel w URL.
					key={isDemoMode ? "demo" : `real-${displayValue}`}
					value={displayValue || undefined}
					onValueChange={handlePortfolioChange}
				>
					<SelectTrigger
						className={cn(
							"w-60 bg-muted/50 border-border2 font-bold text-[11px] uppercase tracking-widest h-9 transition-all",
							!displayValue && portfolios.length > 0 && !isDemoMode
								? "border-primary/50 animate-pulse"
								: "border-border2",
							// Wizualne wyróżnienie trybu demo w głównym nagłówku
							isDemoMode &&
								"border-emerald-500/50 bg-emerald-500/5 text-emerald-600 ring-emerald-500/20",
						)}
					>
						<div className="flex items-center gap-2 overflow-hidden">
							{isDemoMode ? (
								<GraduationCap className="h-4 w-4 shrink-0 text-emerald-600" />
							) : (
								<WalletCards
									className={cn(
										"h-4 w-4 shrink-0",
										displayValue ? "text-primary" : "text-muted-foreground",
									)}
								/>
							)}
							<div className="truncate text-left">
								<SelectValue
									placeholder={
										isDemoMode
											? "Tryb Edukacyjny"
											: portfolios.length === 0
												? "Brak portfeli"
												: "Wybierz portfel..."
									}
								/>
							</div>
						</div>
					</SelectTrigger>

					<SelectContent>
						<div className="flex items-center gap-2 text-xs font-bold text-blue-500  focus:text-blue-600 cursor-pointer">
							<div className="flex items-center gap-2 py-2">
								<Wallet2 className="h-4 w-4 text-blue-500" />
								TWOJE PORTFELE
							</div>
						</div>
						<SelectSeparator />

						{portfolios.map((p) => (
							<SelectItem
								key={p.id}
								value={p.id}
								className="text-xs font-medium focus:bg-primary/10"
							>
								{p.name}
							</SelectItem>
						))}

						<SelectSeparator />

						{/* 4. Stała opcja wejścia w demo dostępna zawsze w liście */}
						<SelectItem
							value="enter-demo"
							className="text-xs font-bold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer"
						>
							<div className="flex items-center gap-2">
								<GraduationCap className="h-4 w-4" />
								ZOBACZ DEMO
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="px-5 flex items-center gap-3">
				<RefreshButton portfolioId={displayValue} role={userRole} />
				<Menu userButton={userButton} />
			</div>
		</header>
	);
}

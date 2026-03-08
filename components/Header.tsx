"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	// 1. Pobieranie ID z parametrów lub ścieżki
	const idFromParams = searchParams.get("portfolioId");
	const segments = pathname.split("/");
	const idFromPath = segments[2];

	// 2. Łączenie logiki
	const rawId = idFromParams || idFromPath || selectedPortfolioId || "";
	const isValidId = portfolios.some((p) => p.id === rawId);
	const displayValue = isValidId ? rawId : "";

	// 3. Funkcja obsługi zmiany
	const handlePortfolioChange = (id: string) => {
		Cookies.set("selectedPortfolioId", id, { expires: 30, path: "/" });

		if (
			pathname.includes("/bond-reports/") &&
			pathname.includes("/add-asset")
		) {
			// Zamieniamy ID w ścieżce dynamicznej
			const newPath = pathname.replace(idFromPath, id);
			router.push(newPath);
		} else {
			// Standardowa nawigacja z parametrem
			const params = new URLSearchParams(searchParams.toString());
			params.set("portfolioId", id);
			router.push(`${pathname}?${params.toString()}`);
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

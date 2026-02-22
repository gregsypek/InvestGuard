"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Menu from "./shared/Menu";
import Cookies from "js-cookie";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
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

	const handlePortfolioChange = (id: string) => {
		Cookies.set("selectedPortfolioId", id, { expires: 30, path: "/" });
		if (id) {
			router.push(`/dashboard?portfolioId=${id}`);
		} else {
			router.push(`/dashboard`);
		}
	};

	// 1. Pobieramy surowe ID z URL lub ciastek
	const rawId = searchParams.get("portfolioId") || selectedPortfolioId || "";

	// 2. KLUCZOWE: Sprawdzamy, czy to ID faktycznie znajduje się w pobranych portfelach
	// Eliminujemy w ten sposób "martwe" ID po usunięciu portfela
	const isValidId = portfolios.some((p) => p.id === rawId);
	const displayValue = isValidId ? rawId : "";

	return (
		<header className="flex justify-between items-center p-2 border-b border-border bg-background text-foreground sticky top-0 z-50">
			<div className="px-5 flex items-center gap-3">
				<Select
					value={displayValue || undefined}
					onValueChange={(value) => handlePortfolioChange(value)}
					disabled={portfolios.length === 0} // Zablokuj klikanie, jeśli lista jest pusta
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

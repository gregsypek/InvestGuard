"use client";

import { GraduationCap, Lock, LogOut, WalletCards } from "lucide-react";
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
import Link from "next/link";
import Menu from "./shared/Menu";
import { cn } from "@/lib/utils";

// Stałe opcje demo
const DEMO_OPTIONS = [
	{ id: "demo-classic", name: "Demo: Klasyczny 60/40", key: "classic" },
	{ id: "demo-dalio", name: "Demo: Ray Dalio", key: "dalio" },
	{ id: "demo-yale", name: "Demo: Model Yale", key: "yale" },
];

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

	// Wykrywanie trybu Demo
	const isDemoPage = pathname.startsWith("/demo");
	const isDemoId = selectedPortfolioId.startsWith("demo-");
	const isDemoMode = isDemoPage || isDemoId;

	// Pobieranie ID (Twoja oryginalna logika)
	const idFromParams = searchParams.get("portfolioId");
	const segments = pathname.split("/");
	let idFromPath = "";
	if (segments.includes("dashboard")) {
		const idx = segments.indexOf("dashboard");
		idFromPath = segments[idx + 1];
	}

	const rawId = idFromParams || idFromPath || selectedPortfolioId || "";
	const displayValue = rawId;

	const handlePortfolioChange = (id: string) => {
		const demo = DEMO_OPTIONS.find((d) => d.id === id);
		if (demo) {
			window.location.href = `/demo?s=${demo.key}`;
			return;
		}

		Cookies.set("selectedPortfolioId", id, { expires: 30, path: "/" });
		window.location.href = `/dashboard/${id}`;
	};

	return (
		<div className="sticky top-0 z-50 w-full flex flex-col">
			<header
				className={cn(
					"flex justify-between items-center p-2 border-b transition-all duration-500",
					isDemoMode
						? "bg-emerald-600 border-emerald-500 text-white"
						: "bg-background border-border text-foreground",
				)}
			>
				<div className="px-5 flex items-center gap-3">
					<Select value={displayValue} onValueChange={handlePortfolioChange}>
						<SelectTrigger
							className={cn(
								"w-64 font-bold text-[11px] uppercase tracking-widest h-9 border-none",
								isDemoMode ? "bg-white/10 text-white" : "bg-muted/50",
							)}
						>
							<div className="flex items-center gap-2 overflow-hidden">
								{isDemoMode ? (
									<GraduationCap className="h-4 w-4" />
								) : (
									<WalletCards className="h-4 w-4" />
								)}
								<SelectValue placeholder="Wybierz portfel..." />
							</div>
						</SelectTrigger>
						<SelectContent>
							{portfolios.map((p) => (
								<SelectItem key={p.id} value={p.id}>
									{p.name}
								</SelectItem>
							))}
							<SelectSeparator />
							<div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
								Portfele Demo
							</div>
							{DEMO_OPTIONS.map((d) => (
								<SelectItem
									key={d.id}
									value={d.id}
									className="text-emerald-600"
								>
									{d.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="px-5 flex items-center gap-4">
					{isDemoMode && (
						<Link
							href="/dashboard"
							className="flex items-center gap-2 text-[10px] font-black uppercase bg-white/20 px-3 py-1.5 rounded-full text-white"
						>
							<LogOut className="h-3 w-3" /> Opuść Demo
						</Link>
					)}
					{!isDemoMode && <Menu userButton={userButton} />}
				</div>
			</header>
			{isDemoMode && (
				<div className="bg-emerald-600 border-emerald-500 text-white text-[9px] text-center font-bold uppercase tracking-widest  py-1">
					<span className="">
						Tryb Demo: Portfel Wzorcowy. Dane wyłącznie poglądowe a przyciski z
						ikoną{" "}
					</span>
					<Lock className="h-3 w-3 text-white inline" />
					<span> nieaktywne.</span>
				</div>
			)}
		</div>
	);
}

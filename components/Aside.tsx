// components/Aside.tsx
"use client";

import {
	FileText,
	GraduationCap,
	History,
	LayoutDashboard,
	Notebook,
	Rocket,
	Settings,
	Wallet,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{ name: "Panel Główny", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Twoje Portfele", href: "/portfolios", icon: Wallet },
	{ name: "Planowanie", href: "/planner", icon: Notebook },
	{ name: "Historia Aktywności", href: "/activity", icon: History },
	{ name: "Strategia Aktywna", href: "/alpha-selection", icon: Rocket },
	{ name: "Analiza Obligacji", href: "/bond-reports", icon: FileText },
	// { name: "Ustawienia", href: "/settings", icon: Settings },
];

export default function Aside() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// 1. Detekcja trybu
	const isDemoMode = pathname.startsWith("/demo");
	const strategy = searchParams.get("s");
	const portfolioId = searchParams.get("portfolioId");

	return (
		<aside className="w-20 md:w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-slate-800 transition-all duration-300">
			<div className="p-6">
				<Link href="/" className="flex items-center gap-3">
					<div
						className={cn(
							"w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
							isDemoMode ? "bg-emerald-600" : "bg-blue-600",
						)}
					>
						{isDemoMode ? (
							<GraduationCap className="text-white w-5 h-5" />
						) : (
							<Wallet className="text-white w-5 h-5" />
						)}
					</div>
					<span className="text-xl font-black tracking-tighter text-white hidden md:inline-block">
						{APP_NAME}
						<span className={isDemoMode ? "text-emerald-500" : "text-blue-500"}>
							.
						</span>
					</span>
				</Link>
			</div>

			<nav className="flex-1 px-4 py-4 space-y-1">
				{NAV_ITEMS.map((item) => {
					// Logika aktywności
					const isActive = isDemoMode
						? item.href === "/dashboard"
							? pathname === "/demo"
							: pathname.startsWith(`/demo${item.href}`)
						: pathname.startsWith(item.href);

					// Mapowanie linków
					let finalHref = item.href;
					if (isDemoMode) {
						if (item.href === "/dashboard") finalHref = "/demo";
						if (item.href === "/portfolios") finalHref = "/demo/portfolios";
						if (item.href === "/planner") finalHref = "/demo/planner";
						if (strategy) finalHref += `?s=${strategy}`;
					} else if (portfolioId) {
						finalHref += `?portfolioId=${portfolioId}`;
					}

					return (
						<Link
							key={item.href}
							href={finalHref}
							className={cn(
								"flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
								isActive
									? isDemoMode
										? "bg-emerald-600/10 text-emerald-500 border border-emerald-600/20" // Styl DEMO (Zielony)
										: "bg-blue-600/10 text-blue-400 border border-blue-600/20" // Styl NORMAL (Niebieski)
									: "hover:bg-slate-800 hover:text-white",
								// Blokada niedostępnych stron w demo
								isDemoMode &&
									!["/dashboard", "/portfolios", "/planner"].includes(
										item.href,
									) &&
									"opacity-30 pointer-events-none",
							)}
						>
							<item.icon
								className={cn(
									"w-5 h-5 transition-colors",
									isActive
										? isDemoMode
											? "text-emerald-500"
											: "text-blue-400"
										: "text-slate-500 group-hover:text-slate-300",
								)}
							/>
							<span className="hidden md:inline-block">{item.name}</span>
						</Link>
					);
				})}
			</nav>

			{/* Footer Nav */}
			<div className="p-4 border-t border-slate-800">
				<Link
					href="/settings"
					className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
				>
					<Settings className="w-5 h-5 text-slate-500" />
					<span className="hidden md:inline-block">Settings</span>
				</Link>
			</div>
		</aside>
	);
}

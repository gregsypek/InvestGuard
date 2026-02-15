// components/Aside.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
	LayoutDashboard,
	Rocket,
	FileText,
	Wallet,
	Settings,
	Notebook,
	History,
} from "lucide-react";
import { cn } from "@/lib/utils";

// const NAV_ITEMS = [
// 	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
// 	{ name: "Portfolios", href: "/portfolios", icon: Wallet },
// 	{ name: "Planning", href: "/planner", icon: Notebook },
// 	{
// 		name: "Activity Log",
// 		href: "/activity",
// 		icon: History,
// 	},
// 	{ name: "Booster 5%", href: "/booster", icon: Rocket },
// 	{ name: "Raporty EDO", href: "/raporty", icon: FileText },
// ];
// Navigation items for the main sidebar
// Each item contains a Polish label and its corresponding English translation for future i18n
const NAV_ITEMS = [
	{
		name: "Panel Główny", // UI: Panel Główny | EN: Dashboard
		href: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		name: "Twoje Portfele", // UI: Twoje Portfele | EN: Portfolios
		href: "/portfolios",
		icon: Wallet,
	},
	{
		name: "Planowanie", // UI: Planowanie | EN: Planning
		href: "/planner",
		icon: Notebook,
	},
	{
		name: "Historia Aktywności", // UI: Historia Aktywności | EN: Activity Log
		href: "/activity",
		icon: History,
	},
	{
		name: "Strategia Aktywna", // UI: Portfel Aktywny | EN: Active Portfolio
		href: "/alpha-selection",
		icon: Rocket,
	},
	{
		name: "Analiza Obligacji", // UI: Analiza Obligacji | EN: Bond Analysis
		href: "/bond-reports",
		icon: FileText,
	},
];
const Aside = () => {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const portfolioId = searchParams.get("portfolioId");

	return (
		<aside className="w-64 flex flex-col bg-sidebar text-sidebar-foreground border-r border-border">
			{/* Logo Area */}
			<div className="p-6">
				<Link href="/" className="flex items-center gap-3 group">
					<div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
						<Rocket className="text-white w-6 h-6" />
					</div>
					<span className="font-bold text-xl text-white tracking-tight">
						MyWallets<span className="text-blue-500">.</span>
					</span>
				</Link>
			</div>

			{/* Navigation */}
			<nav className="flex-1 px-4 py-4 space-y-1">
				{NAV_ITEMS.map((item) => {
					const isActive = pathname.startsWith(item.href);

					// 2. Tworzymy nowy adres URL z zachowaniem portfolioId
					// Jeśli portfolioId istnieje, dodajemy go jako parametr ?portfolioId=...
					const hrefWithQuery = portfolioId
						? `${item.href}?portfolioId=${portfolioId}`
						: item.href;
					return (
						<Link
							key={item.href}
							href={hrefWithQuery}
							className={cn(
								"flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
								isActive
									? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
									: "hover:bg-slate-800 hover:text-white",
							)}
						>
							<item.icon
								className={cn(
									"w-5 h-5",
									isActive ? "text-blue-400" : "text-slate-500",
								)}
							/>
							{item.name}
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
					Settings
				</Link>
			</div>
		</aside>
	);
};

export default Aside;

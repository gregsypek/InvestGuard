"use client";

import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { usePathname, useSearchParams } from "next/navigation";

import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Aside() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const isDemoMode = pathname.startsWith("/demo");
	const strategy = searchParams.get("s");
	const idFromParams = searchParams.get("portfolioId");
	const segments = pathname.split("/");

	const getPathId = () => {
		const keys = [
			"dashboard",
			"edit",
			"bond-reports",
			"portfolios",
			"alpha-selection",
		];
		for (const key of keys) {
			if (segments.includes(key)) {
				const idx = segments.indexOf(key);
				const possibleId = segments[idx + 1];
				if (possibleId && possibleId !== "new") return possibleId;
			}
		}
		return "";
	};

	const activePortfolioId = idFromParams || getPathId();

	return (
		<aside className="hidden md:flex flex-col md:w-20 lg:w-64 bg-sidebar text-sidebar-foreground border-r border-slate-800 transition-all duration-300">
			{/* Logo */}
			<div className="p-3 lg:p-6 flex justify-center lg:justify-start">
				<Link href="/" className="flex items-center gap-3">
					<div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center transition-colors">
						<Image
							src="/logo-light.svg"
							width={40}
							height={40}
							loading="lazy"
							alt="Invest Guard logo"
							className="h-auto w-auto"
						/>
					</div>
					<span
						className={cn(
							"text-xl font-black tracking-tighter text-white hidden lg:inline-block",
							isDemoMode ? "text-emerald-500" : "text-blue-200",
						)}
					>
						{APP_NAME}
						<span className={isDemoMode ? "text-emerald-500" : ""}>.</span>
					</span>
				</Link>
			</div>

			{/* Nawigacja */}
			<nav className="flex-1 flex flex-col items-center lg:items-stretch px-2 lg:px-4 py-4 space-y-1">
				{NAV_ITEMS.map((item) => {
					const isActive = isDemoMode
						? item.href === "/dashboard"
							? pathname === "/demo"
							: pathname.startsWith(`/demo${item.href}`)
						: pathname.startsWith(item.href);

					let finalHref = item.href;
					if (isDemoMode) {
						if (item.href === "/dashboard") finalHref = "/demo";
						if (item.href === "/portfolios") finalHref = "/demo/portfolios";
						if (item.href === "/planner") finalHref = "/demo/planner";
						if (strategy) finalHref += `?s=${strategy}`;
					} else if (activePortfolioId && !isDemoMode) {
						// Tryb Normalny: Jeśli mamy aktywne ID, doklejamy je do każdego linku!
						finalHref += `?portfolioId=${activePortfolioId}`;
					}

					return (
						<Link
							key={item.href}
							href={finalHref}
							className={cn(
								"flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3 rounded-lg text-sm font-medium transition-all group",
								isActive
									? isDemoMode
										? "bg-emerald-600/10 text-emerald-500 border border-emerald-600/20"
										: "bg-blue-600/10 text-blue-400 border border-blue-600/20"
									: "hover:bg-slate-800 hover:text-white",
								isDemoMode &&
									!["/dashboard", "/portfolios", "/planner"].includes(
										item.href,
									) &&
									"opacity-30 pointer-events-none",
							)}
						>
							<item.icon
								className={cn(
									"w-5 h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 transition-colors",
									isActive
										? isDemoMode
											? "text-emerald-500"
											: "text-blue-400"
										: "text-slate-500 group-hover:text-slate-300",
								)}
							/>
							<span className="hidden lg:inline-block">{item.name}</span>
						</Link>
					);
				})}
			</nav>

			{/* Stopka (Ustawienia) */}
			<div className="p-4 border-t border-slate-800">
				<Link
					href="/settings"
					className="flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
				>
					<Settings className="w-5 h-5 text-slate-500" />
					<span className="hidden lg:inline-block">Settings</span>
				</Link>
			</div>
		</aside>
	);
}

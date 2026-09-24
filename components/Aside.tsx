"use client";

import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { Settings, Wrench } from "lucide-react";
import { useEffect, useState } from "react"; // 🚀 DODANY IMPORT
import { usePathname, useSearchParams } from "next/navigation";

import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Aside() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const isDemoMode = pathname.startsWith("/demo");
	const strategy = searchParams.get("s");
	const idFromParams = searchParams.get("portfolioId");
	const segments = pathname.split("/");
	// 🚀 STAN DO HYDRACJI CIASTECZKA
	const [cookieId, setCookieId] = useState<string | null>(null);

	useEffect(() => {
		// Wykonuje się asynchronicznie - omija rygorystyczny błąd Lintera i błąd Hydracji!
		const timer = setTimeout(() => {
			setCookieId(Cookies.get("selectedPortfolioId") || null);
		}, 0);

		return () => clearTimeout(timer);
	}, [pathname]); // <-- Aktualizuj przy każdej zmianie strony

	const getPathId = () => {
		const targetKeys = [
			"dashboard",
			"edit",
			"planner",
			"bond-reports",
			"portfolios",
			"alpha-selection",
			"settings",
		];
		for (let i = segments.length - 1; i >= 0; i--) {
			if (targetKeys.includes(segments[i])) {
				const possibleId = segments[i + 1];
				if (possibleId && possibleId !== "new") return possibleId;
			}
		}
		return "";
	};

	// 🚀 ZMIANA: Zamiast bezpośrednio z Cookies, bierzemy ze stanu!
	const activePortfolioId = idFromParams || getPathId() || cookieId;

	return (
		<aside className="hidden md:flex flex-col md:w-20 lg:w-64 bg-white/40 dark:bg-t-bg-sticky backdrop-blur-xl border-r border-t-border-subtle dark:border-white/10 transition-all duration-300 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] dark:shadow-none z-40">
			{/* Logo */}
			<div className="p-3 lg:p-6 flex justify-center lg:justify-start">
				<Link
					href="/"
					className="flex items-center gap-3 group hover:cursor-pointer"
				>
					<div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center bg-white dark:bg-black shadow-sm border border-t-border-subtle">
						<Image
							src="/logo.svg"
							alt="Logo"
							width={32}
							height={32}
							className="block dark:hidden object-contain"
							style={{ width: "auto", height: "auto" }}
						/>
						<Image
							src="/logo-light.svg"
							alt="Logo"
							width={32}
							height={32}
							className="hidden dark:block object-contain"
							style={{ width: "auto", height: "auto" }}
						/>
					</div>
					<span className="text-xl font-black tracking-tighter hidden lg:inline-block transition-colors text-t-text-primary">
						{APP_NAME}.
					</span>
				</Link>
			</div>

			{/* Nawigacja */}
			<nav className="flex-1 flex flex-col items-center lg:items-stretch px-2 lg:px-4 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
				{NAV_ITEMS.map((item) => {
					const isActive = isDemoMode
						? item.href === "/dashboard"
							? pathname === "/demo"
							: pathname.startsWith(`/demo${item.href}`)
						: item.href === "/dashboard"
							? pathname.startsWith("/dashboard") &&
								!pathname.includes("/settings")
							: pathname.startsWith(item.href);

					let finalHref = item.href;

					if (isDemoMode) {
						if (item.href === "/dashboard") finalHref = "/demo";
						if (item.href === "/portfolios") finalHref = "/demo/portfolios";
						if (item.href === "/planner") finalHref = "/demo/planner";
						if (strategy) finalHref += `?s=${strategy}`;
					} else if (activePortfolioId && !isDemoMode) {
						if (item.href === "/dashboard") {
							finalHref = `/dashboard/${activePortfolioId}`;
						} else {
							finalHref += `?portfolioId=${activePortfolioId}`;
						}
					}

					return (
						<Link
							key={item.href}
							href={finalHref}
							className={cn(
								"flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 group relative overflow-hidden",
								isActive
									? "bg-theme-soft text-theme-primary shadow-sm"
									: "hover:bg-black/5 dark:hover:bg-white/5 text-t-text-secondary hover:text-t-text-primary",
								isDemoMode &&
									!["/dashboard", "/portfolios", "/planner"].includes(
										item.href,
									) &&
									"opacity-30 pointer-events-none",
							)}
						>
							{isActive && (
								<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full hidden lg:block bg-theme-primary" />
							)}
							<item.icon
								className={cn(
									"w-5 h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 transition-transform duration-300 group-hover:scale-110",
									isActive
										? "text-theme-primary"
										: "text-t-text-tertiary group-hover:text-t-text-primary",
								)}
							/>
							<span className="hidden lg:inline-block">{item.name}</span>
						</Link>
					);
				})}
			</nav>

			{/* Stopka (Narzędzia i Ustawienia) */}
			<div className="p-4 border-t border-t-border-subtle flex flex-col gap-2">
				{activePortfolioId &&
					!isDemoMode &&
					(() => {
						const toolsHref = `/dashboard/${activePortfolioId}/settings`;
						const isToolsActive = pathname.startsWith(toolsHref);
						return (
							<Link
								href={toolsHref}
								className={cn(
									"flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 group relative overflow-hidden",
									isToolsActive
										? "bg-theme-soft text-theme-primary shadow-sm"
										: "hover:bg-black/5 dark:hover:bg-white/5 text-t-text-secondary hover:text-t-text-primary",
								)}
							>
								{isToolsActive && (
									<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full hidden lg:block bg-theme-primary" />
								)}
								<Wrench
									className={cn(
										"w-5 h-5 transition-transform duration-300 group-hover:-rotate-12",
										isToolsActive
											? "text-theme-primary"
											: "text-t-text-tertiary group-hover:text-t-text-primary",
									)}
								/>
								<span className="hidden lg:inline-block">Narzędzia</span>
							</Link>
						);
					})()}

				{(() => {
					let settingsHref = "/settings";
					if (activePortfolioId && !isDemoMode)
						settingsHref += `?portfolioId=${activePortfolioId}`;
					const isSettingsActive = pathname.startsWith("/settings");
					return (
						<Link
							href={settingsHref}
							className={cn(
								"flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 group relative overflow-hidden",
								isSettingsActive
									? "bg-theme-soft text-theme-primary shadow-sm"
									: "hover:bg-black/5 dark:hover:bg-white/5 text-t-text-secondary hover:text-t-text-primary",
								isDemoMode && "opacity-30 pointer-events-none",
							)}
						>
							{isSettingsActive && (
								<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full hidden lg:block bg-theme-primary" />
							)}
							<Settings
								className={cn(
									"w-5 h-5 transition-transform duration-300 group-hover:rotate-90",
									isSettingsActive
										? "text-theme-primary"
										: "text-t-text-tertiary group-hover:text-t-text-primary",
								)}
							/>
							<span className="hidden lg:inline-block">Ustawienia</span>
						</Link>
					);
				})()}
			</div>
		</aside>
	);
}

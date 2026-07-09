"use client";

import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { Settings, Wrench } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

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
		<aside className="hidden md:flex flex-col md:w-20 lg:w-64 bg-white/40 dark:bg-t-bg-sticky backdrop-blur-xl border-r border-t-border-subtle dark:border-white/10 transition-all duration-300 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] dark:shadow-none z-40">
			{/* Logo */}
			<div className="p-3 lg:p-6 flex justify-center lg:justify-start">
				<Link
					href="/"
					className="flex items-center gap-3 group hover:cursor-pointer"
				>
					<div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center bg-white dark:bg-black shadow-sm border border-t-border-subtle   ">
						{/* 1. Ciemne logo (logo.svg) - WIDOCZNE w jasnym motywie, UKRYTE w ciemnym */}
						<Image
							src="/logo.svg"
							alt="InvestGuard Logo"
							width={32}
							height={32}
							className="block dark:hidden object-contain"
							style={{ width: "auto", height: "auto" }}
						/>

						{/* 2. Jasne logo (logo-light.svg) - UKRYTE w jasnym motywie, WIDOCZNE w ciemnym */}
						<Image
							src="/logo-light.svg"
							alt="InvestGuard Logo"
							width={32}
							height={32}
							className="hidden dark:block object-contain"
							style={{ width: "auto", height: "auto" }}
						/>
					</div>
					<span
						className={cn(
							"text-xl font-black tracking-tighter hidden lg:inline-block transition-colors",
							isDemoMode ? "text-emerald-500" : "text-t-text-primary",
						)}
					>
						{APP_NAME}
						<span className={isDemoMode ? "text-emerald-500" : "text-blue-500"}>
							.
						</span>
					</span>
				</Link>
			</div>

			{/* Nawigacja */}
			<nav className="flex-1 flex flex-col items-center lg:items-stretch px-2 lg:px-4 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
				{NAV_ITEMS.map((item) => {
					// 🚀 ZMIANA: Zabezpieczenie przed podwójnym podświetlaniem Dashboardu i Ustawień
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
						// Tryb Normalny: Jeśli mamy aktywne ID, doklejamy je do każdego linku
						finalHref += `?portfolioId=${activePortfolioId}`;
					}

					return (
						<Link
							key={item.href}
							href={finalHref}
							className={cn(
								"flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 group relative overflow-hidden",
								isActive
									? isDemoMode
										? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
										: "bg-blue-600/10 text-blue-600 dark:text-blue-400 shadow-sm"
									: "hover:bg-black/5 dark:hover:bg-white/5 text-t-text-secondary hover:text-t-text-primary",
								isDemoMode &&
									!["/dashboard", "/portfolios", "/planner"].includes(
										item.href,
									) &&
									"opacity-30 pointer-events-none",
							)}
						>
							{/* PREMIUM DETAIL: Pionowy akcent dla aktywnego menu */}
							{isActive && (
								<div
									className={cn(
										"absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full hidden lg:block",
										isDemoMode ? "bg-emerald-500" : "bg-blue-500",
									)}
								/>
							)}

							<item.icon
								className={cn(
									"w-5 h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 transition-transform duration-300 group-hover:scale-110",
									isActive
										? isDemoMode
											? "text-emerald-500"
											: "text-blue-500"
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
				{/* === NARZĘDZIA PORTFELA === */}
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
										? "bg-blue-600/10 text-blue-600 dark:text-blue-400 shadow-sm"
										: "hover:bg-black/5 dark:hover:bg-white/5 text-t-text-secondary hover:text-t-text-primary",
								)}
							>
								{/* Pionowy akcent aktywnej zakładki */}
								{isToolsActive && (
									<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full hidden lg:block bg-blue-500" />
								)}
								<Wrench
									className={cn(
										"w-5 h-5 transition-transform duration-300 group-hover:-rotate-12",
										isToolsActive
											? "text-blue-500"
											: "text-t-text-tertiary group-hover:text-t-text-primary",
									)}
								/>
								<span className="hidden lg:inline-block">Narzędzia</span>
							</Link>
						);
					})()}

				{/* === GŁÓWNE USTAWIENIA APLIKACJI === */}
				{(() => {
					let settingsHref = "/settings";
					// Jeśli jesteśmy w portfelu, przekazujemy jego ID do ustawień, żeby Narzędzia nie zniknęły
					if (activePortfolioId && !isDemoMode) {
						settingsHref += `?portfolioId=${activePortfolioId}`;
					}
					const isSettingsActive = pathname.startsWith("/settings");

					return (
						<Link
							href={settingsHref}
							className={cn(
								"flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 group relative overflow-hidden",
								isSettingsActive
									? isDemoMode
										? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
										: "bg-blue-600/10 text-blue-600 dark:text-blue-400 shadow-sm"
									: "hover:bg-black/5 dark:hover:bg-white/5 text-t-text-secondary hover:text-t-text-primary",
								isDemoMode && "opacity-30 pointer-events-none",
							)}
						>
							{/* Pionowy akcent aktywnej zakładki */}
							{isSettingsActive && (
								<div
									className={cn(
										"absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full hidden lg:block",
										isDemoMode ? "bg-emerald-500" : "bg-blue-500",
									)}
								/>
							)}
							<Settings
								className={cn(
									"w-5 h-5 transition-transform duration-300 group-hover:rotate-90",
									isSettingsActive
										? isDemoMode
											? "text-emerald-500"
											: "text-blue-500"
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

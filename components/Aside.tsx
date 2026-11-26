"use client";

import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { LayoutDashboard, Settings, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Aside({ onClose }: { onClose?: () => void }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const isDemoMode = pathname.startsWith("/demo");
	const strategy = searchParams.get("s");
	const idFromParams = searchParams.get("portfolioId");
	const segments = pathname.split("/");

	const [cookieId, setCookieId] = useState<string | null>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			setCookieId(Cookies.get("selectedPortfolioId") || null);
		}, 0);

		return () => clearTimeout(timer);
	}, [pathname]);

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

	const activePortfolioId = idFromParams || getPathId() || cookieId;

	const overviewHref = isDemoMode
		? strategy
			? `/demo?s=${strategy}`
			: "/demo"
		: "/";
	const isOverviewActive = pathname === "/";

	return (
		<aside className="hidden md:flex flex-col md:w-20 lg:w-64 backdrop-blur-xl border-r border-t-border-subtle transition-all duration-300 shadow-sm z-40 bg-t-bg-panel">
			{/* Brand Logo */}
			<div className="p-3 lg:p-6 flex justify-center lg:justify-start">
				<Link
					href={overviewHref}
					onClick={onClose}
					className="flex items-center gap-3 group hover:cursor-pointer"
				>
					<div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center">
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

			{/* Main Navigation */}
			<nav className="flex-1 flex flex-col items-center lg:items-stretch px-2 lg:px-4 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
				{/* Global Overview entry (only outside demo mode to avoid duplicate /demo link) */}
				{!isDemoMode && (
					<Link
						href="/"
						title="Przegląd"
						onClick={onClose}
						className={cn(
							"flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 group relative overflow-hidden",
							isOverviewActive
								? "bg-theme-soft text-theme-primary shadow-sm"
								: "hover:bg-black/5 dark:hover:bg-white/5 text-t-text-secondary hover:text-t-text-primary",
						)}
					>
						{isOverviewActive && (
							<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full hidden lg:block bg-theme-primary" />
						)}
						<LayoutDashboard
							className={cn(
								"w-5 h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 transition-transform duration-300 group-hover:scale-110",
								isOverviewActive
									? "text-theme-primary"
									: "text-t-text-tertiary group-hover:text-t-text-primary",
							)}
						/>
						<span className="hidden lg:inline-block">Przegląd</span>
					</Link>
				)}

				{NAV_ITEMS.map((item) => {
					const isDashboardItem = item.href === "/dashboard";

					// Override label for /dashboard so it clearly distinguishes single portfolio from Global Overview
					const itemLabel =
						isDashboardItem && !isDemoMode ? "Aktywny Portfel" : item.name;

					const isActive = isDemoMode
						? isDashboardItem
							? pathname === "/demo"
							: pathname.startsWith(`/demo${item.href}`)
						: isDashboardItem
							? pathname.startsWith("/dashboard") &&
								!pathname.includes("/settings")
							: pathname.startsWith(item.href);

					let finalHref = item.href;

					if (isDemoMode) {
						if (isDashboardItem) finalHref = "/demo";
						if (item.href === "/portfolios") finalHref = "/demo/portfolios";
						if (item.href === "/planner") finalHref = "/demo/planner";
						if (strategy) finalHref += `?s=${strategy}`;
					} else if (activePortfolioId) {
						if (isDashboardItem) {
							finalHref = `/dashboard/${activePortfolioId}`;
						} else {
							finalHref += `?portfolioId=${activePortfolioId}`;
						}
					}

					return (
						<Link
							key={item.href}
							href={finalHref}
							title={itemLabel}
							onClick={onClose}
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
							<span className="hidden lg:inline-block">{itemLabel}</span>
						</Link>
					);
				})}
			</nav>

			{/* Footer (Tools & Settings) */}
			<div className="p-2 md:p-4 border-t border-t-border-subtle flex flex-col gap-2">
				{activePortfolioId &&
					!isDemoMode &&
					(() => {
						const toolsHref = `/dashboard/${activePortfolioId}/settings`;
						const isToolsActive = pathname.startsWith(toolsHref);
						return (
							<Link
								href={toolsHref}
								title="Narzędzia"
								onClick={onClose}
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
							title="Ustawienia"
							onClick={onClose}
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

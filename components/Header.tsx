"use client";

import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import {
	AlertCircle,
	Globe2,
	GraduationCap,
	Menu as HamburgerIcon,
	Settings,
	Wallet2,
	WalletCards,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import Menu from "./shared/DesktopNav";
import ModeToggle from "./shared/header/ModeToggle";
import { RefreshButton } from "./RefreshButton";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface HeaderProps {
	portfolios: { id: string; name: string; colorTheme?: string }[];
	userButton: React.ReactNode;
	selectedPortfolioId: string;
	userRole: string;
	lastUpdated?: string | null;
	colorTheme?: string;
}

export default function Header({
	portfolios,
	userButton,
	selectedPortfolioId,
	userRole,
	lastUpdated,
}: HeaderProps) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const isDemoMode = pathname.startsWith("/demo");
	const router = useRouter();

	const urlPortfolioId =
		searchParams.get("portfolioId") || searchParams.get("portfolio");
	const strategy = searchParams.get("s");
	const segments = pathname.split("/");
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

	const idFromPath = getPathId();
	const currentEnvId = urlPortfolioId || idFromPath;
	const isCurrentValid = portfolios.some((p) => p.id === currentEnvId);

	// 1. ZMIANA: Czyste ID bez zabugowanego "ALL"
	const rawId = isCurrentValid ? currentEnvId : (selectedPortfolioId ?? "");
	const displayValue = isDemoMode ? "" : rawId;

	// 2. ZMIANA: Jasna definicja stron globalnych (te same zarządzają checkboxami)
	const isGlobalPage =
		pathname === "/" ||
		// pathname === "/dashboard" ||
		pathname === "/profile" ||
		pathname === "/settings";

	const handlePortfolioChange = (id: string) => {
		if (id === "enter-demo") {
			router.push("/demo?s=dalio");
			return;
		}

		Cookies.set("selectedPortfolioId", id, { expires: 30, path: "/" });

		// 🚀 FIX 1: Twarde zdjęcie blokady z Radix UI.
		// Gwarantuje, że po kliknięciu strona nigdy nie zostanie "zamrożona" na kliknięcia.
		document.body.style.pointerEvents = "auto";

		setTimeout(() => {
			if (pathname.startsWith("/planner")) {
				router.push(`/planner?portfolioId=${id}`);
			} else if (pathname.startsWith("/activity")) {
				router.push(`/activity?portfolio=${id}`);
			} else if (pathname.startsWith("/settings")) {
				router.push(`/settings?portfolioId=${id}`);
			} else {
				// 🚀 FIX 2: CATCH-ALL (Opcja domyślna).
				// Jeśli zmienisz portfel będąc na Profilu lub jakiejkolwiek innej
				// nieobsługiwanej wyżej stronie, bezpiecznie wylądujesz w Przeglądzie tego portfela.
				router.push(`/dashboard/${id}`);
			}
		}, 150);
	};

	// Zachowujemy ostatnio odwiedzony portfel w ciastku (bez wymuszania przekierowań!)
	useEffect(() => {
		if (pathname.startsWith("/demo")) return;
		const currentId = urlPortfolioId || idFromPath;
		if (currentId && currentId !== Cookies.get("selectedPortfolioId")) {
			Cookies.set("selectedPortfolioId", currentId, { expires: 30, path: "/" });
		}
	}, [urlPortfolioId, idFromPath, pathname]);

	// 🚀 USUNIĘTO: Błędny `useEffect`, który bez pytania wyrzucał Cię na router.replace(). To on gubił portfele!

	// 3. ZMIANA: Uproszczona logika motywów (kolorów)
	useEffect(() => {
		const activePortfolio = portfolios.find((p) => p.id === displayValue);
		const theme = isDemoMode
			? "emerald"
			: isGlobalPage
				? "indigo"
				: activePortfolio?.colorTheme || "blue";

		const wrapper = document.getElementById("app-wrapper");
		if (wrapper) wrapper.setAttribute("data-theme", theme);
		document.documentElement.setAttribute("data-theme", theme);
	}, [displayValue, portfolios, isDemoMode, isGlobalPage]);

	const hasNoPortfolioSelected =
		!displayValue && portfolios.length > 0 && !isDemoMode && !isGlobalPage;

	return (
		<header className="flex justify-between items-center p-3 md:px-5 border-b border-t-border-subtle sticky top-0 z-50 bg-white/70 dark:bg-t-bg-sticky backdrop-blur-md shadow-sm">
			<div className="flex items-center gap-3 flex-1">
				{/* MOBILNY HAMBURGER (Został bez zmian) */}
				<div className="md:hidden">
					<Sheet>
						<SheetTrigger className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-t-text-secondary transition-colors">
							<HamburgerIcon className="w-5 h-5" />
						</SheetTrigger>

						<SheetContent
							side="left"
							className="md:hidden flex flex-col w-72 bg-t-bg-panel border-r border-t-border-subtle text-t-text-primary p-0 shadow-2xl"
						>
							<SheetTitle className="sr-only">Menu Mobilne</SheetTitle>
							<SheetDescription className="sr-only">
								Nawigacja i ustawienia profilu
							</SheetDescription>

							<div className="p-5 border-b border-t-border-subtle flex items-center gap-3 bg-black/5 dark:bg-white/5">
								<SheetTrigger asChild>
									<Link
										href="/"
										className="flex items-center gap-3 group hover:cursor-pointer"
									>
										<div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-black shadow-sm">
											<Image
												src="/logo.svg"
												alt="InvestGuard"
												width={32}
												height={32}
												className="block dark:hidden"
												style={{ width: "auto", height: "auto" }}
											/>
											<Image
												src="/logo-light.svg"
												alt="InvestGuard"
												width={32}
												height={32}
												className="hidden dark:block"
												style={{ width: "auto", height: "auto" }}
											/>
										</div>
										<span className="text-xl font-black tracking-tighter text-theme-primary">
											{APP_NAME}
											<span className="text-theme-primary">.</span>
										</span>
									</Link>
								</SheetTrigger>
							</div>

							<div className="flex-1 flex flex-col p-4 space-y-1.5 overflow-y-auto">
								{NAV_ITEMS.map((item) => {
									const isActive = isDemoMode
										? item.href === "/dashboard"
											? pathname === "/demo"
											: pathname.startsWith(`/demo${item.href}`)
										: pathname.startsWith(item.href);

									let finalHref = item.href;
									if (isDemoMode) {
										if (item.href === "/dashboard") finalHref = "/demo";
										if (item.href === "/portfolios")
											finalHref = "/demo/portfolios";
										if (item.href === "/planner") finalHref = "/demo/planner";
										if (strategy) finalHref += `?s=${strategy}`;
									} else if (rawId) {
										finalHref += `?portfolioId=${rawId}`;
									}

									return (
										<SheetTrigger asChild key={item.href}>
											<Link
												href={finalHref}
												className={cn(
													"flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all",
													isActive
														? "bg-theme-soft text-theme-primary"
														: "hover:bg-black/5 dark:hover:bg-white/5 text-t-text-secondary hover:text-t-text-primary",
													isDemoMode &&
														!["/dashboard", "/portfolios", "/planner"].includes(
															item.href,
														) &&
														"opacity-30 pointer-events-none",
												)}
											>
												<item.icon
													className={cn(
														"w-5 h-5",
														isActive
															? "text-theme-primary"
															: "text-t-text-tertiary",
													)}
												/>
												<span>{item.name}</span>
											</Link>
										</SheetTrigger>
									);
								})}
							</div>

							<div className="p-5 border-t border-t-border-subtle flex items-center justify-between bg-black/5 dark:bg-white/5">
								<div className="flex items-center gap-3 hover:cursor-pointer">
									<ModeToggle />
									{userButton}
								</div>
								<SheetTrigger asChild>
									<Link
										href="/settings"
										className="p-2.5 rounded-xl text-t-text-tertiary hover:text-t-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
									>
										<Settings className="w-5 h-5" />
									</Link>
								</SheetTrigger>
							</div>
						</SheetContent>
					</Sheet>
				</div>

				{/* 4. ZMIANA: KONTEKSTOWY SELEKTOR PORTFELA */}
				<div className="w-full">
					{isGlobalPage ? (
						// Odznaka Globalna - kiedy Dashboard sam zarządza filtrami
						<div className="flex items-center gap-2 px-4 h-11 w-full md:w-80 bg-theme-soft/50 border border-theme-border rounded-xl shadow-sm text-theme-primary cursor-default">
							<Globe2 className="h-4 w-4 shrink-0" />
							<span className="font-black text-[10px] md:text-[11px] uppercase tracking-widest mt-0.5 truncate">
								Widok Skonsolidowany
							</span>
						</div>
					) : (
						// Standardowy Selektor - tylko dla stron roboczych
						<Select
							// key={isDemoMode ? "demo" : `real-${displayValue}`}
							value={displayValue || undefined}
							onValueChange={handlePortfolioChange}
						>
							<SelectTrigger
								className={cn(
									"w-full md:w-80 font-black text-[10px] md:text-[11px] uppercase tracking-widest h-11 rounded-xl transition-all duration-300 ease-in-out border outline-none focus:ring-0",
									displayValue &&
										!isDemoMode &&
										"dark:bg-t-bg-sticky border-theme-border text-theme-primary shadow-sm hover:bg-theme-soft",
									hasNoPortfolioSelected &&
										"bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-500 shadow-[0_0_20px_-3px_rgba(245,158,11,0.3)] animate-pulse hover:animate-none hover:bg-amber-500/20",
									isDemoMode &&
										"bg-theme-soft/50 border-theme-border text-theme-primary shadow-sm hover:bg-theme-soft",
								)}
							>
								<div className="flex items-center gap-2 overflow-hidden">
									{isDemoMode ? (
										<GraduationCap className="h-4 w-4 shrink-0 text-theme-primary" />
									) : hasNoPortfolioSelected ? (
										<AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
									) : (
										<WalletCards className="h-4 w-4 shrink-0 text-theme-primary" />
									)}
									<div className="truncate text-left mt-1 text-theme-primary">
										<SelectValue
											placeholder={
												isDemoMode
													? "Tryb Edukacyjny"
													: portfolios.length === 0
														? "Brak portfeli"
														: "WYBIERZ PORTFEL..."
											}
										/>
									</div>
								</div>
							</SelectTrigger>

							<SelectContent className="rounded-2xl border border-theme-border bg-t-bg-panel shadow-2xl p-1.5 z-100">
								<div className="flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-t-text-tertiary">
									<Wallet2 className="h-3.5 w-3.5" />
									TWOJE PORTFELE
								</div>
								<SelectSeparator className="bg-t-border-subtle mx-1 mb-1" />

								{portfolios.map((p) => (
									<SelectItem
										key={p.id}
										value={p.id}
										className="text-xs font-bold tracking-wide rounded-xl cursor-pointer hover:bg-theme-soft focus:bg-theme-soft focus:text-theme-primary py-2.5 transition-colors"
									>
										{p.name}
									</SelectItem>
								))}

								<SelectSeparator className="bg-t-border-subtle mx-1 my-1" />
								<SelectItem
									value="enter-demo"
									className="text-xs font-bold tracking-wide rounded-xl text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 focus:bg-emerald-500/10 focus:text-emerald-600 dark:focus:text-emerald-400 cursor-pointer py-2.5 transition-colors"
								>
									<div className="flex items-center gap-2">
										<GraduationCap className="h-4 w-4" />
										ZOBACZ DEMO
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					)}
				</div>
			</div>

			{/* PRAWA STRONA */}
			<div className="flex items-center gap-2 md:gap-3">
				{!isGlobalPage && (
					<RefreshButton
						portfolioId={displayValue}
						role={userRole}
						lastUpdated={lastUpdated}
					/>
				)}
				<Menu userButton={userButton} />
			</div>
		</header>
	);
}

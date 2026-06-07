"use client";

import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import {
	AlertCircle,
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
import Menu from "./shared/Menu";
import ModeToggle from "./shared/header/ModeToggle";
import { RefreshButton } from "./RefreshButton";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface HeaderProps {
	portfolios: { id: string; name: string }[];
	userButton: React.ReactNode;
	selectedPortfolioId: string;
	userRole: string;
}

export default function Header({
	portfolios,
	userButton,
	selectedPortfolioId,
	userRole,
}: HeaderProps) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const isDemoMode = pathname.startsWith("/demo");
	const router = useRouter();

	// 1. Pobieramy ID z URL (to jest nadrzędne nad ciasteczkiem!)
	const urlPortfolioId = searchParams.get("portfolioId");

	// 2. Szukamy ID w ścieżce dla wszystkich modułów
	const strategy = searchParams.get("s");
	const segments = pathname.split("/");
	const getPathId = () => {
		const keys = [
			"dashboard",
			"edit",
			"planner",
			"bond-reports",
			"portfolios",
			"alpha-selection",
		];
		const keyIndex = segments.findIndex((s) => keys.includes(s));
		if (
			keyIndex !== -1 &&
			segments[keyIndex + 1] &&
			segments[keyIndex + 1] !== "new"
		) {
			return segments[keyIndex + 1];
		}
		return "";
	};

	const idFromPath = getPathId();
	// EN: Extract ID from the environment (URL or Path) and verify its existence
	// Wyciągamy ID ze środowiska (URL lub ścieżka) i sprawdzamy, czy istnieje w bazie
	const currentEnvId = urlPortfolioId || idFromPath;
	const isCurrentValid = portfolios.some((p) => p.id === currentEnvId);
	// EN: Consolidated logic: Priority: Valid URL ID > Cookie/Server Prop > Empty string
	// Priorytet: Poprawne ID z adresu > Ciasteczko/Serwer > Pusty string
	const rawId = isCurrentValid
		? (currentEnvId ?? "")
		: (selectedPortfolioId ?? "");

	const displayValue = isDemoMode ? "" : rawId;

	const handlePortfolioChange = (id: string) => {
		if (id === "enter-demo") {
			router.push("/demo?s=dalio");
			return;
		}

		Cookies.set("selectedPortfolioId", id, { expires: 30, path: "/" });

		if (pathname === "/planner") {
			router.push(`/planner?portfolioId=${id}`);
		} else {
			router.push(`/dashboard/${id}`);
		}
	};
	// EN: Sync cookie with URL/Path to prevent "lost" selection
	// Synchronizacja ciasteczka z URL
	useEffect(() => {
		if (pathname.startsWith("/demo")) return;

		const currentId = urlPortfolioId || idFromPath;

		if (currentId && currentId !== Cookies.get("selectedPortfolioId")) {
			Cookies.set("selectedPortfolioId", currentId, { expires: 30, path: "/" });
		}
	}, [urlPortfolioId, idFromPath, pathname]);
	// EN: Auto-redirect if we have a saved ID but no ID in URL on main pages
	// Auto-przekierowanie
	useEffect(() => {
		const isMainPage = pathname === "/dashboard" || pathname === "/planner";
		if (isMainPage && selectedPortfolioId && !urlPortfolioId && !idFromPath) {
			if (pathname === "/planner") {
				router.replace(`${pathname}?portfolioId=${selectedPortfolioId}`);
			} else {
				router.replace(`${pathname}/${selectedPortfolioId}`);
			}
		}
	}, [selectedPortfolioId, pathname, urlPortfolioId, idFromPath, router]);

	// WARUNKI STYLOWANIA
	const hasNoPortfolioSelected =
		!displayValue && portfolios.length > 0 && !isDemoMode;

	return (
		<header className="flex justify-between items-center p-3 md:px-5 border-b border-t-border-subtle sticky top-0 z-50 bg-white/70 dark:bg-black/60 backdrop-blur-md shadow-sm">
			{/* LEWA STRONA: Hamburger (Mobile) + Selektor Portfela */}
			<div className="flex items-center gap-3 flex-1">
				{/* MOBILNY HAMBURGER */}
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

							{/* Mobilny Nagłówek: Logo */}
							<div className="p-5 border-b border-t-border-subtle flex items-center gap-3 bg-black/5 dark:bg-white/5">
								<div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-black shadow-sm">
									<Image
										src="/logo-light.svg"
										width={28}
										height={28}
										alt="Invest Guard logo"
										className="h-auto w-auto dark:invert"
									/>
								</div>
								<span
									className={cn(
										"text-xl font-black tracking-tighter",
										isDemoMode ? "text-emerald-500" : "text-t-text-primary",
									)}
								>
									{APP_NAME}
									<span
										className={
											isDemoMode ? "text-emerald-500" : "text-blue-500"
										}
									>
										.
									</span>
								</span>
							</div>

							{/* Mobilna Nawigacja */}
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
														? isDemoMode
															? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
															: "bg-blue-600/10 text-blue-600 dark:text-blue-400"
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
															? isDemoMode
																? "text-emerald-500"
																: "text-blue-500"
															: "text-t-text-tertiary",
													)}
												/>
												<span>{item.name}</span>
											</Link>
										</SheetTrigger>
									);
								})}
							</div>

							{/* Dolna sekcja mobilna */}
							<div className="p-5 border-t border-t-border-subtle flex items-center justify-between bg-black/5 dark:bg-white/5">
								<div className="flex items-center gap-3">
									<ModeToggle />
									{userButton}
								</div>
								<SheetTrigger asChild>
									<Link
										href="/settings"
										className="p-2.5 rounded-xl text-t-text-tertiary hover:text-t-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors pointer-events-none opacity-40"
									>
										<Settings className="w-5 h-5" />
									</Link>
								</SheetTrigger>
							</div>
						</SheetContent>
					</Sheet>
				</div>

				{/* SELEKTOR PORTFELA - WERSJA PREMIUM */}
				<div className="w-full">
					<Select
						key={isDemoMode ? "demo" : `real-${displayValue}`}
						value={displayValue || undefined}
						onValueChange={handlePortfolioChange}
					>
						<SelectTrigger
							className={cn(
								"w-full md:w-80 font-black text-[10px] md:text-[11px] uppercase tracking-widest h-11 rounded-xl transition-all duration-500 ease-in-out border outline-none focus:ring-0",
								// 1. Zwykły stan (Wybrany portfel)
								displayValue &&
									!isDemoMode &&
									"bg-black/5 dark:bg-white/5 border-t-border-subtle hover:border-blue-500/30 text-t-text-primary shadow-sm",

								// 2. ALERT STATE: Brak wybranego portfela (Premium Glow)
								hasNoPortfolioSelected &&
									"bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-500 shadow-[0_0_20px_-3px_rgba(245,158,11,0.3)] animate-pulse hover:animate-none hover:bg-amber-500/20",

								// 3. Demo Mode
								isDemoMode &&
									"border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]",
							)}
						>
							<div className="flex items-center gap-2 overflow-hidden">
								{isDemoMode ? (
									<GraduationCap className="h-4 w-4 shrink-0 text-emerald-500" />
								) : hasNoPortfolioSelected ? (
									<AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
								) : (
									<WalletCards className="h-4 w-4 shrink-0 text-blue-500" />
								)}

								<div className="truncate text-left mt-px">
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

						<SelectContent className="rounded-2xl border border-t-border-subtle bg-t-bg-panel shadow-2xl p-1.5 z-100">
							<div className="flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-t-text-tertiary">
								<Wallet2 className="h-3.5 w-3.5" />
								TWOJE PORTFELE
							</div>
							<SelectSeparator className="bg-t-border-subtle mx-1 mb-1" />

							{portfolios.map((p) => (
								<SelectItem
									key={p.id}
									value={p.id}
									className="text-xs font-bold tracking-wide rounded-xl cursor-pointer focus:bg-blue-600/10 focus:text-blue-500 dark:focus:text-blue-400 py-2.5 transition-colors"
								>
									{p.name}
								</SelectItem>
							))}

							<SelectSeparator className="bg-t-border-subtle mx-1 my-1" />

							{/* Opcja wejścia w demo */}
							<SelectItem
								value="enter-demo"
								className="text-xs font-bold tracking-wide rounded-xl text-emerald-600 dark:text-emerald-500 focus:bg-emerald-500/10 focus:text-emerald-600 dark:focus:text-emerald-400 cursor-pointer py-2.5 transition-colors"
							>
								<div className="flex items-center gap-2">
									<GraduationCap className="h-4 w-4" />
									ZOBACZ DEMO
								</div>
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* PRAWA STRONA */}
			<div className="flex items-center gap-2 md:gap-3">
				<RefreshButton portfolioId={displayValue} role={userRole} />
				<Menu userButton={userButton} />
			</div>
		</header>
	);
}

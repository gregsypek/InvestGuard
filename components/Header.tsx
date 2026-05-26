"use client";

import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import {
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

	// 🚀 ODZYSKANA LOGIKA WALIDACJI I STANU
	const idFromPath = getPathId();

	// EN: Extract ID from the environment (URL or Path) and verify its existence
	// PL: Wyciągamy ID ze środowiska (URL lub ścieżka) i sprawdzamy, czy istnieje w bazie
	const currentEnvId = urlPortfolioId || idFromPath;
	const isCurrentValid = portfolios.some((p) => p.id === currentEnvId);
	// EN: Consolidated logic: Priority: Valid URL ID > Cookie/Server Prop > Empty string
	// PL: Połączona logika: Priorytet: Poprawne ID z adresu > Ciasteczko/Serwer > Pusty string
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
		router.push(`/dashboard/${id}`);
	};

	// EN: Sync cookie with URL/Path to prevent "lost" selection
	// PL: Synchronizacja ciasteczka z URL, aby nie "gubić" wyboru po wyjściu z demo
	useEffect(() => {
		if (pathname.startsWith("/demo")) return;

		const currentId = urlPortfolioId || idFromPath;

		if (currentId && currentId !== Cookies.get("selectedPortfolioId")) {
			Cookies.set("selectedPortfolioId", currentId, { expires: 30, path: "/" });
		}
	}, [urlPortfolioId, idFromPath, pathname]);

	// EN: Auto-redirect if we have a saved ID but no ID in URL on main pages
	// PL: Auto-przekierowanie, jeśli mamy zapisane ID, ale brak go w URL na stronach głównych
	useEffect(() => {
		const isMainPage = pathname === "/dashboard" || pathname === "/planner";
		if (isMainPage && selectedPortfolioId && !urlPortfolioId && !idFromPath) {
			router.replace(`${pathname}/${selectedPortfolioId}`);
		}
	}, [selectedPortfolioId, pathname, urlPortfolioId, idFromPath, router]);
	return (
		<header className="flex justify-between items-center p-2 border-b border-border bg-background text-foreground sticky top-0 z-50">
			{/* LEWA STRONA: Hamburger (Mobile) + Selektor Portfela */}
			<div className="px-2 md:px-5 flex items-center gap-2 md:gap-3">
				{/* MOBILNY HAMBURGER (Widoczny tylko < md) */}
				<div className="md:hidden">
					<Sheet>
						<SheetTrigger className="p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground transition-colors align-middle">
							<HamburgerIcon className="w-6 h-6" />
						</SheetTrigger>

						{/* Klasa md:hidden gwarantuje brak konfliktu podwójnego sidebaru przy zmianie wielkości ekranu */}
						<SheetContent
							side="left"
							className="md:hidden flex flex-col w-72 bg-sidebar border-r-slate-800 text-white p-0"
						>
							<SheetTitle className="sr-only">Menu Mobilne</SheetTitle>
							<SheetDescription className="sr-only">
								Nawigacja i ustawienia profilu
							</SheetDescription>

							{/* Mobilny Nagłówek: Logo */}
							<div className="p-4 border-b border-slate-800 flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg flex items-center justify-center">
									<Image
										src="/logo-light.svg"
										width={32}
										height={32}
										alt="Invest Guard logo"
										className="h-auto w-auto"
									/>
								</div>
								<span
									className={cn(
										"text-lg font-black tracking-tighter",
										isDemoMode ? "text-emerald-500" : "text-blue-200",
									)}
								>
									{APP_NAME}
									<span className={isDemoMode ? "text-emerald-500" : ""}>
										.
									</span>
								</span>
							</div>

							{/* Mobilna Nawigacja oparta o zweryfikowane rawId */}
							<div className="flex-1 flex flex-col p-3 space-y-1 overflow-y-auto">
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
													"flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
													isActive
														? isDemoMode
															? "bg-emerald-600/10 text-emerald-500 border border-emerald-600/20"
															: "bg-blue-600/10 text-blue-400 border border-blue-600/20"
														: "hover:bg-slate-800 hover:text-white text-slate-300",
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
																: "text-blue-400"
															: "text-slate-500",
													)}
												/>
												<span>{item.name}</span>
											</Link>
										</SheetTrigger>
									);
								})}
							</div>

							{/* Dolna sekcja mobilna: Profil, Motyw i nieaktywne Ustawienia */}
							<div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/40">
								<div className="flex items-center gap-2">
									<ModeToggle />
									{userButton}
								</div>
								<SheetTrigger asChild>
									<Link
										href="/settings"
										className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors pointer-events-none opacity-40"
									>
										<Settings className="w-5 h-5" />
									</Link>
								</SheetTrigger>
							</div>
						</SheetContent>
					</Sheet>
				</div>

				{/* SELEKTOR PORTFELA */}
				<Select
					key={isDemoMode ? "demo" : `real-${displayValue}`}
					value={displayValue || undefined}
					onValueChange={handlePortfolioChange}
				>
					<SelectTrigger
						className={cn(
							"w-[145px] sm:w-48 md:w-60 bg-muted/50 border-border2 font-bold text-[10px] md:text-[11px] uppercase tracking-widest h-9 transition-all",
							!displayValue && portfolios.length > 0 && !isDemoMode
								? "border-primary/50 animate-pulse"
								: "border-border2",
							isDemoMode &&
								"border-emerald-500/50 bg-emerald-500/5 text-emerald-600 ring-emerald-500/20",
						)}
					>
						<div className="flex items-center gap-2 overflow-hidden">
							{isDemoMode ? (
								<GraduationCap className="h-4 w-4 shrink-0 text-emerald-600" />
							) : (
								<WalletCards
									className={cn(
										"h-4 w-4 shrink-0",
										displayValue ? "text-primary" : "text-muted-foreground",
									)}
								/>
							)}
							<div className="truncate text-left">
								<SelectValue
									placeholder={
										isDemoMode
											? "Tryb Edukacyjny"
											: portfolios.length === 0
												? "Brak portfeli"
												: "Wybierz portfel..."
									}
								/>
							</div>
						</div>
					</SelectTrigger>

					<SelectContent>
						<div className="flex items-center gap-2 text-xs font-bold text-blue-500 focus:text-blue-600 cursor-pointer">
							<div className="flex items-center gap-2 py-2">
								<Wallet2 className="h-4 w-4 text-blue-500" />
								TWOJE PORTFELE
							</div>
						</div>
						<SelectSeparator />

						{portfolios.map((p) => (
							<SelectItem
								key={p.id}
								value={p.id}
								className="text-xs font-medium focus:bg-primary/10"
							>
								{p.name}
							</SelectItem>
						))}

						<SelectSeparator />
						{/* 4. Stała opcja wejścia w demo dostępna zawsze w liście */}
						<SelectItem
							value="enter-demo"
							className="text-xs font-bold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer"
						>
							<div className="flex items-center gap-2">
								<GraduationCap className="h-4 w-4" />
								ZOBACZ DEMO
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* PRAWA STRONA: Odświeżanie + Menu Desktopowe */}
			<div className="px-2 md:px-5 flex items-center gap-2 md:gap-3">
				<RefreshButton portfolioId={displayValue} role={userRole} />
				<Menu userButton={userButton} />
			</div>
		</header>
	);
}

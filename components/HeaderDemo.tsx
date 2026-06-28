"use client";

import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import {
	GraduationCap,
	LogOut,
	Menu as MenuIcon,
	Settings,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
} from "./ui/sheet";
// 🚀 ZMIANA: Importujemy useRouter z next/navigation, a nie z next/router!
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import Menu from "./shared/Menu";
import ModeToggle from "./shared/header/ModeToggle";
import { cn } from "@/lib/utils";

const DEMO_OPTIONS = [
	{ id: "demo-classic", name: "Demo: Klasyczny 60/40", key: "classic" },
	{ id: "demo-dalio", name: "Demo: Ray Dalio", key: "dalio" },
	{ id: "demo-yale", name: "Demo: Model Yale", key: "yale" },
];

interface HeaderDemoProps {
	portfolios?: { id: string; name: string }[];
	selectedPortfolioId: string;
}

export default function HeaderDemo({
	portfolios = [],
	selectedPortfolioId,
}: HeaderDemoProps) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter(); // Teraz zadziała bez błędu
	const isDemoMode = pathname.startsWith("/demo");

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

	// Priorytet: Poprawne ID z adresu > Ciasteczko/Serwer > Pusty string
	const rawId = isCurrentValid
		? (currentEnvId ?? "")
		: (selectedPortfolioId ?? "");

	const displayValue = isDemoMode ? "" : rawId;

	const handlePortfolioChange = (id: string) => {
		const demo = DEMO_OPTIONS.find((d) => d.id === id);
		if (demo) {
			// 🚀 ZMIANA: Używamy router.push zamiast window.location dla płynnego przejścia (SPA)
			router.push(`/demo?s=${demo.key}`);
			return;
		}
		// Normalna ścieżka (wyjście z demo do prawdziwego portfela)
		Cookies.set("selectedPortfolioId", id, { expires: 30, path: "/" });
		window.location.href = `/dashboard/${id}`; // Tutaj zostawiamy twardy reload, by wyczyścić stan
	};

	return (
		<>
			{/* 1. PUSTY WYPEŁNIACZ */}
			<div className="h-[68px] w-full" />

			{/* 2. GŁÓWNY PASEK */}
			<div className="fixed top-0 right-0 z-50 flex flex-col shadow-lg w-full md:w-[calc(100%-5rem)] lg:w-[calc(100%-16rem)]">
				{/* Górna, grubsza część paska z przyciskami */}
				<div className="w-full bg-emerald-600 dark:bg-emerald-700 border-b border-emerald-500 dark:border-emerald-800 text-white transition-colors duration-300">
					<div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-2 flex justify-between items-center">
						{/* ========================================== */}
						{/* LEWA STRONA: Hamburger (Mobile) + Select */}
						{/* ========================================== */}
						<div className="flex items-center gap-3">
							{/* MOBILNY HAMBURGER (Widoczny tylko na < md) */}
							<div className="md:hidden">
								<Sheet>
									{/* Zmodyfikowany Trigger pasujący do zielonego paska! */}
									<SheetTrigger className="p-2 rounded-xl bg-black/10 hover:bg-black/20 text-white transition-colors flex items-center justify-center">
										<MenuIcon className="w-5 h-5" />
									</SheetTrigger>

									{/* Zawartość Sheet */}
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
											<SheetTrigger asChild>
												<Link
													href="/"
													className="flex items-center gap-3 group hover:cursor-pointer"
												>
													<div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-black shadow-sm">
														<Image
															src="/logo.svg"
															alt="InvestGuard Logo"
															width={32}
															height={32}
															className="block dark:hidden object-contain"
															style={{ width: "auto", height: "auto" }}
														/>
														<Image
															src="/logo-light.svg"
															alt="InvestGuard Logo"
															width={32}
															height={32}
															className="hidden dark:block object-contain"
															style={{ width: "auto", height: "auto" }}
														/>
													</div>
													<span className="text-xl font-black tracking-tighter text-emerald-500">
														{APP_NAME}
														<span className="text-emerald-500">.</span>
													</span>
												</Link>
											</SheetTrigger>
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
													if (item.href === "/planner")
														finalHref = "/demo/planner";
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
																	![
																		"/dashboard",
																		"/portfolios",
																		"/planner",
																	].includes(item.href) &&
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

										{/* Dolna sekcja mobilna (Z ModeToggle i Ustawieniami) */}
										<div className="p-5 border-t border-t-border-subtle flex items-center justify-between bg-black/5 dark:bg-white/5">
											<div className="flex items-center gap-3 hover:cursor-pointer">
												<ModeToggle />
												{/* Atrapa Avatara w trybie Demo */}
												<div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold">
													DM
												</div>
											</div>
											<SheetTrigger asChild>
												<Link
													href="/settings"
													className="p-2.5 rounded-xl text-t-text-tertiary hover:text-t-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors hover:cursor-pointer"
												>
													<Settings className="w-5 h-5" />
												</Link>
											</SheetTrigger>
										</div>
									</SheetContent>
								</Sheet>
							</div>

							{/* Twój Select Portfela Demo */}
							<Select
								value={selectedPortfolioId}
								onValueChange={handlePortfolioChange}
							>
								<SelectTrigger className="w-64 font-bold text-[11px] uppercase tracking-widest h-9 border-none bg-black/10 hover:bg-black/20 text-white focus:ring-0 transition-colors shadow-none">
									<div className="flex items-center gap-2 overflow-hidden">
										<GraduationCap className="h-4 w-4 shrink-0 text-emerald-100" />
										<div className="truncate text-left">
											<SelectValue placeholder="Wybierz portfel demo..." />
										</div>
									</div>
								</SelectTrigger>
								<SelectContent>
									<div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
										Portfele Demo
									</div>
									{DEMO_OPTIONS.map((d) => (
										<SelectItem
											key={d.id}
											value={d.id}
											className="font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer"
										>
											{d.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* ========================================== */}
						{/* PRAWA STRONA: Przycisk Wyjścia & ModeToggle */}
						{/* ========================================== */}
						<div className="flex items-center gap-2 md:gap-4">
							<div className="text-white opacity-90 hover:opacity-100 transition-opacity">
								<Menu
									userButton={
										<div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-bold border border-white/10 shadow-inner">
											DM
										</div>
									}
								/>
							</div>

							<Link
								href="/dashboard"
								className="flex items-center gap-2 text-[10px] font-black uppercase bg-black/10 px-4 py-2 rounded-full text-white hover:bg-rose-500 hover:text-white transition-all shadow-sm"
							>
								<LogOut className="h-3.5 w-3.5 shrink-0" />
								<span className="hidden sm:inline">Opuść Demo</span>
							</Link>
						</div>
					</div>
				</div>

				{/* Dolna, cienka część informacyjna */}
				<div className="w-full bg-emerald-800 dark:bg-emerald-950 text-emerald-100/90 text-[9px] text-center font-bold uppercase tracking-[0.3em] py-1.5 transition-colors duration-300">
					Tryb Edukacyjny • Przeglądasz portfel wzorcowy • Edycja zablokowana
				</div>
			</div>
		</>
	);
}

import { HeaderTexture } from "./HeaderTexture";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppHeaderLayoutProps {
	breadcrumbs?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	filters?: ReactNode;
	mainStatLabel: ReactNode;
	mainStatValue: ReactNode;
	mainStatSuffix?: ReactNode;
	secondaryStats?: ReactNode;
	className?: string;
}

export function AppHeaderLayout({
	breadcrumbs,
	title,
	description,
	actions,
	filters,
	mainStatLabel,
	mainStatValue,
	mainStatSuffix = "PLN",
	secondaryStats,
	className,
}: AppHeaderLayoutProps) {
	return (
		<header
			className={cn(
				"relative overflow-hidden flex flex-col gap-6 md:gap-6 -mx-3 md:-mx-10 px-3 md:px-10 py-3 md:py-6 rounded-b-2xl shadow-lg",

				// ==========================================
				//  TŁO I GRADIENTY NAGŁÓWKA
				// ==========================================
				"bg-slate-950", // 1. Baza: Najciemniejszy granat/czerń

				// 2. Gradient: Z lewej strony mocny kolor motywu (np. /30 oznacza 30% widoczności).
				// Jeśli chcesz mocniejszy kolor motywu, zmień /30 na /50 lub /80!
				// "bg-gradient-to-r from-theme-primary/20 via-slate-900 to-slate-950",
				"bg-linear-to-r from-theme-primary-light dark:from-theme-primary-dark via-slate-900 to-slate-950",
				// 3. Ramka na samym dole (oddzielająca od jasnego tła reszty strony)
				"border-b border-theme-primary/20",

				// 4. Domyślny kolor tekstu wewnątrz (wymuszamy jasny, by był czytelny)
				"text-slate-200",
				// ==========================================

				className,
			)}
		>
			{/* Dynamiczne SVG w tle - ono również pobiera kolor z motywu! */}
			<HeaderTexture />

			<div className="relative z-10 flex flex-col gap-2">
				{/* Breadcrumbsy automatycznie przyjmą jasny odcień dzięki wymuszeniu w CSS */}
				{breadcrumbs}

				<div className="flex items-start justify-between gap-4 mt-1 sm:mt-2">
					<div className="flex-1">
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-black capitalize flex items-center gap-3 drop-shadow-sm text-slate-300">
							{title}
						</h1>
						{description && (
							//  Kolor małego opisu pod tytułem
							<p className="text-slate-300/80 font-medium mt-1 text-[11px] sm:text-sm md:text-base leading-tight">
								{description}
							</p>
						)}
					</div>
					{actions && <div className="shrink-0">{actions}</div>}
				</div>

				{/* Pasek z tagami */}
				{filters && (
					//  Zmieniamy pasek filtrów na taki z "mrożonego szkła"
					<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-4 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md shadow-inner w-full min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
						{filters}
					</div>
				)}
			</div>

			<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-6 pb-1 mt-2">
				<div className="space-y-1 w-full md:w-auto shrink-0">
					<div className="flex items-center gap-1.5 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase mb-1">
						{/*  Kolor małego napisu nad wielką kwotą (np. text-theme-primary lub text-slate-400) */}
						<span className="text-slate-400 flex items-center gap-1.5">
							{mainStatLabel}
						</span>
					</div>
					<div className="flex items-baseline gap-1.5 sm:gap-2">
						{/*  Główna, ogromna kwota */}
						<h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-md truncate">
							{mainStatValue}
						</h2>
						{mainStatSuffix && (
							<span className="text-lg sm:text-xl md:text-2xl text-slate-400 font-bold uppercase">
								{mainStatSuffix}
							</span>
						)}
					</div>
				</div>

				{secondaryStats && (
					<div className="flex self-start sm:justify-end flex-wrap gap-4 sm:gap-6 md:gap-10 w-full md:w-auto mt-4 md:mt-0">
						{secondaryStats}
					</div>
				)}
			</div>
		</header>
	);
}

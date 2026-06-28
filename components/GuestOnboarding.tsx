import {
	ArrowRight,
	BarChart3,
	BookOpen,
	Globe,
	LineChart,
	Mail,
	Moon,
	PieChart,
	Rocket,
	Settings2,
	ShieldCheck,
	Target,
	UploadCloud,
	Video,
	Wand2,
	Zap,
} from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { Button } from "./ui/button";
import Image from "next/image";
import { Input } from "./ui/input";
import Link from "next/link";

export default function GuestOnboarding() {
	return (
		<div className="flex flex-col min-h-[calc(100vh-4rem)] bg-t-bg-base text-t-text-primary overflow-hidden font-sans selection:bg-blue-500/30 transition-colors duration-300">
			{/* --- TŁO: NOWOCZESNA SIATKA (SVG PATTERN) I ŚWIATŁA --- */}
			{/* <div className="fixed inset-0 z-0 pointer-events-none flex justify-center">
				<div className="absolute inset-0 opacity-20 dark:opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNDgsIDE2MywgMTg0LCAwLjIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
				<div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full" />
			</div> */}
			{/* --- TŁO: TERMINAL TRADINGOWY & TREND WZROSTOWY --- */}
			{/* --- TŁO: ABSTRAKCYJNY WYKRES (MOVING AVERAGES & PRICE ACTION) --- */}
			<div className="fixed inset-0 z-0 pointer-events-none flex justify-center overflow-hidden">
				{/* 1. Delikatna siatka w kropki (Daje technologiczny, matematyczny charakter) */}
				<svg
					className="absolute inset-0 w-full h-full text-t-text-tertiary opacity-[0.09] dark:opacity-[0.09]"
					xmlns="http://www.w3.org/2000/svg"
				>
					<defs>
						<pattern
							id="dot-grid"
							width="32"
							height="32"
							patternUnits="userSpaceOnUse"
						>
							{/* Zmniejszony promień kropki z r="1.5" na r="1" */}
							<circle cx="2" cy="2" r="1" fill="currentColor" />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#dot-grid)" />
				</svg>
				{/* 2. Kreski giełdowe - Abstrakcyjny Wykres */}
				<svg
					className="absolute inset-0 w-full h-full"
					viewBox="0 0 1200 800"
					preserveAspectRatio="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					{/* Linia 1: Zmienna linia trendu (tzw. Price Action - ostre załamania) */}
					<polyline
						points="-100,750 150,700 250,550 320,600 500,450 580,480 850,200 950,250 1300,50"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeDasharray="4 6"
						className="text-t-text-tertiary opacity-30 dark:opacity-20"
						vectorEffect="non-scaling-stroke"
					/>

					{/* Linia 2: Szybka Średnia Krocząca (Gładka, wybijająca w górę) */}
					<path
						d="M -100 780 C 200 750, 300 450, 550 500 C 800 550, 900 250, 1300 100"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						className="text-blue-500/30 dark:text-blue-400/20"
						vectorEffect="non-scaling-stroke"
					/>

					{/* Linia 3: Wolna Średnia Krocząca (Szersza, spokojniejsza) */}
					<path
						d="M -100 800 C 350 800, 450 550, 700 600 C 950 650, 1000 350, 1300 200"
						fill="none"
						stroke="currentColor"
						strokeWidth="6"
						className="hidden lg:block text-cyan-500/15 dark:text-cyan-400/10"
						vectorEffect="non-scaling-stroke"
					/>
				</svg>

				{/* 3. Gradient maskujący (Zanikanie u dołu i na górze dla płynnego wtopienia w tło) */}
				<div className="absolute inset-0 bg-gradient-to-b from-t-bg-base/30 via-transparent to-t-bg-base" />

				{/* 4. Subtelne oświetlenie na "szczytach" wykresu (Golden Cross Glow) */}
				<div className="absolute top-[20%] right-[20%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/15 blur-[120px] rounded-full" />
				<div className="absolute bottom-[40%] left-[30%] w-[300px] h-[300px] bg-cyan-500/10 dark:bg-cyan-500/10 blur-[100px] rounded-full" />
			</div>

			<div className="relative z-10 flex flex-col items-center">
				{/* ========================================= */}
				{/* 1. HERO SECTION */}
				{/* ========================================= */}
				<section className="relative flex flex-col items-center justify-center pt-8 pb-24 px-4 w-full max-w-5xl mx-auto text-center animate-in slide-in-from-bottom-8 fade-in duration-1000">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-500 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
						<span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
						Terminal Inwestycyjny
					</div>

					<h1 className="text-6xl md:text-7xl lg:text-8xl leading-[1.1] mb-6 font-black tracking-tighter text-t-text-primary">
						Twój
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-cyan-600 to-blue-500">
							{" "}
							portfel.
						</span>
						<br /> Pod kontrolą.
					</h1>
					<p className="text-md md:text-xl text-t-text-secondary max-w-2xl mx-auto font-medium leading-relaxed mb-10">
						Automatyzacja, której brakuje w tradycyjnych tabelach. Wgrywaj
						raporty, symuluj przyszłość, buduj bogactwo.
					</p>

					<div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
						<Button
							asChild
							className="h-14 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 border-0"
						>
							<Link href="/sign-in">
								Rozpocznij Inwestowanie <ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="h-14 px-8 rounded-xl border-t-border bg-t-bg-panel hover:bg-black/5 dark:hover:bg-white/5 text-t-text-primary font-bold uppercase tracking-widest text-xs backdrop-blur-sm transition-all"
						>
							<Link href="/demo">Zbadaj środowisko Demo</Link>
						</Button>
					</div>
				</section>
				{/* ========================================= */}
				{/* 2. SHOWCASE (ZDJĘCIE APLIKACJI) */}
				{/* ========================================= */}
				<section className="w-full max-w-6xl mx-auto p-4 pb-32 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-200">
					<div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden border border-t-border shadow-2xl bg-t-bg-panel p-0 group">
						{/* Gradient maskujący na dole zdjęcia */}
						<div className="absolute inset-0 bg-gradient-to-t from-t-bg-base via-transparent to-transparent z-10 pointer-events-none" />

						{/* Wersja dla jasnego motywu */}
						<Image
							src="/screenshots/investGuard_quest_light.png"
							alt="InvestGuard Dashboard"
							width={1200}
							height={1100}
							priority
							className="block dark:hidden w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.01]"
						/>

						{/* Wersja dla ciemnego motywu */}
						<Image
							src="/screenshots/investGuard_quest_dark.png"
							alt="InvestGuard Dashboard"
							width={1200}
							height={1100}
							priority
							className="hidden dark:block w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.01]"
						/>
					</div>
				</section>
				{/* ========================================= */}
				{/* BENTO GRID - GŁÓWNA SIATKA FUNKCJI */}
				{/* ========================================= */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
					{/* 1. IMPORT & AUTOMATYZACJA (Tekst) */}
					<div className="lg:col-span-1 bg-gradient-to-br from-t-bg-panel to-t-bg-base p-6 sm:p-8 rounded-3xl border border-t-border hover:border-blue-500/30 transition-colors relative overflow-hidden group flex flex-col justify-center">
						<div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
						<UploadCloud className="w-10 h-10 text-blue-500 dark:text-blue-400 mb-6" />
						<h3 className="text-2xl font-black text-t-text-primary mb-3">
							Inteligentny Import & Automatyzacja
						</h3>
						<p className="text-t-text-secondary leading-relaxed">
							Wygeneruj raport CSV z <strong>XTB</strong> lub zestawienie
							obligacji z <strong>PKO BP</strong>. Nasz parser automatycznie
							rozpozna transakcje, zaktualizuje kategorie i precyzyjnie wyliczy
							saldo, oszczędzając Ci godzin ręcznej pracy.
						</p>
					</div>

					{/* 2. XTB DASHBOARD (Zdjęcie) */}
					<div className="lg:col-span-2 min-h-[350px] bg-gradient-to-br from-t-bg-panel to-t-bg-base p-4 sm:p-5 rounded-3xl border border-t-border hover:border-blue-500/30 transition-colors group flex flex-col">
						<div className="relative w-full h-full grow min-h-[220px] sm:min-h-[280px] rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base">
							<div className="absolute inset-0 bg-gradient-to-t from-t-bg-base/90 via-transparent to-transparent z-10 pointer-events-none" />

							<Image
								src="/screenshots/GuestBoard/xtb_light.png"
								alt="InvestGuard Dashboard"
								fill
								priority
								className="block dark:hidden object-cover transition-transform duration-700 group-hover:scale-[1.02]"
							/>
							<Image
								src="/screenshots/GuestBoard/xtb_dark.png"
								alt="InvestGuard Dashboard"
								fill
								priority
								className="hidden dark:block object-cover transition-transform duration-700 group-hover:scale-[1.02]"
							/>
						</div>
					</div>

					{/* 3. REJESTR TRANSAKCJI (Zdjęcie) */}
					<div className="lg:col-span-3 min-h-[400px] sm:min-h-[450px] bg-gradient-to-br from-t-bg-panel to-t-bg-base p-4 sm:p-5 rounded-3xl border border-t-border hover:border-indigo-500/30 transition-colors group flex flex-col">
						<div className="px-2 pt-2 pb-6">
							<div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20 group-hover:scale-110 transition-transform">
								<LineChart className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
							</div>
							<h3 className="text-2xl font-black text-t-text-primary mb-3">
								Rejestr Transakcji & Raportowanie
							</h3>
							<p className="text-t-text-secondary leading-relaxed max-w-2xl mb-5">
								Wykres precyzyjnie wizualizuje punkty Twoich zakupów i sprzedaży
								na tle późniejszego zachowania ceny. Wyciągaj wnioski z własnych
								decyzji i generuj przejrzyste raporty okresowe.
							</p>
							<div className="flex gap-2 sm:gap-3 flex-wrap">
								<span className="px-3 py-1 bg-black/5 dark:bg-black/30 border border-t-border-subtle rounded-lg text-[10px] uppercase font-bold text-t-text-secondary shadow-sm">
									Punkty Wejścia
								</span>
								<span className="px-3 py-1 bg-black/5 dark:bg-black/30 border border-t-border-subtle rounded-lg text-[10px] uppercase font-bold text-t-text-secondary shadow-sm">
									Zaawansowane Filtry
								</span>
							</div>
						</div>

						<div className="relative w-full h-full grow min-h-[220px] sm:min-h-[260px] rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base">
							<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-t-bg-base/90 via-t-bg-base/40 to-transparent z-10 pointer-events-none" />
							<Image
								src="/screenshots/GuestBoard/history_light.png"
								alt="Historia i Rejestr Transakcji"
								fill
								priority
								className="block dark:hidden object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
							/>
							<Image
								src="/screenshots/GuestBoard/history_dark.png"
								alt="Historia i Rejestr Transakcji"
								fill
								priority
								className="hidden dark:block object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
							/>
						</div>
					</div>

					{/* MAŁA KARTA: Rebalancing - LEFT PHOTO */}
					<div className="bg-gradient-to-br from-t-bg-panel to-t-bg-base p-3 sm:p-4 rounded-3xl border border-t-border hover:border-blue-500/30 transition-colors group flex flex-col min-h-[260px] md:min-h-[300px]">
						<div className="relative w-full h-full grow rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base flex items-center justify-center p-2">
							<div className="absolute inset-0 bg-gradient-to-t from-t-bg-base/90 via-transparent to-transparent z-10 pointer-events-none" />

							{/* 🚀 ZMIANA: object-contain zamienia ucinanie na skalowanie całości */}
							<Image
								src="/screenshots/GuestBoard/pieChart_light_left.png"
								alt="InvestGuard Dashboard"
								fill
								priority
								className="block dark:hidden object-contain object-center transition-transform duration-700 group-hover:scale-[1.02] p-2"
							/>
							<Image
								src="/screenshots/GuestBoard/pieChart_dark_left.png"
								alt="InvestGuard Dashboard"
								fill
								priority
								className="hidden dark:block object-contain object-center transition-transform duration-700 group-hover:scale-[1.02] p-2"
							/>
						</div>
					</div>

					{/*  MAŁA KARTA: Rebalancing - TEXT) */}
					<div className="bg-t-bg-panel p-8 rounded-3xl border border-t-border hover:border-cyan-500/30 transition-colors">
						<PieChart className="w-10 h-10 text-cyan-500 dark:text-cyan-400 mb-6" />
						<h3 className="text-xl font-black text-t-text-primary mb-3">
							Precyzyjny Rebalancing
						</h3>
						<p className="text-sm text-t-text-tertiary leading-relaxed">
							Porównaj obecną strukturę portfeli z Twoim celem. Zobacz na żywo
							modelową alokację w zestawieniu z rzeczywistym stanem posiadania.
						</p>
					</div>

					{/* MAŁA KARTA: Rebalancing - RIGHT PHOTO */}
					<div className="bg-gradient-to-br from-t-bg-panel to-t-bg-base p-3 sm:p-4 rounded-3xl border border-t-border hover:border-blue-500/30 transition-colors group flex flex-col min-h-[260px] md:min-h-[300px]">
						<div className="relative w-full h-full grow rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base flex items-center justify-center p-2">
							<div className="absolute inset-0 bg-gradient-to-t from-t-bg-base/90 via-transparent to-transparent z-10 pointer-events-none" />

							{/* 🚀 ZMIANA: object-contain zamienia ucinanie na skalowanie całości */}
							<Image
								src="/screenshots/GuestBoard/pieChart_light_right.png"
								alt="InvestGuard Dashboard"
								fill
								priority
								className="block dark:hidden object-contain sm:object-cover object-center transition-transform duration-700 group-hover:scale-[1.02] p-2"
							/>
							<Image
								src="/screenshots/GuestBoard/pieChart_dark_right.png"
								alt="InvestGuard Dashboard"
								fill
								priority
								className="hidden dark:block object-contain sm:object-cover object-center transition-transform duration-700 group-hover:scale-[1.02] p-2"
							/>
						</div>
					</div>

					{/* MAŁA KARTA: Rebalancing - LEFT PHOTO */}
					<div className="sm:col-span-1  md:min-h-[300px] bg-gradient-to-br from-t-bg-panel to-t-bg-base p-4 rounded-3xl border border-t-border hover:border-blue-500/30 transition-colors group flex flex-col">
						{/* 🚀 ZMIANA: Wewnętrzny kontener, który automatycznie szanuje padding (p-4) rodzica. 
														Używamy overflow-hidden, aby zdjęcie i gradient idealnie zamykały się w zaokrąglonych rogach. */}
						<div className="relative w-full h-full grow md:min-h-[260px] rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base">
							{/* Gradient maskujący nałożony wewnątrz wrappera bezpośrednio na zdjęcie */}
							<div className="absolute inset-0 bg-gradient-to-t from-t-bg-base/90 via-transparent to-transparent z-10 pointer-events-none" />

							{/* 🚀 ZMIANA: Używamy atrybutu "fill" z Next.js zamiast width/height. 
															Automatycznie wypełni on kontener zachowując proporcje dzięki object-cover */}
							{/* Wersja dla jasnego motywu */}
							<Image
								src="/screenshots/GuestBoard/pieChart_light_left.png"
								alt="InvestGuard Dashboard"
								fill
								priority
								className="block dark:hidden object-cover transition-transform duration-700 group-hover:scale-[1.02]"
							/>

							{/* Wersja dla ciemnego motywu */}
							<Image
								src="/screenshots/GuestBoard/pieChart_dark_left.png"
								alt="InvestGuard Dashboard"
								fill
								priority
								className="hidden dark:block object-cover transition-transform duration-700 group-hover:scale-[1.02]"
							/>
						</div>
					</div>

					{/* MAŁA KARTA: Rebalancing */}
					<div className="bg-t-bg-panel p-8 rounded-3xl border border-t-border hover:border-cyan-500/30 transition-colors">
						<PieChart className="w-10 h-10 text-cyan-500 dark:text-cyan-400 mb-6" />
						<h3 className="text-xl font-black text-t-text-primary mb-3">
							Precyzyjny Rebalancing
						</h3>
						<p className="text-sm text-t-text-tertiary leading-relaxed">
							Porównaj obecną strukturę portfeli z Twoim celem. Zobacz na żywo
							modelową alokację w zestawieniu z rzeczywistym stanem posiadania.
						</p>
					</div>
					{/* MAŁA KARTA: Rebalancing - RIGHT PHOTO */}
					<div className="sm:col-span-1 min-h-[300px] bg-gradient-to-br from-t-bg-panel to-t-bg-base p-4 rounded-3xl border border-t-border hover:border-blue-500/30 transition-colors group flex flex-col">
						{/* 🚀 ZMIANA: Wewnętrzny kontener, który automatycznie szanuje padding (p-4) rodzica. 
														Używamy overflow-hidden, aby zdjęcie i gradient idealnie zamykały się w zaokrąglonych rogach. */}
						<div className="relative w-full h-full grow min-h-[260px] rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base">
							{/* Gradient maskujący nałożony wewnątrz wrappera bezpośrednio na zdjęcie */}
							<div className="absolute inset-0 bg-gradient-to-t from-t-bg-base/90 via-transparent to-transparent z-10 pointer-events-none" />

							{/* 🚀 ZMIANA: Używamy atrybutu "fill" z Next.js zamiast width/height. 
															Automatycznie wypełni on kontener zachowując proporcje dzięki object-cover */}
							{/* Wersja dla jasnego motywu */}
							<Image
								src="/screenshots/GuestBoard/pieChart_light_right.png"
								alt="InvestGuard Dashboard"
								fill
								priority
								className="block dark:hidden object-cover transition-transform duration-700 group-hover:scale-[1.02]"
							/>

							{/* Wersja dla ciemnego motywu */}
							<Image
								src="/screenshots/GuestBoard/pieChart_dark_right.png"
								alt="InvestGuard Dashboard"
								fill
								priority
								className="hidden dark:block object-cover transition-transform duration-700 group-hover:scale-[1.02]"
							/>
						</div>
					</div>

					{/* 4. PRZEWODNIK REBALANSOWANIA (Zdjęcie - Zastępuje starą kartę PieChart) */}
					<div className="lg:col-span-3 min-h-[400px] sm:min-h-[450px] bg-gradient-to-br from-t-bg-panel to-t-bg-base p-4 sm:p-5 rounded-3xl border border-t-border hover:border-cyan-500/30 transition-colors group flex flex-col">
						<div className="px-2 pt-2 pb-4">
							<div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 border border-cyan-500/20 group-hover:scale-110 transition-transform">
								<PieChart className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
							</div>
							<h3 className="text-xl font-black text-t-text-primary mb-2 tracking-tight">
								Przewodnik Rebalansowania
							</h3>
							<p className="text-sm text-t-text-secondary leading-relaxed">
								Od razu wiesz co robić. Kalkulator precyzyjnie wylicza, ile
								aktywów musisz kupić lub sprzedać, by przywrócić idealną
								alokację.
							</p>
						</div>

						<div className="relative w-full h-full grow min-h-[180px] sm:min-h-[220px] rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base mt-2">
							<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-t-bg-base via-t-bg-base/50 to-transparent z-10 pointer-events-none" />
							<Image
								src="/screenshots/GuestBoard/healthTable_light2.png"
								alt="Tabela Rebalancingu"
								fill
								priority
								className="block dark:hidden object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
							/>
							<Image
								src="/screenshots/GuestBoard/healthTable_dark2.png"
								alt="Tabela Rebalancingu"
								fill
								priority
								className="hidden dark:block object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
							/>
						</div>
					</div>

					{/* 5. PLANNER (Tekst) */}
					<div className="bg-t-bg-panel p-6 sm:p-8 rounded-3xl border border-t-border hover:border-purple-500/30 transition-colors">
						<Target className="w-10 h-10 text-purple-500 dark:text-purple-400 mb-6" />
						<h3 className="text-xl font-black text-t-text-primary mb-3">
							Planner & Projekcje
						</h3>
						<p className="text-sm text-t-text-secondary leading-relaxed">
							Kontroluj przepływ gotówki planując nadchodzące zakupy. System
							wizualizuje oczekujące realizacje i symuluje osiągnięcie celu.
						</p>
					</div>

					{/* 6. OBLIGACJE (Tekst) */}
					<div className="bg-t-bg-panel p-6 sm:p-8 rounded-3xl border border-t-border hover:border-emerald-500/30 transition-colors">
						<ShieldCheck className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mb-6" />
						<h3 className="text-xl font-black text-t-text-primary mb-3">
							Silnik Obligacji
						</h3>
						<p className="text-sm text-t-text-secondary leading-relaxed">
							Specjalistyczne podejście do papierów skarbowych. Analiza
							uwzględniająca narosłe odsetki i historię depozytów.
						</p>
					</div>

					{/* 7. ALPHA (Tekst) */}
					<div className="bg-t-bg-panel p-6 sm:p-8 rounded-3xl border border-t-border hover:border-rose-500/30 transition-colors">
						<Rocket className="w-10 h-10 text-rose-500 dark:text-rose-400 mb-6" />
						<h3 className="text-xl font-black text-t-text-primary mb-3">
							Analityka Alpha
						</h3>
						<p className="text-sm text-t-text-secondary leading-relaxed">
							Wizualizacja trendu dla kapitału podwyższonego ryzyka. Monitoruj
							oddzielnie, czy Twoje ryzykowne tezy się sprawdzają.
						</p>
					</div>

					{/* 8. PERSONALIZACJA (Szeroki pasek na dole) */}
					<div className="lg:col-span-3 bg-gradient-to-r from-t-bg-base via-t-bg-panel to-t-bg-base p-6 sm:p-8 rounded-3xl border border-t-border hover:border-slate-500/30 transition-colors flex flex-col md:flex-row items-center gap-6 sm:gap-8 text-center md:text-left">
						<Settings2 className="w-12 h-12 text-t-text-tertiary shrink-0" />
						<div>
							<h3 className="text-xl font-black text-t-text-primary mb-2">
								Skrojony na Twoją miarę
							</h3>
							<p className="text-sm text-t-text-secondary max-w-3xl">
								Wybierz moduły na stronie głównej. Włącz pływający{" "}
								<strong className="text-t-text-primary">Pasek Rynkowy</strong>,
								śledź wybrane indeksy lub rozwijaj wiedzę dzięki codziennym{" "}
								<strong className="text-t-text-primary">
									Lekcjom Inwestora
								</strong>
								.
							</p>
						</div>
					</div>
				</div>
				{/* ========================================= */}
				{/* 4. SEKCJA WIDEO (INSTRUKTAŻ) */}
				{/* ========================================= */}
				<section className="w-full py-24 border-y border-t-border bg-black/5 dark:bg-black/20">
					<div className="max-w-4xl mx-auto px-4 text-center">
						<h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-t-text-primary mb-6">
							Przewodnik Po Systemie
						</h2>
						<p className="text-t-text-secondary mb-12 max-w-xl mx-auto">
							Zobacz, jak w kilka minut dodać pierwsze aktywa, skonfigurować cel
							inwestycyjny i zaimportować historię od swojego brokera.
						</p>

						<div className="relative aspect-video rounded-[2rem] overflow-hidden border border-t-border shadow-lg bg-t-bg-panel group cursor-pointer">
							<div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent group-hover:scale-105 transition-transform duration-700" />
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:bg-blue-500 group-hover:scale-110 transition-all">
									<div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-2" />
								</div>
							</div>
							<div className="absolute bottom-6 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								Kliknij aby odtworzyć (2:15)
							</div>
						</div>
					</div>
				</section>
			</div>

			{/* FAQ SECTION */}
			<section className=" relative z-10 py-24 container mx-auto px-4 max-w-3xl">
				<h2 className="text-2xl font-black uppercase mb-12 text-center text-t-text-primary">
					Najczęstsze pytania
				</h2>
				<div className="space-y-4">
					{[
						{
							q: "Czy moje dane są bezpieczne?",
							a: "Tak, nie przechowujemy Twoich haseł. Używamy szyfrowanych tokenów.",
						},
						{
							q: "Jakie domy maklerskie obsługujecie?",
							a: "Pełne wsparcie dla XTB oraz PKO BP (obligacje skarbowe).",
						},
						{
							q: "Czy mogę używać tego do IKE/IKZE?",
							a: "Tak, mechanizmy sumowania kapitału są idealne do śledzenia limitów rocznych.",
						},
					].map((item, i) => (
						<details
							key={i}
							className="group bg-t-bg-panel p-6 rounded-2xl border border-t-border"
						>
							<summary className="font-bold cursor-pointer text-t-text-primary">
								{item.q}
							</summary>
							<p className="mt-4 text-t-text-secondary text-sm">{item.a}</p>
						</details>
					))}
				</div>
			</section>

			{/* ========================================= */}
			{/* 5. FOOTER (ROZBUDOWANY) */}
			{/* ========================================= */}
			<footer className="relative z-10 w-full border-t border-t-border bg-t-bg-panel pt-20 pb-10 px-4">
				<div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
					{/* Kolumna 1: Marka & Newsletter */}
					<div className="md:col-span-2 space-y-6">
						<h3 className="text-xl font-black text-t-text-primary tracking-tight">
							{APP_NAME}
						</h3>
						<p className="text-t-text-secondary text-sm max-w-sm leading-relaxed">
							Dołącz do inwestorów, którzy optymalizują swoje portfele na
							wyższym poziomie. Zapisz się na newsletter, aby otrzymywać
							informacje o nowych funkcjach i integracjach.
						</p>
						<div className="flex gap-2 max-w-sm">
							<Input
								type="email"
								placeholder="Twój adres email"
								className="bg-black/5 dark:bg-black/30 border-t-border focus-visible:ring-blue-500 h-10 text-xs text-t-text-primary"
							/>
							<Button className="bg-blue-600 hover:bg-blue-500 text-white h-10 px-6 font-bold uppercase tracking-widest text-[10px] border-0">
								Zapisz
							</Button>
						</div>
					</div>

					{/* Kolumna 2: Szybkie Linki */}
					<div className="flex flex-col space-y-4">
						<h4 className="text-[10px] font-black uppercase tracking-widest text-t-text-tertiary mb-2">
							Platforma
						</h4>
						<Link
							href="/dashboard"
							className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
						>
							Dashboard
						</Link>
						<Link
							href="/planner"
							className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
						>
							Kalkulatory & Planner
						</Link>
						<Link
							href="/demo"
							className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
						>
							Wersja Demo
						</Link>
						<Link
							href="#"
							className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
						>
							Dokumentacja API
						</Link>
					</div>

					{/* Kolumna 3: Prawne & Ustawienia */}
					<div className="flex flex-col space-y-4">
						<h4 className="text-[10px] font-black uppercase tracking-widest text-t-text-tertiary mb-2">
							Zasoby
						</h4>
						<Link
							href="#"
							className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
						>
							Polityka Prywatności
						</Link>
						<Link
							href="#"
							className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
						>
							Regulamin
						</Link>
						<Link
							href="#"
							className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
						>
							Kontakt & Wsparcie
						</Link>
					</div>
				</div>

				{/* Dolny pasek (Copyright & Przełączniki) */}
				<div className="max-w-6xl mx-auto pt-8 border-t border-t-border-subtle flex flex-col md:flex-row justify-between items-center gap-6">
					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary text-center md:text-left">
							&copy; 2026 {APP_NAME}. Wszelkie prawa zastrzeżone.
						</p>
						{/* <p className="text-[8px] font-bold  tracking-widest text-t-text-tertiary text-center md:text-left">
							project created by gregsypek.
						</p> */}
					</div>

					<div className="flex items-center gap-4">
						{/* Przyszły przełącznik języka */}
						<button className="flex items-center gap-2 text-t-text-tertiary hover:text-t-text-primary transition-colors text-xs font-bold uppercase tracking-widest">
							<Globe className="w-4 h-4" /> PL
						</button>
						<div className="w-px h-4 bg-t-border" />
						{/* Przyszły przełącznik motywu (już masz ciemny, to na przyszłość) */}
						<button className="flex items-center gap-2 text-t-text-tertiary hover:text-t-text-primary transition-colors text-xs font-bold uppercase tracking-widest">
							<Moon className="w-4 h-4" /> Dark
						</button>
					</div>
				</div>
			</footer>
		</div>
	);
}

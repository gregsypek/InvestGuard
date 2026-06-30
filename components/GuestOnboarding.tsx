import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import FeatureBentoGrid from "./home/FeatureBentoGrid";
import Footer from "./shared/Footer";
import Image from "next/image";
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

			<div className="relative z-10 flex flex-col items-center ">
				{/* ========================================= */}
				{/* 1. HERO SECTION */}
				{/* ========================================= */}
				<section className="relative flex flex-col items-center justify-center pt-8 xl:pt-24 px-4 w-full max-w-5xl mx-auto text-center animate-in slide-in-from-bottom-8 fade-in duration-1000">
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

					<div className="flex flex-col sm:flex-row gap-4 justify-center  sm:w-auto">
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
				<section className="w-full max-w-6xl mx-auto  pb-6 xl:py-24 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-200">
					<div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden border border-t-border shadow-2xl bg-t-bg-panel p-0 group flex flex-col">
						{/* Gradient maskujący na dole zdjęcia (rozmywa dół aplikacji) */}
						<div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-t-bg-panel via-t-bg-panel/50 to-transparent z-10 pointer-events-none" />

						{/* Wersja dla jasnego motywu */}
						<Image
							src="/screenshots/investGuard_quest_light.png"
							alt="InvestGuard Dashboard"
							width={1200}
							height={1100}
							priority
							className="block dark:hidden w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
						/>

						{/* Wersja dla ciemnego motywu */}
						<Image
							src="/screenshots/investGuard_quest_dark.png"
							alt="InvestGuard Dashboard"
							width={1200}
							height={1100}
							priority
							className="hidden dark:block w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
						/>
					</div>
				</section>

				{/* ========================================= */}
				{/* 3. BENTO GRID (ZAIMPORTOWANY)  */}
				{/* ========================================= */}
				<FeatureBentoGrid />

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
			{/* ========================================= */}
			{/* 5. FAQ SECTION */}
			{/* ========================================= */}

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
			{/* 6. FOOTER */}
			{/* ========================================= */}
			<Footer />
		</div>
	);
}

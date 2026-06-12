"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ChevronLeft,
	ChevronRight,
	History,
	LayoutDashboard,
	Lightbulb,
	LucideIcon,
	Notebook,
	Rocket,
	Sparkles,
	Wallet,
	X,
} from "lucide-react";
import React, { useState } from "react";

import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

// Konfiguracja wspierająca tablicę wielu wskazówek na stronę
const TIPS_CONFIG: Record<
	string,
	{
		title: string;
		icon: LucideIcon;
		indicatorName: string;
		indicatorDesc: string;
		tipTitle: string;
		tipDesc: string;
	}[]
> = {
	"/dashboard": [
		{
			title: `WITAJ W ${APP_NAME}`,
			icon: Sparkles,
			indicatorName: "Korzystanie z Aplikacji",
			indicatorDesc:
				"Aplikacja przelicza kursy USD, EUR i GBP na PLN w czasie rzeczywistym.",
			tipTitle: "Jak przełączać się między stronami",
			tipDesc:
				"Skorzystaj z menu po lewej, aby szybko przełączać się między strategią a historią wpisów.",
		},
		{
			title: "STATUS PORTFELA",
			icon: LayoutDashboard,
			indicatorName: "Kondycja i Rebalancing",
			indicatorDesc: "System monitoruje odchylenia od wag np.15/15/10/55.",
			tipTitle: "Kiedy reagować?",
			tipDesc:
				"Jeśli udział obligacji spadnie poniżej 50% (cel to 55%), system podświetli pole na czerwono – to sygnał do dokupienia EDO/DOR.",
		},
		{
			title: "ANALIZA BAZY",
			icon: LayoutDashboard,
			indicatorName: "Fundament Bezpieczeństwa",
			indicatorDesc:
				"55% w obligacjach skarbowych to Twój 'bezpiecznik' na trudne czasy.",
			tipTitle: "Pułapka nudy",
			tipDesc:
				"Baza ma być przewidywalna. Gdy na rynku panuje euforia, obligacje mogą wydawać się nudne, ale to one chronią kapitał podczas krachów.",
		},
		{
			title: "WYKRESY KOŁOWE",
			icon: LayoutDashboard,
			indicatorName: "Sprawdzanie proporcji",
			indicatorDesc:
				"Twoje aktywa mogą znacznie odchylać się od przyjętych wag. Dzięki wykresom szybko zidentyfikujesz które aktywa wymagają uwagi",
			tipTitle: "Jak nie wpadać w pułapkę nudy?",
			tipDesc:
				"Dino czy złoto mogą stać w miejscu miesiącami. Jeśli fundamenty spółki są zdrowe, brak ruchu na wykresie to czas na akumulację, a nie sprzedaż.",
		},
		{
			title: "STRATEGIA PORTFELA",
			icon: Wallet,
			indicatorName: "Dywersyfikacja",
			indicatorDesc:
				"Podział na EM (15%), World (15%), Złoto (10%) i Obligacje (55%).",
			tipTitle: "Rebalancing to zysk",
			tipDesc:
				"Sprzedając to, co urosło (np. zbrojeniówka), i kupując to, co spadło, realizujesz zyski w sposób systematyczny.",
		},
		{
			title: "STRATEGIA GLOBALNA",
			icon: Wallet,
			indicatorName: "Dywersyfikacja",
			indicatorDesc: "Podział na rynki rozwinięte (World) i wschodzące (EM).",
			tipTitle: "Nie trzymaj jaj w jednym koszyku",
			tipDesc:
				"Dzięki alokacji 15/15 w ETF-y na World i EM, Twój portfel nie zależy od kondycji jednej gospodarki czy waluty.",
		},
	],
	"/portfolios": [
		{
			title: "PODSUMOWANIE PORTFELI",
			icon: Wallet,
			indicatorName: "Dywersyfikacja",
			indicatorDesc:
				"Sprawdź, jak rozkładają się Twoje aktywa między różnymi portfelami.",
			tipTitle: "Rebalancing to zysk",
			tipDesc:
				"Dzięki alokacji globalnej sprawdzisz gdzi ulokowałeś najwięcej środków. To ważne, by nie mieć wszystkich jajek w jednym koszyku.",
		},
	],
	"/planner": [
		{
			title: "OBSŁUGA PLANNERA",
			icon: Notebook,
			indicatorName: "Twórz plany inwestycyjne",
			indicatorDesc:
				"Zaplanuj swoje regularne wpłaty i zatwierdzaj aby system wprowadził je do wybranego portfela",
			tipTitle: "Planowanie wpłat",
			tipDesc:
				"Przydatne gdy co miesiąc wpłacasz środki na konto i chcesz, by system rozdzielił je automatycznie zgodnie z przyjętymi załoźeniami",
		},
	],
	"/activity": [
		{
			title: "HISTORIA OPERACJI",
			icon: History,
			indicatorName: "Arkusz Zleceń",
			indicatorDesc:
				"Zbiór wszystkich ofert kupna i sprzedaży walorów na giełdzie.",
			tipTitle: "Analiza błędów",
			tipDesc:
				"Przeglądaj historię, aby sprawdzić swoje decyzje. Ucz się na błędach i sukcesach, by doskonalić swoją strategię.",
		},
		{
			title: "DZIENNIK INWESTORA",
			icon: History,
			indicatorName: "Psychologia Inwestowania",
			indicatorDesc:
				"Analiza historycznych ruchów pozwala wyłapać emocjonalne decyzje.",
			tipTitle: "Lekcja z historii",
			tipDesc:
				"Sprawdź, czy Twoje poprzednie zakupy były zgodne z planem, czy wynikały z krótkoterminowego szumu rynkowego.",
		},
	],
	"/alpha-selection": [
		{
			title: "RADAR OKAZJI",
			icon: Rocket,
			indicatorName: "Wskaźnik C/Z (P/E)",
			indicatorDesc:
				"Cena do Zysku. Pomaga ocenić, czy 'Booster' nie jest zbyt drogi względem zarobków spółki.",
			tipTitle: "Cyber_Folks pod lupą",
			tipDesc:
				"W strategii Booster (5%) szukasz spółek o wysokim wzroście. Obserwuj dynamikę przychodów, a nie tylko samą cenę akcji.",
		},
		{
			title: "MODUŁ BOOSTER (5%)",
			icon: Sparkles,
			indicatorName: "Alpha Selection",
			indicatorDesc:
				"Próba pokonania rynku poprzez selekcję konkretnych spółek.",
			tipTitle: "Zarządzanie ryzykiem",
			tipDesc:
				"Nawet jeśli spółka zbrojeniowa wygląda świetnie, trzymaj ją w limicie 5%. To chroni Twój kapitał przed nagłymi zwrotami akcji.",
		},
	],
	"/bond-reports": [
		{
			title: "RAPORT OBLIGACJI",
			icon: History,
			indicatorName: "Indeksacja Inflacją",
			indicatorDesc:
				"Kluczowa cecha obligacji EDO. Ich oprocentowanie rośnie wraz z inflacją.",
			tipTitle: "Separating Lines",
			tipDesc:
				"Linie w raporcie oddzielają Twoje historyczne wpisy. Pozwala to śledzić, które serie obligacji (np. z 2024 r.) pracują najlepiej.",
		},
		{
			title: "MODUŁ OBLIGACJI",
			icon: History,
			indicatorName: "Indeksacja Inflacją",
			indicatorDesc:
				"Oprocentowanie EDO zmienia się co roku w oparciu o wskaźnik inflacji.",
			tipTitle: "Pasek postępu i serie",
			tipDesc:
				"Kliknij w konkretną serię, aby zobaczyć narosłe odsetki. Linie separujące pomogą Ci oddzielić stare wpisy od nowych zakupów.",
		},
	],
	default: [
		{
			title: "LEKCJA INWESTORA",
			icon: Sparkles,
			indicatorName: "Wiedza i Umiejętności",
			indicatorDesc: "Stały rozwój to najlepsza inwestycja.",
			tipTitle: "Twój Cel",
			tipDesc:
				"Pamiętaj, że Twój horyzont to 20 lat. Krótkoterminowy szum informacyjny nie powinien zmieniać Twojej strategii.",
		},
		{
			title: "LEKCJA INWESTORA",
			icon: Sparkles,
			indicatorName: "Inwestowanie pasywne",
			indicatorDesc: "Najlepsza strategia dla większości inwestorów",
			tipTitle: "Inwestuj w ETF-y	",
			tipDesc:
				"Regularne dokupowanie udziałów w ETF-ach to sprawdzona metoda budowania bogactwa. Nie szukaj 'gorących' akcji, które mogą okazać się zimne.",
		},
	],
};

const BulbTip = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [activeStep, setActiveStep] = useState(0);
	const pathname = usePathname();
	const [prevPath, setPrevPath] = useState(pathname);

	if (pathname !== prevPath) {
		setPrevPath(pathname);
		setIsOpen(false);
		setActiveStep(0);
	}

	const getPageTips = (path: string) => {
		const matchingKey = Object.keys(TIPS_CONFIG).find(
			(key) => key !== "default" && path.startsWith(key),
		);
		return matchingKey ? TIPS_CONFIG[matchingKey] : TIPS_CONFIG["default"];
	};

	const pageTips = getPageTips(pathname);
	const currentTip = pageTips[activeStep] || pageTips[0];
	const Icon = currentTip.icon;
	const hasMultiple = pageTips.length > 1;

	const handleNext = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setActiveStep((prev) => (prev + 1) % pageTips.length);
	};

	const toggleOpen = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOpen(!isOpen);
	};

	return (
		<div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
			{isOpen && (
				<Card
					style={{ width: "400px", minWidth: "400px" }}
					className={cn(
						"shadow-2xl shadow-black/40 py-4 animate-in slide-in-from-bottom-5 fade-in duration-300",
						"bg-t-bg-panel/95 backdrop-blur-xl border border-t-border-subtle", // PREMIUM GLASS LOOK
					)}
				>
					<CardHeader className="pb-3 relative border-b border-t-border-subtle/50 mb-4 mx-6 px-0">
						<Button
							variant="ghost"
							size="icon"
							type="button"
							className="absolute right-0 top-0 h-7 w-7 rounded-full hover:bg-amber-500/10 transition-colors"
							onClick={(e) => {
								e.stopPropagation();
								setIsOpen(false);
							}}
						>
							<X className="h-4 w-4 text-amber-500" />
						</Button>
						<CardTitle className="flex items-center gap-2 text-[11px] font-black tracking-widest text-amber-500 uppercase">
							<Icon className="w-4 h-4" />
							{currentTip.title}
						</CardTitle>
					</CardHeader>

					<CardContent className="space-y-5 px-6">
						<div>
							<h4 className="font-bold text-[9px] text-t-text-tertiary uppercase tracking-widest mb-1.5">
								Kontekst Aplikacji
							</h4>
							<p className="font-bold text-base text-t-text-primary tracking-tight">
								{currentTip.indicatorName}
							</p>
							<p className="text-[11px] text-t-text-secondary mt-1 leading-relaxed">
								{currentTip.indicatorDesc}
							</p>
						</div>

						<div className="p-4 rounded-2xl bg-t-bg-sticky border border-t-border shadow-inner">
							<h4 className="font-bold text-[9px] text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
								<Lightbulb className="w-3 h-3" /> Wskazówka
							</h4>
							<p className="font-bold text-sm text-t-text-primary mb-1">
								{currentTip.tipTitle}
							</p>
							<p className="text-xs text-t-text-secondary leading-relaxed italic">
								&quot;{currentTip.tipDesc}&quot;
							</p>
						</div>

						{hasMultiple && (
							<div className="flex items-center justify-between pt-2">
								<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest">
									{activeStep + 1} / {pageTips.length}
								</span>
								<div className="flex gap-1.5">
									<Button
										variant="ghost"
										size="icon"
										type="button"
										className="h-7 w-7 rounded-lg border border-t-border hover:bg-black/20 hover:border-blue-500/50 hover:text-blue-500 transition-all"
										onClick={(e) => {
											e.stopPropagation();
											setActiveStep(
												(prev) =>
													(prev - 1 + pageTips.length) % pageTips.length,
											);
										}}
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										type="button"
										className="h-7 w-7 rounded-lg border border-t-border hover:bg-black/20 hover:border-blue-500/50 hover:text-blue-500 transition-all"
										onClick={handleNext}
									>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* PREMIUM BUTTON */}
			<button
				type="button"
				onClick={toggleOpen}
				className={cn(
					"p-3.5 rounded-full shadow-lg transition-all duration-300 active:scale-95 group relative cursor-pointer border",
					isOpen
						? "bg-t-bg-panel border-amber-500/50 rotate-12"
						: "bg-t-bg-panel border-t-border hover:border-amber-500/50 hover:bg-amber-500/5 shadow-amber-500/10",
				)}
			>
				<Lightbulb
					className={cn(
						"w-5 h-5 transition-colors duration-300",
						isOpen
							? "text-amber-500 fill-amber-500/20"
							: "text-amber-500/70 group-hover:text-amber-500",
					)}
				/>
				{!isOpen && (
					<span className="absolute top-0 right-0 flex h-2.5 w-2.5 -mt-0.5 -mr-0.5">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
						<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-t-bg-panel"></span>
					</span>
				)}
			</button>
		</div>
	);
};

export default BulbTip;

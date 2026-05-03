// STRONA INSIGHTS - CODZIENNE ANALIZY I WIEDZA DLA INWESTORA STRONA TESTOWA
"// app/dashboard/insights/page.tsx";

import {
	ArrowUpRight,
	BookOpen,
	Lightbulb,
	MessageSquareQuote,
	Search,
	ShieldCheck,
	Target,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import React from "react";

// --- MOCK DATA (To docelowo trafi do bazy/pliku konfiguracyjnego) ---
const mockInsights = {
	dailyReport: {
		title: "Analiza Bazy i Boostera",
		date: "4 kwietnia 2026",
		summary:
			"Twój portfel wykazuje dziś pozytywną korelację z rynkiem technologicznym. Baza (55% obligacji) stabilizuje wynik, podczas gdy Booster (5%) generuje nadwyżkę.",
		stats: [
			{ label: "Baza (Obligacje/Złoto)", value: "+0.02%", status: "neutral" },
			{ label: "Booster (Akcje)", value: "+1.45%", status: "up" },
		],
		conclusion:
			"Udział obligacji EDO pracuje jako bezpiecznik. Przy obecnej zmienności na Dino, Twoje 55% w obligacjach chroni kapitał przed wahaniami rzędu 3-4%.",
	},
	investorLesson: {
		topic: "Wskaźnik C/Z (Cena do Zysku)",
		tipOfDay: "Jak nie wpadać w pułapkę nudy na Dino?",
		explanation:
			"Wskaźnik C/Z mówi nam, ile lat spółka musi zarabiać na obecnym poziomie, aby zwrócił się koszt zakupu akcji. Dla Dino wysoki C/Z jest normą ze względu na tempo ekspansji.",
		practicalTip:
			"Nuda na Dino często poprzedza okresy konsolidacji. Zamiast sprzedawać pod wpływem braku ruchu, sprawdź, czy fundamenty (liczba nowych sklepów) nadal rosną.",
	},
	opportunityRadar: [
		{
			company: "Nvidia (NVDA)",
			ticker: "NVDA.US",
			reason:
				"Lider boomu AI. Warto obserwować pod kątem dołączenia do sekcji IT.",
			pros: "Dominacja technologiczna, ogromne marże.",
			cons: "Ekstremalnie wysoka wycena (C/Z > 70).",
			action: "Czekaj na korektę -15%.",
		},
		{
			company: "Marathon Petroleum",
			ticker: "MPC.US",
			reason: "Ekspozycja na sektor rafineryjny USA (ropa).",
			pros: "Silny skup akcji własnych, dywidenda.",
			cons: "Zależność od marż rafineryjnych.",
			action: "Obserwuj stabilność cen baryłki.",
		},
	],
};

export default function InsightsPage() {
	return (
		<div className="p-6 space-y-6 max-w-7xl mx-auto">
			{/* NAGŁÓWEK */}
			<div className="flex flex-col gap-1">
				<h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
					<Lightbulb className="w-8 h-8 text-amber-500" />
					CENTRUM ANALIZ I WIEDZY
				</h1>
				<p className="text-muted-foreground">
					Twoja dzienna dawka wiedzy i przegląd strategiczny portfela.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* 1. RAPORT DNIA - Baza vs Booster */}
				<Card className="md:col-span-2 border-primary/20 shadow-sm">
					<CardHeader className="bg-primary/5">
						<div className="flex justify-between items-center">
							<CardTitle className="flex items-center gap-2">
								<ShieldCheck className="w-5 h-5 text-primary" />
								{mockInsights.dailyReport.title}
							</CardTitle>
							<span className="text-xs font-mono text-muted-foreground">
								{mockInsights.dailyReport.date}
							</span>
						</div>
						<CardDescription>
							{mockInsights.dailyReport.summary}
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-6 space-y-4">
						<div className="grid grid-cols-2 gap-4">
							{mockInsights.dailyReport.stats.map((stat, i) => (
								<div
									key={i}
									className="p-4 rounded-xl bg-secondary/30 border border-border"
								>
									<p className="text-xs text-muted-foreground uppercase font-bold">
										{stat.label}
									</p>
									<p
										className={`text-2xl font-black ${stat.status === "up" ? "text-emerald-500" : "text-foreground"}`}
									>
										{stat.value}
									</p>
								</div>
							))}
						</div>
						<div className="p-4 rounded-lg bg-primary/5 border-l-4 border-primary italic text-sm">
							<MessageSquareQuote className="w-4 h-4 mb-2 text-primary" />"
							{mockInsights.dailyReport.conclusion}"
						</div>
					</CardContent>
				</Card>

				{/* 2. LEKCJA INWESTORA */}
				<Card className="border-amber-500/20 shadow-sm">
					<CardHeader className="bg-amber-500/5">
						<CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-lg">
							<BookOpen className="w-5 h-5" />
							Lekcja Inwestora
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-6 space-y-4">
						<div>
							<h4 className="font-bold text-sm text-amber-600 dark:text-amber-400 uppercase">
								Wskaźnik Tygodnia
							</h4>
							<p className="font-black text-xl tracking-tight">
								{mockInsights.investorLesson.topic}
							</p>
							<p className="text-sm text-muted-foreground mt-1">
								{mockInsights.investorLesson.explanation}
							</p>
						</div>
						<div className="h-px bg-border w-full" />
						<div>
							<h4 className="font-bold text-sm text-amber-600 dark:text-amber-400 uppercase">
								Tip Dnia
							</h4>
							<p className="font-bold italic mt-1">
								{mockInsights.investorLesson.tipOfDay}
							</p>
							<p className="text-sm mt-2">
								{mockInsights.investorLesson.practicalTip}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* 3. RADAR OKAZJI */}
				<div className="md:col-span-3">
					<h2 className="text-xl font-black mb-4 flex items-center gap-2">
						<Target className="w-6 h-6 text-rose-500" />
						RADAR OKAZJI
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{mockInsights.opportunityRadar.map((opp, i) => (
							<Card
								key={i}
								className="hover:border-rose-500/50 transition-colors cursor-pointer"
							>
								<CardContent className="pt-6">
									<div className="flex justify-between items-start mb-4">
										<div>
											<h3 className="font-black text-lg">{opp.company}</h3>
											<span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
												{opp.ticker}
											</span>
										</div>
										<div className="bg-rose-500/10 text-rose-600 p-2 rounded-full">
											<Search className="w-4 h-4" />
										</div>
									</div>
									<p className="text-sm font-medium mb-4">{opp.reason}</p>
									<div className="grid grid-cols-2 gap-4 text-xs mb-4">
										<div className="text-emerald-600 bg-emerald-500/5 p-2 rounded">
											<span className="font-bold block uppercase mb-1 text-[10px]">
												Za
											</span>
											{opp.pros}
										</div>
										<div className="text-rose-600 bg-rose-500/5 p-2 rounded">
											<span className="font-bold block uppercase mb-1 text-[10px]">
												Przeciw
											</span>
											{opp.cons}
										</div>
									</div>
									<div className="flex items-center gap-2 text-sm font-bold text-primary">
										<ArrowUpRight className="w-4 h-4" />
										Rekomendacja: {opp.action}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

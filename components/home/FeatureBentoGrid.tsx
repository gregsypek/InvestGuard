import {
	LineChart,
	PieChart,
	Rocket,
	Settings2,
	ShieldCheck,
	Target,
	UploadCloud,
} from "lucide-react";

import Image from "next/image";

export default function FeatureBentoGrid() {
	return (
		<div className="w-full max-w-6xl mx-auto px-4 pb-32">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 xl:space-y-24">
				{/* ========================================= */}
				{/* RZĄD 1: IMPORT & DASHBOARD XTB */}
				{/* ========================================= */}
				<div className="lg:col-span-1 bg-gradient-to-br from-t-bg-panel to-t-bg-base p-6 sm:p-8 rounded-3xl border border-t-border hover:border-blue-500/30 transition-colors relative overflow-hidden group flex flex-col justify-center">
					<div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
					<UploadCloud className="w-10 h-10 text-blue-500 dark:text-blue-400 mb-4 md:mb-6" />
					<h3 className="text-xl md:text-2xl font-black text-t-text-primary mb-3 leading-tight">
						Inteligentny Import & Automatyzacja
					</h3>
					<p className="text-t-text-secondary leading-relaxed text-sm">
						Wygeneruj raport CSV z <strong>XTB</strong> lub zestawienie
						obligacji z <strong>PKO BP</strong>. Nasz parser automatycznie
						rozpozna transakcje, zaktualizuje kategorie i precyzyjnie wyliczy
						saldo.
					</p>
				</div>

				<div className="lg:col-span-2 min-h-[300px] md:min-h-[350px] bg-gradient-to-br from-t-bg-panel to-t-bg-base p-4 rounded-3xl border border-t-border hover:border-blue-500/30 transition-colors group flex flex-col">
					<div className="relative w-full h-full grow rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base">
						<div className="absolute inset-0 bg-gradient-to-t from-t-bg-base/90 via-transparent to-transparent z-10 pointer-events-none" />
						<Image
							src="/screenshots/GuestBoard/xtb_light.png"
							alt="InvestGuard Dashboard"
							fill
							className="block dark:hidden object-cover object-top-left transition-transform duration-700 group-hover:scale-[1.02]"
						/>
						<Image
							src="/screenshots/GuestBoard/xtb_dark.png"
							alt="InvestGuard Dashboard"
							fill
							className="hidden dark:block object-cover object-top-left transition-transform duration-700 group-hover:scale-[1.02]"
						/>
					</div>
				</div>

				{/* ========================================= */}
				{/* RZĄD 2: HISTORIA I REJESTR */}
				{/* ========================================= */}
				<div className="lg:col-span-3 bg-gradient-to-br from-t-bg-panel to-t-bg-base p-4 sm:p-5 rounded-3xl border border-t-border hover:border-indigo-500/30 transition-colors group flex flex-col">
					<div className="px-2 pt-2 pb-6">
						<div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20 group-hover:scale-110 transition-transform">
							<LineChart className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
						</div>
						<h3 className="text-xl md:text-2xl font-black text-t-text-primary mb-3">
							Rejestr Transakcji & Raportowanie
						</h3>
						<p className="text-t-text-secondary leading-relaxed max-w-2xl mb-5 text-sm">
							Wykres precyzyjnie wizualizuje punkty Twoich zakupów i sprzedaży
							na tle późniejszego zachowania ceny. Wyciągaj wnioski z własnych
							decyzji i generuj przejrzyste raporty okresowe.
						</p>
						<div className="flex gap-2 flex-wrap">
							<span className="px-3 py-1 bg-black/5 dark:bg-black/30 border border-t-border-subtle rounded-lg text-[10px] uppercase font-bold text-t-text-secondary shadow-sm">
								Punkty Wejścia
							</span>
							<span className="px-3 py-1 bg-black/5 dark:bg-black/30 border border-t-border-subtle rounded-lg text-[10px] uppercase font-bold text-t-text-secondary shadow-sm">
								Zaawansowane Filtry
							</span>
						</div>
					</div>

					<div className="relative w-full mt-auto rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base flex justify-center p-2 min-h-[250px] md:min-h-[400px]">
						<div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-t-bg-base via-t-bg-base/80 to-transparent z-10 pointer-events-none rounded-b-2xl" />
						<Image
							src="/screenshots/GuestBoard/history_light.png"
							alt="Historia i Rejestr Transakcji"
							fill
							className="block dark:hidden object-contain object-top transition-transform duration-700 group-hover:scale-[1.02] p-2"
						/>
						<Image
							src="/screenshots/GuestBoard/history_dark.png"
							alt="Historia i Rejestr Transakcji"
							fill
							className="hidden dark:block object-contain object-top transition-transform duration-700 group-hover:scale-[1.02] p-2"
						/>
					</div>
				</div>

				{/* ========================================= */}
				{/* RZĄD 3: WYKRESY KOŁOWE I REBALANCING */}
				{/* ========================================= */}
				<div className="min-w-0 bg-gradient-to-br from-t-bg-panel to-t-bg-base p-3 sm:p-4 rounded-3xl border border-t-border hover:border-cyan-500/30 transition-colors group flex flex-col min-h-[260px] md:min-h-[300px]">
					<div className="relative w-full h-full grow rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base p-2">
						<div className="absolute inset-0 bg-gradient-to-t from-t-bg-base/90 via-transparent to-transparent z-10 pointer-events-none" />
						<Image
							src="/screenshots/GuestBoard/pieChart_light_left.png"
							alt="Alokacja Docelowa"
							fill
							className="block dark:hidden object-contain object-center transition-transform duration-700 group-hover:scale-[1.02] p-2"
						/>
						<Image
							src="/screenshots/GuestBoard/pieChart_dark_left.png"
							alt="Alokacja Docelowa"
							fill
							className="hidden dark:block object-contain object-center transition-transform duration-700 group-hover:scale-[1.02] p-2"
						/>
					</div>
				</div>

				<div className="min-w-0 bg-t-bg-panel p-6 lg:p-8 rounded-3xl border border-t-border hover:border-cyan-500/30 transition-colors flex flex-col justify-center items-center text-center">
					<PieChart className="w-10 h-10 text-cyan-500 dark:text-cyan-400 mb-4" />
					<h3 className="text-xl font-black text-t-text-primary mb-3">
						Precyzyjny Rebalancing
					</h3>
					<p className="text-sm text-t-text-tertiary leading-relaxed">
						Porównaj obecną strukturę portfeli z Twoim celem. Zobacz na żywo
						modelową alokację w zestawieniu z rzeczywistym stanem posiadania.
					</p>
				</div>

				<div className="min-w-0 bg-gradient-to-br from-t-bg-panel to-t-bg-base p-3 sm:p-4 rounded-3xl border border-t-border hover:border-cyan-500/30 transition-colors group flex flex-col min-h-[260px] md:min-h-[300px]">
					<div className="relative w-full h-full grow rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base p-2">
						<div className="absolute inset-0 bg-gradient-to-t from-t-bg-base/90 via-transparent to-transparent z-10 pointer-events-none" />
						<Image
							src="/screenshots/GuestBoard/pieChart_light_right.png"
							alt="Alokacja Rzeczywista"
							fill
							className="block dark:hidden object-contain object-center transition-transform duration-700 group-hover:scale-[1.02] p-2"
						/>
						<Image
							src="/screenshots/GuestBoard/pieChart_dark_right.png"
							alt="Alokacja Rzeczywista"
							fill
							className="hidden dark:block object-contain object-center transition-transform duration-700 group-hover:scale-[1.02] p-2"
						/>
					</div>
				</div>

				<div className="lg:col-span-3 bg-gradient-to-br from-t-bg-panel to-t-bg-base p-4 sm:p-5 rounded-3xl border border-t-border hover:border-cyan-500/30 transition-colors group flex flex-col">
					<div className="px-2 pt-2 pb-6">
						<h3 className="text-xl font-black text-t-text-primary mb-2">
							Przewodnik Rebalansowania
						</h3>
						<p className="text-sm text-t-text-secondary leading-relaxed">
							Kalkulator precyzyjnie wylicza, ile aktywów musisz kupić lub
							sprzedać, by przywrócić idealną alokację.
						</p>
					</div>
					<div className="relative w-full mt-auto rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base">
						<div className="absolute inset-x-0 bottom-0 h-1/2 max-h-24 bg-gradient-to-t from-t-bg-base via-t-bg-base/70 to-transparent z-10 pointer-events-none" />
						<Image
							src="/screenshots/GuestBoard/healthTable_light2.png"
							alt="Tabela Rebalancingu"
							width={1300}
							height={420}
							className="block dark:hidden w-full h-auto transition-transform duration-700 group-hover:scale-[1.03]"
						/>
						<Image
							src="/screenshots/GuestBoard/healthTable_dark2.png"
							alt="Tabela Rebalancingu"
							width={1300}
							height={420}
							className="hidden dark:block w-full h-auto transition-transform duration-700 group-hover:scale-[1.03]"
						/>
					</div>
				</div>

				{/* ========================================= */}
				{/* RZĄD 4: OBLIGACJE (Złączony tekst + zdjęcie) */}
				{/* ========================================= */}
				<div className="lg:col-span-1 bg-t-bg-panel p-6 sm:p-8 rounded-3xl border border-t-border hover:border-emerald-500/30 transition-colors flex flex-col justify-center">
					<ShieldCheck className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mb-4 md:mb-6" />
					<h3 className="text-xl font-black text-t-text-primary mb-3">
						Silnik Obligacji Skarbowych
					</h3>
					<p className="text-sm text-t-text-secondary leading-relaxed">
						Specjalistyczne podejście do papierów EDO/DOS. Analiza bezpiecznych
						aktywów uwzględniająca narosłe odsetki i historię zakupów.
					</p>
				</div>

				<div className="lg:col-span-2 min-h-[300px] bg-gradient-to-br from-t-bg-panel to-t-bg-base p-4 rounded-3xl border border-t-border hover:border-emerald-500/30 transition-colors group flex flex-col">
					<div className="relative w-full h-full grow rounded-2xl overflow-hidden border border-t-border-subtle shadow-sm bg-t-bg-base">
						<div className="absolute inset-0 bg-gradient-to-t from-t-bg-base/90 via-transparent to-transparent z-10 pointer-events-none" />
						<Image
							src="/screenshots/GuestBoard/bonds_light.png"
							alt="Panel Obligacji"
							fill
							className="block dark:hidden object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
						/>
						<Image
							src="/screenshots/GuestBoard/bonds_dark.png"
							alt="Panel Obligacji"
							fill
							className="hidden dark:block object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
						/>
					</div>
				</div>

				{/* ========================================= */}
				{/* RZĄD 5: PLANNER & ALPHA (Sub-grid 50/50) */}
				{/* ========================================= */}
				<div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
					<div className="bg-t-bg-panel p-6 sm:p-8 rounded-3xl border border-t-border hover:border-purple-500/30 transition-colors">
						<Target className="w-10 h-10 text-purple-500 dark:text-purple-400 mb-4 md:mb-6" />
						<h3 className="text-xl font-black text-t-text-primary mb-3">
							Planner & Projekcje
						</h3>
						<p className="text-sm text-t-text-secondary leading-relaxed">
							Kontroluj przepływ gotówki planując nadchodzące zakupy. System
							wizualizuje oczekujące realizacje i symuluje osiągnięcie celu.
						</p>
					</div>

					<div className="bg-t-bg-panel p-6 sm:p-8 rounded-3xl border border-t-border hover:border-rose-500/30 transition-colors">
						<Rocket className="w-10 h-10 text-rose-500 dark:text-rose-400 mb-4 md:mb-6" />
						<h3 className="text-xl font-black text-t-text-primary mb-3">
							Analityka Alpha
						</h3>
						<p className="text-sm text-t-text-secondary leading-relaxed">
							Wizualizacja trendu dla kapitału podwyższonego ryzyka. Monitoruj
							oddzielnie, czy Twoje ryzykowne tezy się sprawdzają.
						</p>
					</div>
				</div>

				{/* ========================================= */}
				{/* RZĄD 6: PERSONALIZACJA */}
				{/* ========================================= */}
				<div className="lg:col-span-3 bg-gradient-to-r from-t-bg-base via-t-bg-panel to-t-bg-base p-6 sm:p-8 rounded-3xl border border-t-border hover:border-slate-500/30 transition-colors flex flex-col md:flex-row items-center gap-6 sm:gap-8 text-center md:text-left mt-4">
					<Settings2 className="w-12 h-12 text-t-text-tertiary shrink-0" />
					<div>
						<h3 className="text-xl font-black text-t-text-primary mb-2">
							Skrojony na Twoją miarę
						</h3>
						<p className="text-sm text-t-text-secondary max-w-3xl">
							Wybierz moduły na stronie głównej. Włącz pływający{" "}
							<strong className="text-t-text-primary">Pasek Rynkowy</strong>,
							śledź wybrane indeksy lub rozwijaj wiedzę dzięki codziennym{" "}
							<strong className="text-t-text-primary">Lekcjom Inwestora</strong>
							.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

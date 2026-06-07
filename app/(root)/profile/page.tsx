"use client";

import {
	Award,
	Calendar,
	Compass,
	Edit3,
	ShieldAlert,
	Target,
	User,
	Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InvestorProfilePage() {
	return (
		<div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
			{/* 1. NAGŁÓWEK PROFILU */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
				<div>
					<h1 className="text-3xl md:text-4xl font-black tracking-tighter text-t-text-primary mb-2">
						Profil Inwestora
					</h1>
					<span className="text-2xl uppercase text-t-text-tertiary">
						Strona w przygotowaniu !
					</span>

					<p className="text-sm font-medium text-t-text-tertiary">
						Twoja finansowa tożsamość, strategia i horyzont inwestycyjny.
					</p>
				</div>
				<Button className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 transition-all">
					<Edit3 className="w-3.5 h-3.5 mr-2" /> Aktualizuj Profil
				</Button>
			</div>

			{/* 2. KARTA TOŻSAMOŚCI (Hero Card) */}
			<div className="relative overflow-hidden bg-t-bg-panel border border-t-border-subtle rounded-3xl p-8 shadow-sm">
				<div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

				<div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
					{/* Awatar */}
					<div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-1 shrink-0 shadow-xl shadow-blue-500/20">
						<div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-900">
							<User className="w-10 h-10 text-white opacity-80" />
						</div>
					</div>

					<div className="text-center md:text-left flex-1">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 mb-3">
							<Award className="w-3.5 h-3.5" />
							<span className="text-[10px] font-black uppercase tracking-widest">
								Strateg Pasywny z Alfa Boosterem
							</span>
						</div>
						<h2 className="text-2xl font-black tracking-tight text-t-text-primary mb-1">
							Jan Kowalski
						</h2>
						<p className="text-sm font-medium text-t-text-tertiary">
							Członek InvestGuard od Listopada 2025
						</p>
					</div>
				</div>
			</div>

			{/* 3. GŁÓWNE PARAMETRY (Siatka) */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Karta: Ryzyko i Horyzont */}
				<ProfileCard
					icon={Compass}
					title="Podejście do Ryzyka"
					color="text-amber-500"
					bgColor="bg-amber-500/10"
				>
					<div className="space-y-5 mt-2">
						<div>
							<div className="flex justify-between text-xs font-bold mb-2">
								<span className="text-t-text-secondary">Konserwatywne</span>
								<span className="text-amber-500">Umiarkowane (Poziom 3/5)</span>
								<span className="text-t-text-secondary">Agresywne</span>
							</div>
							<div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex">
								<div
									className="h-full bg-gradient-to-r from-blue-500 to-amber-500 rounded-full"
									style={{ width: "60%" }}
								/>
							</div>
						</div>
						<p className="text-xs text-t-text-tertiary leading-relaxed font-medium border-l-2 border-amber-500/30 pl-3">
							Główny nacisk na ochronę kapitału (ok. 55% obligacji skarbowych
							chroniących przed zmiennością), z wydzielonym niewielkim koszykiem
							(5%) na aktywne poszukiwanie ponadprzeciętnych stóp zwrotu z
							akcji.
						</p>
					</div>
				</ProfileCard>

				{/* Karta: Horyzont Inwestycyjny */}
				<ProfileCard
					icon={Calendar}
					title="Horyzont Inwestycyjny"
					color="text-blue-500"
					bgColor="bg-blue-500/10"
				>
					<div className="space-y-4 mt-2">
						<div className="flex items-baseline gap-2">
							<span className="text-4xl font-black tracking-tighter text-t-text-primary">
								20+
							</span>
							<span className="text-sm font-bold text-t-text-tertiary uppercase tracking-widest">
								Lat
							</span>
						</div>
						<p className="text-xs text-t-text-tertiary leading-relaxed font-medium">
							Strategia nastawiona na długoterminowe budowanie majątku.
							Krótkoterminowe wahania rynkowe (szumy) są ignorowane na rzecz
							siły procentu składanego i dywidend.
						</p>
						<div className="flex items-center gap-2 mt-4 pt-4 border-t border-t-border-subtle">
							<Target className="w-4 h-4 text-emerald-500" />
							<span className="text-xs font-bold text-t-text-secondary">
								Cel główny: Budowa poduszki emerytalnej
							</span>
						</div>
					</div>
				</ProfileCard>

				{/* Karta: Konstrukcja Portfela (Baza) */}
				<ProfileCard
					icon={ShieldAlert}
					title="Docelowa Alokacja (Kompas)"
					color="text-emerald-500"
					bgColor="bg-emerald-500/10"
				>
					<div className="space-y-3 mt-2">
						<AllocationBar
							label="Obligacje Skarbowe (EDO/DOS)"
							percent={55}
							color="bg-blue-500"
						/>
						<AllocationBar
							label="Akcje Rynki Rozwinięte (DM)"
							percent={15}
							color="bg-emerald-500"
						/>
						<AllocationBar
							label="Akcje Rynki Wschodzące (EM)"
							percent={15}
							color="bg-teal-500"
						/>
						<AllocationBar
							label="Surowce (Złoto)"
							percent={10}
							color="bg-amber-500"
						/>
						<AllocationBar
							label="Booster (Aktywna selekcja)"
							percent={5}
							color="bg-rose-500"
						/>
					</div>
				</ProfileCard>

				{/* Karta: Optymalizacja Podatkowa */}
				<ProfileCard
					icon={Wallet}
					title="Tarcze Podatkowe"
					color="text-purple-500"
					bgColor="bg-purple-500/10"
				>
					<div className="space-y-4 mt-2">
						<p className="text-xs text-t-text-tertiary leading-relaxed font-medium mb-4">
							Monitorowanie rocznych limitów wpłat na konta emerytalne
							zwalniające z podatku Belki (19%).
						</p>

						<div className="space-y-2">
							<div className="flex justify-between text-xs font-bold">
								<span className="text-t-text-secondary">Limit IKE (2026)</span>
								<span className="text-purple-500">12 400 / 23 718 PLN</span>
							</div>
							<div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
								<div
									className="h-full bg-purple-500 rounded-full"
									style={{ width: "52%" }}
								/>
							</div>
						</div>

						<div className="space-y-2 pt-2">
							<div className="flex justify-between text-xs font-bold">
								<span className="text-t-text-secondary">Limit IKZE (2026)</span>
								<span className="text-purple-500">0 / 9 466 PLN</span>
							</div>
							<div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
								<div
									className="h-full bg-purple-500 rounded-full"
									style={{ width: "0%" }}
								/>
							</div>
						</div>
					</div>
				</ProfileCard>
			</div>
		</div>
	);
}

// =========================================================
// KOMPONENTY POMOCNICZE WIDOKU
// =========================================================

function ProfileCard({ icon: Icon, title, color, bgColor, children }: any) {
	return (
		<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 shadow-sm hover:border-blue-500/20 transition-colors">
			<div className="flex items-center gap-3 mb-4">
				<div className={cn("p-2.5 rounded-xl", bgColor)}>
					<Icon className={cn("w-4 h-4", color)} />
				</div>
				<h3 className="text-[11px] font-black uppercase tracking-widest text-t-text-primary">
					{title}
				</h3>
			</div>
			{children}
		</div>
	);
}

function AllocationBar({
	label,
	percent,
	color,
}: {
	label: string;
	percent: number;
	color: string;
}) {
	return (
		<div className="flex items-center gap-3">
			<div
				className="w-24 text-[10px] font-bold text-t-text-secondary uppercase tracking-wider truncate"
				title={label}
			>
				{label}
			</div>
			<div className="flex-1 h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
				<div
					className={cn("h-full rounded-full opacity-80", color)}
					style={{ width: `${percent}%` }}
				/>
			</div>
			<div className="w-8 text-right text-[10px] font-black text-t-text-primary">
				{percent}%
			</div>
		</div>
	);
}

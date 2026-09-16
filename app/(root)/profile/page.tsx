"use client";

import {
	Calendar,
	Compass,
	Edit3,
	ShieldAlert,
	Target,
	User,
	Wallet,
} from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { FilterBadge } from "@/components/shared/FilterBadge";
import { SafeActionButton } from "@/components/ui/SafeActionButton";
// Components imports
import { cn } from "@/lib/utils";

// Mock data - to be replaced with Prisma queries
const mockUser = {
	email: "jan.kowalski@example.com",
	plan: "Premium",
	joined: "Listopada 2025",
};

// Predefined color palette matching the application theme
const PREDEFINED_COLORS = [
	"#3b82f6", // blue-500
	"#10b981", // emerald-500
	"#f59e0b", // amber-500
	"#ef4444", // red-500
	"#8b5cf6", // violet-500
	"#ec4899", // pink-500
	"#14b8a6", // teal-500
	"#f97316", // orange-500
];

const TABS = [
	{ id: "overview", label: "Przegląd Strategii" },
	{ id: "appearance", label: "Wygląd i Konto" },
	{ id: "alerts", label: "Powiadomienia" },
	{ id: "reports", label: "Raporty (PDF)" },
] as const;

export default function InvestorProfilePage() {
	const [activeTab, setActiveTab] = useState<string>("overview");

	// State for managing portfolios to show color changes interactively
	const [portfolios, setPortfolios] = useState([
		{ id: "1", name: "Baza (Pasywny)", color: "#3b82f6" },
		{ id: "2", name: "Booster (Aktywny)", color: "#ef4444" },
	]);

	// Handler for form submission
	const handleSaveSettings = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Settings saved", portfolios);
	};

	// Handler for updating portfolio color in local state
	const handleColorChange = (portfolioId: string, newColor: string) => {
		setPortfolios((prev) =>
			prev.map((p) => (p.id === portfolioId ? { ...p, color: newColor } : p)),
		);
	};

	return (
		<div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
			{/* 1. HEADER */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
				<div>
					<h1 className="text-3xl md:text-4xl font-black tracking-tighter text-t-text-primary mb-2">
						Profil Inwestora
					</h1>
					<p className="text-sm font-medium text-t-text-tertiary">
						Twoja finansowa tożsamość, strategia i ustawienia aplikacji.
					</p>
				</div>

				{/* Replaced generic button with SafeActionButton */}
				<SafeActionButton
					label="Aktualizuj Profil"
					icon={Edit3}
					isDemo={false}
					variant="outline"
				/>
			</div>

			{/* 2. HERO CARD */}
			<div className="relative overflow-hidden bg-t-bg-panel border border-t-border-subtle rounded-3xl p-8 shadow-sm">
				<div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

				<div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
					<div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-1 shrink-0 shadow-xl shadow-blue-500/20">
						<div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-900">
							<User className="w-10 h-10 text-white opacity-80" />
						</div>
					</div>

					<div className="text-center md:text-left flex-1">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 mb-3">
							<Compass className="w-3.5 h-3.5" />
							<span className="text-[10px] font-black uppercase tracking-widest">
								Strateg Pasywny z Alfa Boosterem
							</span>
						</div>
						<h2 className="text-2xl font-black tracking-tight text-t-text-primary mb-1">
							Jan Kowalski
						</h2>
						<p className="text-sm font-medium text-t-text-tertiary">
							Członek InvestGuard od {mockUser.joined}
						</p>
					</div>
				</div>
			</div>

			{/* 3. TABS NAVIGATION (Using FilterBadge) */}
			<div className="flex flex-wrap gap-2 border-b border-t-border-subtle pb-4">
				{TABS.map((tab) => (
					<FilterBadge
						key={tab.id}
						id={tab.id}
						label={tab.label}
						isSelected={activeTab === tab.id}
						onToggle={(id) => setActiveTab(id)}
					/>
				))}
			</div>

			{/* 4. TAB CONTENTS */}

			{/* OVERVIEW TAB */}
			{activeTab === "overview" && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
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
									<span className="text-amber-500">
										Umiarkowane (Poziom 3/5)
									</span>
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
								chroniących przed zmiennością), z wydzielonym niewielkim
								koszykiem (5%) na aktywne poszukiwanie ponadprzeciętnych stóp
								zwrotu z akcji.
							</p>
						</div>
					</ProfileCard>

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
								Krótkoterminowe wahania rynkowe są ignorowane na rzecz siły
								procentu składanego.
							</p>
							<div className="flex items-center gap-2 mt-4 pt-4 border-t border-t-border-subtle">
								<Target className="w-4 h-4 text-emerald-500" />
								<span className="text-xs font-bold text-t-text-secondary">
									Cel główny: Budowa poduszki emerytalnej
								</span>
							</div>
						</div>
					</ProfileCard>

					<ProfileCard
						icon={ShieldAlert}
						title="Docelowa Alokacja"
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
									<span className="text-t-text-secondary">
										Limit IKE (2026)
									</span>
									<span className="text-purple-500">12 400 / 23 718 PLN</span>
								</div>
								<div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
									<div
										className="h-full bg-purple-500 rounded-full"
										style={{ width: "52%" }}
									/>
								</div>
							</div>
						</div>
					</ProfileCard>
				</div>
			)}

			{/* APPEARANCE TAB */}
			{activeTab === "appearance" && (
				<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in duration-300">
					<form onSubmit={handleSaveSettings} className="space-y-8">
						<div className="space-y-4">
							<h3 className="text-lg font-bold text-t-text-primary">
								Dane Konta
							</h3>
							<p className="text-sm text-t-text-tertiary">
								Email:{" "}
								<span className="font-medium text-t-text-primary">
									{mockUser.email}
								</span>
							</p>
							<p className="text-sm text-t-text-tertiary">
								Aktywny plan:{" "}
								<span className="inline-block px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md font-bold uppercase text-[10px]">
									{mockUser.plan}
								</span>
							</p>
						</div>

						<div className="space-y-4 pt-6 border-t border-t-border-subtle">
							<h3 className="text-lg font-bold text-t-text-primary">
								Kolorystyka Portfeli
							</h3>
							<p className="text-xs text-t-text-tertiary mb-4">
								Wybierz kolor akcentu dla każdego portfela. Zmiana będzie
								widoczna w całej aplikacji po przełączeniu portfela.
							</p>

							<div className="space-y-6 max-w-xl">
								{portfolios.map((portfolio) => (
									<div
										key={portfolio.id}
										className="p-4 border border-t-border-subtle rounded-xl bg-black/5 dark:bg-white/5 space-y-3"
									>
										<span className="font-medium text-sm text-t-text-primary block">
											{portfolio.name}
										</span>

										{/* Predefined Color Palette Selector */}
										<div className="flex flex-wrap gap-3">
											{PREDEFINED_COLORS.map((color) => (
												<button
													key={color}
													type="button"
													onClick={() => handleColorChange(portfolio.id, color)}
													className={cn(
														"w-8 h-8 rounded-full transition-all duration-200 border-2",
														portfolio.color === color
															? "border-t-text-primary scale-110 shadow-md ring-2 ring-offset-2 ring-offset-t-bg-panel ring-t-text-primary/20"
															: "border-transparent opacity-70 hover:opacity-100 hover:scale-105",
													)}
													style={{ backgroundColor: color }}
													aria-label={`Select color ${color}`}
												/>
											))}
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="space-y-4 pt-6 border-t border-t-border-subtle">
							<h3 className="text-lg font-bold text-t-text-primary">
								Rozmiar Czcionki
							</h3>
							<select className="w-full md:w-64 p-3 border border-t-border-subtle rounded-xl bg-t-bg-panel text-t-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
								<option value="sm">Pomniejszona</option>
								<option value="base">Domyślna</option>
								<option value="lg">Powiększona</option>
							</select>
						</div>

						<Button
							type="submit"
							className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3"
						>
							Zapisz Ustawienia
						</Button>
					</form>
				</div>
			)}

			{/* ALERTS TAB */}
			{activeTab === "alerts" && (
				<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in duration-300">
					<div className="space-y-8">
						<div className="space-y-5">
							<h3 className="text-lg font-bold text-t-text-primary">
								Alerty Inwestycyjne
							</h3>

							<label className="flex items-start space-x-4 cursor-pointer group">
								<input
									type="checkbox"
									defaultChecked
									className="mt-1 w-5 h-5 text-blue-600 rounded border-t-border-subtle bg-transparent focus:ring-blue-500 focus:ring-offset-0"
								/>
								<div>
									<p className="font-bold text-sm text-t-text-primary group-hover:text-blue-500 transition-colors">
										Rebalancing Portfela
									</p>
									<p className="text-xs text-t-text-tertiary mt-1">
										Powiadom, gdy waga klasy aktywów odchyli się o więcej niż 5%
										od ustalonego celu.
									</p>
								</div>
							</label>

							{/* Other alerts as previously defined */}
						</div>
					</div>
				</div>
			)}

			{/* REPORTS TAB */}
			{activeTab === "reports" && (
				<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in duration-300">
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<h3 className="text-xl font-bold text-t-text-primary mb-2">
							Raporty Okresowe
						</h3>
						<p className="text-sm text-t-text-tertiary max-w-md">
							Moduł w przygotowaniu.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

// =========================================================
// WIDGET COMPONENTS
// =========================================================

function ProfileCard({ icon: Icon, title, color, bgColor, children }: any) {
	return (
		<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 shadow-sm hover:border-blue-500/20 transition-colors flex flex-col h-full">
			<div className="flex items-center gap-3 mb-4 shrink-0">
				<div className={cn("p-2.5 rounded-xl", bgColor)}>
					<Icon className={cn("w-4 h-4", color)} />
				</div>
				<h3 className="text-[11px] font-black uppercase tracking-widest text-t-text-primary">
					{title}
				</h3>
			</div>
			<div className="flex-1">{children}</div>
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

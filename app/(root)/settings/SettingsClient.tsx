"use client";

import {
	AlertTriangle,
	Globe,
	LayoutDashboard,
	Lock,
	User,
} from "lucide-react";

import { ChangePasswordModal } from "./ChangePasswordModal";
import Cookies from "js-cookie";
import { DeleteAccountTool } from "./DeleteAccountTool";
import { ExportDataButton } from "@/components/settings/ExportDataButton";
import { ObservedMarketsManager } from "@/components/settings/ObservedMartektsManager";
import { TwoFactorManager } from "@/components/settings/TwoFactorManager";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

// 1. Zmieniamy interfejs, aby przyjmował brakujące dane i stan ciastka z serwera
interface SettingsClientProps {
	assets: { name: string; isObserved: boolean; category: string }[];
	maxLimit: number;
	userIndices: string[];
	initialShowBulbTip: boolean;
	initialShowMarketTicker: boolean;
	hasPassword: boolean;
	isTwoFactorEnabled: boolean;
}

export default function SettingsClient({
	assets,
	maxLimit,
	userIndices,
	initialShowBulbTip,
	initialShowMarketTicker,
	hasPassword,
	isTwoFactorEnabled,
}: SettingsClientProps) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("dashboard");

	// 2. Inicjujemy stan korzystając z wartości początkowej z serwera
	const [settings, setSettings] = useState({
		showBulbTip: initialShowBulbTip, // <-- Teraz Switch wie, czy ciastko istnieje!
		showMarketTicker: initialShowMarketTicker, // <-- Teraz Switch wie, czy ciastko istnieje!
		showPortfolioAssetsInRadar: true,
	});
	const toggleSetting = (key: keyof typeof settings) => {
		// EN: 1. Calculate the new value based on the current state
		const newValue = !settings[key];

		// EN: 2. Perform side effects (Cookies & Router) OUTSIDE of setSettings
		if (key === "showBulbTip") {
			if (newValue) {
				Cookies.remove("hide_bulbtip");
			} else {
				Cookies.set("hide_bulbtip", "true", { expires: 365 });
			}
			router.refresh();
		}

		if (key === "showMarketTicker") {
			if (newValue) {
				Cookies.remove("hide_market_ticker");
			} else {
				Cookies.set("hide_market_ticker", "true", { expires: 365 });
			}
			router.refresh();
		}

		// EN: 3. Update the React state purely at the end
		setSettings((prev) => ({ ...prev, [key]: newValue }));
	};

	return (
		<div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
			<div className="mb-8">
				<h1 className="text-3xl md:text-4xl font-black tracking-tighter text-t-text-primary mb-2">
					Ustawienia
				</h1>

				<p className="text-sm font-medium text-t-text-tertiary">
					Zarządzaj swoimi preferencjami, wyglądem aplikacji i bezpieczeństwem.
				</p>
			</div>

			<div className="flex flex-col md:flex-row gap-8">
				<aside className="w-full md:w-64 shrink-0 space-y-1">
					<TabButton
						active={activeTab === "dashboard"}
						onClick={() => setActiveTab("dashboard")}
						icon={LayoutDashboard}
						label="Pulpit i Wygląd"
					/>
					<TabButton
						active={activeTab === "preferences"}
						onClick={() => setActiveTab("preferences")}
						icon={Globe}
						label="Preferencje"
					/>
					<TabButton
						active={activeTab === "account"}
						onClick={() => setActiveTab("account")}
						icon={User}
						label="Twoje Konto"
					/>
					<TabButton
						active={activeTab === "security"}
						onClick={() => setActiveTab("security")}
						icon={Lock}
						label="Bezpieczeństwo"
					/>
				</aside>
				{/* PRAWA KOLUMNA: Zawartość */}

				<main className="flex-1 space-y-8">
					{activeTab === "dashboard" && (
						<div className="space-y-6 animate-in slide-in-from-right-4 duration-500 fade-in">
							<SettingsSection
								title="Personalizacja Pulpitu"
								desc="Wybierz, które moduły mają być widoczne na stronie głównej."
							>
								<ToggleRow
									title="Pasek Rynkowy (Market Ticker)"
									desc="Pływający pasek z notowaniami na samej górze aplikacji."
									isActive={settings.showMarketTicker}
									onClick={() => toggleSetting("showMarketTicker")}
								/>
								<ToggleRow
									title="Lekcja Inwestora (BulbTip)"
									desc="Codzienne wskazówki i definicje finansowe na pulpicie."
									isActive={settings.showBulbTip}
									onClick={() => toggleSetting("showBulbTip")}
								/>
								{/* <ToggleRow
									title="Aktywa z portfela w Radarze"
									desc="Pozwala na wyświetlanie w Radarze Okazji spółek, które już posiadasz."
									isActive={settings.showPortfolioAssetsInRadar}
									onClick={() => toggleSetting("showPortfolioAssetsInRadar")}
								/> */}
							</SettingsSection>
							{/* === NOWY MODUŁ OBSERWOWANYCH RYNKÓW === */}
							<ObservedMarketsManager
								assets={assets}
								maxLimit={maxLimit}
								userIndices={userIndices} // <-- To naprawia czerwony błąd!
							/>
						</div>
					)}
					{/* ZAKŁADKA 2: PREFERENCJE */}
					{activeTab === "preferences" && (
						<div className="space-y-6 animate-in slide-in-from-right-4 duration-500 fade-in">
							<SettingsSection
								title="Ustawienia Regionalne"
								desc="Formatowanie walut i języka w całej aplikacji."
							>
								<div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-t-bg-panel border border-t-border-subtle opacity-60 grayscale cursor-not-allowed">
									<div className="space-y-1 mb-4 sm:mb-0">
										<div className="flex items-center gap-2">
											<p className="text-sm font-bold text-t-text-primary">
												Główna Waluta
											</p>
											<Badge text="WKRÓTCE" />
										</div>
										<p className="text-xs font-medium text-t-text-tertiary">
											Wszystkie aktywa będą przeliczane na tę walutę.
										</p>
									</div>
									<div className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-t-border-subtle text-sm font-bold text-t-text-secondary flex items-center justify-between w-full sm:w-48">
										<span>PLN (Złoty)</span>
									</div>
								</div>

								<div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-t-bg-panel border border-t-border-subtle opacity-60 grayscale cursor-not-allowed">
									<div className="space-y-1 mb-4 sm:mb-0">
										<div className="flex items-center gap-2">
											<p className="text-sm font-bold text-t-text-primary">
												Język Aplikacji
											</p>
											<Badge text="WKRÓTCE" />
										</div>
										<p className="text-xs font-medium text-t-text-tertiary">
											Wybierz język interfejsu (Polski / English).
										</p>
									</div>
									<div className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-t-border-subtle text-sm font-bold text-t-text-secondary flex items-center justify-between w-full sm:w-48">
										<span>Polski</span>
									</div>
								</div>
							</SettingsSection>
						</div>
					)}

					{activeTab === "account" && (
						<div className="space-y-8 animate-in fade-in duration-300">
							{/* SEKCJA 1: INFORMACJE O KONCIE */}
							<section className="space-y-4">
								<div>
									<h2 className="text-lg font-black tracking-tighter text-t-text-primary">
										Profil Użytkownika
									</h2>
									<p className="text-xs font-medium text-t-text-tertiary mt-1">
										Twoje podstawowe dane (opcja edycji wkrótce).
									</p>
								</div>

								<div className="flex items-center justify-between p-4 rounded-2xl bg-t-bg-panel border border-t-border-subtle">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 flex items-center justify-center">
											<User className="w-6 h-6" />
										</div>
										<div>
											<p className="text-sm font-bold text-t-text-primary">
												Dane logowania
											</p>
											<p className="text-xs text-t-text-tertiary mt-0.5">
												Zalogowano za pomocą ustawień systemu
											</p>
										</div>
									</div>
									<ChangePasswordModal hasPassword={hasPassword} />
								</div>
							</section>

							{/* SEKCJA 2: EKSPORT DANYCH (MOCKUP) */}
							<section className="space-y-4">
								<div>
									<h2 className="text-lg font-black tracking-tighter text-t-text-primary">
										Twoje Dane
									</h2>
									<p className="text-xs font-medium text-t-text-tertiary mt-1">
										Zarządzaj swoimi danymi zgodnie z RODO.
									</p>
								</div>
								<div className="p-4 rounded-2xl bg-t-bg-panel border border-t-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
									<div>
										<p className="text-sm font-bold text-t-text-primary">
											Eksportuj portfele
										</p>
										<p className="text-xs text-t-text-tertiary mt-0.5">
											Pobierz kopię swoich danych w formacie JSON.
										</p>
									</div>
									<ExportDataButton />
								</div>
							</section>

							{/* SEKCJA 3: STREFA NIEBEZPIECZNA (DANGER ZONE) WZOROWANA NA HARD ERASE TOOL */}
							<section className="space-y-4 pt-6 border-t border-rose-500/10">
								<div>
									<h2 className="text-lg font-black tracking-tighter text-rose-500 flex items-center gap-2">
										<AlertTriangle className="w-5 h-5" />
										Strefa Niebezpieczna
									</h2>
									<p className="text-xs font-medium text-t-text-tertiary mt-1">
										Działania wykonane w tej sekcji są nieodwracalne.
									</p>
								</div>

								<div className="p-5 border border-rose-500/30 bg-rose-500/5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
									<div className="space-y-1 pr-4">
										<p className="text-sm font-bold text-rose-500">
											Trwałe usunięcie konta
										</p>
										<p className="text-xs font-medium text-rose-500/70 leading-relaxed">
											Ta operacja natychmiastowo i nieodwracalnie skasuje Twoje
											konto, wszystkie utworzone portfele, historię transakcji
											oraz aktywa.
										</p>
									</div>

									<DeleteAccountTool
										hasPassword={hasPassword}
										isTwoFactorEnabled={isTwoFactorEnabled}
									/>
								</div>
							</section>
						</div>
					)}

					{activeTab === "security" && (
						<div className="space-y-8 animate-in fade-in duration-300">
							<section className="space-y-4">
								<div>
									<h2 className="text-lg font-black tracking-tighter text-t-text-primary">
										Zabezpieczenia Konta
									</h2>
									<p className="text-xs font-medium text-t-text-tertiary mt-1">
										Zarządzaj dodatkowymi warstwami ochrony Twoich danych.
									</p>
								</div>

								<div className="space-y-3">
									{/* Tutaj przenosimy 2FA */}
									<TwoFactorManager initialEnabled={isTwoFactorEnabled} />

									{/* Tu w przyszłości dodasz np. listę aktywnych sesji */}
									<div className="p-4 rounded-2xl bg-t-bg-panel border border-t-border-subtle flex items-center justify-between">
										<div>
											<p className="text-sm font-bold text-t-text-primary">
												Aktywne sesje
											</p>
											<p className="text-xs text-t-text-tertiary">
												Zarządzaj urządzeniami, na których jesteś zalogowany.
											</p>
										</div>
										<button className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg text-xs font-bold text-t-text-tertiary">
											Zobacz listę
										</button>
									</div>
								</div>
							</section>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}

// =========================================================
// KOMPONENTY POMOCNICZE
// =========================================================

function TabButton({ active, onClick, icon: Icon, label }: any) {
	return (
		<button
			onClick={onClick}
			className={cn(
				"w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300",
				active
					? "bg-blue-600/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 shadow-sm"
					: "text-t-text-secondary hover:text-t-text-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent",
			)}
		>
			<Icon
				className={cn(
					"w-4 h-4",
					active ? "text-blue-500" : "text-t-text-tertiary",
				)}
			/>
			{label}
		</button>
	);
}

function SettingsSection({ title, desc, children }: any) {
	return (
		<section className="space-y-4">
			<div className="mb-6 border-b border-t-border-subtle pb-4">
				<h2 className="text-lg font-black tracking-tighter text-t-text-primary">
					{title}
				</h2>
				{desc && (
					<p className="text-xs font-medium text-t-text-tertiary mt-1">
						{desc}
					</p>
				)}
			</div>
			<div className="space-y-3">{children}</div>
		</section>
	);
}

function ToggleRow({ title, desc, isActive, onClick }: any) {
	return (
		<div
			onClick={onClick}
			className="flex items-center justify-between p-4 rounded-2xl bg-t-bg-panel border border-t-border-subtle cursor-pointer hover:border-blue-500/30 transition-colors group"
		>
			<div className="space-y-1 pr-8">
				<p className="text-sm font-bold text-t-text-primary group-hover:text-blue-500 transition-colors">
					{title}
				</p>
				<p className="text-xs font-medium text-t-text-tertiary leading-relaxed">
					{desc}
				</p>
			</div>

			<div
				className={cn(
					"relative w-10 h-5 rounded-full transition-colors duration-300 shrink-0 border",
					isActive
						? "bg-blue-500 border-blue-500"
						: "bg-black/10 dark:bg-white/10 border-t-border-subtle",
				)}
			>
				<div
					className={cn(
						"absolute top-[1px] left-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
						isActive ? "translate-x-5" : "translate-x-0",
					)}
				/>
			</div>
		</div>
	);
}

function Badge({ text }: { text: string }) {
	return (
		<span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest">
			{text}
		</span>
	);
}

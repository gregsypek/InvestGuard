"use client";

import { Activity, useEffect, useState } from "react";
import {
	AlertTriangle,
	ChevronLeft,
	Globe,
	Landmark,
	LayoutDashboard,
	Lock,
	ShieldCheck,
	User,
} from "lucide-react";

import { ActiveSessions } from "@/components/settings/ActiveSessions";
import { BondsAdminPanel } from "@/components/BondAdminPanel";
import { ChangePasswordModal } from "./ChangePasswordModal";
import Cookies from "js-cookie";
import { DeleteAccountTool } from "./DeleteAccountTool";
import { ExportDataButton } from "@/components/settings/ExportDataButton";
import { FilterBadge } from "@/components/shared/FilterBadge";
import Link from "next/link"; // 🚀 DODANY IMPORT
import { ObservedMarketsManager } from "@/components/settings/ObservedMartektsManager";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { TwoFactorManager } from "@/components/settings/TwoFactorManager";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
	assets: { name: string; isObserved: boolean; category: string }[];
	maxLimit: number;
	userIndices: string[];
	initialShowBulbTip: boolean;
	initialShowMarketTicker: boolean;
	hasPassword: boolean;
	isTwoFactorEnabled: boolean;
	userRole: string;
	fromDashboard?: boolean;
	email?: string | null;
}

export default function SettingsClient({
	assets,
	maxLimit,
	userIndices,
	initialShowBulbTip,
	initialShowMarketTicker,
	hasPassword,
	isTwoFactorEnabled,
	userRole,
	fromDashboard,
	email,
}: SettingsClientProps) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("dashboard");

	const [settings, setSettings] = useState({
		showBulbTip: initialShowBulbTip,
		showMarketTicker: initialShowMarketTicker,
		showPortfolioAssetsInRadar: true,
	});

	const toggleSetting = (key: keyof typeof settings) => {
		const newValue = !settings[key];

		if (key === "showBulbTip") {
			if (newValue) Cookies.remove("hide_bulbtip");
			else Cookies.set("hide_bulbtip", "true", { expires: 365 });
			router.refresh();
		}

		if (key === "showMarketTicker") {
			if (newValue) Cookies.remove("hide_market_ticker");
			else Cookies.set("hide_market_ticker", "true", { expires: 365 });
			router.refresh();
		}

		setSettings((prev) => ({ ...prev, [key]: newValue }));
	};

	const isAdmin = userRole === "ADMIN";
	const TABS = [
		{ id: "dashboard", label: "Pulpit i Wygląd" },
		{ id: "preferences", label: "Preferencje" },
		{ id: "account", label: "Konto Użytkownika" },
		{ id: "security", label: "Bezpieczeństwo" },
		...(isAdmin ? [{ id: "bonds-admin", label: "Parametry Obligacji" }] : []),
	];

	useEffect(() => {
		if (activeTab === "bonds-admin" && !isAdmin) {
			setActiveTab("dashboard");
		}
	}, [isAdmin, activeTab]);

	return (
		<div className="w-full animate-in fade-in duration-500">
			{/* 🚀 ZINTEGROWANY, SPÓJNY NAGŁÓWEK (W stylu UserDashboard) */}
			<header className="relative overflow-hidden flex flex-col w-full border-b border-white/10 bg-slate-900 rounded-b-2xl text-slate-100 p-6 md:p-8 shadow-lg mb-8">
				{/* 1. Tło SVG (Świetlny Gradient) */}
				<div className="absolute inset-0 pointer-events-none select-none opacity-40 mix-blend-screen">
					<svg
						viewBox="0 0 1024 1024"
						className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
						aria-hidden="true"
					>
						<circle
							cx={512}
							cy={512}
							r={512}
							fill="url(#settings-gradient)"
							fillOpacity="0.7"
						/>
						<defs>
							<radialGradient id="settings-gradient">
								<stop stopColor="#3b82f6" />
								<stop offset={1} stopColor="#1e3a8a" />
							</radialGradient>
						</defs>
					</svg>
				</div>

				<div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col gap-4">
					{/* Ścieżka powrotu */}
					{fromDashboard && (
						<nav className="flex items-center gap-2 mb-2 text-sm text-slate-400">
							<Link
								href="/"
								className={cn(
									"inline-flex items-center transition-all h-5 text-amber-500 hover:text-amber-400 underline decoration-amber-500/40 underline-offset-4 cursor-pointer font-medium",
								)}
							>
								<ChevronLeft
									className="w-4 h-4 mr-0.5 no-underline"
									strokeWidth={2.5}
								/>
								<span>Przegląd inwestycji</span>
							</Link>
							<span className="text-slate-600">/</span>
							<span className="text-slate-200 font-medium lowercase">
								Ustawienia
							</span>
						</nav>
					)}

					{/* Tytuł i zakładki */}
					<div className="flex flex-col gap-2 mb-2">
						<h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-sm mb-3">
							Ustawienia Konta
						</h1>

						<div className="flex flex-wrap items-center gap-2 mt-2">
							<span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
								Wybierz zakładkę:
							</span>
							<div className="flex gap-2 flex-wrap">
								{TABS.map((t) => (
									<FilterBadge
										key={t.id}
										id={t.id}
										label={t.label}
										isSelected={activeTab === t.id}
										onToggle={(id) => setActiveTab(id)}
										className={activeTab === t.id ? "text-blue-300" : ""}
									/>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* 2. Dolna sekcja (Bliźniacze karty profilowe) */}
				{/* <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 mt-6 border-t border-white/10">
					<div className="flex flex-row justify-center items-center gap-3 px-5 py-3.5 w-full sm:w-auto ">
						<div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
							<ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
							<span>Poziom uprawnień:</span>
						</div>

						<div className="flex items-center justify-center gap-3 text-sm sm:text-base font-black text-white tracking-wide uppercase">
							{userRole}
							{userRole === "ADMIN" && (
								<span
									className="flex h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(243,24,96,0.8)] shrink-0"
									title="Pełen dostęp"
								/>
							)}
						</div>
					</div>

					<div className="flex flex-row justify-center items-center gap-3 px-5 py-3.5 w-full sm:w-auto">
						<div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
							<User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
							<span>Adres E-mail:</span>
						</div>

						<div className="text-sm sm:text-base font-black text-white tracking-wide">
							{email || "Brak przypisanego adresu"}
						</div>
					</div>
				</div> */}
				{/* 2. Dolna sekcja (Responsywne karty profilowe) */}
				<div className="relative z-10 max-w-7xl mx-auto sm:w-full flex flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 pt-6 mt-6 border-t border-white/10">
					{/* Karta: Poziom Uprawnień */}
					<div className="flex  sm:flex-row justify-center sm:justify-start items-center gap-1.5 sm:gap-3  w-full sm:w-auto">
						{/* Etykieta z ikoną */}
						<div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
							<ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
							<span>Poziom uprawnień:</span>
						</div>

						{/* Wartość (Rola) i kropka */}
						<div className="flex items-center gap-2 text-xs sm:text-base font-black text-white tracking-wide uppercase">
							{userRole}
							{userRole === "ADMIN" && (
								<span
									className="flex h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(243,24,96,0.8)] shrink-0"
									title="Pełen dostęp"
								/>
							)}
						</div>
					</div>

					{/* Karta: Adres e-mail */}
					<div className="flex flex-col sm:flex-row justify-center  md sm:justify-start items-center gap-1.5 sm:gap-3  w-full sm:w-auto">
						{/* Etykieta z ikoną */}
						<div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
							<User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
							<span>Adres E-mail:</span>
						</div>

						{/* Wartość (Email) */}
						<div className="text-xs sm:text-base font-black text-white tracking-wide break-all sm:break-normal text-center sm:text-left">
							{email || "Brak przypisanego adresu"}
						</div>
					</div>
				</div>
			</header>

			{/* TREŚĆ ZAKŁADEK */}
			<div className="max-w-7xl mx-auto w-full">
				{activeTab === "dashboard" && (
					<div className="animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Pulpit i Wygląd"
							titleIcon={LayoutDashboard}
							subtitle="Personalizacja aplikacji"
							description="Zarządzaj układem strony głównej, włączaj moduły pomocnicze oraz wybierz, które aktywa i indeksy chcesz śledzić na swoim Radarze Rynkowym."
						>
							<div className="space-y-6">
								<SettingsSubSection title="Moduły pulpitu">
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
								</SettingsSubSection>

								<ObservedMarketsManager
									assets={assets}
									maxLimit={maxLimit}
									userIndices={userIndices}
								/>
							</div>
						</SectionLayout>
					</div>
				)}

				{activeTab === "preferences" && (
					<div className="animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Preferencje"
							titleIcon={Globe}
							subtitle="Ustawienia regionalne"
							description="Dostosuj podstawowe formatowanie walut, strefę czasową oraz domyślny język aplikacji (Opcje w przygotowaniu)."
						>
							<div className="space-y-4">
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
							</div>
						</SectionLayout>
					</div>
				)}

				{activeTab === "account" && (
					<div className="animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Konto Użytkownika"
							titleIcon={User}
							subtitle="Zarządzanie profilem"
							description="Edytuj swoje dane logowania, pobierz kompletną historię inwestycji w formacie otwartym lub bezpowrotnie usuń swoje konto."
						>
							<div className="space-y-8">
								<SettingsSubSection
									title="Dane autoryzacyjne"
									desc="Zarządzaj sposobem logowania do aplikacji."
								>
									<div className="flex items-center justify-between p-4 rounded-2xl bg-t-bg-panel border border-t-border-subtle">
										<div className="flex items-center gap-4">
											<div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0">
												<User className="w-5 h-5" />
											</div>
											<div>
												<p className="text-sm font-bold text-t-text-primary">
													Autoryzacja
												</p>
												<p className="text-xs text-t-text-tertiary mt-0.5">
													Zalogowano bezpiecznym kanałem
												</p>
											</div>
										</div>
										<ChangePasswordModal hasPassword={hasPassword} />
									</div>
								</SettingsSubSection>

								<SettingsSubSection
									title="Kopia zapasowa"
									desc="Pobierz swoje dane zgodnie z dyrektywą RODO."
								>
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
								</SettingsSubSection>

								<SettingsSubSection
									title={
										<span className="flex items-center gap-2 text-rose-500">
											<AlertTriangle className="w-4 h-4" /> Strefa Niebezpieczna
										</span>
									}
									desc="Działania wykonane w tej sekcji są natychmiastowe i nieodwracalne."
								>
									<div className="p-5 border border-rose-500/30 bg-rose-500/5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
										<div className="space-y-1 pr-4">
											<p className="text-sm font-bold text-rose-500">
												Trwałe usunięcie konta
											</p>
											<p className="text-xs font-medium text-rose-500/70 leading-relaxed">
												Skasuje Twoje konto, portfele, historię transakcji oraz
												aktywa.
											</p>
										</div>
										<DeleteAccountTool
											hasPassword={hasPassword}
											isTwoFactorEnabled={isTwoFactorEnabled}
										/>
									</div>
								</SettingsSubSection>
							</div>
						</SectionLayout>
					</div>
				)}

				{activeTab === "security" && (
					<div className="animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Bezpieczeństwo"
							titleIcon={Lock}
							subtitle="Ochrona dostępu"
							description="Zarządzaj dodatkowymi warstwami ochrony Twoich danych, takimi jak uwierzytelnianie dwuetapowe (2FA), oraz monitoruj logowania."
						>
							<div className="space-y-6">
								<TwoFactorManager initialEnabled={isTwoFactorEnabled} />
								<ActiveSessions />
							</div>
						</SectionLayout>
					</div>
				)}

				{activeTab === "bonds-admin" && isAdmin && (
					<div className="animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Parametry Obligacji"
							titleIcon={Landmark}
							subtitle="Baza MF & GUS"
							description="Panel administracyjny do zarządzania globalnymi parametrami silnika obligacji skarbowych (odczyty inflacji oraz konfiguracje poszczególnych serii)."
						>
							<BondsAdminPanel />
						</SectionLayout>
					</div>
				)}
			</div>
		</div>
	);
}

// =========================================================
// KOMPONENTY POMOCNICZE
// =========================================================

function SettingsSubSection({ title, desc, children }: any) {
	return (
		<section className="space-y-3">
			<div className="mb-3 border-b border-t-border-subtle pb-2">
				<h3 className="text-sm font-black tracking-tight text-t-text-primary">
					{title}
				</h3>
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

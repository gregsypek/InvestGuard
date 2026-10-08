"use client";

import { Activity, useEffect, useState } from "react";
import {
	AlertTriangle,
	ChevronLeft,
	Globe,
	Landmark,
	LayoutDashboard,
	Lock,
	Settings2,
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
import Link from "next/link";
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
		// 🚀 ZMIANA 1: Upewnienie się, że jest centrowanie
		<div className="max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500 pb-24">
			{/* 🚀 ZMIANA 2: Bleed Effect dla Headera (-mx-3 md:-mx-10 px-3 md:px-10) */}
			<header className="relative overflow-hidden flex flex-col gap-6 md:gap-6 -mx-3 md:-mx-10 px-3 md:px-10 bg-slate-950 bg-gradient-to-r from-theme-primary/20 dark:from-theme-primary/10 via-slate-900 to-slate-950 text-slate-100 py-3 md:py-6 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors shadow-lg">
				{/* --- TEKSTURA SVG --- */}
				<div
					className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%233b82f6' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%233b82f6' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%2310b981' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%2310b981' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
						WebkitMaskImage:
							"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
						maskImage:
							"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
					}}
				/>

				<div className="relative z-10 flex flex-col gap-2">
					{/* Ścieżka powrotu */}
					{fromDashboard && (
						<nav className="flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-slate-400 italic">
							<Link
								href="/"
								className="inline-flex items-center transition-opacity text-theme-primary hover:opacity-80 cursor-pointer font-medium mr-1"
							>
								<ChevronLeft className="h-4 w-4" />
								<span>Przegląd inwestycji</span>
							</Link>
							<span className="text-slate-500">/</span>
							<span className="text-slate-200 font-medium lowercase">
								Ustawienia
							</span>
						</nav>
					)}

					<div className="mt-1 sm:mt-2">
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter capitalize flex items-center gap-3 drop-shadow-sm text-slate-300">
							Ustawienia Aplikacji
						</h1>
						<p className="text-slate-400 font-medium mt-1 text-[11px] sm:text-sm md:text-base leading-tight">
							Zarządzaj swoim profilem, zabezpieczeniami i preferencjami
							systemowymi.
						</p>
					</div>

					{/* 🚀 ZAKŁADKI W RAMCE */}
					<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-4 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-inner w-full min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
						<span className="sticky left-0 w-max flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
							<Settings2 className="w-3 h-3 text-theme-primary" /> Sekcja:
						</span>

						<div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap pb-1 sm:pb-0 w-max sm:w-full">
							{TABS.map((t) => (
								<FilterBadge
									key={t.id}
									id={t.id}
									label={t.label}
									isSelected={activeTab === t.id}
									onToggle={(id) => setActiveTab(id)}
									className={cn(
										"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0 border",
										activeTab === t.id
											? t.id === "bonds-admin"
												? "bg-amber-500 text-white border-transparent shadow-sm"
												: "bg-theme-primary text-white border-transparent shadow-sm"
											: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
									)}
								/>
							))}
						</div>
					</div>
				</div>

				{/* DÓŁ: Uprawnienia i Konto */}
				<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-start gap-4 md:gap-8 pb-1 border-t border-white/10 pt-4 mt-2">
					{/* INFO: Uprawnienia */}
					<div className="space-y-1 shrink-0">
						<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase mb-1">
							<ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
							<span>Uprawnienia systemowe</span>
						</div>
						<div className="flex items-center gap-2">
							<h2 className="text-xl sm:text-2xl font-black tracking-tighter text-white drop-shadow-sm uppercase">
								{userRole}
							</h2>
							{userRole === "ADMIN" && (
								<span
									className="flex h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(243,24,96,0.8)] shrink-0"
									title="Pełen dostęp"
								/>
							)}
						</div>
					</div>

					{/* INFO: Email */}
					<div className="space-y-1 shrink-0">
						<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase mb-1">
							<User className="w-3.5 h-3.5 text-slate-300" />
							<span>Konto Użytkownika</span>
						</div>
						<div className="flex items-center gap-2">
							<h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-200 truncate max-w-[250px] sm:max-w-md">
								{email || "Brak przypisanego adresu"}
							</h2>
						</div>
					</div>
				</div>
			</header>

			{/* ZAWARTOŚĆ ZAKŁADEK */}
			<div className="w-full pt-2">
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

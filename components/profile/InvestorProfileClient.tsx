"use client";

import {
	Activity,
	Calendar,
	CalendarClock,
	Camera,
	Edit3,
	Info,
	Lock,
	PieChart,
	ShieldAlert,
	Star,
	Target,
	TrendingUp,
	User,
	UserCog,
	Wallet,
} from "lucide-react";
import React, { useEffect, useState, useTransition } from "react";
import {
	setDefaultPortfolio,
	updatePortfolioThemes,
} from "@/lib/actions/portfolio.actions";
import { updateUserAlerts, updateUserData } from "@/lib/actions/user.actions";

import { Button } from "@/components/ui/button";
import { ChangePasswordModal } from "@/app/(root)/settings/ChangePasswordModal";
import { FilterBadge } from "@/components/shared/FilterBadge";
import Image from "next/image";
import { SafeActionButton } from "@/components/ui/SafeActionButton";
import { SectionLayout } from "../shared/SectionLayout";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";
import { runSmartAlerts } from "@/lib/actions/alerts.actions";
import { toast } from "sonner";

const THEME_OPTIONS_MAP: Record<string, string> = {
	blue: "#3b82f6",
	indigo: "#6366f1",
	violet: "#8b5cf6",
	purple: "#a855f7",
	fuchsia: "#d946ef",
	pink: "#ec4899",
	emerald: "#10b981",
	teal: "#14b8a6",
	cyan: "#06b6d4",
	sky: "#0ea5e9",
	amber: "#f59e0b",
	orange: "#f97316",
	lime: "#84cc16",
	slate: "#64748b",
	green: "#22c55e",
	yellow: "#eab308",
	zinc: "#71717a",
	stone: "#78716c",
};
const TABS = [
	{ id: "overview", label: "Przegląd Strategii" },
	{ id: "appearance", label: "Wygląd i Konto" },
	{ id: "alerts", label: "Powiadomienia" },
] as const;

export interface UserProfileData {
	name: string;
	email: string;
	plan: string;
	avatarUrl?: string;
	planExpiresAt?: string;
	hasPassword?: boolean;
	alertBonds?: boolean;
	alertRebalancing?: boolean;
	alertPlans?: boolean;
	defaultPortfolioId?: string | null; // 🚀 DODANE
}

export interface PortfolioData {
	id: string;
	name: string;
	colorTheme: string;
	currentValue: number;
	goal: number | null;
	tenure: string;
}

export interface AllocationData {
	category: string;
	label: string;
	percent: number;
	colorClass: string;
}

export interface SummaryData {
	totalInvested: number;
	currentValue: number;
	totalGoal: number;
	globalTenure: string;
	globalMwr: number;
}

interface InvestorProfileClientProps {
	user: UserProfileData;
	initialPortfolios: PortfolioData[];
	allocations: AllocationData[];
	summary: SummaryData;
}

const inputStyles =
	"h-12 w-full bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-theme-primary rounded-xl px-4 text-sm font-medium text-t-text-primary transition-colors outline-none focus:ring-0";

export default function InvestorProfileClient({
	user,
	initialPortfolios,
	allocations,
	summary,
}: InvestorProfileClientProps) {
	const [activeTab, setActiveTab] = useState<string>("overview");
	const [isAnimated, setIsAnimated] = useState(false);
	const [portfolios, setPortfolios] =
		useState<PortfolioData[]>(initialPortfolios);
	const [isPending, startTransition] = useTransition();

	const [userName, setUserName] = useState(user.name || "");
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(
		user.avatarUrl || null,
	);

	const [alerts, setAlerts] = useState({
		bonds: user.alertBonds ?? true,
		rebalancing: user.alertRebalancing ?? true,
		plans: user.alertPlans ?? true,
	});

	const [defaultPortfolio, setDefaultPortfolioState] = useState<string | null>(
		user.defaultPortfolioId || null,
	);

	// Nowa funkcja obsługująca zmianę
	const handleSetDefault = (portfolioId: string) => {
		if (portfolioId === defaultPortfolio) return;

		startTransition(async () => {
			const result = await setDefaultPortfolio(portfolioId);
			if (result.success) {
				setDefaultPortfolioState(portfolioId);
				toast.success("Ustawiono jako portfel domyślny 🌟");
			} else {
				toast.error(result.error);
			}
		});
	};

	const toggleAlert = (key: keyof typeof alerts) => {
		setAlerts((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	// 🚀 LOGIKA ZMIANY ZDJĘCIA (Podgląd w przeglądarce)
	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setAvatarFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setAvatarPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSaveAlerts = async () => {
		const toastId = toast.loading("Zapisywanie preferencji...");
		const result = await updateUserAlerts({
			alertBonds: alerts.bonds,
			alertRebalancing: alerts.rebalancing,
			alertPlans: alerts.plans,
		});

		if (result.success) {
			toast.success("Ustawienia powiadomień zostały zapisane! 💾", {
				id: toastId,
			});
		} else {
			toast.error(result.error || "Wystąpił błąd.", { id: toastId });
		}
	};

	useEffect(() => {
		let timer: NodeJS.Timeout;
		if (activeTab === "overview") {
			timer = setTimeout(() => setIsAnimated(true), 100);
		}
		return () => {
			clearTimeout(timer);
			setIsAnimated(false);
		};
	}, [activeTab]);

	const handleSaveSettings = (e: React.FormEvent) => {
		e.preventDefault();
		startTransition(async () => {
			// 1. Zapis motywów portfeli
			const dataToSave = portfolios.map((p) => ({
				id: p.id,
				colorTheme: p.colorTheme,
			}));
			const themePromise = updatePortfolioThemes(dataToSave);

			// 2. Zapis danych użytkownika (Imię i Avatar)
			const formData = new FormData();
			if (userName) formData.append("name", userName);
			if (avatarFile) formData.append("avatar", avatarFile);

			const userPromise = updateUserData(formData);
			// Wykonujemy obie akcje serwerowe równocześnie dla lepszej wydajności
			const [themeResult, userResult] = await Promise.all([
				themePromise,
				userPromise,
			]);

			if (!userResult.success) {
				toast.error(
					userResult.error || "Nie udało się zaktualizować danych konta.",
				);
				return;
			}

			if (themeResult.success && userResult.success) {
				toast.success("Profil został pomyślnie zaktualizowany! 💾");
			} else {
				toast.error("Wystąpił błąd podczas zapisu motywów. ❌");
			}
		});
	};

	const handleTestEmail = async () => {
		const toastId = toast.loading("Wysyłanie maila...");
		const result = await runSmartAlerts(true);
		if (result.success) {
			toast.success("E-mail wysłany! Sprawdź skrzynkę (również SPAM).", {
				id: toastId,
			});
		} else {
			toast.error(result.error || "Wystąpił błąd wysyłki.", { id: toastId });
		}
	};

	const profit = summary.currentValue - summary.totalInvested;
	const profitPercent =
		summary.totalInvested > 0 ? (profit / summary.totalInvested) * 100 : 0;
	const globalGoalProgress =
		summary.totalGoal > 0
			? (summary.currentValue / summary.totalGoal) * 100
			: 0;

	return (
		<div className="max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500 pb-24">
			{/* 🚀 ZMODYFIKOWANY NAGŁÓWEK (Hero Card wyrwana z sekcji) */}
			<header className="relative overflow-hidden w-full bg-slate-900 border-b border-white/10 rounded-b-2xl p-6 md:p-8 lg:p-10 shadow-lg mt-2 md:mt-0 group transition-all duration-500">
				{/* Efekt Świetlny SVG dla ciemnego motywu (spójność) */}
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
							fill="url(#profile-gradient)"
							fillOpacity="0.7"
						/>
						<defs>
							<radialGradient id="profile-gradient">
								<stop stopColor="#3b82f6" />
								<stop offset={1} stopColor="#1e3a8a" />
							</radialGradient>
						</defs>
					</svg>
				</div>

				<div className="relative z-10 flex flex-col md:flex-row items-center gap-6 max-w-7xl mx-auto">
					{/* Avatar */}
					<div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shrink-0 shadow-xl group-hover:scale-105 transition-transform duration-500">
						<div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-900 relative z-10 overflow-hidden">
							{user.avatarUrl ? (
								<Image
									src={user.avatarUrl}
									alt="Avatar"
									width={96}
									height={96}
									className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
								/>
							) : (
								<User className="w-10 h-10 text-slate-400 opacity-90" />
							)}
						</div>
					</div>

					{/* Dane użytkownika */}
					<div className="text-center md:text-left flex-1">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 mb-3 shadow-inner">
							<span className="text-[10px] font-black uppercase tracking-widest">
								{user.plan}
							</span>
						</div>
						<h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-sm mb-1">
							{user.name}
						</h1>
						<p className="text-sm font-medium text-slate-400">
							Kapitał pracuje od:{" "}
							<span className="font-bold text-slate-300">
								{summary.globalTenure}
							</span>
						</p>
					</div>

					{/* Przycisk Akcji - Szybka Edycja */}
					<div className="hidden md:block">
						<SafeActionButton
							label="Aktualizuj Profil"
							icon={Edit3}
							isDemo={false}
							variant="outline"
							className="border-white/20 bg-white/5 text-white hover:bg-white/10 shadow-sm"
							onClick={() => setActiveTab("appearance")}
						/>
					</div>
				</div>
			</header>

			{/* 🚀 STICKY PASEK NAWIGACJI (Zgodny z resztą aplikacji) */}
			<div className="sticky top-0 z-50 w-full bg-t-bg-base/80 backdrop-blur-xl border-b border-t-border-subtle py-3 transition-all duration-300">
				<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
					<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest hidden sm:block">
						Wybierz zakładkę:
					</span>
					<div className="flex gap-1.5 flex-wrap">
						{TABS.map((t) => (
							<FilterBadge
								key={t.id}
								id={t.id}
								label={t.label}
								isSelected={activeTab === t.id}
								onToggle={(id) => setActiveTab(id)}
								className={
									activeTab === t.id
										? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
										: ""
								}
							/>
						))}
					</div>
				</div>
			</div>

			{/* ZAWARTOŚĆ ZAKŁADEK */}
			<div className="w-full pt-2">
				{activeTab === "overview" && (
					<div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
						<div className="bg-theme-soft/50 border border-theme-border rounded-2xl p-4 flex items-start gap-4">
							<div className="bg-theme-primary/10 p-2 rounded-full shrink-0">
								<Info className="w-5 h-5 text-theme-primary" />
							</div>
							<div>
								<h4 className="text-sm font-bold text-t-text-primary">
									Skonsolidowany Widok Majątku
								</h4>
								<p className="text-xs text-t-text-tertiary mt-1 leading-relaxed max-w-3xl">
									Dane widoczne w tej sekcji stanowią sumę ze wszystkich Twoich
									portfeli. Służą one ocenie całkowitej sytuacji finansowej i
									zrealizowanych założeń z lotu ptaka.
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* GLOBALNY WYNIK */}
							<ProfileCard
								icon={TrendingUp}
								title="Całkowita wycena (Suma portfeli)"
								color="text-emerald-500"
								bgColor="bg-emerald-500/10"
							>
								<div className="space-y-4 mt-2">
									<div className="flex justify-between items-end">
										<p className="text-xs text-t-text-tertiary font-bold uppercase tracking-widest">
											Obecna Wycena
										</p>
										<p className="text-2xl font-black text-t-text-primary tracking-tighter">
											{formatCurrency(summary.currentValue)}{" "}
											<span className="text-sm text-t-text-tertiary">PLN</span>
										</p>
									</div>
									<div className="h-px w-full bg-t-border-subtle" />
									<div className="flex justify-between items-center text-sm font-medium">
										<span className="text-t-text-secondary">
											Zainwestowano:
										</span>
										<span className="text-t-text-primary">
											{summary.totalInvested.toLocaleString("pl-PL", {
												minimumFractionDigits: 2,
											})}{" "}
											PLN
										</span>
									</div>
									<div className="flex justify-between items-center text-sm font-bold">
										<span className="text-t-text-secondary">
											Całkowity Zysk:
										</span>
										<span
											className={cn(
												profit >= 0 ? "text-emerald-500" : "text-rose-500",
											)}
										>
											{profit > 0 ? "+" : ""}
											{profit.toLocaleString("pl-PL", {
												minimumFractionDigits: 2,
											})}{" "}
											PLN
										</span>
									</div>
									<div className="flex justify-between items-center text-sm font-bold">
										<span className="text-t-text-secondary">Stopa prosta</span>
										<span
											className={cn(
												profit >= 0 ? "text-emerald-500" : "text-rose-500",
											)}
										>
											{profit > 0 ? "+" : ""}
											{profitPercent.toFixed(2)}%
										</span>
									</div>
									<div className="flex justify-between items-center text-sm font-bold group/mwr relative">
										<span className="text-t-text-secondary flex items-center gap-1.5 cursor-help">
											Stopa MWR
											<Info className="w-3.5 h-3.5 text-t-text-tertiary hover:text-theme-primary transition-colors" />
										</span>
										<div className="absolute left-0 bottom-6 w-64 p-2 bg-t-bg-panel border border-t-border rounded-lg shadow-xl opacity-0 invisible group-hover/mwr:opacity-100 group-hover/mwr:visible transition-all z-50 text-[10px] font-medium text-t-text-tertiary leading-tight pointer-events-none">
											<span className="font-bold text-t-text-primary block mb-1">
												Money-Weighted Return (XIRR)
											</span>
											Roczna stopa zwrotu precyzyjnie uwzględniająca wielkość i
											daty wszystkich Twoich historycznych wpłat oraz wypłat.
										</div>
										<span
											className={cn(
												summary.globalMwr >= 0
													? "text-emerald-500"
													: "text-rose-500",
											)}
										>
											{summary.globalMwr > 0 ? "+" : ""}
											{summary.globalMwr.toFixed(2)}%
										</span>
									</div>
								</div>
							</ProfileCard>

							{/* POSIADANE PORTFELE */}
							<ProfileCard
								icon={Wallet}
								title="Twoje Portfele (Wartość i Staż)"
								color="text-purple-500"
								bgColor="bg-purple-500/10"
							>
								<div className="space-y-4 mt-2 pr-2">
									{portfolios.map((p) => (
										<div
											key={p.id}
											className="flex justify-between items-center border-b border-t-border-subtle pb-3 last:border-0 last:pb-0"
										>
											<div>
												<div className="flex items-center gap-2">
													<div
														className="w-2 h-2 rounded-full"
														style={{
															backgroundColor: `var(--color-${p.colorTheme}-500, var(--theme-primary))`,
														}}
													/>
													<span className="font-bold text-sm text-t-text-primary">
														{p.name}
													</span>
												</div>
												<p className="text-[10px] text-t-text-tertiary font-bold uppercase tracking-widest mt-1">
													Na rynku od: {p.tenure}
												</p>
											</div>
											<span className="font-black text-sm text-t-text-primary">
												{p.currentValue.toLocaleString("pl-PL")}{" "}
												<span className="text-[10px] text-t-text-tertiary">
													PLN
												</span>
											</span>
										</div>
									))}
								</div>
							</ProfileCard>

							{/* REALIZACJA CELÓW */}
							<ProfileCard
								icon={Target}
								title="Realizacja Celów"
								color="text-blue-500"
								bgColor="bg-blue-500/10"
							>
								<div className="space-y-6 mt-2">
									{summary.totalGoal > 0 ? (
										<div>
											<div className="flex justify-between text-xs font-bold mb-2">
												<span className="text-t-text-secondary uppercase tracking-widest">
													Globalny Cel
												</span>
												<span className="text-blue-500">
													{globalGoalProgress.toFixed(1)}%
												</span>
											</div>
											<div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden flex shadow-inner">
												<div
													className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
													style={{
														width: isAnimated
															? `${Math.min(globalGoalProgress, 100)}%`
															: "0%",
													}}
												/>
											</div>
											<p className="text-[10px] text-t-text-tertiary text-right mt-1.5 font-bold uppercase tracking-widest">
												{summary.totalGoal.toLocaleString("pl-PL")} PLN
											</p>
										</div>
									) : (
										<p className="text-sm text-t-text-tertiary text-center italic">
											Brak zdefiniowanych celów globalnych.
										</p>
									)}

									<div className="space-y-3 pt-4 border-t border-t-border-subtle">
										{portfolios
											.filter((p) => p.goal)
											.map((p) => {
												const portProgress = p.goal
													? (p.currentValue / p.goal) * 100
													: 0;
												return (
													<div key={p.id}>
														<div className="flex justify-between text-[10px] font-bold mb-1.5">
															<span className="text-t-text-tertiary">
																{p.name}
															</span>
															<span className="text-t-text-primary">
																{portProgress.toFixed(1)}%
															</span>
														</div>
														<div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden flex">
															<div
																className="h-full rounded-full transition-all duration-1000 ease-out"
																style={{
																	width: isAnimated
																		? `${Math.min(portProgress, 100)}%`
																		: "0%",
																	backgroundColor: `var(--color-${p.colorTheme}-500, #3b82f6)`,
																}}
															/>
														</div>
													</div>
												);
											})}
									</div>
								</div>
							</ProfileCard>

							{/* DOCELOWA ALOKACJA */}
							<ProfileCard
								icon={PieChart}
								title="Rzeczywista Alokacja"
								color="text-amber-500"
								bgColor="bg-amber-500/10"
							>
								<div className="space-y-3 mt-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
									{allocations.map((alloc, index) => (
										<AllocationBar
											key={alloc.category}
											label={alloc.label}
											percent={alloc.percent}
											color={alloc.colorClass}
											isAnimated={isAnimated}
											index={index}
										/>
									))}
								</div>
							</ProfileCard>
						</div>
					</div>
				)}

				{/* 🚀 NOWY LAYOUT DLA USTAWIEŃ KONTA */}
				{activeTab === "appearance" && (
					<div className="animate-in slide-in-from-right-4 fade-in duration-300">
						<SectionLayout
							title="Dane konta i Wygląd"
							titleIcon={UserCog}
							subtitle="Zarządzaj swoją tożsamością"
							description="Zaktualizuj swoje dane osobowe, podłącz autoryzację bezpiecznym hasłem i dostosuj kolory poszczególnych portfeli według własnych upodobań."
						>
							<form
								onSubmit={handleSaveSettings}
								className="space-y-8 w-full bg-t-bg-panel border border-t-border rounded-2xl p-6 shadow-sm"
							>
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-t-bg-base/30 dark:bg-black/20 border border-t-border-subtle">
									<div className="space-y-1">
										<p className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary mb-2">
											Status Konta
										</p>
										<div className="flex items-center gap-2 mt-1">
											<p className="text-sm font-medium text-t-text-primary">
												Aktywny plan:
											</p>
											<span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md font-bold uppercase text-[10px]">
												{user.plan}
											</span>
										</div>
										<p className="text-xs font-medium text-t-text-tertiary mt-1">
											Wygasa:{" "}
											<span className="font-bold text-t-text-secondary">
												{user.planExpiresAt || "31 grudnia 2026"}
											</span>
										</p>
									</div>
									<Button
										type="button"
										variant="outline"
										className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 font-bold rounded-xl shadow-sm transition-colors cursor-not-allowed opacity-50"
										disabled
									>
										Zarządzaj Subskrypcją
									</Button>
								</div>

								{/* DANE OSOBOWE */}
								<div className="pt-6 border-t border-t-border-subtle space-y-6">
									<div>
										<h3 className="text-lg font-bold text-t-text-primary">
											Dane Osobowe
										</h3>
										<p className="text-xs font-medium text-t-text-tertiary mt-1">
											Zaktualizuj swoje zdjęcie oraz imię i nazwisko.
										</p>
									</div>
									<div className="flex flex-col md:flex-row gap-8">
										<div className="flex flex-col items-center gap-3 shrink-0">
											<div
												className="relative group cursor-pointer"
												onClick={() =>
													document.getElementById("avatar-upload")?.click()
												}
											>
												<div className="w-28 h-28 rounded-2xl border-2 border-t-border-subtle bg-t-bg-base/50 flex items-center justify-center overflow-hidden shadow-sm">
													{avatarPreview ? (
														<Image
															src={avatarPreview}
															alt="Avatar"
															width={112}
															height={112}
															className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
														/>
													) : (
														<User className="w-12 h-12 text-t-text-tertiary group-hover:opacity-50 transition-opacity" />
													)}
												</div>
												<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 dark:bg-black/40 rounded-2xl">
													<Camera className="w-8 h-8 text-white" />
												</div>
												<input
													id="avatar-upload"
													type="file"
													className="hidden"
													accept="image/*"
													onChange={handleAvatarChange}
												/>
											</div>
											<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
												Zmień Avatar
											</span>
										</div>

										<div className="flex-1 space-y-6">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
												<div className="space-y-2">
													<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
														Imię i Nazwisko
													</label>
													<input
														type="text"
														value={userName}
														onChange={(e) => setUserName(e.target.value)}
														className={inputStyles}
														placeholder="Wpisz swoje dane"
													/>
												</div>
												<div className="space-y-2">
													<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
														Adres Email
													</label>
													<input
														type="email"
														defaultValue={user.email}
														disabled
														className={cn(
															inputStyles,
															"opacity-70 cursor-not-allowed bg-black/5 dark:bg-white/5",
														)}
													/>
												</div>
											</div>
											<div className="flex items-center justify-between p-4 rounded-xl bg-t-bg-base/30 dark:bg-black/20 border border-t-border-subtle mt-4">
												<div className="flex items-center gap-4">
													<div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 flex items-center justify-center">
														<Lock className="w-5 h-5" />
													</div>
													<div>
														<p className="text-sm font-bold text-t-text-primary">
															Ustawienia logowania
														</p>
														<p className="text-xs text-t-text-tertiary mt-0.5">
															{user.hasPassword
																? "Konto zabezpieczone hasłem"
																: "Zalogowano za pomocą Google OAuth"}
														</p>
													</div>
												</div>
												<ChangePasswordModal hasPassword={!!user.hasPassword} />
											</div>
										</div>
									</div>
								</div>

								{/* MOTYWY PORTFELI I DOMYŚLNY PORTFEL */}
								<div className="pt-8 border-t border-t-border-subtle space-y-6">
									<div>
										<h3 className="text-lg font-bold text-t-text-primary">
											Kolorystyka i Ustawienia Portfeli
										</h3>
										<p className="text-xs font-medium text-t-text-tertiary mt-1">
											Wybierz motyw przewodni dla każdego ze swoich portfeli
											oraz zdecyduj, który jest główny.
										</p>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{portfolios.map((portfolio) => {
											const isDefault = defaultPortfolio === portfolio.id;
											return (
												<div
													key={portfolio.id}
													className="p-5 border border-t-border-subtle rounded-xl bg-t-bg-base/30 dark:bg-black/20 space-y-4 relative"
													data-theme={portfolio.colorTheme}
												>
													{/* NAGŁÓWEK KARTY: Tytuł i Przycisk Domyślny */}
													<div className="flex items-center justify-between">
														<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary flex items-center gap-2">
															<div className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
															{portfolio.name}
														</label>

														<button
															type="button"
															disabled={isPending}
															onClick={() => handleSetDefault(portfolio.id)}
															className={cn(
																"p-1.5 rounded-lg transition-colors flex items-center gap-1.5",
																isDefault
																	? "text-yellow-500 bg-yellow-500/10 cursor-default"
																	: "text-t-text-tertiary hover:bg-t-border hover:text-yellow-500 cursor-pointer",
															)}
															title={
																isDefault
																	? "To jest główny portfel"
																	: "Ustaw jako główny"
															}
														>
															<Star
																className={cn(
																	"h-4 w-4 transition-transform",
																	isDefault && "fill-current",
																)}
															/>
															{isDefault && (
																<span className="text-[9px] uppercase tracking-widest font-bold">
																	Główny
																</span>
															)}
														</button>
													</div>

													{/* PALETA KOLORÓW */}
													<div className="flex flex-wrap gap-2.5">
														{Object.entries(THEME_OPTIONS_MAP).map(
															([themeName, hexColor]) => (
																<button
																	key={themeName}
																	type="button"
																	onClick={() => {
																		setPortfolios((prev) =>
																			prev.map((p) =>
																				p.id === portfolio.id
																					? { ...p, colorTheme: themeName }
																					: p,
																			),
																		);
																	}}
																	className={cn(
																		"w-7 h-7 rounded-full transition-all duration-200 border-2",
																		portfolio.colorTheme === themeName
																			? "scale-110 shadow-md ring-2 ring-offset-2 ring-offset-t-bg-panel ring-t-text-primary/20 border-t-text-primary"
																			: "border-transparent opacity-70 hover:opacity-100 hover:scale-105",
																	)}
																	style={{
																		backgroundColor: hexColor, // 🚀 Używamy bezpiecznych hexów ze słownika
																	}}
																	title={themeName}
																/>
															),
														)}
													</div>
												</div>
											);
										})}
									</div>
								</div>

								<div className="flex justify-end pt-8 border-t border-t-border-subtle">
									<Button
										type="submit"
										disabled={isPending}
										className="h-12 px-8 rounded-xl bg-theme-primary hover:opacity-90 text-white font-bold transition-all shadow-sm disabled:opacity-50"
									>
										{isPending ? "Zapisywanie..." : "Zapisz Zmiany Profilu"}
									</Button>
								</div>
							</form>
						</SectionLayout>
					</div>
				)}

				{/* 🚀 NOWY LAYOUT DLA ALERTÓW */}
				{activeTab === "alerts" && (
					<div className="animate-in slide-in-from-right-4 fade-in duration-300">
						<SectionLayout
							title="Konfiguracja Powiadomień"
							titleIcon={ShieldAlert}
							subtitle="Kontroluj przepływ informacji"
							description="Zdecyduj, o jakich zdarzeniach system ma Cię informować za pomocą wiadomości e-mail."
						>
							<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
								<div className="space-y-4">
									<div className="flex items-center justify-between p-5 rounded-xl bg-t-bg-base/30 dark:bg-black/20 border border-t-border-subtle transition-colors hover:border-t-border">
										<div className="flex items-center gap-4">
											<div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 flex items-center justify-center shrink-0">
												<ShieldAlert className="w-5 h-5" />
											</div>
											<div>
												<p className="text-sm font-bold text-t-text-primary">
													Zapadalność Obligacji
												</p>
												<p className="text-xs text-t-text-tertiary mt-0.5 max-w-md">
													Otrzymaj powiadomienie e-mail, gdy do wykupu Twoich
													obligacji pozostanie mniej niż 30 dni.
												</p>
											</div>
										</div>
										<button
											type="button"
											onClick={() => toggleAlert("bonds")}
											className={cn(
												"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-t-bg-panel",
												alerts.bonds ? "bg-blue-800" : "bg-t-border",
											)}
										>
											<span
												className={cn(
													"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
													alerts.bonds ? "translate-x-5" : "translate-x-0",
												)}
											/>
										</button>
									</div>
									<div className="flex items-center justify-between p-5 rounded-xl bg-t-bg-base/30 dark:bg-black/20 border border-t-border-subtle transition-colors hover:border-t-border">
										<div className="flex items-center gap-4">
											<div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0">
												<PieChart className="w-5 h-5" />
											</div>
											<div>
												<p className="text-sm font-bold text-t-text-primary">
													Rebalancing i Alokacja
												</p>
												<p className="text-xs text-t-text-tertiary mt-0.5 max-w-md">
													Powiadomienia, gdy wybrane aktywa niebezpiecznie
													przekroczą założony procent w portfelu.
												</p>
											</div>
										</div>
										<button
											type="button"
											onClick={() => toggleAlert("rebalancing")}
											className={cn(
												"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
												alerts.rebalancing ? "bg-blue-800" : "bg-t-border",
											)}
										>
											<span
												className={cn(
													"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
													alerts.rebalancing
														? "translate-x-5"
														: "translate-x-0",
												)}
											/>
										</button>
									</div>
									<div className="flex items-center justify-between p-5 rounded-xl bg-t-bg-base/30 dark:bg-black/20 border border-t-border-subtle transition-colors hover:border-t-border">
										<div className="flex items-center gap-4">
											<div className="w-10 h-10 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-500 flex items-center justify-center shrink-0">
												<CalendarClock className="w-5 h-5" />
											</div>
											<div>
												<p className="text-sm font-bold text-t-text-primary">
													Dyscyplina Planu
												</p>
												<p className="text-xs text-t-text-tertiary mt-0.5 max-w-md">
													Przypomnienie pod koniec miesiąca, jeśli Twój założony
													Plan Inwestycyjny wciąż ma status niezrealizowanego.
												</p>
											</div>
										</div>
										<button
											type="button"
											onClick={() => toggleAlert("plans")}
											className={cn(
												"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
												alerts.plans ? "bg-blue-800" : "bg-t-border",
											)}
										>
											<span
												className={cn(
													"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
													alerts.plans ? "translate-x-5" : "translate-x-0",
												)}
											/>
										</button>
									</div>
								</div>

								<div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-t-border-subtle gap-4">
									<Button
										type="button"
										variant="outline"
										onClick={handleTestEmail}
										className="w-full sm:w-auto h-12 px-6 rounded-xl border-t-border-subtle text-t-text-secondary hover:text-t-text-primary font-bold shadow-sm"
									>
										<Activity className="w-4 h-4 mr-2" />
										Wymuś Skanowanie
									</Button>
									<Button
										type="button"
										onClick={handleSaveAlerts}
										className="w-full sm:w-auto h-12 px-8 rounded-xl bg-theme-primary hover:opacity-90 text-white font-bold transition-all shadow-sm"
									>
										Zapisz Ustawienia
									</Button>
								</div>
							</div>
						</SectionLayout>
					</div>
				)}
			</div>
		</div>
	);
}

function ProfileCard({
	icon: Icon,
	title,
	color,
	bgColor,
	children,
}: {
	icon: React.ElementType;
	title: string;
	color: string;
	bgColor: string;
	children: React.ReactNode;
}) {
	return (
		<div className="bg-t-bg-panel border border-t-border rounded-3xl p-6 shadow-sm transition-all duration-300 flex flex-col h-full hover:border-theme-border">
			<div className="flex items-center gap-3 mb-4 shrink-0">
				<div
					className={cn(
						"p-2.5 rounded-xl transition-colors duration-300",
						bgColor,
					)}
				>
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
	isAnimated,
	index = 0,
}: {
	label: string;
	percent: number;
	color: string;
	isAnimated: boolean;
	index?: number;
}) {
	const delay = index * 100;
	return (
		<div className="flex items-center gap-3 group/bar">
			<div
				className="w-32 text-[10px] font-bold text-t-text-secondary uppercase tracking-wider truncate transition-colors group-hover/bar:text-t-text-primary"
				title={label}
			>
				{label}
			</div>
			<div className="flex-1 h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
				<div
					className={cn(
						"h-full rounded-full opacity-80 transition-all duration-1000 ease-out group-hover/bar:opacity-100 group-hover/bar:shadow-lg",
						color,
					)}
					style={{
						width: isAnimated ? `${percent}%` : "0%",
						transitionDelay: `${delay}ms`,
					}}
				/>
			</div>
			<div className="w-10 text-right text-[10px] font-black text-t-text-primary">
				{percent.toFixed(1)}%
			</div>
		</div>
	);
}

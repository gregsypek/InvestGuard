"use client";

import {
	Calendar,
	Camera,
	Edit3,
	PieChart,
	Target,
	TrendingUp,
	User,
	UserCog,
	Wallet,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FilterBadge } from "@/components/shared/FilterBadge";
import Image from "next/image";
import { SafeActionButton } from "@/components/ui/SafeActionButton";
import { SectionLayout } from "../shared/SectionLayout";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";

const PREDEFINED_COLORS = [
	"blue",
	"indigo",
	"violet",
	"purple",
	"fuchsia",
	"pink",
	"emerald",
	"teal",
	"cyan",
	"sky",
	"amber",
	"orange",
	"lime",
	"slate",
	"red",
	"rose",
	"green",
	"yellow",
	"zinc",
	"stone",
];

const TABS = [
	{ id: "overview", label: "Przegląd Strategii" },
	{ id: "appearance", label: "Wygląd i Konto" },
	{ id: "alerts", label: "Powiadomienia" },
] as const;

export interface UserProfileData {
	name: string;
	email: string;
	plan: string;
	avatarUrl?: string; // Miejsce na zdjęcie profilowe
	planExpiresAt?: string;
}

export interface PortfolioData {
	id: string;
	name: string;
	colorTheme: string;
	currentValue: number;
	goal: number | null;
	tenure: string; // Wyliczane z pierwszej transakcji
}

export interface AllocationData {
	category: string;
	label: string;
	percent: number;
	colorClass: string; // Pobierane prosto z constants.ts
}

export interface SummaryData {
	totalInvested: number;
	currentValue: number;
	totalGoal: number;
	globalTenure: string; // Czas od absolutnie pierwszej transakcji na koncie
	globalMwr: number;
}

interface InvestorProfileClientProps {
	user: UserProfileData;
	initialPortfolios: PortfolioData[];
	allocations: AllocationData[];
	summary: SummaryData;
}

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
		console.log("Gotowe do zapisu w DB:", portfolios);
	};

	const handleColorChange = (portfolioId: string, newTheme: string) => {
		setPortfolios((prev) =>
			prev.map((p) =>
				p.id === portfolioId ? { ...p, colorTheme: newTheme } : p,
			),
		);
	};

	const profit = summary.currentValue - summary.totalInvested;
	const profitPercent =
		summary.totalInvested > 0 ? (profit / summary.totalInvested) * 100 : 0;
	const globalGoalProgress =
		summary.totalGoal > 0
			? (summary.currentValue / summary.totalGoal) * 100
			: 0;

	return (
		<SectionLayout
			title="Profil Inwestora"
			titleIcon={UserCog}
			subtitle="Tożsamość i ustawienia"
			description="Zarządzaj swoim kontem, weryfikuj globalne wyniki portfeli oraz dostosuj wizualny motyw aplikacji."
			action={
				// 🚀 Przywrócony przycisk aktualizacji profilu
				<SafeActionButton
					label="Aktualizuj Profil"
					icon={Edit3}
					isDemo={false}
					variant="default"
					className="bg-[color-mix(in_srgb,var(--theme-primary),black_10%)] text-white hover:opacity-90 transition-all rounded-xl shadow-sm"
				/>
			}
		>
			<div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
				{/* 1. HERO CARD */}
				<div className="relative overflow-hidden bg-t-bg-panel border border-t-border rounded-3xl p-8 shadow-sm group transition-all duration-500 hover:border-theme-border">
					<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-theme-soft via-transparent to-transparent rounded-full blur-3xl pointer-events-none opacity-50 transition-opacity duration-700" />

					<div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
						<div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-theme-primary to-theme-soft p-1 shrink-0 shadow-xl group-hover:scale-105 transition-transform duration-500">
							<div className="w-full h-full bg-t-bg-panel rounded-full flex items-center justify-center border-4 border-t-bg-panel relative z-10 overflow-hidden">
								{user.avatarUrl ? (
									// <img
									// 	src={user.avatarUrl}
									// 	alt="Avatar"
									// 	className="w-full h-full object-cover"
									// />
									<Image
										src={user.avatarUrl}
										alt="Avatar"
										width={96}
										height={96}
										className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
									/>
								) : (
									<User className="w-10 h-10 text-theme-primary opacity-90" />
								)}
							</div>
						</div>

						<div className="text-center md:text-left flex-1">
							<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-theme-soft border border-theme-border text-theme-primary mb-3 shadow-inner">
								<span className="text-[10px] font-black uppercase tracking-widest">
									{user.plan}
								</span>
							</div>
							<h2 className="text-2xl font-black tracking-tight text-t-text-primary mb-1">
								{user.name}
							</h2>
							<p className="text-sm font-medium text-t-text-tertiary">
								Kapitał pracuje od:{" "}
								<span className="font-bold text-t-text-secondary">
									{summary.globalTenure}
								</span>
							</p>
						</div>
					</div>
				</div>

				{/* 2. TABS NAVIGATION */}
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

				{/* 3. TAB CONTENTS */}
				{activeTab === "overview" && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
						{/* GLOBALNY WYNIK */}
						<ProfileCard
							icon={TrendingUp}
							title="Globalny Wynik"
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
									<span className="text-t-text-secondary">Zainwestowano:</span>
									<span className="text-t-text-primary">
										{formatCurrency(summary.totalInvested)} PLN
									</span>
								</div>
								<div className="flex justify-between items-center text-sm font-bold">
									<span className="text-t-text-secondary">
										Całkowity Zysk{" "}
										{/* <span className="text-[10px] font-medium uppercase tracking-widest text-t-text-tertiary ml-1">
											(Stopa prosta)
										</span> */}
										:
									</span>
									<span
										className={cn(
											profit >= 0 ? "text-emerald-500" : "text-rose-500",
										)}
									>
										{profit > 0 ? "+" : ""}
										{formatCurrency(profit)} PLN
									</span>
								</div>
								<div className="flex justify-between items-center text-sm font-bold">
									<span className="text-t-text-secondary">Stopa prosta</span>
									<div className="text-right">
										<span
											className={cn(
												profit >= 0 ? "text-emerald-500" : "text-rose-500",
												"block",
											)}
										>
											<span className="ml-2">
												{profit > 0 ? "+" : ""}
												{profitPercent.toFixed(2)}%
											</span>
										</span>
									</div>
								</div>
								<div className="flex justify-between items-center text-sm font-bold">
									<span className="text-t-text-secondary">Stopa MWR</span>
									<div className="text-right">
										<span
											className={cn(
												profit >= 0 ? "text-emerald-500" : "text-rose-500",
												"block",
											)}
										>
											<span className="ml-2">
												{summary.globalMwr > 0 ? "+" : ""}
												{summary.globalMwr.toFixed(2)}%
											</span>
										</span>
									</div>
								</div>
							</div>
						</ProfileCard>

						{/* POSIADANE PORTFELE I STAŻ */}
						<ProfileCard
							icon={Wallet}
							title="Twoje Portfele (Wartość i Staż)"
							color="text-purple-500"
							bgColor="bg-purple-500/10"
						>
							<div className="space-y-4 mt-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
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
												Czas na rynku: {p.tenure}
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

						{/* REALIZACJA CELÓW (Global + Indywidualne) */}
						<ProfileCard
							icon={Target}
							title="Realizacja Celów"
							color="text-blue-500"
							bgColor="bg-blue-500/10"
						>
							<div className="space-y-6 mt-2">
								{/* Globalny cel */}
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

								{/* Cele per portfel */}
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
				)}

				{/* APPEARANCE TAB */}
				{activeTab === "appearance" && (
					<div className="bg-t-bg-panel border border-t-border rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in duration-300">
						<form onSubmit={handleSaveSettings} className="space-y-8">
							{/* SEKCJA ZDJĘCIA PROFILOWEGO (UI przygotowane pod backend) */}
							<div className="flex items-center gap-6 pb-6 border-b border-t-border-subtle">
								<div className="relative group cursor-pointer">
									<div className="w-20 h-20 rounded-full border-2 border-t-border-subtle bg-t-bg-base flex items-center justify-center overflow-hidden">
										{user.avatarUrl ? (
											// <img
											// 	src={user.avatarUrl}
											// 	alt="Avatar"
											// 	className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
											// />
											<Image
												src={user.avatarUrl}
												alt="Avatar"
												width={96}
												height={96}
												className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
											/>
										) : (
											<User className="w-8 h-8 text-t-text-tertiary group-hover:opacity-50 transition-opacity" />
										)}
									</div>
									<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
										<Camera className="w-6 h-6 text-t-text-primary" />
									</div>
									<input type="file" className="hidden" accept="image/*" />
								</div>
								<div>
									<h3 className="text-sm font-bold text-t-text-primary mb-1">
										Zdjęcie Profilowe
									</h3>
									<p className="text-xs text-t-text-tertiary">
										Kliknij ikonę, aby wgrać nowy avatar (JPG, PNG).
									</p>
								</div>
							</div>

							<div className="space-y-4 pt-2 border-b border-t-border-subtle pb-6">
								<h3 className="text-lg font-bold text-t-text-primary">
									Dane Konta i Subskrypcja
								</h3>

								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-t-border">
									<div className="space-y-1">
										<p className="text-sm text-t-text-tertiary">
											Email:{" "}
											<span className="font-medium text-t-text-primary">
												{user.email}
											</span>
										</p>
										<div className="flex items-center gap-2 mt-2">
											<p className="text-sm text-t-text-tertiary">
												Aktywny plan:
											</p>
											<span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md font-bold uppercase text-[10px]">
												{user.plan}
											</span>
										</div>
										<p className="text-xs text-t-text-tertiary mt-1">
											Wygasa:{" "}
											<span className="font-bold text-t-text-secondary">
												{user.planExpiresAt || "31 grudnia 2026"}
											</span>
										</p>
									</div>

									<Button
										type="button"
										className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm cursor-pointer transition-colors"
									>
										Przedłuż Abonament
									</Button>
								</div>
							</div>

							<div className="space-y-4 pt-2">
								<h3 className="text-lg font-bold text-t-text-primary">
									Kolorystyka Portfeli
								</h3>
								<p className="text-xs text-t-text-tertiary mb-4">
									Wybierz motyw przewodni dla każdego portfela.
								</p>

								<div className="space-y-6 max-w-2xl">
									{portfolios.map((portfolio) => (
										<div
											key={portfolio.id}
											className="p-5 border border-t-border rounded-xl bg-t-bg-base space-y-4"
											data-theme={portfolio.colorTheme}
										>
											<span className="font-bold text-sm text-theme-primary uppercase tracking-widest flex items-center gap-2">
												<div className="w-3 h-3 rounded-full bg-theme-primary" />
												{portfolio.name}
											</span>
											<div className="flex flex-wrap gap-3">
												{PREDEFINED_COLORS.map((themeName) => (
													<button
														key={themeName}
														type="button"
														onClick={() =>
															handleColorChange(portfolio.id, themeName)
														}
														className={cn(
															"w-8 h-8 rounded-full transition-all duration-200 border-2",
															portfolio.colorTheme === themeName
																? "scale-110 shadow-md ring-2 ring-offset-2 ring-offset-t-bg-base border-white dark:border-black"
																: "border-transparent opacity-50 hover:opacity-100 hover:scale-105",
														)}
														style={{
															backgroundColor: `var(--color-${themeName}-500, var(--theme-primary))`,
														}}
														data-theme={themeName}
													/>
												))}
											</div>
										</div>
									))}
								</div>
							</div>

							<Button
								type="submit"
								className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--theme-primary),black_10%)] hover:opacity-90 text-white font-bold px-6 py-5 transition-all shadow-sm cursor-pointer"
							>
								Zapisz Ustawienia Motywów
							</Button>
						</form>
					</div>
				)}

				{/* ALERTS TAB */}
				{activeTab === "alerts" && (
					<div className="bg-t-bg-panel border border-t-border rounded-3xl p-6 md:p-8 shadow-sm animate-in fade-in duration-300">
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="w-16 h-16 bg-theme-soft rounded-full flex items-center justify-center mb-4">
								<Edit3 className="w-8 h-8 text-theme-primary opacity-50" />
							</div>
							<h3 className="text-xl font-bold text-t-text-primary mb-2">
								Moduł Powiadomień
							</h3>
							<p className="text-sm text-t-text-tertiary max-w-md">
								Sekcja alertów cenowych i rebalancingu w przygotowaniu.
							</p>
						</div>
					</div>
				)}
			</div>
		</SectionLayout>
	);
}

// =========================================================
// WIDGET COMPONENTS
// =========================================================

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

"use client";

import {
	AlertTriangle,
	ChevronLeft,
	Coins,
	FileText,
	LibrarySquareIcon,
	Settings2,
	ShieldCheck,
	UploadCloud,
	User,
	Wrench,
} from "lucide-react";

import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import { BondImporter } from "@/components/ui/BondImporter";
import { BulkMigrationTool } from "@/components/alpha/MigrationTool";
import { FilterBadge } from "@/components/shared/FilterBadge";
import { HardEraseTool } from "@/components/shared/HardEraseTool";
import Link from "next/link";
import { QuickDepositForm } from "@/components/ui/QuickDepositForm";
import { RevertLastTrancheTool } from "@/components/shared/RevertLastTrancheTool";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { XtbImporter } from "@/components/ui/XtbImporter";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function PortfolioSettingsClient({
	portfolioId,
	portfolioName,
	allCategories,
	portfolioAssets,
	assetsForMigration,
	userRole,
	email,
	fromDashboard,
}: any) {
	const [activeTab, setActiveTab] = useState("add");

	const TABS = [
		{ id: "add", label: "Dodawanie Aktywów" },
		{ id: "import", label: "Import Danych" },
		{ id: "admin", label: "Administracja" },
		{ id: "danger", label: "Strefa Zagrożenia" },
	];

	return (
		<div className="max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500 pb-24">
			{/* 🚀 ZMIANA: Nagłówek ujednolicony z nowym standardem Bleed Effect, zagnieżdżone zakładki */}
			<header className="relative overflow-hidden flex flex-col gap-6 md:gap-6 -mx-3 md:-mx-10 px-3 md:px-10 bg-slate-950 bg-gradient-to-r from-theme-primary/20 dark:from-theme-primary/10 via-slate-900 to-slate-950 text-slate-100 py-3 md:py-6 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors shadow-lg">
				{" "}
				{/* --- TEKSTURA SVG (Spójne świece japońskie) --- */}
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
				{/* GÓRA: Nawigacja i Tytuł */}
				<div className="relative z-10 flex flex-col gap-2">
					{/* Ścieżka powrotu */}
					{fromDashboard && (
						<nav className="flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-slate-400 italic">
							<Link
								href={`/dashboard/${portfolioId}`}
								className="inline-flex items-center transition-opacity text-theme-primary hover:opacity-80 cursor-pointer font-medium mr-1"
							>
								<ChevronLeft className="h-4 w-4" />
								<span>Panel Główny</span>
							</Link>
							<span className="text-slate-500">/</span>
							<Link
								href={`/dashboard/${portfolioId}`}
								className="text-theme-primary font-medium lowercase"
							>
								{portfolioName}
							</Link>
							<span className="text-slate-500">/</span>
							<span className="text-slate-200 font-medium lowercase">
								Narzędzia
							</span>
						</nav>
					)}

					<div className="mt-1 sm:mt-2">
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase flex items-center gap-3 drop-shadow-sm text-slate-400">
							Narzędzia Portfela
						</h1>
						<p className="text-slate-400 font-medium mt-1 text-[11px] sm:text-sm md:text-base leading-tight">
							Zarządzaj technicznymi aspektami i wprowadzaj dane.
						</p>
					</div>

					{/* 🚀 PASEK ZAKŁADEK (Spójny wizualnie z filtrami innych podstron) */}
					<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-4 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-inner w-full min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
						<span className="sticky left-0 w-max flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
							<Settings2 className="w-3 h-3 text-theme-primary" /> Moduł:
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
											? t.id === "danger"
												? "bg-rose-500 text-white border-transparent shadow-sm" // Ostrzeżenie na zakładce Danger
												: "bg-theme-primary text-white border-transparent shadow-sm"
											: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
									)}
								/>
							))}
						</div>
					</div>
				</div>
				{/* DÓŁ: Statystyki uprawnień i konta (w rzędzie) */}
				<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-start gap-4 md:gap-8 pb-1 border-t border-white/10 pt-4 mt-2">
					{/* INFO: Uprawnienia */}
					<div className="space-y-1 shrink-0">
						<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase mb-1">
							<ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
							<span>Poziom Uprawnień</span>
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
							<span>Adres E-mail powiązany z portfelem</span>
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
				{/* 1. DODAWANIE ŚRODKÓW */}
				{activeTab === "add" && (
					<div className="grid grid-cols-1 gap-8 items-start animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Ręczne dodawanie aktywów"
							titleIcon={LibrarySquareIcon}
							subtitle="Wybierz odpowiednią zakładkę"
							description="Dodaj środki krok po kroku, wybierając formularz dla akcji, krypto, gotówki lub obligacji."
						>
							<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
								<AddAssetForm
									portfolioId={portfolioId}
									allowedCategories={allCategories}
									existingAssets={portfolioAssets}
									userRole={userRole}
								/>
							</div>
						</SectionLayout>
						<SectionLayout
							title="Szybkie Zasilenie Gotówki"
							titleIcon={Coins}
							subtitle="Zastrzyk kapitału"
							description="Najszybszy sposób na aktualizację stanu konta i uwzględnienie nowego kapitału w analizach."
						>
							<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
								<QuickDepositForm portfolioId={portfolioId} />
							</div>
						</SectionLayout>
					</div>
				)}

				{/* 2. IMPORT DANYCH */}
				{activeTab === "import" && (
					<div className="grid grid-cols-1 gap-8 items-start animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Import raportu (XTB)"
							titleIcon={UploadCloud}
							subtitle="Automatyczne księgowanie transakcji"
							description="Wygeneruj raport CSV z XTB i zaimportuj go tutaj. System automatycznie rozpozna aktywa i dywidendy."
						>
							<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
								<XtbImporter portfolioId={portfolioId} />
							</div>
						</SectionLayout>

						<SectionLayout
							title="Import obligacji (PKO BP)"
							titleIcon={FileText}
							subtitle="Automatyczne dodawanie bezpiecznych aktywów"
							description="Pobierz zestawienie swoich obligacji z konta PKO BP i wgraj plik do automatycznej rejestracji serii."
						>
							<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
								<BondImporter portfolioId={portfolioId} />
							</div>
						</SectionLayout>
					</div>
				)}

				{/* 3. ADMINISTRACJA */}
				{activeTab === "admin" && (
					<div className="animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Narzędzia Administracyjne"
							titleIcon={Wrench}
							subtitle="Konwersja danych"
							description="Narzędzie pozwala na masową korektę błędnie przypisanych kategorii, aktualizując całą historię transakcji."
						>
							<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
								<BulkMigrationTool
									assets={assetsForMigration as any}
									categories={allCategories}
									portfolioId={portfolioId}
								/>
							</div>
						</SectionLayout>
					</div>
				)}

				{/* 4. STREFA ZAGROŻENIA */}
				{activeTab === "danger" && (
					<div className="grid grid-cols-1 gap-8 items-start animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Wymazanie aktywa"
							titleIcon={AlertTriangle}
							subtitle="Całkowite usunięcie z bazy"
							description="Bezpowrotnie usunie aktywo wraz z całą jego historią. Wykresy zostaną przeliczone na nowo."
						>
							<div className="w-full bg-red-500/5 border border-red-500/20 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
								<HardEraseTool assets={portfolioAssets} />
							</div>
						</SectionLayout>

						<SectionLayout
							title="Cofnięcie transzy"
							titleIcon={AlertTriangle}
							subtitle="Usunięcie pojedynczej operacji"
							description="Bezpowrotnie usunie wybraną transzę z historii aktywa. Operacja nie wpływa na inne transakcje."
						>
							<div className="w-full bg-red-500/5 border border-red-500/20 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
								<RevertLastTrancheTool assets={portfolioAssets} />
							</div>
						</SectionLayout>
					</div>
				)}
			</div>
		</div>
	);
}

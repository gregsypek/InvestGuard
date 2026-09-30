"use client";

import {
	AlertTriangle,
	ChevronLeft,
	Coins,
	FileText,
	LibrarySquareIcon,
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
import { useState } from "react";

export default function PortfolioSettingsClient({
	portfolioId,
	portfolioName,
	allCategories,
	portfolioAssets,
	assetsForMigration,
	userRole,
	email,
	fromDashboard, // 🚀 DODANE ODBIERANIE FLAGI
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
			{/* ZINTEGROWANY NAGŁÓWEK NARZĘDZI */}
			<header className="relative overflow-hidden flex flex-col w-full border-b border-white/10 bg-slate-900 rounded-b-2xl text-slate-100 p-6 md:p-8 shadow-lg mb-8 mt-2 md:mt-0">
				{/* Świetlny Gradient SVG */}
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

				<div className="relative z-10 w-full flex flex-col gap-4">
					{/* 🚀 Ścieżka powrotu ukazuje się TYLKO gdy przyszliśmy z pulpitu */}
					{fromDashboard && (
						<nav className="flex items-center gap-2 mb-2 text-sm text-slate-400">
							<Link
								href={`/dashboard/${portfolioId}`}
								className="inline-flex items-center transition-all h-5 text-amber-500 hover:text-amber-400  decoration-amber-500/40 underline-offset-4 cursor-pointer font-medium"
							>
								<ChevronLeft
									className="w-4 h-4 mr-0.5 no-underline"
									strokeWidth={2.5}
								/>
								<span>Panel Główny</span>
							</Link>
							<span className="text-slate-600">/</span>
							<Link
								href={`/dashboard/${portfolioId}`}
								className="text-slate-300 hover:text-white transition-colors"
							>
								{portfolioName}
							</Link>
							<span className="text-slate-600">/</span>
							<span className="text-slate-200 font-medium lowercase">
								Narzędzia
							</span>
						</nav>
					)}

					{/* Tytuł i zakładki */}
					<div className="flex flex-col gap-2 mb-2">
						<h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-sm mb-3">
							Narzędzia Portfela
						</h1>

						<div className="flex flex-wrap items-center gap-2 mt-2">
							<span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
								Wybierz narzędzia:
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

				{/* 🚀 IDEALNIE SPÓJNE KARTY (Przekopiowane z Twojego SettingsClient) */}
				<div className="relative z-10 max-w-7xl sm:w-full flex flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 pt-6 mt-6 border-t border-white/10">
					{/* Karta: Poziom Uprawnień */}
					<div className="flex flex-col sm:flex-row justify-start items-center gap-1.5 sm:gap-3 w-full sm:w-auto">
						{/* Etykieta z ikoną */}
						<div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
							<ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
							<span>Poziom uprawnień:</span>
						</div>

						{/* Wartość (Rola) i kropka */}
						<div className="flex justify-start gap-2 text-[10px] sm:text-sm font-black text-white tracking-wide uppercase">
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
					<div className="flex flex-col sm:flex-row justify-center md sm:justify-start items-center gap-1.5 sm:gap-3 w-full sm:w-auto">
						{/* Etykieta z ikoną */}
						<div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
							<User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
							<span>Adres E-mail:</span>
						</div>

						{/* Wartość (Email) */}
						<div className="text-xs sm:text-sm font-black text-white tracking-wide break-all sm:break-normal text-center sm:text-left">
							{email || "Brak przypisanego adresu"}
						</div>
					</div>
				</div>
			</header>

			{/* ZAWARTOŚĆ ZAKŁADEK (bez zmian) */}
			<div className="w-full">
				{/* 1. DODAWANIE ŚRODKÓW */}
				{activeTab === "add" && (
					<div className="grid grid-cols-1  gap-8 items-start animate-in slide-in-from-right-4 duration-300 fade-in">
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
					<div className="grid grid-cols-1  gap-8 items-start animate-in slide-in-from-right-4 duration-300 fade-in">
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

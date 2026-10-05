"use client";

import {
	Briefcase,
	ChevronLeft,
	Coins,
	FileText,
	LibrarySquareIcon,
	PlusCircle,
	Settings2,
	ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";

import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import { BondImporter } from "@/components/ui/BondImporter";
import { FilterBadge } from "@/components/shared/FilterBadge";
import Link from "next/link";
import { QuickDepositForm } from "@/components/ui/QuickDepositForm";
import { SectionLayout } from "@/components/shared/SectionLayout";
import { ValueCard } from "@/components/shared/ValueCard";
import { XtbImporter } from "@/components/ui/XtbImporter";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";

interface AddAssetClientProps {
	id: string;
	portfolioName: string;
	categories: any[];
	assets: any[];
	userRole: "ADMIN" | "SUBSCRIBER" | "REGULAR";
	source?: string;
	initialView?: string;
	portfolioTotalValue: number; // 🚀 DODANE: Statystyki
	portfolioInvested: number; // 🚀 DODANE: Statystyki
}

export default function AddAssetClient({
	id,
	portfolioName,
	categories,
	assets,
	userRole,
	source,
	initialView,
	portfolioTotalValue,
	portfolioInvested,
}: AddAssetClientProps) {
	// Domyślna zakładka na podstawie źródła
	const defaultTab = source === "bonds" ? "import-bonds" : "manual";
	const [activeTab, setActiveTab] = useState(defaultTab);

	// 🚀 INTELIGENTNE ZAKŁADKI (Dynamicznie filtrujemy i używamy uniwersalnych nazw)
	const AVAILABLE_TABS = useMemo(() => {
		return [
			{ id: "manual", label: "Formularz Ręczny", show: true },
			{
				id: "import-market",
				label: "Import Giełdowy",
				show: source !== "bonds",
			},
			{
				id: "import-bonds",
				label: "Import Obligacji",
				show: source !== "alpha",
			},
			{ id: "cash", label: "Szybka Gotówka", show: !source },
		].filter((t) => t.show);
	}, [source]);

	// 🚀 INTELIGENTNY ROUTING POWROTU
	const { backUrl, backLabel, moduleName } = useMemo(() => {
		if (source === "alpha") {
			return {
				backUrl: `/alpha-selection?portfolioId=${id}`,
				backLabel: "Alpha",
				moduleName: "Nowa Teza Alpha",
			};
		}
		if (source === "bonds") {
			return {
				backUrl: `/bond-reports/${id}`,
				backLabel: "Obligacje",
				moduleName: "Nowa Seria Obligacji",
			};
		}
		return {
			backUrl: `/dashboard/${id}`,
			backLabel: "Panel Główny",
			moduleName: "Kreator Aktywów",
		};
	}, [source, id]);

	return (
		<div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500 pb-24">
			{/* NAGŁÓWEK */}
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
					<nav className="flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-slate-400 italic">
						<Link
							href={backUrl}
							className="inline-flex items-center transition-opacity text-theme-primary hover:opacity-80 cursor-pointer font-medium mr-1"
						>
							<ChevronLeft className="h-4 w-4" />
							<span>{backLabel}</span>
						</Link>
						<span className="text-slate-500">/</span>
						<span className="text-slate-300">{portfolioName}</span>
						<span className="text-slate-500">/</span>
						<span className="text-slate-200 font-medium lowercase">
							{moduleName}
						</span>
					</nav>

					<div className="mt-1 sm:mt-2">
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter lowercase flex items-center gap-3 drop-shadow-sm text-white">
							<PlusCircle className="w-6 h-6 sm:w-8 sm:h-8 text-theme-primary shrink-0" />
							Rejestracja Aktywów
						</h1>
						{/* 🚀 ZMIANA: Spójny opis nawiązujący do zarządzania portfelem */}
						<p className="text-slate-400 font-medium mt-1 text-[11px] sm:text-sm md:text-base leading-tight max-w-2xl">
							Zarządzaj portfelem i kontroluj strategie inwestycyjne poprzez
							precyzyjne ewidencjonowanie kapitału.
						</p>
					</div>

					{/* DYNAMICZNY PASEK WYBORU FORMULARZY */}
					<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 sm:mt-4 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-inner w-full min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
						<span className="sticky left-0 w-max flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
							<Settings2 className="w-3 h-3 text-theme-primary" /> Metoda:
						</span>

						<div className="flex gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap pb-1 sm:pb-0 w-max sm:w-full">
							{AVAILABLE_TABS.map((tab) => (
								<FilterBadge
									key={tab.id}
									id={tab.id}
									label={tab.label}
									isSelected={activeTab === tab.id}
									onToggle={setActiveTab}
									className={cn(
										"py-1 px-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest rounded-lg transition-all shrink-0 border",
										activeTab === tab.id
											? "bg-theme-primary text-white border-transparent shadow-sm"
											: "bg-transparent text-slate-300 border-white/20 hover:bg-white/10",
									)}
								/>
							))}
						</div>
					</div>
				</div>

				{/* 🚀 NOWE: Sekcja ze statystykami portfela */}
				<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-8 pb-1 border-t border-white/10 pt-4 mt-2">
					<div className="space-y-1 w-full xl:w-auto shrink-0">
						<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase mb-1">
							<Briefcase className="w-3.5 h-3.5 text-slate-300" />
							<span>Wycena Portfela</span>
						</div>
						<div className="flex items-baseline gap-1.5 sm:gap-2">
							<h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm truncate">
								{formatCurrency(portfolioTotalValue)}
							</h2>
							<span className="text-lg sm:text-xl md:text-2xl text-slate-500 font-bold uppercase">
								PLN
							</span>
						</div>
					</div>
					<div className="flex flex-wrap xl:justify-end gap-4 sm:gap-6 md:gap-10 w-full xl:w-auto mt-4 xl:mt-0">
						<ValueCard
							label="Wkład własny"
							icon={ShieldCheck}
							className="text-white"
						>
							<div className="flex items-baseline gap-1.5 font-mono">
								<span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-200">
									{formatCurrency(portfolioInvested)}
								</span>
								<span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
									PLN
								</span>
							</div>
						</ValueCard>
					</div>
				</div>
			</header>

			{/* ======================= */}
			{/* ZAWARTOŚĆ FORMULARZY    */}
			{/* ======================= */}

			<div className="pt-2 w-full">
				{activeTab === "manual" && (
					<div className="animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Ręczne dodawanie aktywów"
							titleIcon={LibrarySquareIcon}
							subtitle="Krok po kroku"
							description="Dodaj środki do portfela podając ticker, ilość oraz cenę zakupu."
						>
							<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
								<AddAssetForm
									portfolioId={id}
									allowedCategories={categories}
									existingAssets={assets}
									userRole={userRole}
								/>
							</div>
						</SectionLayout>
					</div>
				)}

				{activeTab === "import-market" && (
					<div className="animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Import raportu giełdowego (XTB / mBank)"
							titleIcon={FileText}
							subtitle="Automatyczne księgowanie"
							description="Zaimportuj wygenerowany z domu maklerskiego plik CSV. System automatycznie rozpozna i doda Twoje aktywa oraz przeliczy saldo."
						>
							<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
								<XtbImporter portfolioId={id} />
							</div>
						</SectionLayout>
					</div>
				)}

				{activeTab === "import-bonds" && (
					<div className="animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Import obligacji skarbowych"
							titleIcon={FileText}
							subtitle="Szybka integracja z PKO BP"
							description="Pobierz zestawienie swoich obligacji z konta PKO BP i wgraj plik tutaj. Zaktualizujemy Twój stan kapitału automatycznie."
						>
							<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
								<BondImporter portfolioId={id} />
							</div>
						</SectionLayout>
					</div>
				)}

				{activeTab === "cash" && (
					<div className="animate-in slide-in-from-right-4 duration-300 fade-in">
						<SectionLayout
							title="Szybkie Zasilenie Gotówki"
							titleIcon={Coins}
							subtitle="Dodaj wolne środki"
							description="Najszybszy sposób na aktualizację wolnej gotówki na koncie inwestycyjnym bez przypisywania aktywa."
						>
							<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 shadow-sm">
								<QuickDepositForm portfolioId={id} />
							</div>
						</SectionLayout>
					</div>
				)}
			</div>
		</div>
	);
}

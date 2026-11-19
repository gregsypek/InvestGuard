"use client";

import {
	Activity,
	Banknote,
	BarChart2,
	BarChart3,
	Briefcase,
	Calculator,
	ChartArea,
	Eye,
	EyeOff,
	Globe,
	History,
	Landmark,
	ListOrdered,
	LucideIcon,
	PieChart,
	PiggyBank,
	ShieldCheck,
	Target,
	TrendingUp,
	WalletCards,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

// Słownik ikon dostępnych dla zakładek
const ICON_MAP: Record<string, LucideIcon> = {
	Calculator,
	Banknote,
	History,
	PieChart,
	ChartArea,
	ListOrdered,
	Briefcase,
	WalletCards,
	BarChart2,
	Globe,
	Target,
	PiggyBank,
	TrendingUp,
	BarChart3,
	Activity,
	ShieldCheck,
	Landmark,
};

export interface SectionTab {
	id: string;
	label: string;
	iconName?: keyof typeof ICON_MAP;
	icon?: LucideIcon; // Zachowujemy kompatybilność wsteczną
}

interface SectionNavTabsProps {
	sections: SectionTab[];
}

export function SectionNavTabs({ sections }: SectionNavTabsProps) {
	const [activeSection, setActiveSection] = useState<string>(
		sections[0]?.id || "",
	);
	const [isVisible, setIsVisible] = useState<boolean>(true);

	useEffect(() => {
		const savedPreference = localStorage.getItem("investguard_navtabs_hidden");
		if (savedPreference === "true") {
			setIsVisible(false);
		}
	}, []);

	const toggleVisibility = () => {
		const nextState = !isVisible;
		setIsVisible(nextState);
		localStorage.setItem("investguard_navtabs_hidden", String(!nextState));
	};

	useEffect(() => {
		if (!sections.length || !isVisible) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setActiveSection(entry.target.id);
					}
				});
			},
			{
				threshold: 0.2,
				rootMargin: "-80px 0px -50% 0px",
			},
		);

		sections.forEach((section) => {
			const el = document.getElementById(section.id);
			if (el) observer.observe(el);
		});

		return () => observer.disconnect();
	}, [sections, isVisible]);

	const scrollToSection = (id: string) => {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
			setActiveSection(id);
		}
	};

	if (!sections || sections.length === 0) return null;

	// Jeśli użytkownik ukrył pasek, pokazujemy tylko minimalistyczny przycisk rozwijania w rogu (bez zmian pozycji!)
	if (!isVisible) {
		return (
			<div className="sticky -right-20 top-0 md:top-0 z-30 w-full flex justify-end px-4 py-1 pointer-events-none">
				<button
					type="button"
					onClick={toggleVisibility}
					// 🚀 NAPRAWA: Dodano pointer-events-auto oraz zmieniono z-100 na z-[100]
					className="absolute z-[100] -right-2 sm:-right-4 p-1.5 text-t-text-tertiary hover:text-t-text-primary  border border-t-border rounded-full shadow-sm transition-colors pointer-events-auto cursor-pointer"
					title="Pokaż pasek sekcji"
				>
					<Eye className="w-3.5 h-3.5" />
				</button>
			</div>
		);
	}

	return (
		<div className="sticky top-0 md:top-0 z-30 w-full bg-t-bg-base py-2 transition-all ">
			<div className="relative w-full  mx-auto px-2 sm:px-4">
				{/* Cienka linia łącząca w tle */}
				<div className="absolute top-[20px] sm:top-[22px] left-[8%] right-[8%] h-[2px] bg-t-border-subtle z-0 hidden xs:block" />

				<div className="relative z-10 flex justify-between items-center">
					{sections.map((tab) => {
						const isActive = activeSection === tab.id;
						// Rozwiązujemy ikonę po nazwie lub przekazanym komponencie
						const Icon = tab.iconName ? ICON_MAP[tab.iconName] : tab.icon;

						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => scrollToSection(tab.id)}
								className="group flex flex-col items-center gap-1 outline-none cursor-pointer flex-1 px-0 sm:px-1 py-0.5"
								title={tab.label}
							>
								<div
									className={cn(
										"w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-300",
										isActive
											? "bg-theme-primary/15 border-theme-primary/40 text-theme-primary dark:text-theme-primary shadow-[0_0_12px_rgba(59,130,246,0.15)] scale-105"
											: "bg-t-bg-panel border-t-border text-t-text-tertiary group-hover:border-theme-primary/40 group-hover:text-theme-primary",
									)}
								>
									{Icon && <Icon className="h-4 w-4" />}
								</div>
								<span
									className={cn(
										"text-[9px] font-bold transition-colors uppercase tracking-wider text-center line-clamp-1",
										isActive
											? "hidden xs:block text-t-text-primary font-black"
											: "hidden xs:block text-t-text-tertiary group-hover:text-t-text-secondary",
									)}
								>
									{tab.label}
								</span>
							</button>
						);
					})}

					<button
						type="button"
						onClick={toggleVisibility}
						className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 p-1.5 text-t-text-tertiary hover:text-t-text-primary bg-t-bg-panel border border-t-border rounded-full shadow-sm transition-colors cursor-pointer"
						title="Ukryj pasek nawigacji"
					>
						<EyeOff className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>
		</div>
	);
}

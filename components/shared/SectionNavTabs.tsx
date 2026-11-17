"use client";

import {
	Banknote,
	Calculator,
	ChartArea,
	History,
	ListOrdered,
	PieChart,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

// Definicja zakładek z pasującymi identyfikatorami sekcji (id)
const SECTIONS = [
	{ id: "section-rebalance", label: "Rebalansowanie", icon: Calculator },
	{ id: "section-daily-pnl", label: "Wynik Dzienny", icon: Banknote },
	{ id: "section-cards", label: "Karty Aktywów", icon: History },
	{ id: "section-allocation", label: "Alokacja", icon: PieChart },
	{ id: "section-growth", label: "Wzrost", icon: ChartArea },
	{ id: "section-ledger", label: "Rejestr", icon: ListOrdered },
];

export function SectionNavTabs() {
	const [activeSection, setActiveSection] = useState<string>("");

	// Opcjonalnie: automatyczne wykrywanie aktywnej sekcji podczas przewijania strony
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setActiveSection(entry.target.id);
					}
				});
			},
			{ threshold: 0.3 },
		);

		SECTIONS.forEach((section) => {
			const el = document.getElementById(section.id);
			if (el) observer.observe(el);
		});

		return () => observer.disconnect();
	}, []);

	const scrollToSection = (id: string) => {
		const el = document.getElementById(id);
		if (el) {
			const yOffset = -100; // Offset na ewentualny stały nagłówek strony
			const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
			window.scrollTo({ top: y, behavior: "smooth" });
		}
	};

	return (
		<div className="relative w-full max-w-2xl mx-auto my-6 px-4">
			{/* Linia łącząca ikony w tle */}
			<div className="absolute top-[24px] left-[12%] right-[12%] h-[2px] bg-t-border-subtle z-0 hidden sm:block" />

			<div className="relative z-10 flex justify-between items-start">
				{SECTIONS.map((tab) => {
					const isActive = activeSection === tab.id;
					const Icon = tab.icon;

					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => scrollToSection(tab.id)}
							className="group flex flex-col items-center gap-2 w-1/6 outline-none cursor-pointer"
						>
							<div
								className={cn(
									"w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
									isActive
										? "bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-110"
										: "bg-t-bg-panel border-t-border text-t-text-tertiary group-hover:border-blue-500/50 group-hover:text-blue-400",
								)}
							>
								<Icon className="w-4 h-4 sm:w-5 sm:h-5" />
							</div>
							<span
								className={cn(
									"text-[9px] sm:text-[10px] font-bold transition-colors uppercase tracking-wider text-center line-clamp-1",
									isActive
										? "text-t-text-primary"
										: "text-t-text-tertiary group-hover:text-t-text-secondary",
								)}
							>
								{tab.label}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

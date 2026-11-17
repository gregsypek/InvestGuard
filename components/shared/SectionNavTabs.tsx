"use client";

import React, { useEffect, useState } from "react";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionTab {
	id: string;
	label: string;
	icon: LucideIcon;
}

interface SectionNavTabsProps {
	sections: SectionTab[];
}

export function SectionNavTabs({ sections }: SectionNavTabsProps) {
	const [activeSection, setActiveSection] = useState<string>(
		sections[0]?.id || "",
	);

	useEffect(() => {
		if (!sections.length) return;

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
	}, [sections]);

	const scrollToSection = (id: string) => {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
			setActiveSection(id);
		}
	};

	if (!sections || sections.length === 0) return null;

	return (
		<div className="sticky top-0 md:top-0 z-30 w-full bg-t-bg-base/85 backdrop-blur-md py-2 border-b border-t-border-subtle shadow-sm transition-all">
			<div className="relative w-full max-w-xl mx-auto px-2 sm:px-4">
				{/* Cienka linia łącząca w tle */}
				<div className="absolute top-[20px] sm:top-[22px] left-[8%] right-[8%] h-[2px] bg-t-border-subtle z-0 hidden sm:block" />

				<div className="relative z-10 flex justify-between items-center">
					{sections.map((tab) => {
						const isActive = activeSection === tab.id;
						const Icon = tab.icon;

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
										// Styl inspirowany menu bocznym: eleganckie, półprzezroczyste tło z obramowaniem dla aktywnego
										"w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-300",
										isActive
											? "bg-blue-500/15 border-blue-500/40 text-blue-500 dark:text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)] scale-105"
											: "bg-t-bg-panel border-t-border text-t-text-tertiary group-hover:border-blue-500/30 group-hover:text-blue-400",
									)}
								>
									<Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
								</div>
								{/* Gwarantowane ukrycie etykiety na mniejszych ekranach */}
								<span
									className={cn(
										"hidden md:block text-[9px] font-bold transition-colors uppercase tracking-wider text-center line-clamp-1",
										isActive
											? "text-t-text-primary font-black"
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
		</div>
	);
}

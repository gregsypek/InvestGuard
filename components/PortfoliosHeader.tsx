import { Briefcase, LayoutGrid, Wallet2 } from "lucide-react";

import { ValueCard } from "./shared/ValueCard";
import { cn } from "@/lib/utils";

interface PortfoliosHeaderProps {
	title: string;
	totalValue: number;
	portfoliosCount: number;
	assetsCount: number;
	customBreadcrumbs?: React.ReactNode;
}

export const PortfoliosHeader = ({
	title,
	totalValue,
	portfoliosCount,
	assetsCount,
	customBreadcrumbs,
}: PortfoliosHeaderProps) => {
	return (
		<header className="relative overflow-hidden flex flex-col gap-8 w-full bg-slate-900 dark:bg-t-bg-base/15 text-slate-100 p-6 md:p-8 border-b border-white/10 dark:border-t-border rounded-b-2xl transition-colors">
			{/* --- TEKSTURA SVG (Giełdowe Świece Japońskie z maskowaniem) --- */}
			<div
				className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.4'%3E%3Cline x1='15' y1='20' x2='15' y2='60'/%3E%3Crect x='11' y='30' width='8' height='20' fill='%23ffffff' fill-opacity='0.3'/%3E%3Cline x1='35' y1='40' x2='35' y2='80'/%3E%3Crect x='31' y='50' width='8' height='15' fill='none'/%3E%3Cline x1='55' y1='10' x2='55' y2='45'/%3E%3Crect x='51' y='15' width='8' height='25' fill='%23ffffff' fill-opacity='0.6'/%3E%3Cline x1='75' y1='30' x2='75' y2='70'/%3E%3Crect x='71' y='45' width='8' height='10' fill='none'/%3E%3Cline x1='95' y1='50' x2='95' y2='90'/%3E%3Crect x='91' y='60' width='8' height='25' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
					WebkitMaskImage:
						"radial-gradient(circle at 95% 2%, black 0%, transparent 20%)",
					maskImage:
						"radial-gradient(circle at 90% 2%, black 5%, transparent 20%)",
				}}
			/>

			{/* GÓRA: Nawigacja i Tytuł */}
			<div className="relative z-10">
				{customBreadcrumbs}
				<div className="mt-2">
					<h1 className="text-3xl md:text-4xl font-black tracking-tighter lowercase flex items-center gap-3 drop-shadow-sm text-white">
						{title}
					</h1>
					<p className="text-slate-400 font-medium mt-1 text-sm md:text-base">
						Zarządzaj wszystkimi portfelami i dokonuj zmian w swoich
						inwestycjach.
					</p>
				</div>
			</div>

			{/* DÓŁ: Główne Statystyki */}
			<div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pb-2 md:pb-0">
				{/* OGROMNA Całkowita Wartość - WYRÓŻNIONA (Dokładnie jak w DashboardHeader) */}
				<div className="space-y-1">
					<div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-widest text-[10px] uppercase mb-1">
						<Wallet2 className="w-3.5 h-3.5" />
						<span>Wartość portfeli</span>
					</div>
					<div className="flex items-baseline gap-2">
						<h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-sm">
							{totalValue.toLocaleString("pl-PL", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</h2>
						<span className="text-xl md:text-2xl text-slate-500 font-bold">
							PLN
						</span>
					</div>
				</div>

				{/* PRAWA STRONA: Mniejsze statystyki */}
				<div className="flex self-start sm:justify-end flex-wrap gap-8 md:gap-12 overflow-x-auto no-scrollbar">
					{/* Liczba portfeli z customowym neonowym akcentem */}
					<ValueCard label="Liczba portfeli" icon={Briefcase}>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-2xl font-bold tracking-tight text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">
								{portfoliosCount}
							</span>
							<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								SZT.
							</span>
						</div>
					</ValueCard>

					{/* Liczba aktywów z neonowym akcentem */}
					<ValueCard label="Liczba aktywów" icon={LayoutGrid}>
						<div className="flex items-baseline gap-1.5 font-mono">
							<span className="text-2xl font-bold tracking-tight text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
								{assetsCount}
							</span>
							<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
								SZT.
							</span>
						</div>
					</ValueCard>
				</div>
			</div>
		</header>
	);
};

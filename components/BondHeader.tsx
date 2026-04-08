import {
	ChevronLeft,
	History,
	ShieldCheck,
	Target,
	TrendingUp,
} from "lucide-react";

import { BondStatCard } from "./shared/BondStatCard";
import Link from "next/link";
import { ValueCard } from "./shared/ValueCard";

export interface BondHeaderStats {
	totalInvested: string;
	currentValue: string;
	profit: string;
	avgYield: string;
}
interface BondHeaderProps {
	title: string;
	totalBonds: number;
	portfolioName?: string; // EN: Added for better context
	stats: BondHeaderStats;
	customBreadcrumbs?: React.ReactNode;
	backHref?: string;
}

export function BondHeader({
	title,
	totalBonds,
	portfolioName,
	stats,
	customBreadcrumbs,
	backHref,
}: BondHeaderProps) {
	return (
		<>
			<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					{/* Renderowanie nawigacji (Breadcrumbs) */}
					{customBreadcrumbs}
					<div>
						<div className="flex items-center gap-2 text-sm">
							{backHref && (
								<Link
									href={backHref}
									className=" inline-flex items-center transition-all h-5 italic mb-2 text-amber-600  decoration-amber-600/40  cursor-pointer font-medium"
								>
									<ChevronLeft className="h-4 w-4" />
									<span>Obligacje</span>
								</Link>
							)}
							<nav className="text-sm text-muted-foreground mb-2 italic">
								{!backHref && <span>Obligacje</span>}
								<span className="text-muted-foreground"> / </span>
								<span className="text-primary font-medium">
									{portfolioName}
								</span>
							</nav>
						</div>
						<div>
							<h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 lowercase">
								{title}
							</h1>
							<p className="text-muted-foreground font-medium mt-1 flex items-center">
								<ShieldCheck className="h-4 w-4 text-emerald-500" />{" "}
								<span>Bezpieczny kapitał i ochrona przed inflacją.</span>
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap gap-4 justify-end">
					<ValueCard label="Aktywne serie" icon={History} value={totalBonds} />
				</div>
			</header>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<BondStatCard
					title="Zainwestowany Kapitał"
					value={`${stats.totalInvested} PLN`}
					icon={ShieldCheck}
					variant="neutral"
					description="Łączny nominał jednostek"
				/>
				<BondStatCard
					title="Aktualna Wycena"
					value={`${stats.currentValue} PLN`}
					description={`+${stats.profit} PLN odsetek`}
					icon={TrendingUp}
					variant="green"
				/>
				<BondStatCard
					title="Średnie Oprocentowanie"
					value={`${stats.avgYield}%`}
					icon={Target}
					description="Ważone oprocentowanie (YTM)"
					variant="blue"
				/>
			</div>
		</>
	);
}

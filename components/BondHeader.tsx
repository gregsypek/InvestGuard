import { History, ShieldCheck } from "lucide-react";

interface BondHeaderProps {
	title: string;
	totalBonds: number;
	portfolioName?: string; // EN: Added for better context
	customBreadcrumbs?: React.ReactNode;
}

export function BondHeader({
	title,
	totalBonds,
	portfolioName,
	customBreadcrumbs,
}: BondHeaderProps) {
	return (
		<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
			<div>
				{/* Renderowanie nawigacji (Breadcrumbs) */}
				{customBreadcrumbs}
				<h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
					{title}{" "}
					{portfolioName && (
						<span className="text-primary/50 text-2xl">| {portfolioName}</span>
					)}
				</h1>
				<p className="text-muted-foreground font-medium mt-1 flex items-center gap-2">
					<ShieldCheck className="h-4 w-4 text-emerald-500" /> Bezpieczny
					kapitał i ochrona przed inflacją.
				</p>
			</div>

			<div className="flex flex-wrap gap-4 justify-end">
				<div className="flex items-center gap-2 text-primary px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 shrink-0">
					<span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black flex items-center gap-2">
						<History className="h-3.5 w-3.5 text-blue-500" /> Aktywne Serie
					</span>
					<span className="text-2xl font-mono font-black">{totalBonds}</span>
				</div>
			</div>
		</header>
	);
}

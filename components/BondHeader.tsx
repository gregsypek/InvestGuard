import { Container, ShieldCheck, History } from "lucide-react";

interface BondHeaderProps {
	totalBonds: number;
	customBreadcrumbs?: React.ReactNode;
}

export function BondHeader({ totalBonds, customBreadcrumbs }: BondHeaderProps) {
	return (
		<div className="mb-8">
			{customBreadcrumbs}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
				<div>
					<h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 ">
					 Skarbiec Obligacji
					</h1>
					<p className="text-muted-foreground font-medium mt-1 flex items-center gap-2">
						<ShieldCheck className="h-4 w-4 text-emerald-500" /> Bezpieczny
						kapitał i ochrona przed inflacją.
					</p>
				</div>

				{/* Statystyka pigułkowa */}
				<div className="flex flex-wrap gap-4 justify-end">
					<div className="flex items-center gap-2 text-primary px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 shrink-0">
						<span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black flex items-center gap-2">
							<History className="h-3.5 w-3.5 text-blue-500" />
							Aktywne Serie
						</span>
						<span className="text-2xl font-mono font-black">{totalBonds}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

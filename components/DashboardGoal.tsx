import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
	progress: number;
	remaining: number;
	goal: number;
};

const DashboardGoal = ({ progress, remaining, goal }: Props) => {
	// Sprawdzamy, czy cel został osiągnięty, aby zmienić kolor na zielony
	const isCompleted = progress >= 100;

	return (
		// ZMIANA: Usunięto sztywne tło bg-card. Komponent jest "płaski" i oddycha.
		<section className="w-full py-4 md:py-6">
			<div className="flex justify-between items-end mb-4">
				{/* LEWA STRONA: Postęp procentowy w stylu Hero */}
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-1.5 text-slate-500 font-bold tracking-widest text-[10px] uppercase">
						<Target className="h-3.5 w-3.5" />
						<span>Postęp Strategii</span>
					</div>
					<p
						className={cn(
							"text-3xl font-black tracking-tighter",
							isCompleted
								? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
								: "text-white",
						)}
					>
						{progress.toFixed(1)}%
					</p>
				</div>

				{/* PRAWA STRONA: Wartość docelowa (Cel) */}
				<div className="text-right flex flex-col gap-1">
					<span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
						Cel Finansowy
					</span>
					<p className="text-lg font-semibold text-slate-200">
						{goal.toLocaleString("pl-PL", {
							minimumFractionDigits: 2,
						})}{" "}
						<span className="text-sm font-bold text-slate-500">PLN</span>
					</p>
				</div>
			</div>

			{/* ZMIANA: Customowy pasek z efektem Neon Glow (zamiast standardowego Progress) */}
			<div className="relative w-full h-1.5 md:h-2 bg-slate-800/80 rounded-full overflow-hidden mb-3">
				<div
					className={cn(
						"absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full",
						isCompleted
							? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
							: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]",
					)}
					style={{ width: `${Math.min(progress, 100)}%` }}
				/>
			</div>

			{/* DÓŁ: Techniczny opis ile brakuje */}
			<div className="flex justify-end">
				<p
					className={cn(
						"text-[11px] font-medium tracking-wide",
						isCompleted ? "text-emerald-500" : "text-slate-500",
					)}
				>
					{remaining > 0
						? `Brakuje: ${remaining.toLocaleString("pl-PL", {
								minimumFractionDigits: 2,
							})} PLN`
						: "Cel zrealizowany! 🚀"}
				</p>
			</div>
		</section>
	);
};

export default DashboardGoal;

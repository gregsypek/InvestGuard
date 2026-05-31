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
		<section className="w-full p-2 md:p-4 xl:p-6  border-b border-t-border-subtle xl:border-none rounded-2xl ">
			<div className="flex justify-between items-end mb-4">
				{/* LEWA STRONA: Postęp procentowy w stylu Hero */}
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-1.5 text-t-text-tertiary font-bold tracking-widest text-[10px] uppercase">
						<Target className="h-3.5 w-3.5" />
						<span>Postęp Strategii</span>
					</div>
					<p
						className={cn(
							"text-3xl font-black tracking-tighter transition-colors",
							isCompleted
								? "text-emerald-600 dark:text-emerald-400 drop-shadow-none dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
								: "text-t-text-primary",
						)}
					>
						{progress.toFixed(1)}%
					</p>
				</div>

				{/* PRAWA STRONA: Wartość docelowa (Cel) */}
				<div className="text-right flex flex-col gap-1">
					<span className="text-t-text-tertiary text-[10px] uppercase font-bold tracking-widest">
						Cel Finansowy
					</span>
					<p className="text-lg font-semibold text-t-text-primary">
						{goal.toLocaleString("pl-PL", {
							minimumFractionDigits: 2,
						})}{" "}
						<span className="text-sm font-bold text-t-text-tertiary">PLN</span>
					</p>
				</div>
			</div>

			{/* Customowy pasek z efektem Neon Glow w nocy i czystym kolorem w dzień */}
			<div className="relative w-full h-1.5 md:h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mb-3">
				<div
					className={cn(
						"absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full",
						isCompleted
							? "bg-emerald-500 shadow-none dark:shadow-[0_0_10px_rgba(52,211,153,0.8)]"
							: "bg-blue-600 dark:bg-blue-500 shadow-none dark:shadow-[0_0_10px_rgba(59,130,246,0.6)]",
					)}
					style={{ width: `${Math.min(progress, 100)}%` }}
				/>
			</div>

			{/* DÓŁ: Techniczny opis ile brakuje */}
			<div className="flex justify-end">
				<p
					className={cn(
						"text-[11px] font-medium tracking-wide",
						isCompleted
							? "text-emerald-600 dark:text-emerald-500"
							: "text-t-text-tertiary",
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

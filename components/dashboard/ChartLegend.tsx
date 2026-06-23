import { SimpleTransaction } from "@/lib/types";

interface ChartLegendProps {
	transactions: SimpleTransaction[];
	chartMode: "VALUE" | "PERCENTAGE";
}

export const ChartLegend = ({ chartMode, transactions }: ChartLegendProps) => (
	<div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 pl-2">
		<div className="flex items-center gap-1.5">
			<div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
			{chartMode === "VALUE" ? "Wartość Portfela" : "Zwrot Portfela"}
		</div>
		{transactions.length > 0 && (
			<>
				<div className="flex items-center gap-1.5">
					<div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
					Kupno / Wpłata
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
					Sprzedaż / Wypłata
				</div>
			</>
		)}
	</div>
);

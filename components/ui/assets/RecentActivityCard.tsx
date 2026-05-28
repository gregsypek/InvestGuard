import { Asset } from "@/lib/types";
import { COLORS } from "@/lib/constants";
import { DeleteButton } from "@/components/DeleteButton";
import { cn } from "@/lib/utils";
import { deleteAsset } from "@/lib/actions/portfolio.actions";
interface Props {
	asset: Asset;
	isHighlighted: boolean;
	isDemo?: boolean;
}
export default function AssetCard({ asset, isHighlighted, isDemo }: Props) {
	return (
		<div
			key={asset.id}
			className={cn(
				"relative flex justify-between items-center p-3 md:p-4 rounded-xl border transition-all duration-300 group flex-1",
				isHighlighted
					? "border-blue-500/30 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
					: "border-white/5 bg-[#0a0e17] hover:bg-white/[0.02]",
			)}
		>
			{/* NEONOWY WSKAŹNIK (Zamiast standardowej gwiazdki) */}
			{isHighlighted && (
				<div className="absolute -left-1.5 -top-1.5">
					<span className="relative flex h-3.5 w-3.5">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
						<span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-[#05070a]"></span>
					</span>
				</div>
			)}

			{/* LEWA STRONA: Nazwa / Kategoria */}
			<div className="flex flex-col gap-1.5">
				<p className="font-bold text-sm text-slate-200 tracking-tight min-w-60">
					{asset.name}
				</p>
				<div className="flex items-center gap-1.5">
					{/* ZMIANA: Zwykłe kółko zastąpione płaską kropką z poświatą */}
					<div
						className="w-1.5 h-1.5 rounded-full opacity-80"
						style={{
							backgroundColor:
								COLORS[asset.category as keyof typeof COLORS] || "#64748b",
							boxShadow: `0 0 8px ${COLORS[asset.category as keyof typeof COLORS] || "#64748b"}`,
						}}
					/>
					<p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
						{asset.category}
					</p>
				</div>
			</div>

			{/* PRAWA STRONA: Kwota + Przycisk usuwania */}
			<div className="flex items-center gap-4">
				<div className="flex flex-col items-end gap-0.5">
					<p className="font-mono text-sm font-medium text-slate-300">
						{asset.currentValue.toLocaleString("pl-PL", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
					<p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
						PLN
					</p>
				</div>

				{/* ZMIANA: Kosz na śmieci jest dyskretnie wygaszony i podświetla się dopiero po najechaniu na kartę myszką */}
				<div className="opacity-30 group-hover:opacity-100 transition-opacity duration-200">
					<DeleteButton
						id={asset.id}
						onDelete={deleteAsset}
						confirmMsg={`Usunąć ${asset.name}?`}
						isDemo={isDemo}
					/>
				</div>
			</div>
		</div>
	);
}

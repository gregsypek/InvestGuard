import { TrendingDown, TrendingUp } from "lucide-react";

import { Asset } from "@/lib/types";
import { COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
	asset: Asset;
	isHighlighted: boolean;
	isDemo?: boolean;
	activityDate?: Date;
}

export default function AssetCard({
	asset,
	isHighlighted,
	isDemo,
	activityDate,
}: Props) {
	// 🚀 ZMIANA 1: Obliczenia finansowe w locie
	const invested = asset.investedCapital || 0;
	const current = asset.currentValue || 0;
	const profitAmount = current - invested;
	const profitPercent = invested > 0 ? (profitAmount / invested) * 100 : 0;

	const isPositive = profitAmount >= 0;
	const isCash = asset.category === "CASH";
	const cleanTicker = asset.ticker ? asset.ticker.split("_")[0] : null;

	return (
		<div
			key={asset.id}
			className={cn(
				"relative flex justify-between items-center p-3 md:p-4 rounded-xl border transition-all duration-300 group flex-1 min-w-[280px] overflow-hidden",
				isHighlighted
					? "border-blue-500/30 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
					: "border-t-border bg-t-bg-panel hover:bg-t-hover",
			)}
		>
			{/* NEONOWY WSKAŹNIK */}
			{isHighlighted && (
				<div className="absolute -left-1.5 -top-1.5 z-10">
					<span className="relative flex h-3.5 w-3.5">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
						<span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-t-bg-panel"></span>
					</span>
				</div>
			)}

			<div className="flex flex-col gap-2 flex-1 min-w-0 pr-4">
				<p className="font-bold text-sm text-t-text-primary tracking-tight truncate">
					{asset.name}
				</p>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5 shrink-0">
						<div
							className="w-1.5 h-1.5 rounded-full opacity-80"
							style={{
								backgroundColor:
									COLORS[asset.category as keyof typeof COLORS] || "#64748b",
								boxShadow: `0 0 8px ${COLORS[asset.category as keyof typeof COLORS] || "#64748b"}`,
							}}
						/>
						{/* <p className="text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary truncate">
							{asset.category}
						</p> */}
					</div>

					{/* Ticker jako mały, elegancki badge */}
					{cleanTicker && (
						<span className="text-[8px] font-bold text-t-text-tertiary uppercase border border-t-border-subtle bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-sm shrink-0">
							{cleanTicker}
						</span>
					)}

					{/* Wyświetlanie precyzyjnej daty ostatniej aktywności */}
					<span className="text-[9px] text-t-text-tertiary opacity-70 font-mono tracking-tighter shrink-0 ml-auto border-l border-t-border-subtle pl-2">
						{(
							activityDate || new Date(asset.purchaseDate || asset.createdAt)
						).toLocaleDateString("pl-PL", {
							day: "2-digit",
							month: "short",
							year: "numeric",
						})}
					</span>
				</div>
			</div>

			<div className="flex items-center gap-4 shrink-0">
				<div className="flex flex-col items-end gap-1">
					<div className="flex items-baseline gap-1">
						<p className="font-mono text-sm font-bold text-t-text-primary">
							{current.toLocaleString("pl-PL", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</p>
						<p className="text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary">
							PLN
						</p>
					</div>

					{/* 🚀 ZMIANA 3: Wynik Zysku/Straty (Ukryty dla gotówki i gdy brak wkładu) */}
					{!isCash && invested > 0 && (
						<div
							className={cn(
								"flex items-center gap-1 text-[10px] font-mono font-bold tracking-tighter",
								isPositive ? "text-emerald-500" : "text-rose-500",
							)}
						>
							{isPositive ? (
								<TrendingUp className="w-3 h-3" />
							) : (
								<TrendingDown className="w-3 h-3" />
							)}
							<span>
								{isPositive ? "+" : ""}
								{profitAmount.toLocaleString("pl-PL", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
							<span className="opacity-80">
								({isPositive ? "+" : ""}
								{profitPercent.toFixed(2)}%)
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

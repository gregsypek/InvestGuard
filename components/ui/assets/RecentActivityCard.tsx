"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { Asset } from "@/lib/types";
import { COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useChartContext } from "@/components/providers/ChartProvider";

interface Props {
	asset: Asset;
	isHighlighted: boolean;
	isDemo?: boolean;
	activityDate?: Date;
	purchaseCount?: number;
	isSold?: boolean;
}

export default function AssetCard({
	asset,
	isHighlighted,
	isDemo,
	activityDate,
	purchaseCount,
	isSold = false,
}: Props) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	// Calculate unrealized profit/loss on the fly
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
				isSold
					? "border-dashed border-t-border bg-t-bg-panel/60 opacity-80"
					: isHighlighted
						? "border-blue-500/30 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
						: "border-t-border bg-t-bg-panel hover:bg-t-hover",
			)}
		>
			{/* Slanted rubber-stamp badge for completely sold positions */}
			{isSold && (
				<div
					aria-label="Pozycja sprzedana"
					className="pointer-events-none select-none absolute inset-0 flex items-center justify-center z-10"
				>
					<span className="-rotate-12 px-3 py-1 rounded-md border-2 border-rose-500/45 bg-t-bg-panel/85 backdrop-blur-[1px] text-rose-500/80 text-xs font-black uppercase tracking-[0.22em] shadow-xs">
						Sprzedane
					</span>
				</div>
			)}

			{isHighlighted && !isSold && (
				<div className="absolute -left-1.5 -top-1.5 z-10">
					<span className="relative flex h-3.5 w-3.5">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
						<span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-t-bg-panel"></span>
					</span>
				</div>
			)}

			<div className="flex flex-col gap-2 flex-1 min-w-0 pr-4">
				<p className="font-bold text-sm text-t-text-primary tracking-tight truncate max-w-44">
					{asset.name}
				</p>
				<div className="flex items-center gap-2 flex-wrap">
					<div className="flex items-center gap-1.5 shrink-0">
						<div
							className="w-1.5 h-1.5 rounded-full opacity-80"
							style={{
								backgroundColor:
									COLORS[asset.category as keyof typeof COLORS] || "#64748b",
								boxShadow: `0 0 8px ${COLORS[asset.category as keyof typeof COLORS] || "#64748b"}`,
							}}
						/>
					</div>

					{cleanTicker && (
						<span className="text-[8px] font-bold text-t-text-tertiary uppercase border border-t-border-subtle bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-sm shrink-0">
							{cleanTicker}
						</span>
					)}

					{purchaseCount && purchaseCount > 1 && (
						<span className="text-[8px] font-bold text-blue-400 uppercase border border-blue-500/25 bg-blue-500/10 px-1.5 py-0.5 rounded-sm shrink-0">
							{purchaseCount}× zakup
						</span>
					)}

					<span className="text-[9px] text-t-text-tertiary opacity-70 font-mono tracking-tighter shrink-0 mr-auto border-l border-t-border-subtle pl-2">
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
							{formatCurrency(convertPLN(isSold ? invested : current))}
						</p>
						<p className="text-xs font-bold uppercase tracking-widest text-t-text-tertiary">
							{currencySymbol}
						</p>
					</div>

					{isSold ? (
						<span className="text-[10px] font-mono font-semibold text-t-text-tertiary tracking-tighter">
							Wkład (zamknięta)
						</span>
					) : (
						!isCash &&
						invested > 0 && (
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
									{formatCurrency(convertPLN(profitAmount))}
								</span>
								<span className="opacity-80">
									({isPositive ? "+" : ""}
									{profitPercent.toFixed(2)}%)
								</span>
							</div>
						)
					)}
				</div>
			</div>
		</div>
	);
}

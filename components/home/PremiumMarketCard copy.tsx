import {
	Activity,
	Briefcase,
	Globe,
	Plus,
	Settings,
	TrendingDown,
	TrendingUp,
} from "lucide-react";

import React from "react";
import { cn } from "@/lib/utils";

// Premium version of the market row, inspired by AssetCard
export function PremiumMarketCard({
	name,
	ticker,
	change,
	logo,
}: {
	name: string;
	ticker?: string;
	change: number;
	logo?: string;
}) {
	const isPositive = change >= 0;
	// Color palette for positive/negative trends
	const changeColor = isPositive ? "text-emerald-500" : "text-rose-500";
	const changeBg = isPositive ? "bg-emerald-500/10" : "bg-rose-500/10";
	const changeBorder = isPositive
		? "border-emerald-500/20"
		: "border-rose-500/20";

	return (
		<div className="group relative flex justify-between items-center p-2 transition-all duration-300">
			{/* Neon indicator on hover - adapts color based on trend */}
			<div
				className={cn(
					"absolute -left-[1px] top-1/2 -translate-y-1/2 h-1/2 w-[3px] rounded-r-full transition-all duration-300 opacity-0 group-hover:opacity-100",
					isPositive
						? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
						: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]",
				)}
			/>

			<div className="flex items-center gap-3">
				{/* Logo container with fallback */}
				<div className="w-9 h-9 rounded-full overflow-hidden bg-t-bg-sticky border border-t-border flex items-center justify-center shrink-0">
					{logo ? (
						<img src={logo} alt={name} className="w-full h-full object-cover" />
					) : (
						<span className="text-xs font-bold text-slate-400">
							{name.charAt(0)}
						</span>
					)}
				</div>

				<div className="flex flex-col gap-0.5">
					<p className="font-bold text-sm text-t-text-primary tracking-tight truncate max-w-[130px] sm:max-w-[180px]">
						{name}
					</p>
					{ticker && (
						<p className="text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary">
							{ticker}
						</p>
					)}
				</div>
			</div>

			{/* Styled badge for percentage change */}
			<div
				className={cn(
					"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border",
					changeBg,
					changeBorder,
				)}
			>
				{isPositive ? (
					<TrendingUp className={cn("w-3.5 h-3.5", changeColor)} />
				) : (
					<TrendingDown className={cn("w-3.5 h-3.5", changeColor)} />
				)}
				<p className={cn("font-mono text-xs font-bold", changeColor)}>
					{isPositive ? "+" : ""}
					{change.toFixed(2)}%
				</p>
			</div>
		</div>
	);
}

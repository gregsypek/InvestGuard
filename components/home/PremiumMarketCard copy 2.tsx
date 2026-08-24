import { TrendingDown, TrendingUp } from "lucide-react";

import Image from "next/image";
import React from "react";
import { cn } from "@/lib/utils";

function Sparkline({
	data,
	isPositive,
}: {
	data: number[];
	isPositive: boolean;
}) {
	if (!data || data.length < 2) return null;

	const min = Math.min(...data);
	const max = Math.max(...data);
	const range = max - min || 1;
	const width = 60;
	const height = 24;

	const points = data
		.map((val, i) => {
			const x = (i / (data.length - 1)) * width;
			const y = height - ((val - min) / range) * height;
			return `${x},${y}`;
		})
		.join(" ");

	const strokeColor = isPositive ? "text-emerald-500" : "text-rose-500";

	return (
		<svg
			width={width}
			height={height}
			className="overflow-visible"
			viewBox={`0 0 ${width} ${height}`}
		>
			<polyline
				points={points}
				fill="none"
				className={cn("stroke-[1.5px]", strokeColor)}
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function PremiumMarketCard({
	name,
	ticker,
	change,
	logo,
	historyData,
}: {
	name: string;
	ticker?: string | null;
	change: number;
	logo?: string | null;
	historyData?: number[];
}) {
	const isPositive = change >= 0;
	const changeColor = isPositive ? "text-emerald-500" : "text-rose-500";

	return (
		<div className="relative flex justify-between items-center p-2 rounded-xl bg-t-bg-base/20  cursor-default">
			{/* 🚀 Statyczny, delikatny znacznik koloru (zamiast wyskakującego na hover) */}
			<div className={cn("absolute")} />

			<div className="flex items-center gap-3">
				<div className="w-9 h-9 rounded-full overflow-hidden bg-t-bg-sticky border border-t-border flex items-center justify-center shrink-0 shadow-sm p-2">
					{logo ? (
						<Image
							src={logo}
							alt={name}
							width={20}
							height={20}
							className="w-full h-full object-cover dark:invert"
						/>
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

			<div className="flex items-center gap-4">
				{historyData && historyData.length > 0 && (
					// 🚀 Wykres widoczny na stałe, bez zmiany opacity
					<div className=" opacity-80">
						<Sparkline data={historyData} isPositive={isPositive} />
					</div>
				)}

				<div
					className={
						"flex items-center gap-1.5 px-2.5 py-1.5  min-w-[70px] justify-center"
					}
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
		</div>
	);
}

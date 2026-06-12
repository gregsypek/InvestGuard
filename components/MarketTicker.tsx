"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

// Słownik do ładnego formatowania
const TICKER_NAMES: Record<string, string> = {
	SP500: "S&P 500",
	NASDAQ: "NASDAQ 100",
	WIG20: "WIG20",
	DAX: "DAX 40",
	GOLD: "ZŁOTO",
	BTC: "BITCOIN",
};

interface MarketTickerProps {
	indices: { symbol: string; price: number; dailyChange: number }[];
}

export function MarketTicker({ indices }: MarketTickerProps) {
	if (!indices || indices.length === 0) return null;

	// Klonujemy tablicę 3 razy, żeby stworzyć idealnie płynną pętlę na dużych ekranach
	const duplicatedIndices = [...indices, ...indices, ...indices];

	return (
		<div className="w-full bg-t-bg-panel/95 backdrop-blur-xl border-b border-t-border-subtle overflow-hidden flex items-center h-10 z-50 relative">
			{/* PREMIUM SHADOW: Efekt płynnego zanikania tekstu na krawędziach ekranu */}
			<div
				className="absolute inset-0 z-10 pointer-events-none"
				style={{
					background:
						"linear-gradient(90deg, var(--bg-panel) 0%, transparent 5%, transparent 95%, var(--bg-panel) 100%)",
				}}
			/>

			{/* Kontener animacji z pauzą po najechaniu myszką */}
			<div className="flex items-center w-full min-w-max animate-ticker hover:[animation-play-state:paused] cursor-default">
				{duplicatedIndices.map((idx, i) => {
					const isPositive = idx.dailyChange >= 0;
					const name = TICKER_NAMES[idx.symbol] || idx.symbol;
					const changeStr = `${isPositive ? "+" : ""}${idx.dailyChange.toFixed(2)}%`;

					return (
						<div
							key={`${idx.symbol}-${i}`}
							className="flex items-center gap-3 px-8 group transition-opacity duration-300"
						>
							<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-t-text-tertiary group-hover:text-t-text-secondary transition-colors">
								{name}
							</span>

							<div
								className={cn(
									"flex items-center gap-1.5 text-[11px] font-black tracking-wider",
									isPositive ? "text-emerald-500/90" : "text-rose-500/90",
								)}
							>
								{isPositive ? (
									<TrendingUp className="w-3 h-3" />
								) : (
									<TrendingDown className="w-3 h-3" />
								)}
								{changeStr}
							</div>

							{/* Minimalistyczny separator (kropka) */}
							<div className="w-1 h-1 rounded-full bg-t-border-subtle ml-8" />
						</div>
					);
				})}
			</div>
		</div>
	);
}

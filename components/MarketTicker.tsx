"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface MarketTickerProps {
	data: {
		label: string;
		value: string;
		change: string;
		logo?: string | null;
	}[];
}

export function MarketTicker({ data }: MarketTickerProps) {
	if (!data || data.length === 0) return null;

	// Klonujemy 3 razy dla perfekcyjnej, nieskończonej pętli na dużych monitorach
	const duplicatedData = [...data, ...data, ...data];

	return (
		<div className="w-full bg-t-bg-panel/95 backdrop-blur-xl border-b border-t-border-subtle overflow-hidden flex items-center h-10 z-50 relative">
			{/* PREMIUM SHADOW: Płynne zanikanie na brzegach ekranu */}
			<div
				className="absolute inset-0 z-10 pointer-events-none"
				style={{
					background:
						"linear-gradient(90deg, var(--bg-panel) 0%, transparent 5%, transparent 95%, var(--bg-panel) 100%)",
				}}
			/>

			{/* Kontener animacji CSS - płynne tempo i pauza na hover */}
			<div className="flex items-center w-full min-w-max animate-ticker cursor-default">
				{" "}
				{duplicatedData.map((item, i) => {
					// Twój format 'change' ma już plusy i minusy (np. "+1.25%")
					const isPositive = item.change.startsWith("+");

					return (
						<div
							key={`${item.label}-${i}`}
							className="flex items-center gap-3 px-8 group transition-opacity duration-300"
						>
							{/* IKONA / LOGO */}
							{item.logo ? (
								<div className="w-4 h-4 rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={item.logo}
										alt={item.label}
										className="w-full h-full object-cover"
									/>
								</div>
							) : (
								<div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 shrink-0" />
							)}

							{/* NAZWA (LABEL) */}
							<span className="text-[10px] font-bold uppercase tracking-[0.15em] text-t-text-tertiary group-hover:text-t-text-secondary transition-colors">
								{item.label}
							</span>

							{/* CENA (VALUE) */}
							<span className="text-[11px] font-medium text-t-text-primary ml-1">
								{item.value}
							</span>

							{/* ZMIANA (CHANGE) */}
							<div
								className={cn(
									"flex items-center gap-1.5 text-[11px] font-black tracking-wider ml-1",
									isPositive ? "text-emerald-500/90" : "text-rose-500/90",
									// Jeśli zmiana wynosi dokładnie "0.00%", pokazujemy na szaro
									item.change === "0.00%" || item.change === "+0.00%"
										? "text-t-text-tertiary"
										: "",
								)}
							>
								{isPositive ? (
									<TrendingUp className="w-3 h-3" />
								) : (
									<TrendingDown className="w-3 h-3" />
								)}
								{item.change}
							</div>

							{/* Minimalistyczny separator (kropka) na końcu */}
							<div className="w-1 h-1 rounded-full bg-t-border-subtle ml-8" />
						</div>
					);
				})}
			</div>
		</div>
	);
}

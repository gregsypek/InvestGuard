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

// 🚀 NOWE: Funkcja "czyszcząca" i kategoryzująca nazwy aktywów
function formatAssetName(rawName: string) {
	let cleanName = rawName;
	let isETF = false;
	let provider = null;

	// 1. Sprawdzamy czy to ETF
	if (cleanName.includes("ETF") || cleanName.includes("UCITS")) {
		isETF = true;
	}

	// 2. Szukamy dostawców (Providers)
	const providers = [
		"iShares",
		"Vanguard",
		"Amundi",
		"Xtrackers",
		"Invesco",
		"Lyxor",
	];
	for (const p of providers) {
		if (cleanName.startsWith(p)) {
			provider = p;
			// Usuwamy nazwę dostawcy z głównego tekstu
			cleanName = cleanName.replace(p, "").trim();
			break;
		}
	}

	// 3. Usuwamy śmieci typowe dla ETF-ów (UCITS, klasy walutowe, Acc/Dist)
	cleanName = cleanName
		.replace(/UCITS/g, "")
		.replace(/ETF/g, "")
		.replace(/USD/g, "")
		.replace(/EUR/g, "")
		.replace(/GBP/g, "")
		.replace(/\(Acc\)/gi, "")
		.replace(/\(Dist\)/gi, "")
		.replace(/\(PLN Hedged\)/gi, "")
		.replace(/\s+/g, " ") // Usuwa podwójne spacje po wycinaniu
		.trim();

	// Jeśli po wycięciu wszystkiego nazwa jest pusta (rzadki przypadek), zwracamy oryginał
	if (cleanName.length === 0) {
		cleanName = rawName;
	}

	return { cleanName, isETF, provider };
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

	// 🚀 Aplikujemy funkcję formatującą
	const { cleanName, isETF, provider } = formatAssetName(name);

	return (
		<div className="flex items-center bg justify-between p-2 rounded-xl bg-t-bg-panel border border-t-border w-full min-w-0 gap-2 overflow-hidden">
			{/* LEWA STRONA: Logo, Nazwa i Ticker */}
			<div className="flex items-center gap-2 flex-1 min-w-0">
				<div className="shrink-0">
					<div className="w-6 h-6 rounded-full overflow-hidden bg-t-bg-sticky border border-t-border flex items-center justify-center shadow-sm p-1">
						{logo ? (
							<Image
								src={logo}
								alt={name}
								width={12}
								height={12}
								className="w-full h-full object-contain dark:invert"
							/>
						) : (
							<span className="text-[9px] font-medium text-slate-400">
								{name.charAt(0)}
							</span>
						)}
					</div>
				</div>

				<div className="flex flex-col min-w-0 justify-center">
					<div className="flex items-center gap-1.5">
						<p
							className="font-medium text-[10px] text-t-text-primary tracking-tight truncate"
							title={cleanName}
						>
							{cleanName}
						</p>
						{isETF && (
							<span className="shrink-0 px-1 py-0.2 rounded bg-theme-soft border border-blue-500/20 text-[6px] font-bold uppercase text-theme-primary tracking-widest hidden xs:inline-block">
								ETF
							</span>
						)}
					</div>

					{ticker && (
						<p className="text-[8px] font-medium uppercase tracking-widest text-t-text-tertiary truncate">
							{ticker}
						</p>
					)}
				</div>
			</div>

			{/* PRAWA STRONA: Wynik procentowy w tej samej linii */}
			<div className="flex  bottom-0  right-2  items-center shrink-0">
				{historyData && historyData.length > 0 && (
					<div className="opacity-70 shrink-0 hidden md:block">
						<Sparkline data={historyData} isPositive={isPositive} />
					</div>
				)}{" "}
				<div className="flex items-center gap-1 shrink-0 ml-1">
					{isPositive ? (
						<TrendingUp className={cn("w-3 h-3 opacity-70", changeColor)} />
					) : (
						<TrendingDown className={cn("w-3 h-3 opacity-70", changeColor)} />
					)}
					<p
						className={cn(
							"font-mono text-[10px] font-medium opacity-90",
							changeColor,
						)}
					>
						{isPositive ? "+" : ""}
						{change.toFixed(2)}%
					</p>
				</div>
			</div>
		</div>
	);
}

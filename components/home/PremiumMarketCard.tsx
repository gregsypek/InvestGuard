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
		<div className="relative flex flex-1  flex-col min-w-[180px] md:min-w-[300px] sm:flex-row sm:justify-between sm:items-center p-2 rounded-xl bg-t-bg-base/20 cursor-default gap-2 overflow-hidden">
			{/* LEWA STRONA: Logo i tekst - elastyczna szerokość */}
			<div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
				{/* Kontener na Logo z potencjalną plakietką dostawcy */}
				<div className="relative shrink-0">
					<div className="md:w-8 md:h-8 h-6 w-6 rounded-full overflow-hidden bg-t-bg-sticky border border-t-border flex items-center justify-center shadow-sm p-1 md:p-1.5 ">
						{logo ? (
							<Image
								src={logo}
								alt={name}
								width={8}
								height={8}
								className="w-full h-full object-contain dark:invert"
							/>
						) : (
							<span className="text-[10px] sm:text-xs font-bold text-slate-400">
								{name.charAt(0)}
							</span>
						)}
					</div>
				</div>

				<div className="flex flex-col flex-1  justify-center">
					{/* 🚀 Górny rządek z nowym badge'em ETF i wyczyszczoną nazwą */}
					<div className="flex items-center gap-1.5">
						<p
							className="font-bold text-xs sm:text-sm text-t-text-primary tracking-tight truncate max-w-[140px] sm:max-w-[180px]"
							title={cleanName}
						>
							{cleanName}
						</p>
						{isETF && (
							<span className="shrink-0 px-1 py-0.5 rounded bg-theme-soft border border-blue-500/20 text-[6px] sm:text-[8px] font-black uppercase text-theme-primary tracking-widest mt-0.5">
								ETF
							</span>
						)}
					</div>

					{/* 🚀 Dolny rządek z tickerem i ew. dostawcą */}
					<div className="flex items-center gap-1.5 mt-0.5">
						{ticker && (
							<p className="text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary truncate">
								{ticker}
							</p>
						)}
						{provider && (
							<>
								<span className="text-[8px] hidden xl:block text-t-text-tertiary/50">
									•
								</span>
								<p className="text-[9px] font-medium text-t-text-tertiary hidden xl:block truncate">
									{provider}
								</p>
							</>
						)}
					</div>
				</div>
			</div>

			{/* PRAWA STRONA: Wykres i liczby */}
			<div className="absolute bottom-0  right-2  items-center shrink-0">
				{historyData && historyData.length > 0 && (
					<div className="opacity-70 shrink-0 hidden md:block">
						<Sparkline data={historyData} isPositive={isPositive} />
					</div>
				)}

				<div className="flex items-center gap-1 min-w-[70px] sm:min-w-[100px] justify-end ">
					{isPositive ? (
						<TrendingUp
							className={cn(
								"w-3 sm:w-3.5 h-3 sm:h-3.5 md:hidden opacity-70 ",
								changeColor,
							)}
						/>
					) : (
						<TrendingDown
							className={cn(
								"w-3 sm:w-3.5 h-3 sm:h-3.5 md:hidden opacity-70",
								changeColor,
							)}
						/>
					)}
					<p
						className={cn(
							"font-mono text-[11px] sm:text-xs font-bold opacity-70",
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

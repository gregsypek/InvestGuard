"use client";

import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import React, { useId } from "react";

import Image from "next/image";
import { cn } from "@/lib/utils";

/* =========================================
   SPARKLINE (linia + wypełnienie gradientem)
   Skaluje się do szerokości karty.
   ========================================= */
function Sparkline({
	data,
	isPositive,
	className,
}: {
	data: number[];
	isPositive: boolean;
	className?: string;
}) {
	// useId musi być przed early-return (zasady hooków)
	const gradientId = `spark-${useId().replace(/:/g, "")}`;

	if (!data || data.length < 2) return null;

	const W = 100;
	const H = 40;
	const PAD = 4; // zapas, żeby obrys linii nie był ucinany

	const min = Math.min(...data);
	const max = Math.max(...data);
	const range = max - min || 1;

	const coords = data.map((val, i) => {
		const x = (i / (data.length - 1)) * W;
		const y = H - PAD - ((val - min) / range) * (H - PAD * 2);
		return [x, y] as const;
	});

	const line = coords
		.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
		.join(" ");
	const area = `${line} L${W},${H} L0,${H} Z`;

	return (
		<svg
			viewBox={`0 0 ${W} ${H}`}
			preserveAspectRatio="none"
			className={cn(
				"w-full h-10 overflow-visible",
				isPositive ? "text-gain" : "text-loss",
				className,
			)}
			aria-hidden="true"
		>
			<defs>
				<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
					<stop offset="100%" stopColor="currentColor" stopOpacity="0" />
				</linearGradient>
			</defs>
			<path d={area} fill={`url(#${gradientId})`} />
			<path
				d={line}
				fill="none"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
}

/* =========================================
   NAZWY AKTYWÓW: czyszczenie i kategoryzacja
   ========================================= */
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
			cleanName = cleanName.replace(p, "").trim();
			break;
		}
	}

	// 3. Usuwamy śmieci typowe dla ETF-ów
	cleanName = cleanName
		.replace(/UCITS/g, "")
		.replace(/ETF/g, "")
		.replace(/USD/g, "")
		.replace(/EUR/g, "")
		.replace(/GBP/g, "")
		.replace(/\(Acc\)/gi, "")
		.replace(/\(Dist\)/gi, "")
		.replace(/\(PLN Hedged\)/gi, "")
		.replace(/\s+/g, " ")
		.trim();

	if (cleanName.length === 0) {
		cleanName = rawName;
	}

	return { cleanName, isETF, provider };
}

/* =========================================
   LOGO
   ========================================= */
function AssetLogo({
	logo,
	name,
	className,
}: {
	logo?: string | null;
	name: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"shrink-0 w-8 h-8 rounded-full bg-t-bg-sticky border border-t-border flex items-center justify-center overflow-hidden p-1.5 shadow-sm",
				className,
			)}
		>
			{logo ? (
				<Image
					src={logo}
					alt={name}
					width={20}
					height={20}
					className="w-full h-full object-contain dark:invert"
				/>
			) : (
				<span className="text-[10px] font-bold text-t-text-tertiary">
					{name.charAt(0)}
				</span>
			)}
		</div>
	);
}

/* =========================================
   KARTA RYNKOWA
   variant="index" → duża karta z wykresem (indeksy)
   variant="asset" → kompaktowa karta (walory)
   Domyślnie: jeśli są dane historyczne → "index".
   ========================================= */
export function PremiumMarketCard({
	name,
	ticker,
	change,
	logo,
	historyData,
	variant,
}: {
	name: string;
	ticker?: string | null;
	change: number;
	logo?: string | null;
	historyData?: number[];
	variant?: "index" | "asset";
}) {
	const isPositive = change >= 0;
	const { cleanName, isETF } = formatAssetName(name);
	const resolvedVariant =
		variant ?? (historyData && historyData.length > 1 ? "index" : "asset");

	const TrendIcon = isPositive ? TrendingUp : TrendingDown;
	const formattedChange = `${isPositive ? "+" : ""}${change.toFixed(2)}%`;

	const cardBase =
		"group-hover:border-theme-border group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-300";

	/* ---------- WARIANT: INDEKS ---------- */
	if (resolvedVariant === "index") {
		return (
			<div
				className={cn(
					"relative flex flex-col gap-3 w-full min-w-0 overflow-hidden rounded-2xl border border-t-border bg-t-bg-panel p-3 sm:p-4",
					cardBase,
				)}
			>
				{/* Poświata zależna od kierunku zmiany */}
				<div
					className={cn(
						"pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-colors duration-500",
						isPositive
							? "bg-gain/10 group-hover:bg-gain/20"
							: "bg-loss/10 group-hover:bg-loss/20",
					)}
				/>

				{/* Nagłówek: logo, nazwa, strzałka "otwórz" */}
				<div className="relative flex items-center gap-2.5 min-w-0">
					<AssetLogo logo={logo} name={name} />
					<div className="flex flex-col min-w-0 flex-1">
						<p
							className="text-xs font-semibold text-t-text-primary tracking-tight truncate"
							title={cleanName}
						>
							{cleanName}
						</p>
						{ticker && (
							<p className="text-[9px] font-medium uppercase tracking-widest text-t-text-tertiary truncate">
								{ticker}
							</p>
						)}
					</div>
					<ArrowUpRight className="w-4 h-4 shrink-0 text-t-text-tertiary opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
				</div>

				{/* Wynik */}
				<div className="relative flex items-center gap-2">
					<p
						className={cn(
							"font-mono num text-xl sm:text-2xl font-semibold tracking-tight",
							isPositive ? "text-gain" : "text-loss",
						)}
					>
						{formattedChange}
					</p>
					<span
						className={cn(
							"flex items-center justify-center w-5 h-5 rounded-md",
							isPositive ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss",
						)}
					>
						<TrendIcon className="w-3 h-3" />
					</span>
				</div>

				{/* Wykres */}
				{historyData && historyData.length > 1 && (
					<div className="relative -mx-1 mt-auto">
						<Sparkline data={historyData} isPositive={isPositive} />
					</div>
				)}
			</div>
		);
	}

	/* ---------- WARIANT: WALOR ---------- */
	const meterWidth = Math.min(Math.abs(change) / 5, 1) * 100; // 5% = pełny pasek

	return (
		<div
			className={cn(
				"relative flex flex-col gap-2.5 w-full min-w-0 overflow-hidden rounded-xl border border-t-border bg-t-bg-panel p-2.5 sm:p-3",
				cardBase,
			)}
		>
			<div className="flex items-center gap-2 min-w-0">
				<AssetLogo logo={logo} name={name} className="w-7 h-7 p-1.5" />
				<div className="flex flex-col min-w-0 flex-1">
					<div className="flex items-center gap-1.5 min-w-0">
						<p
							className="text-[11px] font-semibold text-t-text-primary tracking-tight truncate"
							title={cleanName}
						>
							{cleanName}
						</p>
						{isETF && (
							<span className="shrink-0 px-1 rounded bg-theme-soft border border-theme-border text-[7px] font-bold uppercase text-theme-primary tracking-widest hidden xs:inline-block">
								ETF
							</span>
						)}
					</div>
					{ticker && (
						<p className="text-[9px] font-medium uppercase tracking-widest text-t-text-tertiary truncate">
							{ticker}
						</p>
					)}
				</div>
			</div>

			<div className="flex items-center justify-between gap-2">
				<p
					className={cn(
						"font-mono num text-sm font-semibold tracking-tight",
						isPositive ? "text-gain" : "text-loss",
					)}
				>
					{formattedChange}
				</p>
				<span
					className={cn(
						"flex items-center justify-center w-5 h-5 rounded-md",
						isPositive ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss",
					)}
				>
					<TrendIcon className="w-3 h-3" />
				</span>
			</div>

			{/* Miernik siły ruchu (skala do ±5%) */}
			<div className="h-0.5 w-full rounded-full bg-t-border overflow-hidden">
				<div
					className={cn(
						"h-full rounded-full transition-all duration-700",
						isPositive ? "bg-gain" : "bg-loss",
					)}
					style={{ width: `${Math.max(meterWidth, 4)}%` }}
				/>
			</div>
		</div>
	);
}

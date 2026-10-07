"use client";

import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";

export interface StressTestAsset {
	category: string;
	quantity: number;
	currentValue: number;
	investedCapital: number;
}

interface AlphaStressTestProps {
	assets: StressTestAsset[];
}

export function AlphaStressTest({ assets }: AlphaStressTestProps) {
	const [cryptoShock, setCryptoShock] = useState(0);
	const [stocksShock, setStocksShock] = useState(0);

	const isCrypto = (a: StressTestAsset) => a.category === "CRYPTO";
	const isBooster = (a: StressTestAsset) => a.category === "BOOSTER";

	const metrics = useMemo(() => {
		const activeAssets = assets.filter((a) => a.quantity > 0);

		const cryptoCurrent = activeAssets
			.filter(isCrypto)
			.reduce((sum, a) => sum + a.currentValue, 0);
		const stocksCurrent = activeAssets
			.filter(isBooster)
			.reduce((sum, a) => sum + a.currentValue, 0);
		const totalInvested = activeAssets.reduce(
			(sum, a) => sum + a.investedCapital,
			0,
		);

		const cryptoSimulated = cryptoCurrent * (1 + cryptoShock / 100);
		const stocksSimulated = stocksCurrent * (1 + stocksShock / 100);
		const totalSimulated = cryptoSimulated + stocksSimulated;
		const totalCurrent = cryptoCurrent + stocksCurrent;

		const currentRoi =
			totalInvested > 0
				? ((totalCurrent - totalInvested) / totalInvested) * 100
				: 0;
		const simulatedRoi =
			totalInvested > 0
				? ((totalSimulated - totalInvested) / totalInvested) * 100
				: 0;
		const impactPLN = totalSimulated - totalCurrent;

		return {
			totalCurrent,
			totalSimulated,
			currentRoi,
			simulatedRoi,
			impactPLN,
		};
	}, [assets, cryptoShock, stocksShock]);

	return (
		<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
				{/* LEWA: SUWAKI (STEROWANIE) */}
				<div className="space-y-6 sm:space-y-8 flex flex-col justify-center">
					<div className="space-y-3 sm:space-y-4">
						<div className="flex justify-between items-end gap-4">
							<div className="space-y-1">
								<h4 className="text-xs sm:text-sm font-bold text-t-text-primary uppercase tracking-widest">
									Szok na Krypto
								</h4>
								<p className="text-[9px] sm:text-[10px] text-t-text-tertiary uppercase tracking-widest">
									Zmiana wyceny kryptowalut
								</p>
							</div>
							<span
								className={cn(
									"text-lg sm:text-xl font-black font-mono shrink-0",
									cryptoShock > 0
										? "text-emerald-500"
										: cryptoShock < 0
											? "text-rose-500"
											: "text-t-text-secondary",
								)}
							>
								{cryptoShock > 0 ? "+" : ""}
								{cryptoShock}%
							</span>
						</div>
						<input
							type="range"
							min="-80"
							max="80"
							step="5"
							value={cryptoShock}
							onChange={(e) => setCryptoShock(Number(e.target.value))}
							className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-(--theme-primary) hover:opacity-90 transition-opacity"
						/>
					</div>

					<div className="space-y-3 sm:space-y-4">
						<div className="flex justify-between items-end gap-4">
							<div className="space-y-1">
								<h4 className="text-xs sm:text-sm font-bold text-t-text-primary uppercase tracking-widest">
									Szok na Akcjach
								</h4>
								<p className="text-[9px] sm:text-[10px] text-t-text-tertiary uppercase tracking-widest">
									Zmiana wyceny spółek (Booster)
								</p>
							</div>
							<span
								className={cn(
									"text-lg sm:text-xl font-black font-mono shrink-0",
									stocksShock > 0
										? "text-emerald-500"
										: stocksShock < 0
											? "text-rose-500"
											: "text-t-text-secondary",
								)}
							>
								{stocksShock > 0 ? "+" : ""}
								{stocksShock}%
							</span>
						</div>
						<input
							type="range"
							min="-50"
							max="50"
							step="5"
							value={stocksShock}
							onChange={(e) => setStocksShock(Number(e.target.value))}
							className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-(--theme-primary) hover:opacity-90 transition-opacity"
						/>
					</div>

					<div className="flex justify-end pt-2">
						<button
							onClick={() => {
								setCryptoShock(0);
								setStocksShock(0);
							}}
							className="text-[10px] sm:text-xs font-bold text-t-text-tertiary hover:text-t-text-primary uppercase tracking-widest transition-colors py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
						>
							Resetuj symulację
						</button>
					</div>
				</div>

				{/* PRAWA: WYNIKI SYMULACJI */}
				<div className="bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-xl p-4 sm:p-6 flex flex-col justify-center">
					<div className="flex items-center gap-2 mb-4 sm:mb-6 text-t-text-secondary">
						<Activity className="w-4 h-4 sm:w-5 sm:h-5" />
						<span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">
							Projekcja Portfela Alpha
						</span>
					</div>

					{/* 🚀 ZMIANA 3: flex-wrap zapobiegający zderzaniu się tekstu z wyceną na bardzo małych ekranach */}
					<div className="space-y-4 sm:space-y-6">
						<div className="flex flex-wrap justify-between items-center gap-2 border-b border-t-border-subtle pb-3 sm:pb-4">
							<span className="text-xs sm:text-sm font-bold text-t-text-tertiary uppercase tracking-widest">
								Nowa Wycena
							</span>
							<span className="text-xl sm:text-2xl font-black text-t-text-primary">
								{formatCurrency(metrics.totalSimulated, 0)}{" "}
								<span className="text-xs sm:text-sm text-t-text-tertiary uppercase tracking-widest ml-0.5">
									PLN
								</span>
							</span>
						</div>

						<div className="flex flex-wrap justify-between items-center gap-2 border-b border-t-border-subtle pb-3 sm:pb-4">
							<span className="text-xs sm:text-sm font-bold text-t-text-tertiary uppercase tracking-widest">
								Zrewidowane ROI
							</span>
							<span
								className={cn(
									"text-xl sm:text-2xl font-black font-mono tracking-tight",
									metrics.simulatedRoi >= 0
										? "text-emerald-500"
										: "text-rose-500",
								)}
							>
								{metrics.simulatedRoi > 0 ? "+" : ""}
								{metrics.simulatedRoi.toFixed(1)}%
							</span>
						</div>

						<div className="flex flex-wrap justify-between items-center gap-2">
							<span className="text-xs sm:text-sm font-bold text-t-text-tertiary uppercase tracking-widest">
								Wpływ szoku
							</span>
							<div
								className={cn(
									"flex items-center gap-1.5 text-base sm:text-lg font-black font-mono",
									metrics.impactPLN > 0
										? "text-emerald-500"
										: metrics.impactPLN < 0
											? "text-rose-500"
											: "text-t-text-secondary",
								)}
							>
								{metrics.impactPLN > 0 ? (
									<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
								) : metrics.impactPLN < 0 ? (
									<TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
								) : null}
								<span>
									{metrics.impactPLN > 0 ? "+" : ""}
									{formatCurrency(metrics.impactPLN, 0)}{" "}
									<span className="text-[10px] sm:text-xs text-current opacity-70 uppercase tracking-widest ml-0.5">
										PLN
									</span>
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

"use client";

import { Calendar, Filter, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { AbsoluteDailyPnLChart } from "../dashboard/AbsoluteDailyPnLChart";
import { FilterBadge } from "../shared/FilterBadge";
import { cn } from "@/lib/utils";

interface MinimalAsset {
	category: string;
	currentValue: number;
	investedCapital: number;
}

interface MinimalTransaction {
	category?: string;
	type: string;
	executedValue: number;
	executedAt: string | Date;
}

interface MinimalSnapshot {
	date: string;
	globalTotalValue: number;
	globalChangePLN: number;
}

interface AlphaPnLClientProps {
	snapshotsData: MinimalSnapshot[];
	transactions: MinimalTransaction[];
	assets: MinimalAsset[];
}

type TimeRangeMode = "1M" | "3M" | "6M" | "YTD" | "MAX";
type FilterMode = "ALL" | "STOCKS" | "CRYPTO";

export function AlphaPnLClient({
	snapshotsData,
	transactions,
	assets,
}: AlphaPnLClientProps) {
	const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
	const [timeRange, setTimeRange] = useState<TimeRangeMode>("1M");
	const [isCalculating, setIsCalculating] = useState(false);

	const oldestSnapshotDate = useMemo(() => {
		if (!snapshotsData || snapshotsData.length === 0) return new Date();
		return new Date(snapshotsData[0].date);
	}, [snapshotsData]);

	const availableRanges = useMemo(() => {
		const now = new Date();
		const date1M = new Date(
			now.getFullYear(),
			now.getMonth() - 1,
			now.getDate(),
		);
		const date3M = new Date(
			now.getFullYear(),
			now.getMonth() - 3,
			now.getDate(),
		);
		const date6M = new Date(
			now.getFullYear(),
			now.getMonth() - 6,
			now.getDate(),
		);

		return {
			"1M": true,
			"3M": oldestSnapshotDate < date1M,
			"6M": oldestSnapshotDate < date3M,
			YTD:
				oldestSnapshotDate.getFullYear() < now.getFullYear() ||
				oldestSnapshotDate < date1M,
			MAX: true,
		};
	}, [oldestSnapshotDate]);

	const handleTimeRangeChange = (range: string) => {
		const typedRange = range as TimeRangeMode;
		if (timeRange === typedRange || !availableRanges[typedRange]) return;
		setIsCalculating(true);
		setTimeout(() => {
			setTimeRange(typedRange);
			setIsCalculating(false);
		}, 300);
	};

	const handleFilterModeChange = (mode: string) => {
		const typedMode = mode as FilterMode;
		if (filterMode === typedMode) return;
		setIsCalculating(true);
		setTimeout(() => {
			setFilterMode(typedMode);
			setIsCalculating(false);
		}, 300);
	};

	const isCrypto = (a: { category?: string }) => a.category === "CRYPTO";
	const isBooster = (a: { category?: string }) => a.category === "BOOSTER";

	const hasCrypto = assets.some(isCrypto);
	const hasStocks = assets.some(isBooster);
	const showPills = hasCrypto && hasStocks;

	const chartData = useMemo(() => {
		const filteredAssets = assets.filter((a) =>
			filterMode === "ALL"
				? true
				: filterMode === "CRYPTO"
					? isCrypto(a)
					: isBooster(a),
		);
		const filteredTxs = transactions.filter((t) =>
			filterMode === "ALL"
				? true
				: filterMode === "CRYPTO"
					? isCrypto(t)
					: isBooster(t),
		);

		if (filteredAssets.length === 0 || snapshotsData.length === 0) return [];

		const currentLiveValue = filteredAssets.reduce(
			(sum, a) => sum + Number(a.currentValue),
			0,
		);
		const totalInvested = filteredAssets.reduce(
			(sum, a) => sum + Number(a.investedCapital),
			0,
		);
		const targetTotalPnL = currentLiveValue - totalInvested;

		const cashFlowsByDate: Record<string, number> = {};
		filteredTxs.forEach((tx) => {
			const dateStr = new Date(tx.executedAt).toISOString().split("T")[0];
			if (!cashFlowsByDate[dateStr]) cashFlowsByDate[dateStr] = 0;
			if (tx.type === "BUY" || tx.type === "DEPOSIT")
				cashFlowsByDate[dateStr] += Math.abs(tx.executedValue);
			if (tx.type === "SELL")
				cashFlowsByDate[dateStr] -= Math.abs(tx.executedValue);
		});

		// 🚀 NOWOŚĆ: Obliczamy kapitał zdeponowany ZANIM pojawił się pierwszy zrzut bazy
		const firstSnapDateStr = snapshotsData[0].date.split("T")[0];
		let initialCapitalBeforeSnapshots = 0;
		Object.keys(cashFlowsByDate).forEach((dateStr) => {
			if (dateStr < firstSnapDateStr) {
				initialCapitalBeforeSnapshots += cashFlowsByDate[dateStr];
			}
		});

		let sumEstimatedPnL = 0;
		let runningInvestedForEstimation = initialCapitalBeforeSnapshots;
		let activeDaysCount = 0;

		const alphaRatio =
			currentLiveValue /
			(snapshotsData[snapshotsData.length - 1]?.globalTotalValue || 1);

		const preliminaryTimeline = snapshotsData.map((snap) => {
			const dateStr = snap.date.split("T")[0];
			const cf = cashFlowsByDate[dateStr] || 0;

			runningInvestedForEstimation += cf;

			// ELIMINACJA FAKE-SPADKÓW:
			// Jeśli w danym dniu była transakcja (BUY/SELL/DEPOSIT), ignorujemy
			// zniekształcony odczyt z bazy (globalChangePLN) i zakładamy neutralny rynek.

			const isTransactionDay = Math.abs(cf) > 10;

			const estimatedPnL =
				runningInvestedForEstimation > 0 && !isTransactionDay
					? snap.globalChangePLN * alphaRatio
					: 0;

			if (runningInvestedForEstimation > 0) {
				sumEstimatedPnL += estimatedPnL;
				activeDaysCount++;
			}

			return {
				date: dateStr,
				cf,
				estimatedPnL,
				isActive: runningInvestedForEstimation > 0,
			};
		});

		const pnlDifference = targetTotalPnL - sumEstimatedPnL;
		const dailyCorrection =
			activeDaysCount > 0 ? pnlDifference / activeDaysCount : 0;

		const timeline: Array<{
			date: string;
			totalPortfolioValue: number;
			netCashFlow: number;
			exactChangePLN: number;
		}> = [];
		let runningValue = initialCapitalBeforeSnapshots;

		preliminaryTimeline.forEach((day) => {
			const finalDailyPnL = day.isActive
				? day.estimatedPnL + dailyCorrection
				: 0;
			runningValue += day.cf + finalDailyPnL;

			timeline.push({
				date: day.date,
				totalPortfolioValue: runningValue,
				netCashFlow: day.cf,
				exactChangePLN: finalDailyPnL,
			});
		});

		if (timeline.length > 0) {
			timeline[timeline.length - 1].totalPortfolioValue = currentLiveValue;
		}

		const now = new Date();
		let cutoff = new Date(0);
		if (timeRange === "1M") cutoff = new Date(now.setMonth(now.getMonth() - 1));
		else if (timeRange === "3M")
			cutoff = new Date(now.setMonth(now.getMonth() - 3));
		else if (timeRange === "6M")
			cutoff = new Date(now.setMonth(now.getMonth() - 6));
		else if (timeRange === "YTD") cutoff = new Date(now.getFullYear(), 0, 1);

		return timeline.filter((t) => new Date(t.date) >= cutoff);
	}, [filterMode, timeRange, assets, transactions, snapshotsData]);

	return (
		//  Kontener bez narzuconej wysokości 'h-xxx', pozwalający flexowi swobodnie oddychać na mobile.
		<div className="mt-6 flex flex-col bg-t-bg-panel border border-t-border rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden gap-4">
			{/* NAKŁADKA ŁADUJĄCA (Spinner) z precyzyjnym z-index */}
			{isCalculating && (
				<div className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center rounded-2xl">
					<div className="flex flex-col items-center gap-3 bg-slate-900/90 border border-slate-700/50 p-4 rounded-2xl shadow-2xl">
						<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
						<span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
							Przeliczanie...
						</span>
					</div>
				</div>
			)}

			<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
				<div className="flex items-center flex-wrap gap-2">
					<span className="hidden sm:flex text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 items-center gap-1.5">
						<Calendar className="w-3.5 h-3.5" /> Zakres:
					</span>
					{(["1M", "3M", "6M", "YTD", "MAX"] as const).map((range) => {
						const isAvailable = availableRanges[range];
						return (
							<div
								key={range}
								className={cn(
									!isAvailable && "opacity-40 grayscale pointer-events-none",
								)}
							>
								<FilterBadge
									id={range}
									label={range}
									isSelected={timeRange === range}
									onToggle={handleTimeRangeChange}
								/>
							</div>
						);
					})}
				</div>

				{showPills && (
					<div className="flex items-center flex-wrap gap-2">
						<span className="hidden sm:flex text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 items-center gap-1.5">
							<Filter className="w-3.5 h-3.5" /> Aktywa:
						</span>
						<FilterBadge
							id="ALL"
							label="Całość"
							isSelected={filterMode === "ALL"}
							onToggle={handleFilterModeChange}
						/>
						<FilterBadge
							id="STOCKS"
							label="Akcje"
							isSelected={filterMode === "STOCKS"}
							onToggle={handleFilterModeChange}
						/>
						<FilterBadge
							id="CRYPTO"
							label="Krypto"
							isSelected={filterMode === "CRYPTO"}
							onToggle={handleFilterModeChange}
						/>
					</div>
				)}
			</div>

			{/*  Twarda wysokość nałożona wyłącznie na ten div pod wykresem, zabezpieczająca go przed zniknięciem! */}
			<div className="relative w-full h-[350px] sm:h-[400px]">
				<AbsoluteDailyPnLChart data={chartData} />
			</div>
		</div>
	);
}

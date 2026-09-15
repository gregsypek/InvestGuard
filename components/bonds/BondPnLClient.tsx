"use client";

import { Calendar, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { AbsoluteDailyPnLChart } from "../dashboard/AbsoluteDailyPnLChart";
import { FilterBadge } from "../shared/FilterBadge";
import { cn } from "@/lib/utils";

interface BondPnLClientProps {
	snapshotsData: any[]; // Zostawiamy w interfejsie, żeby nie zepsuć page_2.tsx, ale nie będziemy tego używać!
	transactions: any[];
	assets: any[];
}

export function BondPnLClient({ transactions, assets }: BondPnLClientProps) {
	const [timeRange, setTimeRange] = useState<
		"1M" | "3M" | "6M" | "YTD" | "MAX"
	>("1M");
	const [isCalculating, setIsCalculating] = useState(false);

	// 1. Zamiast szukać pierwszego zrzutu bazy, szukamy NAJSTARSZEJ TRANSAKCJI
	const oldestTransactionDate = useMemo(() => {
		const bondTxs = transactions.filter((t) => t.category === "BONDS");
		if (bondTxs.length === 0) {
			const d = new Date();
			d.setMonth(d.getMonth() - 1);
			return d;
		}
		const timestamps = bondTxs.map((t) => new Date(t.executedAt).getTime());
		return new Date(Math.min(...timestamps));
	}, [transactions]);

	// 2. Filtry odblokowują się teraz na podstawie prawdziwej historii wpłat
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
		const startOfYear = new Date(now.getFullYear(), 0, 1);

		return {
			"1M": true,
			"3M": oldestTransactionDate < date1M,
			"6M": oldestTransactionDate < date3M,
			YTD: oldestTransactionDate < startOfYear,
			MAX: true,
		};
	}, [oldestTransactionDate]);

	const handleTimeRangeChange = (range: any) => {
		if (timeRange === range || !(availableRanges as any)[range]) return;
		setIsCalculating(true);
		setTimeout(() => {
			setTimeRange(range);
			setIsCalculating(false);
		}, 300);
	};

	const chartData = useMemo(() => {
		const bondAssets = assets.filter((a) => a.category === "BONDS");
		const bondTxs = transactions.filter((t) => t.category === "BONDS");

		if (bondAssets.length === 0) return [];

		// Docelowy zysk z nagłówka (całkowity zysk wygenerowany od początku historii)
		const currentLiveValue = bondAssets.reduce(
			(sum, a) => sum + Number(a.currentValue),
			0,
		);
		const totalInvested = bondAssets.reduce(
			(sum, a) => sum + Number(a.investedCapital),
			0,
		);
		const targetTotalPnL = currentLiveValue - totalInvested;

		// Mapujemy historię przepływów (wpłaty / wypłaty) do słownika po datach
		const cashFlowsByDate: Record<string, number> = {};
		bondTxs.forEach((tx) => {
			const dateStr = new Date(tx.executedAt).toISOString().split("T")[0];
			if (!cashFlowsByDate[dateStr]) cashFlowsByDate[dateStr] = 0;
			if (tx.type === "BUY" || tx.type === "DEPOSIT")
				cashFlowsByDate[dateStr] += Math.abs(tx.executedValue);
			if (tx.type === "SELL")
				cashFlowsByDate[dateStr] -= Math.abs(tx.executedValue);
		});

		// Tworzymy pełną, ciągłą oś czasu od PIERWSZEJ TRANSAKCJI do DZIŚ
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const startDate = new Date(oldestTransactionDate);
		startDate.setHours(0, 0, 0, 0);

		const dates: string[] = [];
		for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
			dates.push(d.toISOString().split("T")[0]);
		}

		// Spacer w przód nr 1: Badamy, ile kapitału pracowało każdego dnia
		let runningCapital = 0;
		let sumOfInvestedDays = 0;
		const activeCapitalByDate: Record<string, number> = {};

		dates.forEach((dateStr) => {
			runningCapital += cashFlowsByDate[dateStr] || 0;
			const activeCapital = runningCapital > 0 ? runningCapital : 0;
			activeCapitalByDate[dateStr] = activeCapital;
			sumOfInvestedDays += activeCapital;
		});

		// Spacer w przód nr 2: Rozdzielamy całkowity zysk proporcjonalnie na całą wyrysowaną historię
		const timeline: any[] = [];
		let runningValue = 0;

		dates.forEach((dateStr) => {
			const cf = cashFlowsByDate[dateStr] || 0;
			const activeCapital = activeCapitalByDate[dateStr];

			// Magia uśredniania zysku (zaledwie ułamek procenta dziennie)
			const dailyInterest =
				sumOfInvestedDays > 0
					? targetTotalPnL * (activeCapital / sumOfInvestedDays)
					: 0;

			runningValue += cf + dailyInterest;

			timeline.push({
				date: dateStr,
				totalPortfolioValue: runningValue,
				netCashFlow: cf,
				exactChangePLN: dailyInterest,
			});
		});

		// Wyrównanie drobnych błędów zaokrągleń (floating point) dla dzisiejszego dnia
		if (timeline.length > 0) {
			timeline[timeline.length - 1].totalPortfolioValue = currentLiveValue;
		}

		// Cięcie dat dla widoków (1M, 3M, 6M itp.)
		const now = new Date();
		let cutoff = new Date(0);
		if (timeRange === "1M") cutoff = new Date(now.setMonth(now.getMonth() - 1));
		else if (timeRange === "3M")
			cutoff = new Date(now.setMonth(now.getMonth() - 3));
		else if (timeRange === "6M")
			cutoff = new Date(now.setMonth(now.getMonth() - 6));
		else if (timeRange === "YTD") cutoff = new Date(now.getFullYear(), 0, 1);

		return timeline.filter((t) => new Date(t.date) >= cutoff);
	}, [timeRange, assets, transactions, oldestTransactionDate]);

	return (
		<div className="h-[450px] mt-6 flex flex-col bg-t-bg-panel border border-t-border rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden">
			{isCalculating && (
				<div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
					<div className="flex flex-col items-center gap-3 bg-slate-900/90 border border-slate-700/50 p-4 rounded-2xl shadow-2xl">
						<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
						<span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
							Przeliczanie...
						</span>
					</div>
				</div>
			)}
			<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
				<div className="flex items-center flex-wrap gap-2">
					<span className="hidden sm:flex text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 items-center gap-1.5">
						<Calendar className="w-3.5 h-3.5" /> Zakres:
					</span>
					{(["1M", "3M", "6M", "YTD", "MAX"] as const).map((range) => (
						<div
							key={range}
							className={cn(
								!availableRanges[range] &&
									"opacity-40 grayscale pointer-events-none",
							)}
						>
							<FilterBadge
								id={range}
								label={range}
								isSelected={timeRange === range}
								onToggle={() => handleTimeRangeChange(range)}
							/>
						</div>
					))}
				</div>
			</div>
			<div className="relative flex-1 min-h-0">
				<AbsoluteDailyPnLChart data={chartData} />
			</div>
		</div>
	);
}

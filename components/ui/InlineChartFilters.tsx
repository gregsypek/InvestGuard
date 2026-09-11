"use client";

import { differenceInDays, startOfYear } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DatePickerWithRange } from "../shared/DatePickerWithRange";
import { FilterBadge } from "../shared/FilterBadge";
import { Info } from "lucide-react";
import { PortfolioWithAssets } from "@/lib/types";
import { useChartContext } from "../providers/ChartProvider";
import { useEffect } from "react";

export function InlineChartFilters({
	portfolios,
	oldestRealSnapshotDate,
	showModeToggle = true,
	showPortfolioSelector = true, // 👈 Flaga włączająca pigułki portfeli
}: {
	portfolios: PortfolioWithAssets[];
	oldestRealSnapshotDate?: Date;
	showModeToggle?: boolean;
	showPortfolioSelector?: boolean;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParamsRaw = useSearchParams();
	// Zaciągamy stany z kontekstu (w tym selectedIds i togglePortfolio do pigułek)
	const {
		chartMode,
		setChartMode,
		dataMode,
		setDataMode,
		activeRange,
		handleRangeChange,
		fromDate,
		toDate,
		handleDateRangeSelect,
		selectedIds,
		togglePortfolio,
	} = useChartContext();

	const isRangeDisabledForReal = (range: string) => {
		if (dataMode === "SIMULATED" || !oldestRealSnapshotDate) return false;

		const oldestDate = new Date(oldestRealSnapshotDate);
		if (isNaN(oldestDate.getTime())) return false;

		const daysAvailable = differenceInDays(new Date(), oldestDate);

		switch (range) {
			case "1M":
				return daysAvailable < 7;
			case "3M":
				return daysAvailable < 30;
			case "YTD":
				const daysSinceYearStart = differenceInDays(
					new Date(),
					startOfYear(new Date()),
				);
				return daysAvailable < daysSinceYearStart;
			case "1Y":
				return daysAvailable < 90;
			case "3Y":
				return daysAvailable < 365;
			case "5Y":
				return daysAvailable < 1095;
			default:
				return false;
		}
	};

	useEffect(() => {
		if (!oldestRealSnapshotDate) return;

		const daysAvailable = differenceInDays(
			new Date(),
			new Date(oldestRealSnapshotDate),
		);

		if (daysAvailable > 2) {
			setDataMode("REAL");
		} else {
			setDataMode("SIMULATED");
		}
	}, [oldestRealSnapshotDate, setDataMode]);

	return (
		<div className="flex flex-col gap-4 mb-4">
			{/* ROW 1: Pigułki Portfeli (jeśli włączone) + Tryb PLN/% oraz Źródło Danych */}
			<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
				{/* LEWA STRONA: Pigułki wyboru portfeli */}
				{/* {showPortfolioSelector && portfolios.length > 0 && (
					<div className="flex flex-wrap items-center gap-2">
						<FilterBadge
							id="ALL"
							label="Wszystkie"
							isSelected={selectedIds.includes("ALL")}
							onToggle={() => togglePortfolio("ALL")}
						/>
						{portfolios.map((p) => (
							<FilterBadge
								key={p.id}
								id={p.id}
								label={p.name}
								isSelected={selectedIds.includes(p.id)}
								onToggle={() => togglePortfolio(p.id)}
							/>
						))}
					</div>
				)} */}
				{showPortfolioSelector && portfolios.length > 0 && (
					<div className="flex flex-1 xl:flex-none xl:w-56 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors overflow-hidden">
						<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
							Portfel:
						</span>
						<select
							value={selectedIds[0] || "ALL"}
							onChange={(e) => {
								const newId = e.target.value;
								const params = new URLSearchParams(searchParamsRaw.toString());
								if (newId === "ALL") params.delete("portfolio");
								else params.set("portfolio", newId);
								router.push(`${pathname}?${params.toString()}`);
							}}
							className="w-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
						>
							<option value="ALL" className="bg-t-bg-panel">
								Wszystkie
							</option>
							{portfolios.map((p) => (
								<option key={p.id} value={p.id} className="bg-t-bg-panel">
									{p.name}
								</option>
							))}
						</select>
					</div>
				)}

				{/* PRAWA STRONA: PLN/% oraz Realne/Symulacja */}
				<div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end ml-auto">
					{showModeToggle && (
						<div className="flex items-center gap-2">
							<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
								Wartość:
							</span>
							<FilterBadge
								id="VALUE"
								label="PLN"
								isSelected={chartMode === "VALUE"}
								onToggle={() => setChartMode("VALUE")}
							/>
							<FilterBadge
								id="PERCENTAGE"
								label="%"
								isSelected={chartMode === "PERCENTAGE"}
								onToggle={() => setChartMode("PERCENTAGE")}
							/>
						</div>
					)}

					<div className="flex items-center gap-2 relative">
						<div className="group flex items-center gap-1 cursor-help">
							<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
								Dane:
							</span>
							<Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 transition-colors" />

							<div className="absolute bottom-full right-0 mb-2 w-64 p-2.5 bg-slate-800 border border-slate-700/60 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
								<p className="text-[10px] text-slate-300 leading-relaxed">
									<strong className="text-white block mb-0.5">Realne:</strong>
									Wykres bazuje na zrzutach wycen zapisanych w bazie danych.
								</p>
								<div className="h-px w-full bg-slate-700/50 my-1.5" />
								<p className="text-[10px] text-slate-300 leading-relaxed">
									<strong className="text-white block mb-0.5">
										Symulacja:
									</strong>
									Wykres generowany wstecznie na podstawie historii transakcji.
								</p>
							</div>
						</div>
						<FilterBadge
							id="REAL"
							label="Realne"
							isSelected={dataMode === "REAL"}
							onToggle={() => setDataMode("REAL")}
						/>
						<FilterBadge
							id="SIMULATED"
							label="Symulacja"
							isSelected={dataMode === "SIMULATED"}
							onToggle={() => setDataMode("SIMULATED")}
						/>
					</div>
				</div>
			</div>

			{/* ROW 2: Zakres Dat + Kalendarz */}
			<div className="flex flex-row items-center justify-end gap-2 sm:gap-3">
				<div className="flex flex-1 sm:flex-none sm:w-56 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors overflow-hidden">
					<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
						Zakres:
					</span>
					<select
						value={activeRange}
						onChange={(e) => handleRangeChange(e.target.value)}
						className="w-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
					>
						{["1W", "1M", "3M", "YTD", "1Y", "3Y", "5Y", "MAX", "CUSTOM"].map(
							(range) => {
								const isDisabled = isRangeDisabledForReal(range);

								return (
									<option
										key={range}
										value={range}
										disabled={isDisabled}
										className={
											isDisabled
												? "bg-t-bg-panel text-slate-600 opacity-50"
												: "bg-t-bg-panel"
										}
									>
										{range} {isDisabled ? "(Brak danych)" : ""}
									</option>
								);
							},
						)}
					</select>
				</div>
				<div className="shrink-0">
					<DatePickerWithRange
						from={fromDate}
						to={toDate}
						onSelect={handleDateRangeSelect}
					/>
				</div>
			</div>
		</div>
	);
}

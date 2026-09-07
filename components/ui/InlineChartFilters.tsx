"use client";

import { differenceInDays, startOfYear } from "date-fns";

import { DatePickerWithRange } from "../shared/DatePickerWithRange";
import { FilterBadge } from "../shared/FilterBadge";
import { Info } from "lucide-react";
import { PortfolioWithAssets } from "@/lib/types";
import { useChartContext } from "../providers/ChartProvider";

export function InlineChartFilters({
	portfolios,
	oldestRealSnapshotDate,
}: {
	portfolios: PortfolioWithAssets[];
	oldestRealSnapshotDate?: Date;
}) {
	// 1. Zaciągamy dodatkowo stany kalendarza z kontekstu
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
	} = useChartContext();

	// 1. LOGIKA SPRAWDZANIA DOSTĘPNOŚCI DLA TRYBU 'REAL'
	const isRangeDisabledForReal = (range: string) => {
		// Jeśli tryb to symulacja albo brak daty bazowej - nie blokujemy
		if (dataMode === "SIMULATED" || !oldestRealSnapshotDate) return false;

		// Bezpieczne parsowanie daty (Next.js może przekazać string z serwera)
		const oldestDate = new Date(oldestRealSnapshotDate);
		console.log("🚀 ~ isRangeDisabledForReal ~ oldestDate:", oldestDate);
		if (isNaN(oldestDate.getTime())) return false;

		const daysAvailable = differenceInDays(new Date(), oldestDate);
		console.log("🚀 ~ isRangeDisabledForReal ~ daysAvailable:", daysAvailable);

		// Nowe, bardziej rygorystyczne progi blokowania:
		switch (range) {
			case "1M":
				return daysAvailable < 7; // Wymaga min. tygodnia danych
			case "3M":
				return daysAvailable < 30; // Wymaga min. miesiąca
			case "YTD":
				// Zablokuj YTD, jeśli od początku roku minęło więcej dni niż mamy w bazie
				// (np. mamy wrzesień, więc YTD to 250 dni. Mamy 16 dni danych = blokujemy)
				const daysSinceYearStart = differenceInDays(
					new Date(),
					startOfYear(new Date()),
				);
				return daysAvailable < daysSinceYearStart;
			case "1Y":
				return daysAvailable < 90; // Wymaga min. 3 miesięcy (90 dni)
			case "3Y":
				return daysAvailable < 365; // Wymaga min. 1 roku
			case "5Y":
				return daysAvailable < 1095; // Wymaga min. 3 lat
			default:
				return false; // 1W, MAX, CUSTOM są zawsze aktywne
		}
	};

	return (
		<div className="flex flex-col gap-4 mb-4">
			{/* ROW 1: Tryb PLN/% oraz Źródło Danych (Realne/Symulacja) */}
			<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
				{/* Ponieważ usunęliśmy pigułki portfeli, wyrównujemy ten kontener do prawej lub rozciągamy */}
				<div className="flex flex-wrap items-center gap-4 w-full justify-end">
					{/* PLN / PERCENTAGE Toggle */}
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

					{/* REAL / SIMULATED Toggle z Tooltipem */}
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
									Zrzuty są zapisywane od momentu utworzenia portfela kadego
									dnia po godzinie 23:59. Jeśli portfel został utworzony w ciągu
									dnia, pierwszy zrzut zostanie zapisany dopiero następnego
									dnia.{" "}
								</p>
								<div className="h-px w-full bg-slate-700/50 my-1.5" />
								<p className="text-[10px] text-slate-300 leading-relaxed">
									<strong className="text-white block mb-0.5">
										Symulacja:
									</strong>
									Wykres generowany wstecznie na podstawie historii Twoich
									transakcji.
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
			<div className="flex flex-row items-center gap-2 sm:gap-3">
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
								// 2. WYWOŁANIE BLOKADY
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
				{/* 3. Komponent kalendarza wpięty tuż obok selektora */}
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

"use client";

import {
	ChevronDown,
	ChevronRight,
	FileText,
	ListPlus,
	Loader2,
	Plus,
	Search,
	Trash2,
	TrendingUp,
} from "lucide-react";
import {
	addMultipleBondConfigs,
	addMultipleInflationRates,
	deleteBondConfig,
	deleteInflationRate,
	getBondConfigs,
	getInflationRates,
} from "@/lib/actions/admin-bonds";
import { useCallback, useEffect, useState, useTransition } from "react";

import { InflationRate } from "@prisma/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function BondsAdminPanel() {
	// ZAMIAST: const [isPending, startTransition] = useTransition();
	const [isPendingInf, startTransitionInf] = useTransition();
	const [isPendingBond, startTransitionBond] = useTransition();
	const [inflationRates, setInflationRates] = useState<any[]>([]);
	const [bondConfigs, setBondConfigs] = useState<any[]>([]);

	// --- SEARCH AND VIEW STATES ---
	const [infSearch, setInfSearch] = useState("");
	const [bondSearch, setBondSearch] = useState("");
	const [openInfYears, setOpenInfYears] = useState<string[]>([]);
	const [openBondGroups, setOpenBondGroups] = useState<string[]>([]);

	// NEW: Toggle state for Bond grouping mode
	const [bondGroupMode, setBondGroupMode] = useState<"YEAR" | "TYPE">("YEAR");

	// --- MASS ENTRY STATES ---
	const [newInflations, setNewInflations] = useState([
		{ id: Date.now(), yearMonth: "", value: "" },
	]);
	const [newConfigs, setNewConfigs] = useState([
		{ id: Date.now(), seriesCode: "", firstYearRate: "", margin: "" },
	]);

	const loadData = useCallback(() => {
		Promise.all([getInflationRates(), getBondConfigs()]).then(([inf, conf]) => {
			const sortedInf = inf.sort((a, b) =>
				b.yearMonth.localeCompare(a.yearMonth),
			);
			setInflationRates(sortedInf);
			setBondConfigs(conf);
		});
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// ==========================================
	// MASS ENTRY SAVE LOGIC
	// ==========================================
	const handleSaveBulkInflation = () => {
		const validData = newInflations
			.filter((item) => item.yearMonth.length >= 7 && item.value !== "")
			.map((item) => ({
				yearMonth: item.yearMonth,
				value: Number(item.value),
			}));

		if (validData.length === 0)
			return toast.error("Brak poprawnych danych do zapisu.");

		startTransitionInf(async () => {
			const res = await addMultipleInflationRates(validData);
			if (res.success) {
				toast.success(`Zapisano ${validData.length} odczytów inflacji.`);
				setNewInflations([{ id: Date.now(), yearMonth: "", value: "" }]);
				loadData();
			} else {
				toast.error(res.error);
			}
		});
	};

	const handleSaveBulkConfigs = () => {
		const validData = newConfigs
			.filter(
				(item) => item.seriesCode.length >= 3 && item.firstYearRate !== "",
			)
			.map((item) => ({
				seriesCode: item.seriesCode.toUpperCase(),
				firstYearRate: Number(item.firstYearRate),
				margin: item.margin ? Number(item.margin) : null,
			}));

		if (validData.length === 0)
			return toast.error("Brak poprawnych danych do zapisu.");

		startTransitionBond(async () => {
			const res = await addMultipleBondConfigs(validData);
			if (res.success) {
				toast.success(`Zapisano ${validData.length} konfiguracji serii.`);
				setNewConfigs([
					{ id: Date.now(), seriesCode: "", firstYearRate: "", margin: "" },
				]);
				loadData();
			} else {
				toast.error(res.error);
			}
		});
	};

	// ==========================================
	// INFLATION: GROUPING & SEARCH
	// ==========================================
	const filteredInflation = inflationRates.filter((inf) =>
		inf.yearMonth.includes(infSearch),
	);
	const groupedInflation = filteredInflation.reduce(
		(acc, inf) => {
			const year = inf.yearMonth.substring(0, 4);
			if (!acc[year]) acc[year] = [];
			acc[year].push(inf);
			return acc;
		},
		{} as Record<string, any[]>,
	);
	const sortedInfYears = Object.keys(groupedInflation).sort((a, b) =>
		b.localeCompare(a),
	);

	const toggleInfYear = (year: string) =>
		setOpenInfYears((p) =>
			p.includes(year) ? p.filter((y) => y !== year) : [...p, year],
		);

	// ==========================================
	// BONDS: DYNAMIC GROUPING & SEARCH
	// ==========================================
	const filteredBonds = bondConfigs.filter((conf) =>
		conf.seriesCode.toLowerCase().includes(bondSearch.toLowerCase()),
	);

	// Grouping logic depends on the selected mode
	const groupedBonds = filteredBonds.reduce(
		(acc, conf) => {
			let groupKey = "INNE";

			if (bondGroupMode === "YEAR") {
				const match = conf.seriesCode.match(/[A-Z]+(\d{2})(\d{2})/i);
				groupKey = match ? `20${match[2]}` : "INNE";
			} else {
				groupKey = conf.seriesCode.substring(0, 3).toUpperCase();
			}

			if (!acc[groupKey]) acc[groupKey] = [];
			acc[groupKey].push(conf);
			return acc;
		},
		{} as Record<string, any[]>,
	);

	// Sort keys differently based on mode (Years descending, Types ascending)
	const sortedBondGroups = Object.keys(groupedBonds).sort((a, b) => {
		if (bondGroupMode === "YEAR") return b.localeCompare(a);
		return a.localeCompare(b);
	});

	const toggleBondGroup = (key: string) =>
		setOpenBondGroups((p) =>
			p.includes(key) ? p.filter((k) => k !== key) : [...p, key],
		);

	const inputStyles =
		"h-9 bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-blue-500 rounded-lg px-2 text-xs font-mono font-medium text-t-text-primary outline-none transition-colors";

	return (
		<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
			{/* ======================= */}
			{/* PANEL 1: INFLACJA GUS */}
			{/* ======================= */}
			<div className="flex flex-col bg-t-bg-panel border border-t-border rounded-2xl shadow-sm overflow-hidden h-[700px]">
				<div className="p-5 border-b border-t-border-subtle bg-black/5 dark:bg-white/5">
					<div className="flex items-center gap-3 mb-4">
						<TrendingUp className="w-5 h-5 text-rose-500" />
						<div>
							<h3 className="text-sm font-black uppercase tracking-widest text-t-text-primary">
								Miesięcznik Inflacji GUS
							</h3>
							<p className="text-[10px] text-t-text-tertiary uppercase tracking-widest mt-0.5">
								Dodawaj odczyty zbiorczo (YYYY-MM)
							</p>
						</div>
					</div>

					<div className="space-y-2 mb-3">
						{newInflations.map((item, index) => (
							<div key={item.id} className="flex gap-2 items-center">
								<input
									type="text"
									placeholder="YYYY-MM (np. 2026-07)"
									value={item.yearMonth}
									onChange={(e) => {
										const newArr = [...newInflations];
										newArr[index].yearMonth = e.target.value.toUpperCase();
										setNewInflations(newArr);
									}}
									className={cn(inputStyles, "flex-1")}
								/>
								<input
									type="number"
									step="0.01"
									placeholder="Inflacja %"
									value={item.value}
									onChange={(e) => {
										const newArr = [...newInflations];
										newArr[index].value = e.target.value;
										setNewInflations(newArr);
									}}
									className={cn(inputStyles, "w-28")}
								/>
								<button
									onClick={() =>
										setNewInflations(
											newInflations.filter((x) => x.id !== item.id),
										)
									}
									className="p-2 text-t-text-tertiary hover:text-rose-500 transition-colors rounded-lg"
								>
									<Trash2 size={16} />
								</button>
							</div>
						))}
					</div>
					<div className="flex gap-2">
						<button
							onClick={() =>
								setNewInflations([
									...newInflations,
									{ id: Date.now(), yearMonth: "", value: "" },
								])
							}
							className="flex-1 flex justify-center items-center gap-2 h-9 border border-dashed border-t-border-subtle hover:border-blue-500 hover:text-blue-500 text-t-text-tertiary rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
						>
							<Plus size={14} /> Dodaj Wiersz
						</button>
						<button
							onClick={handleSaveBulkInflation}
							disabled={isPendingInf}
							className="flex-1 flex justify-center items-center gap-2 h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
						>
							{isPendingInf ? (
								<Loader2 size={14} className="animate-spin" />
							) : (
								<ListPlus size={14} />
							)}
							Zapisz Wszystko
						</button>
					</div>
				</div>

				<div className="p-4 border-b border-t-border-subtle">
					<div className="relative w-full">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-t-text-tertiary" />
						<input
							type="text"
							placeholder="Szukaj po roku lub miesiącu..."
							value={infSearch}
							onChange={(e) => setInfSearch(e.target.value)}
							className={cn(inputStyles, "w-full pl-9")}
						/>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
					{sortedInfYears.map((year) => (
						<div
							key={year}
							className="border border-t-border-subtle rounded-xl overflow-hidden"
						>
							<button
								onClick={() => toggleInfYear(year)}
								className="w-full flex justify-between items-center bg-black/5 dark:bg-white/5 p-3 text-xs font-bold text-t-text-primary transition-colors hover:bg-t-hover"
							>
								<div className="flex items-center gap-2">
									{openInfYears.includes(year) ? (
										<ChevronDown size={16} className="text-blue-500" />
									) : (
										<ChevronRight size={16} className="text-blue-500" />
									)}
									ROK {year}
								</div>
								<span className="text-[10px] text-t-text-tertiary uppercase tracking-widest">
									{groupedInflation[year].length} wpisów
								</span>
							</button>
							{openInfYears.includes(year) && (
								<div className="flex flex-col">
									{groupedInflation[year].map((inf: InflationRate) => (
										<div
											key={inf.id}
											className="flex justify-between items-center p-3 border-t border-t-border-subtle hover:bg-t-hover transition-colors"
										>
											<span className="font-mono text-xs font-bold text-t-text-secondary">
												{inf.yearMonth}
											</span>
											<div className="flex items-center gap-4">
												<span className="font-mono text-sm font-black text-rose-500">
													{inf.value}%
												</span>
												<button
													onClick={() => {
														deleteInflationRate(inf.id);
														loadData();
													}}
													className="text-t-text-tertiary hover:text-rose-500 transition-colors"
												>
													<Trash2 size={14} />
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* ======================= */}
			{/* PANEL 2: LISTY EMISYJNE */}
			{/* ======================= */}
			<div className="flex flex-col bg-t-bg-panel border border-t-border rounded-2xl shadow-sm overflow-hidden h-[700px]">
				<div className="p-5 border-b border-t-border-subtle bg-black/5 dark:bg-white/5">
					<div className="flex items-center gap-3 mb-4">
						<FileText className="w-5 h-5 text-emerald-500" />
						<div>
							<h3 className="text-sm font-black uppercase tracking-widest text-t-text-primary">
								Katalog Listów Emisyjnych
							</h3>
							<p className="text-[10px] text-t-text-tertiary uppercase tracking-widest mt-0.5">
								Szybkie wprowadzanie konfiguracji serii
							</p>
						</div>
					</div>

					<div className="space-y-2 mb-3">
						{newConfigs.map((item, index) => (
							<div key={item.id} className="flex gap-2 flex-wrap items-center">
								<input
									type="text"
									placeholder="Seria np. EDO1035"
									value={item.seriesCode}
									onChange={(e) => {
										const newArr = [...newConfigs];
										newArr[index].seriesCode = e.target.value.toUpperCase();
										setNewConfigs(newArr);
									}}
									className={cn(inputStyles, "flex-[3]")}
								/>
								<input
									type="number"
									step="0.01"
									placeholder="1. rok %"
									value={item.firstYearRate}
									onChange={(e) => {
										const newArr = [...newConfigs];
										newArr[index].firstYearRate = e.target.value;
										setNewConfigs(newArr);
									}}
									className={cn(inputStyles, "flex-[2]")}
								/>
								<input
									type="number"
									step="0.01"
									placeholder="Marża %"
									title="Marża (dla DOS/TOS pozostaw puste)"
									value={item.margin}
									onChange={(e) => {
										const newArr = [...newConfigs];
										newArr[index].margin = e.target.value;
										setNewConfigs(newArr);
									}}
									className={cn(inputStyles, "flex-[2]")}
								/>
								<button
									onClick={() =>
										setNewConfigs(newConfigs.filter((x) => x.id !== item.id))
									}
									className="p-2 text-t-text-tertiary hover:text-rose-500 transition-colors rounded-lg shrink-0"
								>
									<Trash2 size={16} />
								</button>
							</div>
						))}
					</div>
					<div className="flex gap-2">
						<button
							onClick={() =>
								setNewConfigs([
									...newConfigs,
									{
										id: Date.now(),
										seriesCode: "",
										firstYearRate: "",
										margin: "",
									},
								])
							}
							className="flex-1 flex justify-center items-center gap-2 h-9 border border-dashed border-t-border-subtle hover:border-emerald-500 hover:text-emerald-500 text-t-text-tertiary rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
						>
							<Plus size={14} /> Dodaj Wiersz
						</button>
						<button
							onClick={handleSaveBulkConfigs}
							disabled={isPendingBond}
							className="flex-1 flex justify-center items-center gap-2 h-9 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
						>
							{isPendingBond ? (
								<Loader2 size={14} className="animate-spin" />
							) : (
								<ListPlus size={14} />
							)}
							Zapisz Wszystko
						</button>
					</div>
				</div>

				<div className="p-4 border-b border-t-border-subtle flex flex-col sm:flex-row sm:items-center gap-3">
					<div className="relative flex-1 w-full">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-t-text-tertiary" />
						<input
							type="text"
							placeholder="Szukaj po roku (2025) lub kodzie (EDO)..."
							value={bondSearch}
							onChange={(e) => setBondSearch(e.target.value)}
							className={cn(inputStyles, "w-full pl-9")}
						/>
					</div>

					{/* TOGGLE GROUPING MODE */}
					<div className="flex items-center bg-black/10 dark:bg-white/5 p-1 rounded-lg shrink-0">
						<button
							onClick={() => setBondGroupMode("YEAR")}
							className={cn(
								"px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
								bondGroupMode === "YEAR"
									? "bg-emerald-500/20 text-emerald-500"
									: "text-t-text-tertiary hover:text-t-text-secondary",
							)}
						>
							Wg Roku
						</button>
						<button
							onClick={() => setBondGroupMode("TYPE")}
							className={cn(
								"px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
								bondGroupMode === "TYPE"
									? "bg-emerald-500/20 text-emerald-500"
									: "text-t-text-tertiary hover:text-t-text-secondary",
							)}
						>
							Wg Typu
						</button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
					{sortedBondGroups.map((groupKey) => (
						<div
							key={groupKey}
							className="border border-t-border-subtle rounded-xl overflow-hidden"
						>
							<button
								onClick={() => toggleBondGroup(groupKey)}
								className="w-full flex justify-between items-center bg-black/5 dark:bg-white/5 p-3 text-xs font-bold text-t-text-primary transition-colors hover:bg-t-hover"
							>
								<div className="flex items-center gap-2">
									{openBondGroups.includes(groupKey) ? (
										<ChevronDown size={16} className="text-emerald-500" />
									) : (
										<ChevronRight size={16} className="text-emerald-500" />
									)}
									{bondGroupMode === "YEAR"
										? `ROK ZAPADALNOŚCI: ${groupKey}`
										: `TYP OBLIGACJI: ${groupKey}`}
								</div>
								<span className="text-[10px] text-t-text-tertiary uppercase tracking-widest">
									{groupedBonds[groupKey].length} serii
								</span>
							</button>
							{openBondGroups.includes(groupKey) && (
								<div className="flex flex-col">
									{groupedBonds[groupKey]
										.sort((a: any, b: any) =>
											b.seriesCode.localeCompare(a.seriesCode),
										)
										.map((conf: any) => (
											<div
												key={conf.id}
												className="flex justify-between items-center p-3 border-t border-t-border-subtle hover:bg-t-hover transition-colors"
											>
												<span className="font-mono text-xs font-bold text-t-text-primary bg-black/5 dark:bg-white/5 px-2 py-1 rounded border border-t-border-subtle">
													{conf.seriesCode}
												</span>
												<div className="flex items-center gap-4">
													<div className="flex flex-col items-end">
														<span className="font-mono text-xs font-bold text-t-text-primary">
															{conf.firstYearRate.toFixed(2)}%
														</span>
														<span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
															{conf.margin !== null
																? `Marża: ${conf.margin.toFixed(2)}%`
																: "Stałe (Brak marży)"}
														</span>
													</div>
													<button
														onClick={() => {
															deleteBondConfig(conf.id);
															loadData();
														}}
														className="text-t-text-tertiary hover:text-rose-500 transition-colors"
													>
														<Trash2 size={14} />
													</button>
												</div>
											</div>
										))}
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

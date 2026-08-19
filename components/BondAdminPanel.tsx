"use client";

import {
	FileText,
	FolderOpen,
	Loader2,
	PlusCircle,
	Trash2,
	TrendingUp,
} from "lucide-react";
import {
	addBondConfig,
	addInflationRate,
	deleteBondConfig,
	deleteInflationRate,
	getBondConfigs,
	getInflationRates,
} from "@/lib/actions/admin-bonds";
import { useCallback, useEffect, useState, useTransition } from "react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function BondsAdminPanel() {
	const [isPending, startTransition] = useTransition();
	const [inflationRates, setInflationRates] = useState<any[]>([]);
	const [bondConfigs, setBondConfigs] = useState<any[]>([]);

	// 🚀 FIX 2: Zgodny z zasadami Reacta sposób ładowania danych
	// Używamy useCallback i .then() aby uniknąć błędów ESLint o kaskadowym renderowaniu
	const loadData = useCallback(() => {
		Promise.all([getInflationRates(), getBondConfigs()]).then(([inf, conf]) => {
			// Sortowanie inflacji
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

	const handleAddInflation = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.currentTarget;
		const formData = new FormData(form);
		startTransition(async () => {
			const res = await addInflationRate(formData);
			if (res.success) {
				toast.success("Zapisano odczyt GUS.");
				// form.reset();
				loadData(); // Odświeżamy nową metodą
			} else {
				toast.error(res.error);
			}
		});
	};

	const handleAddConfig = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.currentTarget;
		const formData = new FormData(form);
		startTransition(async () => {
			const res = await addBondConfig(formData);
			if (res.success) {
				toast.success("Zapisano konfigurację serii.");
				// form.reset();
				loadData(); // Odświeżamy nową metodą
			} else {
				toast.error(res.error);
			}
		});
	};

	const inputStyles =
		"h-10 w-full bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-blue-500 rounded-lg px-3 text-xs font-medium text-t-text-primary transition-colors focus:outline-none";

	// =======================================
	// LOGIKA GRUPOWANIA SERII (EDO, COI, itp.)
	// =======================================
	const groupedConfigs = bondConfigs.reduce(
		(acc, conf) => {
			const prefix = conf.seriesCode.substring(0, 3).toUpperCase();
			if (!acc[prefix]) acc[prefix] = [];
			acc[prefix].push(conf);
			return acc;
		},
		{} as Record<string, any[]>,
	);

	// 🚀 FIX 1: Zaawansowane sortowanie CHRONOLOGICZNE (Lata -> Miesiące)
	Object.keys(groupedConfigs).forEach((prefix) => {
		groupedConfigs[prefix].sort(
			(a: { seriesCode: string }, b: { seriesCode: string }) => {
				// Wyciągamy miesiąc (mm) i rok (yy) ze stringa np. EDO0835 -> mm: 8, yy: 35
				const parseDate = (code: string) => {
					const match = code.match(/[A-Z]+(\d{2})(\d{2})/i);
					if (match) {
						return { mm: parseInt(match[1], 10), yy: parseInt(match[2], 10) };
					}
					return { mm: 99, yy: 99 };
				};

				const dateA = parseDate(a.seriesCode);
				const dateB = parseDate(b.seriesCode);

				// Jeśli lata są różne, sortujemy po latach (np. 35 przed 36)
				if (dateA.yy !== dateB.yy) {
					return dateA.yy - dateB.yy;
				}
				// Jeśli rok ten sam, sortujemy po miesiącach (np. 07 przed 08)
				return dateA.mm - dateB.mm;
			},
		);
	});

	const sortedPrefixes = Object.keys(groupedConfigs).sort();

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
			{/* ======================================= */}
			{/* 1. INFLACJA GUS */}
			{/* ======================================= */}
			<div className="bg-t-bg-panel border border-t-border-subtle rounded-2xl p-6 flex flex-col h-[500px]">
				<div className="flex items-center gap-2 mb-4 border-b border-t-border-subtle pb-4 shrink-0">
					<TrendingUp className="w-5 h-5 text-blue-500" />
					<div>
						<h3 className="text-sm font-black uppercase tracking-widest text-t-text-primary">
							Wskaźniki GUS
						</h3>
						<p className="text-[10px] text-t-text-tertiary">
							Miesiąc poprzedzający rocznicę (2 m-ce wstecz).
						</p>
					</div>
				</div>

				<form
					onSubmit={handleAddInflation}
					className="flex gap-2 mb-4 shrink-0"
				>
					<input
						name="yearMonth"
						type="text"
						placeholder="YYYY-MM (np. 2026-06)"
						required
						className={cn(inputStyles, "flex-1 font-mono uppercase")}
					/>
					<input
						name="value"
						type="number"
						step="0.01"
						placeholder="Inflacja %"
						required
						className={cn(inputStyles, "w-24 font-mono")}
					/>
					<button
						type="submit"
						disabled={isPending}
						className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 flex items-center justify-center transition-colors"
					>
						{isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<PlusCircle className="w-4 h-4" />
						)}
					</button>
				</form>

				<div className="flex-1 overflow-y-auto custom-scrollbar border border-t-border-subtle rounded-xl bg-black/5 dark:bg-white/5">
					{inflationRates.length === 0 && (
						<div className="p-4 text-center text-xs text-t-text-tertiary mt-10">
							Brak dodanych wskaźników.
						</div>
					)}
					{inflationRates.map((inf) => (
						<div
							key={inf.id}
							className="flex justify-between items-center p-3 border-b border-t-border-subtle last:border-0 hover:bg-t-hover transition-colors"
						>
							<span className="font-mono text-xs font-bold text-t-text-secondary">
								{inf.yearMonth}
							</span>
							<div className="flex items-center gap-4">
								<span className="font-mono text-sm font-black text-blue-500">
									{inf.value}%
								</span>
								<button
									onClick={() => {
										deleteInflationRate(inf.id);
										loadData();
									}}
									className="text-t-text-tertiary hover:text-rose-500 transition-colors p-1"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* ======================================= */}
			{/* 2. KONFIGURACJE SERII */}
			{/* ======================================= */}
			<div className="bg-t-bg-panel border border-t-border-subtle rounded-2xl p-6 flex flex-col h-[500px]">
				<div className="flex items-center gap-2 mb-4 border-b border-t-border-subtle pb-4 shrink-0">
					<FileText className="w-5 h-5 text-emerald-500" />
					<div>
						<h3 className="text-sm font-black uppercase tracking-widest text-t-text-primary">
							Listy Emisyjne
						</h3>
						<p className="text-[10px] text-t-text-tertiary">
							Dla DOS/TOS pole marży zostaw puste.
						</p>
					</div>
				</div>

				<form onSubmit={handleAddConfig} className="flex gap-2 mb-4 shrink-0">
					<input
						name="seriesCode"
						type="text"
						placeholder="Seria (np. EDO0836)"
						required
						className={cn(inputStyles, "flex-1 font-mono uppercase")}
					/>
					<input
						name="firstYearRate"
						type="number"
						step="0.01"
						placeholder="1. rok %"
						required
						className={cn(inputStyles, "w-20 font-mono")}
					/>
					<input
						name="margin"
						type="number"
						step="0.01"
						placeholder="Marża %"
						className={cn(inputStyles, "w-20 font-mono")}
					/>
					<button
						type="submit"
						disabled={isPending}
						className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 flex items-center justify-center transition-colors"
					>
						{isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<PlusCircle className="w-4 h-4" />
						)}
					</button>
				</form>

				<div className="flex-1 overflow-y-auto custom-scrollbar border border-t-border-subtle rounded-xl bg-black/5 dark:bg-white/5 space-y-4 p-2">
					{sortedPrefixes.length === 0 && (
						<div className="p-4 text-center text-xs text-t-text-tertiary mt-8">
							Brak dodanych serii.
						</div>
					)}

					{/* Grupowanie po typie obligacji */}
					{sortedPrefixes.map((prefix) => (
						<div
							key={prefix}
							className="bg-t-bg-base/50 rounded-lg overflow-hidden border border-t-border-subtle"
						>
							<div className="bg-t-bg-sticky px-3 py-2 border-b border-t-border-subtle flex items-center gap-2">
								<FolderOpen className="w-4 h-4 text-t-text-tertiary" />
								<span className="text-xs font-bold text-t-text-primary uppercase tracking-widest">
									Obligacje {prefix}
								</span>
							</div>
							<div>
								{groupedConfigs[prefix].map(
									(conf: {
										id: string;
										seriesCode: string;
										firstYearRate: number;
										margin: number | null;
									}) => (
										<div
											key={conf.id}
											className="flex justify-between items-center p-3 border-b border-t-border-subtle last:border-0 hover:bg-t-hover transition-colors"
										>
											<span className="font-mono text-[11px] font-bold text-t-text-secondary bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
												{conf.seriesCode}
											</span>
											<div className="flex items-center gap-4 text-xs font-mono font-bold">
												<div className="flex flex-col items-end">
													<span className="text-t-text-primary">
														{conf.firstYearRate.toFixed(2)}%
													</span>
													<span className="text-[9px] text-emerald-500 uppercase tracking-widest mt-0.5">
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
													className="text-t-text-tertiary hover:text-rose-500 transition-colors p-1"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</div>
									),
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// components/ui/BondImporter.tsx
"use client";

import * as XLSX from "xlsx";

import { AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { ParsedBond, parseBondRow } from "@/lib/utils/bond-parser";
import React, { ChangeEvent, useState } from "react";

import { BOND_DURATIONS } from "@/lib/constants";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { saveXtbTransaction } from "@/lib/actions/transactions";
import { syncPortfolioAssets } from "@/lib/actions/asset-actions";
import { toast } from "sonner";
import { updateImportedBondSpecs } from "@/lib/actions/bond-actions";
import { useRouter } from "next/navigation";

interface ExtendedParsedBond extends ParsedBond {
	purchaseDate?: Date;
	interestRate?: number;
}

export const BondImporter = ({ portfolioId }: { portfolioId: string }) => {
	const router = useRouter();
	const [preview, setPreview] = useState<ExtendedParsedBond[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
	// 🚀 NOWOŚĆ: Stan przełącznika (domyślnie włączony, by chronić gotówkę)
	const [autoFundCash, setAutoFundCash] = useState(true);
	// EN: Local fallback API dictionary providing latest Polish Treasury Bond interest rates
	const inferDefaultBondRate = (ticker: string): number => {
		const prefix = ticker.substring(0, 3).toUpperCase();
		const rates: Record<string, number> = {
			OTS: 3.0, // 3-month fixed
			ROR: 5.75, // 1-year floating
			DOR: 6.0, // 2-year floating
			TOS: 6.2, // 3-year fixed
			COI: 6.3, // 4-year inflation-indexed
			EDO: 6.55, // 10-year inflation-indexed
			ROS: 6.3, // 6-year family bond
			ROD: 6.55, // 12-year family bond
		};
		return rates[prefix] || 0;
	};

	const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setError(null);

		const reader = new FileReader();
		reader.onload = (evt: ProgressEvent<FileReader>) => {
			try {
				const bstr = evt.target?.result;
				if (!bstr) return;

				const wb = XLSX.read(bstr, { type: "array" });
				const ws = wb.Sheets[wb.SheetNames[0]];
				// EN: Typed as unknown records to fully deprecate implicit 'any' usage
				const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

				const parsed = data
					.map(parseBondRow)
					.filter((b): b is ExtendedParsedBond => b !== null);

				if (parsed.length === 0) {
					setError("Nie znaleziono poprawnych obligacji w pliku.");
					return;
				}

				setPreview(parsed);
				setSelectedIndices(parsed.map((_, i) => i));
			} catch (err: unknown) {
				console.error(err);
				setError("Wystąpił błąd podczas parsowania struktury arkusza.");
			}
		};
		reader.readAsArrayBuffer(file);
	};
	// EN: Executes segmented record creation allowing non-blocking duplicate omission
	const handleImport = async () => {
		if (selectedIndices.length === 0) return;

		setLoading(true);
		setError(null);
		let count = 0;
		let duplicateCount = 0;

		// 🚀 PL: Filtrujemy tylko wiersze wybrane przez użytkownika za pomocą checkboxów
		const dataToSave = preview.filter((_, i) => selectedIndices.includes(i));

		// 1. STAGE ONE: Log pure historical purchase transaction logs
		for (const bond of dataToSave) {
			try {
				const dateStr =
					bond.expiryDate instanceof Date
						? bond.expiryDate.toISOString().split("T")[0]
						: String(bond.expiryDate);

				const prefix = bond.ticker.substring(0, 3).toUpperCase();

				const durationYears = BOND_DURATIONS[prefix] || 10;

				const inferredPurchaseDate = new Date(bond.expiryDate);
				inferredPurchaseDate.setFullYear(
					inferredPurchaseDate.getFullYear() - durationYears,
				);

				const uniqueKey = `BOND_${bond.ticker}_${dateStr}`;

				const txPayload = {
					uniqueKey,
					type: "BUY" as const,
					assetName: `Obligacje ${bond.ticker}`,
					ticker: `${bond.ticker}_${dateStr}`,
					quantity: bond.quantity,
					date: bond.purchaseDate || inferredPurchaseDate,
					amountPLN: bond.investedValue, // 🚀 FIX: Zapisujemy czysty, nominalny wkład początkowy
					originalPrice:
						bond.quantity > 0 ? bond.investedValue / bond.quantity : 0,
					currency: "PLN",
					exchangeRate: 1,
					category: "BONDS" as const,
					comment: `Automatyczny import: Wykup ${dateStr}`,
				};

				// 🚀 NOWOŚĆ: Automatyczne zasilenie gotówki (jeśli switch jest włączony)
				if (autoFundCash) {
					const fundPayload = {
						uniqueKey: `BOND_FUND_${bond.ticker}_${dateStr}`, // Unikalny klucz wpłaty
						type: "DEPOSIT" as const,
						assetName: "Wpłata pod obligacje skarbowe",
						ticker: "CASH",
						quantity: bond.investedValue,
						date: bond.purchaseDate || inferredPurchaseDate,
						amountPLN: bond.investedValue,
						originalPrice: 1,
						currency: "PLN",
						exchangeRate: 1,
						category: "CASH" as const,
						comment: `Auto-zasilenie chroniące saldo dla ${bond.ticker}`,
					};

					try {
						// Zapisujemy wpłatę przed zakupem obligacji
						await saveXtbTransaction(fundPayload, portfolioId);
					} catch (fundErr: any) {
						// Ignorujemy błąd duplikatu dla wpłaty, jeśli już kiedyś ją dodano
						if (
							fundErr?.message?.toLowerCase().includes("istnieje") === false
						) {
							console.error("Błąd zapisu zasilenia:", fundErr);
						}
					}
				}

				await saveXtbTransaction(txPayload, portfolioId);
				count++;
			} catch (err: unknown) {
				console.error(err);
				const errMsg = err instanceof Error ? err.message : String(err);

				if (
					errMsg.toLowerCase().includes("unique") ||
					errMsg.toLowerCase().includes("duplicate") ||
					errMsg.toLowerCase().includes("istnieje") ||
					errMsg.toLowerCase().includes("dodane")
				) {
					duplicateCount++;
				} else {
					setLoading(false);
					toast.error("Wystąpił nieoczekiwany błąd podczas zapisu danych.");
					return;
				}
			}
		}

		// 2. STAGE TWO: Recalculate portfolio and push precise current asset metrics
		try {
			if (count > 0) {
				// EN: Build base asset entries from transaction logs
				await syncPortfolioAssets(portfolioId);

				// 🚀 FIX: Przepychamy aktualne wyceny i oprocentowanie bezpośrednio do tabeli aktywów
				for (const bond of dataToSave) {
					const dateStr =
						bond.expiryDate instanceof Date
							? bond.expiryDate.toISOString().split("T")[0]
							: String(bond.expiryDate);

					const fullTicker = `${bond.ticker}_${dateStr}`;
					const finalRate =
						bond.interestRate || inferDefaultBondRate(bond.ticker);

					await updateImportedBondSpecs(
						portfolioId,
						fullTicker,
						bond.currentValue,
						finalRate,
					);
				}

				toast.success(`Sukces! Zaimportowano ${count} obligacji.`);
			}

			// 🚀 PL: Zależnie od proporcji duplikatów, ustawiamy właściwy komunikat w boksie
			if (duplicateCount > 0 && count === 0) {
				setError(
					"Wybrane obligacje z tą datą i kwotą są już dodane w tym portfelu.",
				);
			} else if (duplicateCount > 0) {
				setError(
					`Zaimportowano ${count} obligacji. Pominięto ${duplicateCount} pozycji, które były już dodane w tym portfelu.`,
				);
			} else {
				setError(null);
			}

			setPreview([]);
			setSelectedIndices([]);
			router.refresh();
		} catch (err: unknown) {
			console.error(err);
			toast.error("Wystąpił błąd podczas synchronizacji końcowej portfela.");
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveRow = (index: number) => {
		setPreview((prev) => prev.filter((_, i) => i !== index));
		setSelectedIndices((prev) =>
			prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
		);
	};

	const toggleRow = (idx: number) => {
		setSelectedIndices((prev) =>
			prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
		);
	};

	const toggleAll = () => {
		if (selectedIndices.length === preview.length) {
			setSelectedIndices([]);
		} else {
			setSelectedIndices(preview.map((_, i) => i));
		}
	};

	const previewTotal = preview
		.filter((_, i) => selectedIndices.includes(i))
		.reduce((sum, b) => sum + b.currentValue, 0);

	return (
		<div className="flex flex-col gap-8 animate-in fade-in duration-300">
			{/* ========================================= */}
			{/* 1. STREFA WGRYWANIA (DROPZONE) */}
			{/* ========================================= */}
			<div className="relative group">
				<input
					type="file"
					onChange={handleFile}
					accept=".xlsx, .xls, .csv"
					className="hidden"
					id="bond-upload"
				/>
				<label
					htmlFor="bond-upload"
					className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-t-border-subtle hover:border-blue-500/50 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 transition-all cursor-pointer group"
				>
					<div className="mb-4 transition-transform group-hover:scale-105 group-active:scale-95 shadow-sm rounded-md overflow-hidden bg-white">
						<Image
							src="https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img/https://bank.pl/wp-content/uploads/2013/05/mf.obligacje.01.250x181.jpg"
							alt="Obligacje skarbowe"
							width={60}
							height={45}
							className="object-cover mix-blend-multiply"
						/>
					</div>
					<span className="text-xs font-bold text-t-text-primary uppercase tracking-wider">
						Wybierz lub upuść plik z obligacjami
					</span>
					<span className="text-[10px] text-t-text-tertiary uppercase mt-1.5 tracking-widest font-medium">
						Obsługiwane formaty: .XLS
					</span>
				</label>
			</div>

			{/* ========================================= */}
			{/* 2. KOMUNIKAT BŁĘDU */}
			{/* ========================================= */}
			{error && (
				<div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-500 text-xs font-bold uppercase tracking-wider animate-in slide-in-from-top-2">
					<AlertTriangle className="h-5 w-5 shrink-0" />
					{error}
				</div>
			)}

			{/* ========================================= */}
			{/* 3. TABELA PODGLĄDU I WERYFIKACJI */}
			{/* ========================================= */}
			{preview.length > 0 && (
				<div className="border border-t-border rounded-2xl bg-t-bg-panel shadow-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-500">
					{/* Wrapper przewijalny dla samej tabeli */}
					<div className="overflow-x-auto no-scrollbar">
						<table className="w-full text-sm text-left">
							<thead className="bg-t-bg-sticky border-b border-t-border-subtle">
								<tr>
									<th className="p-4 w-12 text-center">
										<input
											type="checkbox"
											checked={
												selectedIndices.length === preview.length &&
												preview.length > 0
											}
											onChange={toggleAll}
											className="rounded border-t-border-subtle text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer bg-black/5 dark:bg-white/5"
										/>
									</th>
									<th className="p-4 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
										Emisja
									</th>
									<th className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
										Ilość
									</th>
									<th className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary whitespace-nowrap">
										Wartość Inwestowana
									</th>
									<th className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary whitespace-nowrap">
										Wartość Bieżąca
									</th>
									<th className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
										Data Wykupu
									</th>
									<th className="p-4 w-12 text-right"></th>
								</tr>
							</thead>
							<tbody>
								{preview.map((b, i) => {
									const isSelected = selectedIndices.includes(i);
									const isEven = i % 2 === 1;

									return (
										<tr
											key={i}
											className={cn(
												"border-b border-t-border-subtle transition-all",
												!isSelected && "opacity-40 grayscale", // Wyciszenie odznaczonych
												isSelected &&
													isEven &&
													"bg-t-bg-base/30 dark:bg-black/20", // Paski zebry dla zaznaczonych
												isSelected && !isEven && "hover:bg-t-hover",
											)}
										>
											<td className="p-4 text-center">
												<input
													type="checkbox"
													checked={isSelected}
													onChange={() => toggleRow(i)}
													className="rounded border-t-border-subtle text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer bg-black/5 dark:bg-white/5"
												/>
											</td>
											<td className="p-4 font-bold text-sm text-t-text-primary whitespace-nowrap">
												{b.ticker}
											</td>
											<td className="p-4 text-right">
												<div className="font-mono text-sm text-t-text-secondary whitespace-nowrap">
													{b.quantity}
													<span className="text-[10px] text-t-text-tertiary ml-1">
														SZT
													</span>
												</div>
											</td>
											<td className="p-4 text-right">
												<div className="font-mono text-sm text-t-text-secondary whitespace-nowrap">
													{b.investedValue.toLocaleString("pl-PL", {
														minimumFractionDigits: 2,
													})}
													<span className="text-[10px] text-t-text-tertiary ml-1">
														PLN
													</span>
												</div>
											</td>
											<td className="p-4 text-right">
												<div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
													{b.currentValue.toLocaleString("pl-PL", {
														minimumFractionDigits: 2,
													})}
													<span className="text-[10px] text-blue-600/50 dark:text-blue-400/50 ml-1">
														PLN
													</span>
												</div>
											</td>
											<td className="p-4 text-center text-[11px] font-bold tracking-widest uppercase text-t-text-tertiary whitespace-nowrap">
												{b.expiryDate.toLocaleDateString("pl-PL")}
											</td>
											<td className="p-4 text-right">
												<button
													onClick={() => handleRemoveRow(i)}
													className="p-2 text-t-text-tertiary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
													title="Usuń wiersz"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
							{/* Podsumowanie tabeli */}
							<tfoot>
								<tr className="bg-black/5 dark:bg-white/5">
									<td
										colSpan={4}
										className="p-4 text-[10px] uppercase tracking-widest text-t-text-secondary font-bold text-right border-t border-t-border-subtle"
									>
										Łącznie wybrane:
									</td>
									<td className="p-4 text-right border-t border-t-border-subtle">
										<div className="font-mono font-black text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
											{previewTotal.toLocaleString("pl-PL", {
												minimumFractionDigits: 2,
											})}
											<span className="text-[10px] text-blue-600/50 dark:text-blue-400/50 ml-1">
												PLN
											</span>
										</div>
									</td>
									<td colSpan={2} className="border-t border-t-border-subtle" />
								</tr>
							</tfoot>
						</table>
					</div>

					{/* ========================================= */}
					{/* 4. PASEK AKCJI (FOOTER TABELI) */}
					{/* ========================================= */}
					<div className="p-6 bg-t-bg-base/30 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-t-border-subtle">
						{/* <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
							<p className="text-[11px] font-black uppercase tracking-widest text-t-text-primary">
								Wybrano:{" "}
								<span className="text-blue-500">{selectedIndices.length}</span>{" "}
								z {preview.length}
							</p>
							<p className="text-[10px] text-t-text-tertiary uppercase tracking-widest font-bold mt-1">
								Tylko zaznaczone obligacje zostaną dodane do portfela.
							</p>
						</div> */}

						{/* ========================================= */}
						{/* 4. PASEK AKCJI (FOOTER TABELI) */}
						{/* ========================================= */}
						<div className="p-6 bg-t-bg-base/30 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-t-border-subtle">
							<div className="flex flex-col items-center sm:items-start text-center sm:text-left">
								<p className="text-[11px] font-black uppercase tracking-widest text-t-text-primary">
									Wybrano:{" "}
									<span className="text-blue-500">
										{selectedIndices.length}
									</span>{" "}
									z {preview.length}
								</p>
								<p className="text-[10px] text-t-text-tertiary uppercase tracking-widest font-bold mt-1">
									Tylko zaznaczone obligacje zostaną dodane do portfela.
								</p>

								{/* 🚀 NOWOŚĆ: Nasz Switch / Checkbox */}
								<label className="flex items-center gap-2 mt-3 cursor-pointer group">
									<input
										type="checkbox"
										checked={autoFundCash}
										onChange={(e) => setAutoFundCash(e.target.checked)}
										className="rounded border-t-border-subtle text-blue-600 focus:ring-blue-500 h-4 w-4 bg-black/5 dark:bg-white/5 cursor-pointer"
									/>
									<span className="text-[10px] uppercase tracking-widest font-bold text-t-text-secondary group-hover:text-t-text-primary transition-colors">
										Automatycznie zaksięguj wpłatę gotówki (chroni obecne saldo)
									</span>
								</label>
							</div>
						</div>

						<button
							onClick={handleImport}
							disabled={loading || selectedIndices.length === 0}
							className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px] disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
						>
							{loading ? (
								<span className="flex items-center gap-2">
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									Importowanie...
								</span>
							) : (
								<>
									<CheckCircle className="h-4 w-4" />
									Zatwierdź Wybrane
								</>
							)}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

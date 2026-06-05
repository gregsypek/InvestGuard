// components/ui/XtbImporter.tsx
"use client";

import * as XLSX from "xlsx";

import { AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { ParsedXtbTransaction, parseXtbRow } from "@/lib/utils/xtb-parser";
import React, { useState } from "react";

import { Category } from "@prisma/client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { inferTickersCategories } from "@/lib/actions/portfolio.actions";
import { saveXtbTransaction } from "@/lib/actions/transactions";
import { syncPortfolioAssets } from "@/lib/actions/asset-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const XtbImporter = ({ portfolioId }: { portfolioId: string }) => {
	const [previewData, setPreviewData] = useState<ParsedXtbTransaction[]>([]);
	const [isImporting, setIsImporting] = useState(false);
	const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	// 1. Logika wczytywania i parowania danych
	// Zwróć uwagę na słówko "async" dopisane do eventu:
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setError(null);
		const reader = new FileReader();

		// 🚀 ZMIANA 1: Zmieniamy na async, żeby móc poczekać na bazę danych
		reader.onload = async (event: ProgressEvent<FileReader>) => {
			try {
				// EN: Get the raw ArrayBuffer from the reader
				// PL: Pobieramy surowy ArrayBuffer z czytnika
				const data = event.target?.result;
				if (!data) return;

				// EN: Use type: "array" for raw ArrayBuffer - most stable for browser XLSX
				// PL: Używamy type: "array" bezpośrednio na ArrayBuffer - najstabilniejsza metoda
				const workbook = XLSX.read(data, {
					type: "array",
					cellDates: true,
				});

				// EN: Locate the specific sheet for cash operations
				// PL: Lokalizujemy arkusz z operacjami gotówkowymi
				const sheetName = workbook.SheetNames.find((n) =>
					n.toLowerCase().startsWith("cash operat"),
				);

				if (!sheetName) {
					setError(
						"Nie znaleziono arkusza 'Cash Operations'! Upewnij się, że to raport XTB.",
					);
					return;
				}

				const worksheet = workbook.Sheets[sheetName];

				// EN: Convert worksheet to raw rows typed safely as multidimensional unknown array
				// PL: Konwertujemy arkusz na surowe wiersze z bezpiecznym typowaniem unknown[][] zamiast any[][]
				const rowsRaw = XLSX.utils.sheet_to_json(worksheet, {
					header: 1,
				}) as unknown[][];

				const headerIndex = rowsRaw.findIndex(
					(r) => Array.isArray(r) && (r.includes("Type") || r.includes("Typ")),
				);

				if (headerIndex === -1) {
					setError("Nie znaleziono nagłówków (Type/Typ) w arkuszu.");
					return;
				}

				// EN: Parse actual data rows typed as native object records
				// PL: Parsujemy dane właściwe zaczynając od headerIndex otypowane bezpiecznie
				const rows = XLSX.utils.sheet_to_json(worksheet, {
					range: headerIndex,
				}) as Record<string, unknown>[];

				const parsed = rows
					.map((r) => parseXtbRow(r))
					.filter(Boolean) as ParsedXtbTransaction[];

				if (parsed.length === 0) {
					setError("Nie znaleziono poprawnych transakcji w pliku.");
					return;
				}

				// EN: Merge commissions and swap costs by position ID
				// PL: Scalamy prowizje i koszty swapu po ID pozycji
				const groupedData = parsed.reduce(
					(acc: ParsedXtbTransaction[], current: ParsedXtbTransaction) => {
						if (!current.positionId) {
							acc.push(current);
							return acc;
						}

						const existingIdx = acc.findIndex(
							(item) => item.positionId === current.positionId,
						);

						if (existingIdx > -1) {
							acc[existingIdx].amountPLN += current.amountPLN;
							// EN: Ensure we don't lose the ticker during merge
							// PL: Upewniamy się, że nie zgubimy tickera podczas scalania
							if (!acc[existingIdx].ticker && current.ticker) {
								acc[existingIdx].ticker = current.ticker;
								acc[existingIdx].assetName = current.assetName;
							}
						} else {
							acc.push(current);
						}
						return acc;
					},
					[],
				);

				// 🚀 ZMIANA 2: TUTAJ WCHODZI NASZA NOWA LOGIKA UCZENIA SIĘ

				// EN: Extract unique tickers from the grouped data
				// PL: 1. Pobieramy unikalne tickery z pogrupowanych danych
				const uniqueTickers = Array.from(
					new Set(groupedData.map((tx) => tx.ticker).filter(Boolean)),
				) as string[];

				// EN: Fetch learned categories from the database
				// PL: 2. Pobieramy z bazy zapamiętane kategorie dla tych tickerów
				const learnedCategories = await inferTickersCategories(
					uniqueTickers,
					portfolioId,
				);

				// EN: Override parsed categories with learned ones
				// PL: 3. Nadpisujemy kategorie tymi wyciągniętymi z bazy
				const formattedPreview = groupedData.map((tx) => {
					if (tx.ticker && learnedCategories[tx.ticker]) {
						return { ...tx, category: learnedCategories[tx.ticker] };
					}
					return tx;
				});

				// 🚀 ZMIANA 3: Używamy 'formattedPreview' zamiast starego 'groupedData'
				setPreviewData(formattedPreview);
				setSelectedIndices(formattedPreview.map((_, i) => i));
			} catch (err: unknown) {
				setError("Błąd podczas odczytu pliku Excel.");
				console.error("Błąd podczas odczytu pliku Excel:", err);
				alert(
					"Nie udało się odczytać pliku. Spróbuj otworzyć go w Excelu i zapisać ponownie jako .xlsx",
				);
			}
		};

		reader.readAsArrayBuffer(file);
	};
	// 2. Funkcje zarządzania podglądem
	const handleRemoveRow = (index: number) => {
		setPreviewData((prev) => prev.filter((_, i) => i !== index));
		setSelectedIndices((prev) =>
			prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
		);
	};

	const handleChangeCategory = (index: number, newCat: Category) => {
		setPreviewData((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], category: newCat };
			return updated;
		});
	};

	const handleFinalImport = async () => {
		if (selectedIndices.length === 0) return;

		setIsImporting(true);
		setError(null);
		let count = 0;
		let duplicateCount = 0;

		// 🚀 FILTR: Bierzemy tylko te wiersze, których indeksy są w selectedIndices
		const dataToSave = previewData.filter((_, i) =>
			selectedIndices.includes(i),
		);

		for (const tx of dataToSave) {
			try {
				// 🚀 EN: Inner try-catch ensures that one duplicate doesn't abort the remaining loop items
				// 🚀 PL: Wewnętrzny try-catch sprawia, że jeden duplikat nie przerywa sprawdzania reszty listy
				await saveXtbTransaction(tx, portfolioId);
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
					setIsImporting(false);
					toast.error("Wystąpił nieoczekiwany błąd podczas zapisywania.");
					return;
				}
			}
		}

		try {
			if (count > 0) {
				await syncPortfolioAssets(portfolioId);
				toast.success(`Sukces! Zaimportowano ${count} transakcji.`);
			}

			// 🚀 EN: Set non-blocking error view summary after the complete processing sequence finishes
			// 🚀 PL: Ustawiamy podsumowanie błędów na dole po zakończeniu przetwarzania całej pętli
			if (duplicateCount > 0 && count === 0) {
				setError(
					"Wybrane aktywo z tą datą i kwotą jest już dodane w tym portfelu.",
				);
			} else if (duplicateCount > 0) {
				setError(
					`Zaimportowano ${count} transakcji. Pominięto ${duplicateCount} pozycji, które były już dodane w tym portfelu.`,
				);
			} else {
				setError(null);
			}

			setPreviewData([]);
			setSelectedIndices([]);
			router.refresh();
		} catch {
			toast.error("Wystąpił błąd podczas synchronizacji portfela.");
		} finally {
			setIsImporting(false);
		}
	};

	const toggleRow = (idx: number) => {
		setSelectedIndices((prev) =>
			prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
		);
	};

	const toggleAll = () => {
		if (selectedIndices.length === previewData.length) {
			setSelectedIndices([]);
		} else {
			setSelectedIndices(previewData.map((_, i) => i));
		}
	};

	return (
		<div className="flex flex-col gap-8 animate-in fade-in duration-300">
			{/* ========================================= */}
			{/* 1. STREFA WGRYWANIA (DROPZONE) */}
			{/* ========================================= */}
			<div className="relative group">
				<input
					type="file"
					onChange={handleFileUpload}
					accept=".xlsx, .xls, .csv"
					className="hidden"
					id="xtb-upload"
				/>
				<label
					htmlFor="xtb-upload"
					className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-t-border-subtle hover:border-blue-500/50 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 transition-all cursor-pointer group"
				>
					<div className="mb-4 transition-transform group-hover:scale-105 group-active:scale-95 shadow-sm rounded-md overflow-hidden">
						<Image
							src={"/xtb.png"}
							alt={"XTB"}
							width={50}
							height={50}
							className="object-cover"
						/>
					</div>
					<span className="text-xs font-bold text-t-text-primary uppercase tracking-wider">
						Wybierz lub upuść raport XTB
					</span>
					<span className="text-[10px] text-t-text-tertiary uppercase mt-1.5 tracking-widest font-medium">
						Obsługiwane formaty: .XLSX
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
			{previewData.length > 0 && (
				<div className="border border-t-border rounded-2xl bg-t-bg-panel shadow-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-500">
					{/* Wrapper przewijalny dla samej tabeli */}
					<div className="overflow-x-auto no-scrollbar">
						<table className="w-full text-sm text-left">
							<thead className="bg-t-bg-sticky border-b border-t-border-subtle">
								<tr>
									<th className="p-4 w-12 text-center">
										<input
											type="checkbox"
											checked={selectedIndices.length === previewData.length}
											onChange={toggleAll}
											className="rounded border-t-border-subtle text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer bg-black/5 dark:bg-white/5"
										/>
									</th>
									<th className="p-4 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary whitespace-nowrap">
										Data
									</th>
									<th className="p-4 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
										Aktywo
									</th>
									<th className="p-4 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
										Kategoria
									</th>
									<th className="p-4 text-right text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary whitespace-nowrap">
										Kwota
									</th>
									<th className="p-4 w-12 text-right"></th>
								</tr>
							</thead>
							<tbody>
								{previewData.map((tx, idx) => {
									const isSelected = selectedIndices.includes(idx);
									const isEven = idx % 2 === 1;

									return (
										<tr
											key={idx}
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
													onChange={() => toggleRow(idx)}
													className="rounded border-t-border-subtle text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer bg-black/5 dark:bg-white/5"
												/>
											</td>
											<td className="p-4 text-[11px] font-bold tracking-widest uppercase text-t-text-secondary whitespace-nowrap">
												{new Date(tx.date).toLocaleDateString("pl-PL")}
											</td>
											<td className="p-4">
												<div className="font-bold text-sm text-t-text-primary whitespace-nowrap">
													{tx.assetName}
												</div>
												<div className="text-[10px] text-t-text-tertiary font-mono uppercase tracking-widest mt-0.5">
													{tx.ticker}
												</div>
											</td>
											<td className="p-4">
												<select
													disabled={!isSelected}
													value={tx.category}
													onChange={(e) =>
														handleChangeCategory(
															idx,
															e.target.value as Category,
														)
													}
													className="h-9 bg-black/5 dark:bg-t-bg-base border border-t-border-subtle rounded-lg px-3 py-1 text-xs font-bold text-t-text-secondary focus:border-blue-500 outline-none disabled:opacity-50 transition-colors uppercase tracking-wider cursor-pointer"
												>
													{Object.values(Category).map((c) => (
														<option key={c} value={c}>
															{c}
														</option>
													))}
												</select>
											</td>
											<td className="p-4 text-right">
												<div className="font-mono font-bold text-sm text-t-text-primary whitespace-nowrap">
													{tx.amountPLN.toLocaleString("pl-PL", {
														minimumFractionDigits: 2,
													})}
													<span className="text-[10px] text-t-text-tertiary ml-1">
														PLN
													</span>
												</div>
											</td>
											<td className="p-4 text-right">
												<button
													onClick={() => handleRemoveRow(idx)}
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
						</table>
					</div>

					{/* ========================================= */}
					{/* 4. PASEK AKCJI (FOOTER TABELI) */}
					{/* ========================================= */}
					<div className="p-6 bg-t-bg-base/30 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-t-border-subtle">
						<div className="flex flex-col items-center sm:items-start text-center sm:text-left">
							<p className="text-[11px] font-black uppercase tracking-widest text-t-text-primary">
								Wybrano:{" "}
								<span className="text-blue-500">{selectedIndices.length}</span>{" "}
								z {previewData.length}
							</p>
							<p className="text-[10px] text-t-text-tertiary uppercase tracking-widest font-bold mt-1">
								Tylko zaznaczone transakcje zostaną dodane do portfela.
							</p>
						</div>

						<button
							onClick={handleFinalImport}
							disabled={isImporting || selectedIndices.length === 0}
							className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px] disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
						>
							{isImporting ? (
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

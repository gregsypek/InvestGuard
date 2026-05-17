// components/ui/XtbImporter.tsx
"use client";

import * as XLSX from "xlsx";

import { AlertTriangle, CheckCircle, FileUp, Trash2 } from "lucide-react";
import { ParsedXtbTransaction, parseXtbRow } from "@/lib/utils/xtb-parser";
import React, { useState } from "react";

import { Category } from "@prisma/client";
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
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setError(null);
		const reader = new FileReader();

		reader.onload = (event: ProgressEvent<FileReader>) => {
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

				setPreviewData(groupedData);
				setSelectedIndices(parsed.map((_, i) => i));
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

	// 3. Renderowanie interfejsu
	return (
		<div className="flex flex-col gap-6">
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
					className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-border/50 rounded-3xl bg-card/30 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer group"
				>
					<div className="bg-primary/10 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
						<FileUp className="h-6 w-6 text-primary" />
					</div>
					<span className="text-sm font-bold tracking-tight">
						Wybierz raport XTB
					</span>
					<span className="text-[10px] text-muted-foreground uppercase mt-1 tracking-widest">
						Obsługiwane: .XLSX
					</span>
				</label>
			</div>

			{error && (
				<div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 border-dashed rounded-2xl text-destructive text-xs text-red-600">
					<AlertTriangle className="h-4 w-4" />
					{error}
				</div>
			)}

			{previewData.length > 0 && (
				<div className="mt-6 overflow-x-auto border rounded-2xl bg-card shadow-xl overflow-hidden">
					<table className="w-full text-sm text-left">
						<thead className="bg-muted/50 border-b">
							<tr>
								<th className="p-4 w-10">
									<input
										type="checkbox"
										checked={selectedIndices.length === previewData.length}
										onChange={toggleAll}
										className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
									/>
								</th>
								<th className="p-4 font-bold uppercase text-[10px] tracking-wider opacity-60">
									Data
								</th>
								<th className="p-4 font-bold uppercase text-[10px] tracking-wider opacity-60">
									Aktywo
								</th>
								<th className="p-4 font-bold uppercase text-[10px] tracking-wider opacity-60">
									Kategoria
								</th>
								<th className="p-4 font-bold uppercase text-[10px] tracking-wider opacity-60">
									Kwota
								</th>
								<th className="p-4 w-10"></th>
							</tr>
						</thead>
						<tbody>
							{previewData.map((tx, idx) => {
								const isSelected = selectedIndices.includes(idx);
								return (
									<tr
										key={idx}
										className={`border-t border-border/50 transition-colors ${
											isSelected ? "bg-primary/5" : "opacity-50 grayscale-[0.5]"
										}`}
									>
										<td className="p-4">
											<input
												type="checkbox"
												checked={isSelected}
												onChange={() => toggleRow(idx)}
												className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
											/>
										</td>
										<td className="p-4 text-muted-foreground font-medium">
											{new Date(tx.date).toLocaleDateString("pl-PL")}
										</td>
										<td className="p-4">
											<div
												className={`font-bold transition-all ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
											>
												{tx.assetName}
											</div>
											<div className="text-[10px] text-muted-foreground font-mono opacity-70">
												{tx.ticker}
											</div>
										</td>
										<td className="p-4">
											<select
												disabled={!isSelected}
												value={tx.category}
												onChange={(e) =>
													handleChangeCategory(idx, e.target.value as Category)
												}
												className="bg-background border border-border/50 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
											>
												{Object.values(Category).map((c) => (
													<option key={c} value={c}>
														{c}
													</option>
												))}
											</select>
										</td>
										<td
											className={`p-4 font-mono font-bold ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
										>
											{tx.amountPLN.toLocaleString("pl-PL", {
												minimumFractionDigits: 2,
											})}{" "}
											PLN
										</td>
										<td className="p-4">
											<button
												onClick={() => handleRemoveRow(idx)}
												className="text-destructive/50 hover:text-destructive transition-all hover:scale-110"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>

					<div className="p-4 bg-muted/10 flex justify-between items-center border-t border-border/50">
						<div className="flex flex-col">
							<p className="text-[11px] font-bold uppercase tracking-widest text-primary">
								Wybrano: {selectedIndices.length} z {previewData.length}
							</p>
							<p className="text-[10px] text-muted-foreground italic mt-0.5">
								Tylko zaznaczone transakcje zostaną zapisane w bazie.
							</p>
						</div>

						<button
							onClick={handleFinalImport}
							disabled={isImporting || selectedIndices.length === 0}
							className="flex items-center gap-2 bg-primary text-white px-10 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-30 disabled:grayscale shadow-lg shadow-primary/20 transition-all active:scale-95"
						>
							<CheckCircle className="h-4 w-4" />
							{isImporting ? "Importowanie..." : `Zatwierdź Wybrane`}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

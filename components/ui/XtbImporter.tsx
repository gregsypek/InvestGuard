// components/ui/XtbImporter.tsx
"use client";

import * as XLSX from "xlsx";

import { CheckCircle, Trash2 } from "lucide-react";
import { ParsedXtbTransaction, parseXtbRow } from "@/lib/utils/xtb-parser";
import React, { useState } from "react";

import { Category } from "@prisma/client";
import { saveXtbTransaction } from "@/lib/actions/transactions";
import { syncPortfolioAssets } from "@/lib/actions/asset-actions";

export const XtbImporter = ({ portfolioId }: { portfolioId: string }) => {
	const [previewData, setPreviewData] = useState<ParsedXtbTransaction[]>([]);
	const [isImporting, setIsImporting] = useState(false);

	// 1. Logika wczytywania i parowania danych
	// 1. Logika wczytywania i parowania danych
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();

		reader.onload = (event) => {
			try {
				// EN: Get the raw ArrayBuffer from the reader
				// PL: Pobieramy surowy ArrayBuffer z czytnika
				const data = event.target?.result;
				if (!data) return;

				// EN: Use type: "array" for raw ArrayBuffer - most stable for browser XLSX
				// PL: Używamy type: "array" bezpośrednio na ArrayBuffer - najstabilniejsza metoda
				const workbook = XLSX.read(data, {
					// type: "array",
					type: "binary", // 🚀 ZMIANA NA BINARY
					cellDates: true,
				});

				// EN: Locate the specific sheet for cash operations
				// PL: Lokalizujemy arkusz z operacjami gotówkowymi
				const sheetName = workbook.SheetNames.find((n) =>
					n.toLowerCase().startsWith("cash operat"),
				);

				if (!sheetName) {
					return alert(
						"Nie znaleziono arkusza 'Cash Operations'! Upewnij się, że to raport XTB.",
					);
				}

				const worksheet = workbook.Sheets[sheetName];

				// EN: Convert worksheet to raw rows to find the header index
				// PL: Konwertujemy arkusz na surowe wiersze, by znaleźć index nagłówka
				const rowsRaw = XLSX.utils.sheet_to_json(worksheet, {
					header: 1,
				}) as any[][];

				const headerIndex = rowsRaw.findIndex(
					(r) => r.includes("Type") || r.includes("Typ"),
				);

				if (headerIndex === -1) {
					return alert("Nie znaleziono nagłówków (Type/Typ) w arkuszu.");
				}

				// EN: Parse actual data rows starting from headerIndex
				// PL: Parsujemy dane właściwe zaczynając od headerIndex
				const rows = XLSX.utils.sheet_to_json(worksheet, {
					range: headerIndex,
				}) as any[];

				const parsed = rows
					.map((r) => parseXtbRow(r))
					.filter(Boolean) as ParsedXtbTransaction[];

				// EN: Merge commissions and swap costs by position ID
				// PL: Scalamy prowizje i koszty swapu po ID pozycji
				const groupedData = parsed.reduce(
					(acc: ParsedXtbTransaction[], current) => {
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

				// EN: Update state to show the preview table
				// PL: Aktualizujemy stan, by wyświetlić tabelę podglądu
				setPreviewData(groupedData);
			} catch (error) {
				console.error("Błąd podczas odczytu pliku Excel:", error);
				alert(
					"Nie udało się odczytać pliku. Spróbuj otworzyć go w Excelu i zapisać ponownie jako .xlsx",
				);
			}
		};

		// 🚀 KLUCZOWE: Uruchomienie czytnika w formacie ArrayBuffer
		// reader.readAsArrayBuffer(file);
		reader.readAsBinaryString(file); // 🚀 ZMIANA NA BINARY STRING
	};

	// 2. Funkcje zarządzania podglądem
	const handleRemoveRow = (index: number) => {
		setPreviewData((prev) => prev.filter((_, i) => i !== index));
	};

	const handleChangeCategory = (index: number, newCat: Category) => {
		setPreviewData((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], category: newCat };
			return updated;
		});
	};

	const handleFinalImport = async () => {
		setIsImporting(true);
		let count = 0;
		try {
			// EN: Save each transaction to history
			// PL: Zapisujemy każdą transakcję do historii
			for (const tx of previewData) {
				await saveXtbTransaction(tx, portfolioId);
				count++;
			}

			// EN: Sync assets table with history to update Dashboard
			// PL: Synchronizujemy tabelę Asset z historią, by odświeżyć Dashboard
			await syncPortfolioAssets(portfolioId);

			alert(`Sukces! Zaimportowano i zsynchronizowano ${count} transakcji. ✨`);
			setPreviewData([]);
		} catch (error) {
			console.error("Błąd podczas importu:", error);
			alert("Wystąpił błąd podczas zapisywania transakcji.");
		} finally {
			setIsImporting(false);
		}
	};

	// 3. Renderowanie interfejsu
	return (
		<div className="space-y-4 p-4 border rounded-xl bg-background shadow-sm">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-bold">Import Raportu XTB</h3>
				<span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
					Format: .xlsx
				</span>
			</div>

			<input
				type="file"
				accept=".xlsx"
				onChange={handleFileUpload}
				className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white cursor-pointer hover:file:bg-primary/90 transition-all"
			/>

			{previewData.length > 0 && (
				<div className="mt-6 overflow-x-auto border rounded-lg bg-card">
					<table className="w-full text-sm text-left">
						<thead className="bg-muted/50">
							<tr>
								<th className="p-3 font-bold uppercase text-[10px]">Data</th>
								<th className="p-3 font-bold uppercase text-[10px]">Aktywo</th>
								<th className="p-3 font-bold uppercase text-[10px]">
									Kategoria
								</th>
								<th className="p-3 font-bold uppercase text-[10px]">Kwota</th>
								<th className="p-3 w-10"></th>
							</tr>
						</thead>
						<tbody>
							{previewData.map((tx, idx) => (
								<tr
									key={idx}
									className="border-t border-border/50 hover:bg-muted/30 transition-colors"
								>
									<td className="p-3 text-muted-foreground">
										{new Date(tx.date).toLocaleDateString("pl-PL")}
									</td>
									<td className="p-3">
										<div className="font-bold">{tx.assetName}</div>
										<div className="text-[10px] text-muted-foreground font-mono">
											{tx.ticker}
										</div>
									</td>
									<td className="p-3">
										<select
											value={tx.category}
											onChange={(e) =>
												handleChangeCategory(idx, e.target.value as Category)
											}
											className="bg-background border border-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
										>
											{Object.values(Category).map((c) => (
												<option key={c} value={c}>
													{c}
												</option>
											))}
										</select>
									</td>
									<td className="p-3 font-mono font-medium">
										{tx.amountPLN.toLocaleString("pl-PL", {
											minimumFractionDigits: 2,
										})}{" "}
										PLN
									</td>
									<td className="p-3">
										<button
											onClick={() => handleRemoveRow(idx)}
											className="text-destructive/70 hover:text-destructive hover:scale-110 transition-all"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					<div className="p-4 bg-muted/20 flex justify-between items-center border-t">
						<p className="text-xs text-muted-foreground italic">
							Zweryfikuj poprawność kategorii przed zatwierdzeniem.
						</p>
						<button
							onClick={handleFinalImport}
							disabled={isImporting}
							className="flex items-center gap-2 bg-primary text-white px-8 py-2.5 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all active:scale-95"
						>
							<CheckCircle className="h-4 w-4" />
							{isImporting
								? "Przetwarzanie..."
								: `Zatwierdź i Synchronizuj (${previewData.length})`}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

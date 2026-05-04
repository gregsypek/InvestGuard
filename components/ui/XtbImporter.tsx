// components/ui/XtbImporter.tsx
"use client";

import * as XLSX from "xlsx";

import { CheckCircle, Trash2 } from "lucide-react";
import { ParsedXtbTransaction, parseXtbRow } from "@/lib/utils/xtb-parser";
import React, { useState } from "react";

import { Category } from "@prisma/client";
import { saveXtbTransaction } from "@/lib/actions/transactions";

export const XtbImporter = ({ portfolioId }: { portfolioId: string }) => {
	const [previewData, setPreviewData] = useState<ParsedXtbTransaction[]>([]);
	const [isImporting, setIsImporting] = useState(false);

	// 1. Logika wczytywania i parowania danych
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const data = new Uint8Array(event.target?.result as ArrayBuffer);
			const workbook = XLSX.read(data, { type: "array", cellDates: true });
			const sheetName = workbook.SheetNames.find((n) =>
				n.toLowerCase().startsWith("cash operat"),
			);

			if (!sheetName) return alert("Nie znaleziono arkusza!");

			const worksheet = workbook.Sheets[sheetName];
			const rowsRaw = XLSX.utils.sheet_to_json(worksheet, {
				header: 1,
			}) as any[][];
			const headerIndex = rowsRaw.findIndex(
				(r) => r.includes("Type") || r.includes("Typ"),
			);

			if (headerIndex === -1)
				return alert("Nie znaleziono nagłówków w arkuszu.");

			const rows = XLSX.utils.sheet_to_json(worksheet, {
				range: headerIndex,
			}) as any[];

			const parsed = rows
				.map((r) => parseXtbRow(r))
				.filter(Boolean) as ParsedXtbTransaction[];

			// Scalanie prowizji i kosztów po ID pozycji
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
		};
		reader.readAsArrayBuffer(file);
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
			for (const tx of previewData) {
				await saveXtbTransaction(tx, portfolioId);
				count++;
			}
			alert(`Zaimportowano pomyślnie ${count} transakcji!`);
			setPreviewData([]);
		} catch (error) {
			console.error("Błąd podczas importu:", error);
			alert("Wystąpił błąd podczas zapisywania transakcji.");
		} finally {
			setIsImporting(false);
		}
	};

	// 3. Renderowanie interfejsu (zawsze na końcu komponentu)
	return (
		<div className="space-y-4 p-4 border rounded-xl bg-background shadow-sm">
			<h3 className="text-lg font-bold">Import XTB (Tryb Nauki)</h3>
			<input
				type="file"
				accept=".xlsx"
				onChange={handleFileUpload}
				className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white cursor-pointer"
			/>

			{previewData.length > 0 && (
				<div className="mt-6 overflow-x-auto border rounded-lg">
					<table className="w-full text-sm text-left">
						<thead className="bg-muted">
							<tr>
								<th className="p-2">Data</th>
								<th className="p-2">Aktywo</th>
								<th className="p-2">Kategoria</th>
								<th className="p-2">Kwota</th>
								<th className="p-2">Akcja</th>
							</tr>
						</thead>
						<tbody>
							{previewData.map((tx, idx) => (
								<tr key={idx} className="border-t hover:bg-muted/50">
									<td className="p-2">
										{new Date(tx.date).toLocaleDateString()}
									</td>
									<td className="p-2 font-medium">{tx.assetName}</td>
									<td className="p-2">
										<select
											value={tx.category}
											onChange={(e) =>
												handleChangeCategory(idx, e.target.value as Category)
											}
											className="bg-transparent border rounded p-1"
										>
											{Object.values(Category).map((c) => (
												<option key={c} value={c}>
													{c}
												</option>
											))}
										</select>
									</td>
									<td className="p-2">{tx.amountPLN.toFixed(2)} PLN</td>
									<td className="p-2">
										<button
											onClick={() => handleRemoveRow(idx)}
											className="text-destructive hover:scale-110 transition-transform"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<div className="p-4 bg-muted/30 flex justify-end">
						<button
							onClick={handleFinalImport}
							disabled={isImporting}
							className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50"
						>
							<CheckCircle className="h-4 w-4" />
							{isImporting
								? "Zapisywanie..."
								: `Potwierdź import (${previewData.length})`}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

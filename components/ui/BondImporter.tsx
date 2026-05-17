// components/ui/BondImporter.tsx
"use client";

import * as XLSX from "xlsx";

import { AlertTriangle, CheckCircle, FileUp, Trash2 } from "lucide-react";
import { ParsedBond, parseBondRow } from "@/lib/utils/bond-parser";
import React, { ChangeEvent, useState } from "react";

import { saveXtbTransaction } from "@/lib/actions/transactions";
import { syncPortfolioAssets } from "@/lib/actions/asset-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const BondImporter = ({ portfolioId }: { portfolioId: string }) => {
	const router = useRouter();
	const [preview, setPreview] = useState<ParsedBond[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

	// EN: Handles binary file layout reading and strictly types parser outputs
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
					.filter((b): b is ParsedBond => b !== null);

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

		for (const bond of dataToSave) {
			try {
				const dateStr =
					bond.expiryDate instanceof Date
						? bond.expiryDate.toISOString().split("T")[0]
						: String(bond.expiryDate);

				// EN: Normalize underlying composite structural unique key signatures for bonds
				const uniqueKey = `BOND_${bond.ticker}_${dateStr}`;

				const txPayload = {
					uniqueKey,
					type: "UPDATE" as const,
					assetName: `Obligacje ${bond.ticker}`,
					ticker: `${bond.ticker}_${dateStr}`,
					quantity: bond.quantity,
					date: new Date(),
					amountPLN: bond.currentValue,
					originalPrice:
						bond.quantity > 0 ? bond.investedValue / bond.quantity : 0,
					currency: "PLN",
					exchangeRate: 1,
					category: "BONDS" as const,
					comment: `Automatyczny import: Wykup ${dateStr}`,
				};

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

		try {
			if (count > 0) {
				await syncPortfolioAssets(portfolioId);
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
		} catch {
			toast.error("Wystąpił błąd podczas synchronizacji portfela.");
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

	// EN: Calculate summary values purely against actively selected index nodes
	const previewTotal = preview
		.filter((_, i) => selectedIndices.includes(i))
		.reduce((sum, b) => sum + b.currentValue, 0);

	return (
		<div className="flex flex-col gap-6">
			{/* FILE DRAG AND DROP ZONE */}
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
					className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-border/50 rounded-3xl bg-card/30 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer group"
				>
					<div className="bg-primary/10 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
						<FileUp className="h-6 w-6 text-primary" />
					</div>
					<span className="text-sm font-bold tracking-tight">
						Wybierz plik z obligacjami skarbowymi
					</span>
					<span className="text-[10px] text-muted-foreground uppercase mt-1 tracking-widest">
						Obsługiwane: .XLS
					</span>
				</label>
			</div>

			{error && (
				<div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 border-dashed rounded-2xl text-destructive text-xs text-red-600 animate-in fade-in duration-200">
					<AlertTriangle className="h-4 w-4" />
					{error}
				</div>
			)}

			{preview.length > 0 && (
				<div className="mt-6 overflow-x-auto border rounded-2xl bg-card shadow-xl overflow-hidden animate-in fade-in duration-300">
					<table className="w-full text-sm text-left">
						<thead className="bg-muted/50 border-b text-[10px] uppercase tracking-wider opacity-70 font-bold">
							<tr>
								<th className="p-4 w-10">
									<input
										type="checkbox"
										checked={
											selectedIndices.length === preview.length &&
											preview.length > 0
										}
										onChange={toggleAll}
										className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
									/>
								</th>
								<th className="p-3">Emisja</th>
								<th className="p-3 text-right">Ilość</th>
								<th className="p-3 text-right">Wartość Inwestowana</th>
								<th className="p-3 text-right">Wartość Bieżąca</th>
								<th className="p-3 text-center">Data Wykupu</th>
								<th className="p-3 w-10"></th>
							</tr>
						</thead>
						<tbody>
							{preview.map((b, i) => {
								const isSelected = selectedIndices.includes(i);
								return (
									<tr
										key={i}
										className={`border-t border-border/10 hover:bg-primary/5 transition-colors ${
											isSelected ? "bg-primary/5" : "opacity-40 grayscale-[0.3]"
										}`}
									>
										<td className="p-4">
											<input
												type="checkbox"
												checked={isSelected}
												onChange={() => toggleRow(i)}
												className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
											/>
										</td>
										<td className="p-3 font-bold">{b.ticker}</td>
										<td className="p-3 text-right font-mono">
											{b.quantity} szt.
										</td>
										<td className="p-3 text-right font-mono text-muted-foreground">
											{b.investedValue.toLocaleString("pl-PL", {
												minimumFractionDigits: 2,
											})}{" "}
											PLN
										</td>
										<td className="p-3 text-right font-mono font-bold text-primary">
											{b.currentValue.toLocaleString("pl-PL", {
												minimumFractionDigits: 2,
											})}{" "}
											PLN
										</td>
										<td className="p-3 text-center opacity-60">
											{b.expiryDate.toLocaleDateString("pl-PL")}
										</td>
										<td className="p-3">
											<button
												onClick={() => handleRemoveRow(i)}
												className="text-destructive/50 hover:text-destructive transition-all hover:scale-110"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
						<tfoot>
							<tr className="border-t border-border/30 bg-muted/20">
								<td
									colSpan={4}
									className="p-3 text-[9px] uppercase tracking-widest text-muted-foreground font-bold"
								>
									Łącznie wybrane
								</td>
								<td className="p-3 text-right font-bold text-primary font-mono">
									{previewTotal.toLocaleString("pl-PL", {
										minimumFractionDigits: 2,
									})}{" "}
									PLN
								</td>
								<td colSpan={2} />
							</tr>
						</tfoot>
					</table>

					{/* DEDICATED INFERRED DURATION METADATA NOTICE */}
					<p className="px-4 py-2 text-[9px] text-muted-foreground border-t border-border/20">
						* Data emisji obliczana automatycznie na podstawie rodzaju obligacji
						(np. DOR = 2 lata, EDO = 10 lat przed wykupem).
					</p>

					<div className="p-4 bg-muted/10 flex justify-between items-center border-t border-border/50">
						<div className="flex flex-col">
							<p className="text-[11px] font-bold uppercase tracking-widest text-primary">
								Wybrano: {selectedIndices.length} z {preview.length}
							</p>
							<p className="text-[10px] text-muted-foreground italic mt-0.5">
								Tylko zaznaczone obligacje zostaną dodane do historii operacji.
							</p>
						</div>

						<button
							onClick={handleImport}
							disabled={loading || selectedIndices.length === 0}
							className="flex items-center gap-2 bg-primary text-white px-10 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-30 disabled:grayscale shadow-lg shadow-primary/20 transition-all active:scale-95 text-xs"
						>
							<CheckCircle className="h-4 w-4" />
							{loading ? "Aktualizowanie..." : `Zatwierdź Wybrane`}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

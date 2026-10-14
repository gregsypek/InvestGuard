"use client";

import * as XLSX from "xlsx";

import { AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { ParsedXtbTransaction, parseXtbRow } from "@/lib/utils/xtb-parser";
import React, { useState } from "react";

import { Category } from "@prisma/client";
import Image from "next/image";
import JSZip from "jszip";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";
import { inferTickersCategories } from "@/lib/actions/portfolio.actions";
import { saveXtbTransaction } from "@/lib/actions/transactions";
import { syncPortfolioAssets } from "@/lib/actions/asset-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// EN: Reads workbook with 3 strategies: direct -> re-zipped via JSZip -> text fallback
async function readWorkbookRobust(file: File): Promise<XLSX.WorkBook> {
	const arrayBuffer = await file.arrayBuffer();

	// 1) Repack ZIP first (XTB files have zero-size local headers)
	try {
		const zip = await JSZip.loadAsync(arrayBuffer);
		const repacked = await zip.generateAsync({
			type: "arraybuffer",
			compression: "DEFLATE",
		});
		return XLSX.read(repacked, { type: "array", cellDates: true });
	} catch (e) {
		console.debug("JSZip repack failed, trying direct read...", e);
	}

	// 2) Standard read
	try {
		return XLSX.read(arrayBuffer, { type: "array", cellDates: true });
	} catch (e) {
		console.debug("Standard XLSX read failed, trying text fallback...", e);
	}

	// 3) Text fallback (CSV/HTML disguised as .xls)
	const textData = await file.text();
	return XLSX.read(textData, { type: "string", cellDates: true });
}
export const XtbImporter = ({ portfolioId }: { portfolioId: string }) => {
	const [previewData, setPreviewData] = useState<ParsedXtbTransaction[]>([]);
	const [isImporting, setIsImporting] = useState(false);
	const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setError(null);

		try {
			// EN: Robust read: direct -> JSZip repack -> text fallback
			const workbook = await readWorkbookRobust(file);

			// EN: Locate the specific sheet for cash operations
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

			// EN: Generate precise unique keys to prevent duplicate collisions during rapid trades
			const keyCounts: Record<string, number> = {};
			const deduplicatedData = groupedData.map((tx) => {
				const baseKey = `${tx.uniqueKey}_${tx.quantity}_${tx.amountPLN}`;

				if (keyCounts[baseKey]) {
					keyCounts[baseKey]++;
					tx.uniqueKey = `${baseKey}_${keyCounts[baseKey]}`;
				} else {
					keyCounts[baseKey] = 1;
					tx.uniqueKey = baseKey;
				}
				return tx;
			});

			// EN: Extract unique tickers and fetch learned categories from the database
			const uniqueTickers = Array.from(
				new Set(deduplicatedData.map((tx) => tx.ticker).filter(Boolean)),
			) as string[];

			const learnedCategories = await inferTickersCategories(
				uniqueTickers,
				portfolioId,
			);

			// EN: Override parsed categories with learned ones
			const formattedPreview = deduplicatedData.map((tx) => {
				if (tx.ticker && learnedCategories[tx.ticker]) {
					return { ...tx, category: learnedCategories[tx.ticker] };
				}
				return tx;
			});

			setPreviewData(formattedPreview);
			setSelectedIndices(formattedPreview.map((_, i) => i));
		} catch (err: unknown) {
			setError("Błąd podczas odczytu pliku Excel.");
			console.error("XLSX Processing Error:", err);
		}
	};

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

		// EN: Array to track ignored items for detailed error reporting
		const duplicateItems: string[] = [];

		const dataToSave = previewData.filter((_, i) =>
			selectedIndices.includes(i),
		);

		for (const tx of dataToSave) {
			try {
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
					// EN: Collect skipped transactions
					duplicateItems.push(
						`[${tx.type}] ${tx.assetName || tx.ticker} (${formatCurrency(tx.amountPLN)} PLN)`,
					);
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

			// EN: Generate detailed summary regarding duplicates
			if (duplicateItems.length > 0 && count === 0) {
				setError(
					`Wszystkie pozycje zostały odrzucone jako duplikaty:\n${duplicateItems.join(", ")}`,
				);
			} else if (duplicateItems.length > 0) {
				setError(
					`Zaimportowano ${count} transakcji. Pominięto ${duplicateItems.length} z powodu duplikatów: ${duplicateItems.join(", ")}`,
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
			{/* 1. STREFA WGRYWANIA (DROPZONE) */}
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

			{/* 2. KOMUNIKAT BŁĘDU (Szczegółowy) */}
			{error && (
				<div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-500 text-xs font-bold uppercase tracking-wider animate-in slide-in-from-top-2 whitespace-pre-wrap">
					<AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
					<span>{error}</span>
				</div>
			)}

			{/* 3. TABELA PODGLĄDU I WERYFIKACJI */}
			{previewData.length > 0 && (
				<div className="border border-t-border rounded-2xl bg-t-bg-panel shadow-sm flex flex-col animate-in slide-in-from-bottom-4 duration-500 relative">
					{/* ========================================= */}
					{/* EN: STICKY HEADER WITH ACTION BAR */}
					{/* ========================================= */}
					<div className="sticky top-0 z-20 p-4 sm:p-6 bg-t-bg-panel/90 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-t-border shadow-sm rounded-t-2xl">
						<div className="flex flex-col items-center sm:items-start text-center sm:text-left">
							<p className="text-[11px] font-black uppercase tracking-widest text-t-text-primary">
								Wybrano:{" "}
								<span className="text-blue-500">{selectedIndices.length}</span>{" "}
								z {previewData.length}
							</p>
							<p className="text-[10px] text-t-text-tertiary uppercase tracking-widest font-bold mt-1">
								Zatwierdź przypisane kategorie i zignoruj zbędne pozycje.
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

					{/* EN: Scrollable wrapper for the table content */}
					<div className="overflow-x-auto overflow-y-visible no-scrollbar">
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
									<th className="p-3 text-left">Typ operacji</th>
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
												!isSelected && "opacity-40 grayscale",
												isSelected &&
													isEven &&
													"bg-t-bg-base/30 dark:bg-black/20",
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
											<td className="p-3 font-bold text-xs uppercase tracking-wider">
												{tx.type === "BUY" ? (
													<span className="text-rose-500">Kupno</span>
												) : tx.type === "SELL" ? (
													<span className="text-emerald-500">Sprzedaż</span>
												) : tx.type === "DEPOSIT" ? (
													<span className="text-blue-500">Wpłata</span>
												) : tx.type === "INTEREST" && tx.amountPLN > 0 ? (
													<span className="text-purple-500">Dywidenda</span>
												) : tx.type === "INTEREST" && tx.amountPLN < 0 ? (
													<span className="text-orange-500">Podatek</span>
												) : (
													<span className="text-slate-500">{tx.type}</span>
												)}
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
													{formatCurrency(tx.amountPLN)}
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
				</div>
			)}
		</div>
	);
};

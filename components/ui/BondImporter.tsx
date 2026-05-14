"use client";

import * as XLSX from "xlsx";

import { AlertTriangle, CheckCircle, FileUp, TrendingUp } from "lucide-react";
import { ParsedBond, parseBondRow } from "@/lib/utils/bond-parser";
import React, { useState } from "react";

import { BOND_DURATIONS } from "@/lib/constants";
import { importBondsAction } from "@/lib/actions/bond-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const BondImporter = ({ portfolioId }: { portfolioId: string }) => {
	const router = useRouter();
	const [preview, setPreview] = useState<ParsedBond[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setError(null);

		const reader = new FileReader();
		reader.onload = (evt) => {
			try {
				const bstr = evt.target?.result;
				const wb = XLSX.read(bstr, { type: "array" });
				const ws = wb.Sheets[wb.SheetNames[0]];
				const data = XLSX.utils.sheet_to_json(ws);

				const parsed = data
					.map(parseBondRow)
					.filter((b): b is ParsedBond => b !== null);

				if (parsed.length === 0) {
					setError(
						"Nie znaleziono żadnych obligacji w pliku. Sprawdź format raportu.",
					);
				}
				setPreview(parsed);
			} catch {
				setError("Błąd odczytu pliku. Upewnij się, że to poprawny plik .xls.");
			}
		};
		reader.readAsArrayBuffer(file);
	};

	// components/ui/BondImporter.tsx

	const handleImport = async () => {
		setLoading(true);
		try {
			// 1. Agregacja danych (logika kliencka)
			const aggregated = preview.reduce((acc: any, bond) => {
				const key = `${bond.ticker}_${bond.expiryDate.toISOString().split("T")[0]}`;
				if (!acc[key]) acc[key] = { ...bond };
				else {
					acc[key].quantity += bond.quantity;
					acc[key].currentValue += bond.currentValue;
					acc[key].investedValue += bond.investedValue;
				}
				return acc;
			}, {});

			// 2. Wywołanie Server Action (bezpieczne przesyłanie danych do bazy)
			const result = await importBondsAction(
				portfolioId,
				Object.values(aggregated),
			);

			if (result.success) {
				toast.success("Zaimportowano! Teraz zobaczysz zysk w statystykach.");
				setPreview([]);
				router.refresh();
			} else {
				toast.error(result.error);
			}
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	// Suma dla podglądu
	const previewTotal = preview.reduce((s, b) => s + b.currentValue, 0);

	return (
		<div className="mt-6 space-y-4 p-6 bg-card/50 rounded-3xl border border-border/50 backdrop-blur-sm">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
						<TrendingUp className="h-4 w-4 text-primary" />
						Import Obligacji (PKO BP)
					</h3>
					<p className="text-[10px] text-muted-foreground mt-1">
						Wgraj plik .xls z serwisu obligacjeskarbowe.pl
					</p>
				</div>
				<input
					type="file"
					onChange={handleFile}
					className="hidden"
					id="bond-upload"
					accept=".xls,.xlsx"
				/>
				<label
					htmlFor="bond-upload"
					className="cursor-pointer flex items-center gap-2 text-[10px] font-bold uppercase bg-primary text-white px-5 py-2.5 rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20"
				>
					<FileUp className="h-3.5 w-3.5" /> Wybierz raport
				</label>
			</div>

			{/* Błąd */}
			{error && (
				<div className="flex items-center gap-2 text-[10px] text-destructive bg-destructive/10 rounded-xl px-4 py-3">
					<AlertTriangle className="h-3.5 w-3.5 shrink-0" />
					{error}
				</div>
			)}

			{/* Podgląd */}
			{preview.length > 0 && (
				<div className="mt-4 overflow-hidden rounded-2xl border border-border/50 bg-background/50">
					<table className="w-full text-[10px] text-left">
						<thead className="bg-muted/50 border-b border-border/50 uppercase text-muted-foreground">
							<tr>
								<th className="p-3">Emisja</th>
								<th className="p-3 text-right">Ilość</th>
								<th className="p-3 text-right">Wart. Nominalna</th>
								<th className="p-3 text-right text-primary">Wart. Aktualna</th>
								<th className="p-3 text-center">Data emisji*</th>
								<th className="p-3 text-center">Wykup</th>
							</tr>
						</thead>
						<tbody>
							{preview.map((b, i) => {
								const expiryDate = new Date(b.expiryDate);
								const prefix = b.ticker.match(/^[A-Z]+/)?.[0] || "EDO";
								const duration = BOND_DURATIONS[prefix] || 10;
								const inferredPurchase = new Date(expiryDate);
								inferredPurchase.setFullYear(
									expiryDate.getFullYear() - duration,
								);

								return (
									<tr
										key={i}
										className="border-t border-border/10 hover:bg-primary/5 transition-colors"
									>
										<td className="p-3 font-bold font-mono">{b.ticker}</td>
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
										{/* ✅ Pokazujemy inferowaną datę emisji, żeby user widział co trafi do bazy */}
										<td className="p-3 text-center opacity-60 text-[9px]">
											{inferredPurchase.toLocaleDateString("pl-PL")}
										</td>
										<td className="p-3 text-center opacity-60">
											{b.expiryDate.toLocaleDateString("pl-PL")}
										</td>
									</tr>
								);
							})}
						</tbody>
						<tfoot>
							<tr className="border-t border-border/30 bg-muted/20">
								<td
									colSpan={3}
									className="p-3 text-[9px] uppercase tracking-widest text-muted-foreground"
								>
									Łącznie
								</td>
								<td className="p-3 text-right font-bold text-primary">
									{previewTotal.toLocaleString("pl-PL", {
										minimumFractionDigits: 2,
									})}{" "}
									PLN
								</td>
								<td colSpan={2} />
							</tr>
						</tfoot>
					</table>

					{/* Uwaga o inferowanej dacie */}
					<p className="px-4 py-2 text-[9px] text-muted-foreground border-t border-border/20">
						* Data emisji obliczana automatycznie na podstawie rodzaju obligacji
						(np. DOR = 2 lata, EDO = 10 lat przed wykupem). Ustaw w{" "}
						<code>BOND_DURATIONS</code> jeśli wartości są niepoprawne.
					</p>

					<button
						onClick={handleImport}
						disabled={loading}
						className="w-full bg-primary/10 hover:bg-primary/20 text-primary h-12 font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-t border-border/50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? (
							<span className="animate-pulse">Aktualizowanie portfela...</span>
						) : (
							<>
								<CheckCircle className="h-4 w-4" />
								Zatwierdź i zaktualizuj stan ({preview.length} emisji)
							</>
						)}
					</button>
				</div>
			)}
		</div>
	);
};

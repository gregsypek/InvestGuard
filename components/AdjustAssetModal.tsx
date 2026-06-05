"use client";

import { Loader2, X } from "lucide-react";

import type { Asset } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AdjustAssetModalProps {
	asset: Asset;
	onConfirm: (data: {
		newQuantity: number;
		newInvestedCapital: number;
		newCurrentValue: number;
		note: string;
	}) => void;
	onClose: () => void;
	isLoading?: boolean;
}

export function AdjustAssetModal({
	asset,
	onConfirm,
	onClose,
	isLoading,
}: AdjustAssetModalProps) {
	// Domyślnie ładujemy obecny stan aktywa
	const [newQuantity, setNewQuantity] = useState<number>(asset.quantity);
	const [newInvestedCapital, setNewInvestedCapital] = useState<number>(
		asset.investedCapital,
	);
	const [newCurrentValue, setNewCurrentValue] = useState<number>(
		asset.currentValue,
	);
	const [note, setNote] = useState("");

	const isValid =
		newQuantity >= 0 && newInvestedCapital >= 0 && newCurrentValue >= 0;

	const inputStyles =
		"h-12 bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-blue-500 rounded-xl px-4 text-sm font-medium text-t-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none w-full";

	return (
		<div className="bg-t-bg-panel border border-t-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
			{/* ================= HEADER ================= */}
			<div className="flex items-center justify-between p-6 border-b border-t-border-subtle">
				<div>
					<h2 className="text-lg font-black text-t-text-primary tracking-tight">
						Korekta stanu
					</h2>
					<p className="text-[11px] text-t-text-tertiary uppercase tracking-widest font-bold mt-0.5">
						{asset.name} {asset.ticker && `(${asset.ticker})`}
					</p>
				</div>
				<button
					onClick={onClose}
					className="p-2 text-t-text-tertiary hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-all"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			{/* ================= BODY ================= */}
			<div className="p-6 space-y-6">
				{/* Ilość */}
				<div className="space-y-2">
					<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
						Faktyczna ilość
					</label>
					<div className="relative">
						<input
							type="number"
							min="0"
							step="any"
							value={newQuantity}
							onChange={(e) => setNewQuantity(Number(e.target.value))}
							className={cn(inputStyles, "pr-12 font-mono")}
							placeholder="0.00"
						/>
						<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
							SZT
						</span>
					</div>
				</div>

				{/* Grid: Wkład i Wycena */}
				<div className="grid grid-cols-2 gap-4">
					{/* Zainwestowano */}
					<div className="space-y-2">
						<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
							Zainwestowano
						</label>
						<div className="relative">
							<input
								type="number"
								min="0"
								step="0.01"
								value={newInvestedCapital}
								onChange={(e) => setNewInvestedCapital(Number(e.target.value))}
								className={cn(inputStyles, "pr-12 font-mono")}
								placeholder="0.00"
							/>
							<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								PLN
							</span>
						</div>
					</div>

					{/* Obecna Wartość */}
					<div className="space-y-2">
						<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
							Obecna Wartość
						</label>
						<div className="relative">
							<input
								type="number"
								min="0"
								step="0.01"
								value={newCurrentValue}
								onChange={(e) => setNewCurrentValue(Number(e.target.value))}
								className={cn(inputStyles, "pr-12 font-mono")}
								placeholder="0.00"
							/>
							<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								PLN
							</span>
						</div>
					</div>
				</div>

				{/* Notatka */}
				<div className="space-y-2">
					<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
						Powód korekty (Opcjonalnie)
					</label>
					<textarea
						rows={2}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Np. Podział akcji, poprawa błędu wprowadzania..."
						className={cn(inputStyles, "min-h-[80px] py-3 resize-none")}
					/>
				</div>
			</div>

			{/* ================= FOOTER ================= */}
			<div className="p-6 bg-t-bg-base/30 dark:bg-black/20 border-t border-t-border-subtle">
				<button
					disabled={!isValid || isLoading}
					onClick={() =>
						onConfirm({
							newQuantity,
							newInvestedCapital,
							newCurrentValue,
							note,
						})
					}
					className={cn(
						"w-full h-12 rounded-xl font-bold uppercase tracking-widest text-[11px] flex justify-center items-center gap-2 shadow-md transition-all",
						isValid && !isLoading
							? "bg-blue-600 hover:bg-blue-500 text-white"
							: "bg-black/5 dark:bg-white/5 text-t-text-tertiary opacity-50 cursor-not-allowed",
					)}
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						"Zatwierdź korektę"
					)}
				</button>
			</div>
		</div>
	);
}

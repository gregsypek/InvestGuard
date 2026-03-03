"use client";

import { Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface AdjustAssetModalProps {
	asset: any;
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

	return (
		<div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
			{/* HEADER */}
			<div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
				<div>
					<h2 className="font-bold text-lg">Korekta stanu</h2>
					<p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
						{asset.name} {asset.ticker ? `(${asset.ticker})` : ""}
					</p>
				</div>
				<button
					onClick={onClose}
					className="p-2 hover:bg-muted rounded-full transition-colors"
				>
					<X className="h-5 w-5 text-muted-foreground" />
				</button>
			</div>

			{/* BODY */}
			<div className="p-6 space-y-6">
				{/* Quantity */}
				<div className="space-y-2">
					<label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
						Faktyczna ilość (Sztuki)
					</label>
					<input
						type="number"
						min="0"
						step="any"
						value={newQuantity}
						onChange={(e) => setNewQuantity(Number(e.target.value))}
						className="w-full bg-background border border-border rounded-lg px-4 py-3 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					{/* Invested Capital */}
					<div className="space-y-2">
						<label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
							Zainwestowano (PLN)
						</label>
						<input
							type="number"
							min="0"
							step="0.01"
							value={newInvestedCapital}
							onChange={(e) => setNewInvestedCapital(Number(e.target.value))}
							className="w-full bg-background border border-border rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
						/>
					</div>

					{/* Current Value */}
					<div className="space-y-2">
						<label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
							Obecna Wartość (PLN)
						</label>
						<input
							type="number"
							min="0"
							step="0.01"
							value={newCurrentValue}
							onChange={(e) => setNewCurrentValue(Number(e.target.value))}
							className="w-full bg-background border border-border rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
						/>
					</div>
				</div>

				{/* Note */}
				<div className="space-y-2">
					<label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
						Powód korekty (Opcjonalnie)
					</label>
					<textarea
						rows={2}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Np. Podział akcji, poprawa błędu wprowadzania..."
						className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
					/>
				</div>
			</div>

			{/* FOOTER */}
			<div className="p-4 bg-muted/20 border-t border-border mt-2">
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
						"w-full py-3 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2",
						isValid && !isLoading
							? "bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20"
							: "bg-muted text-muted-foreground cursor-not-allowed",
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

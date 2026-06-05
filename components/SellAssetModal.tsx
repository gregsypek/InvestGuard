"use client";

import { Loader2, X } from "lucide-react";

import { Asset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SellAssetModalProps {
	asset: Asset;
	portfoliosWithCash: { id: string; name: string }[];
	currentPortfolioId: string;
	onConfirm: (data: {
		quantity: number;
		price: number; // EN: This will now be the Total Value (quantity * unitPrice)
		targetId: string;
		note: string;
	}) => void;
	onClose: () => void;
	isLoading?: boolean;
}

export function SellAssetModal({
	asset,
	portfoliosWithCash,
	currentPortfolioId,
	onConfirm,
	onClose,
	isLoading,
}: SellAssetModalProps) {
	const [quantity, setQuantity] = useState<number>(0);
	const [unitPrice, setUnitPrice] = useState<number>(
		asset.currentValue / asset.quantity || 0,
	);
	// ✅ POPRAWKA: Obliczamy wartość początkową bezpośrednio w useState
	const [targetId, setTargetId] = useState<string>(() => {
		const hasLocalCash = portfoliosWithCash.some(
			(p) => p.id === currentPortfolioId,
		);
		if (hasLocalCash) return currentPortfolioId;
		if (portfoliosWithCash.length > 0) return portfoliosWithCash[0].id;
		return "none";
	});
	const [note, setNote] = useState("");

	// EN: Financial calculations
	const totalValue = quantity * unitPrice;
	const avgPurchasePrice = asset.investedCapital / asset.quantity;
	const estimatedProfit = (unitPrice - avgPurchasePrice) * quantity;
	const isLoss = estimatedProfit < 0;
	// Walidacja: ilość musi być poprawna, a targetId nie może być pusty (musi być ID lub "none")
	const isValid =
		quantity > 0 &&
		quantity <= asset.quantity &&
		unitPrice > 0 &&
		targetId !== "";

	const inputStyles =
		"h-12 bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-blue-500 rounded-xl px-4 text-sm font-medium text-t-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none w-full";

	return (
		<div className="bg-t-bg-panel border border-t-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
			{/* ================= HEADER ================= */}
			<div className="flex items-center justify-between p-6 border-b border-t-border-subtle">
				<div>
					<h2 className="text-lg font-black text-t-text-primary tracking-tight">
						Zatwierdź Sprzedaż
					</h2>
					<p className="text-[11px] text-t-text-tertiary uppercase tracking-widest font-bold mt-0.5">
						{asset.name} {asset.ticker && `(${asset.ticker})`}
					</p>
				</div>
				<button
					onClick={onClose}
					className="p-2 text-t-text-tertiary hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			{/* ================= BODY ================= */}
			<div className="p-6 space-y-6">
				<div className="grid grid-cols-2 gap-4">
					{/* Ilość */}
					<div className="space-y-2">
						<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
							Ilość sztuk
						</label>
						<div className="relative">
							<input
								type="number"
								className={cn(inputStyles, "pr-12 font-mono")}
								placeholder="0.00"
								onChange={(e) => setQuantity(Number(e.target.value))}
								value={quantity || ""}
							/>
							<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								SZT
							</span>
						</div>
						<button
							type="button"
							onClick={() => setQuantity(Number(asset.quantity.toFixed(4)))}
							className="text-[9px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest text-left w-full transition-colors mt-1"
						>
							Wstaw MAX:{" "}
							{asset.quantity.toLocaleString("pl-PL", {
								maximumFractionDigits: 4,
							})}
						</button>
					</div>

					{/* Cena */}
					<div className="space-y-2">
						<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
							Cena / szt.
						</label>
						<div className="relative">
							<input
								type="number"
								defaultValue={unitPrice}
								className={cn(inputStyles, "pr-12 font-mono")}
								onChange={(e) => setUnitPrice(Number(e.target.value))}
							/>
							<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								PLN
							</span>
						</div>
					</div>
				</div>

				{/* Portfel docelowy */}
				<div className="space-y-2">
					<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
						Gdzie przelać gotówkę?
					</label>
					<select
						value={targetId}
						onChange={(e) => setTargetId(e.target.value)}
						className={cn(inputStyles, "cursor-pointer appearance-none")}
					>
						<option value="none">-- Nie księguj gotówki (Wypłata) --</option>
						{portfoliosWithCash.map((p) => (
							<option key={p.id} value={p.id}>
								🏦 {p.name} {p.id === currentPortfolioId ? "(Ten portfel)" : ""}
							</option>
						))}
					</select>
				</div>

				{/* Notatka */}
				<div className="space-y-2">
					<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
						Notatka (Opcjonalnie)
					</label>
					<textarea
						className={cn(inputStyles, "min-h-[80px] py-3 resize-none")}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Np. realizacja zysków, rebalansowanie..."
					/>
				</div>

				{/* Podsumowanie (Pokazuje się tylko gdy wpisano dane) */}
				{quantity > 0 && unitPrice > 0 && (
					<div
						className={cn(
							"p-4 rounded-xl border animate-in slide-in-from-bottom-2 duration-300",
							isLoss
								? "bg-rose-500/10 border-rose-500/20"
								: "bg-emerald-500/10 border-emerald-500/20",
						)}
					>
						<div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2 mb-2">
							<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
								Otrzymasz łącznie:
							</span>
							<span className="font-mono text-sm font-black text-t-text-primary">
								{totalValue.toLocaleString("pl-PL", {
									minimumFractionDigits: 2,
								})}{" "}
								PLN
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
								Szacowany {isLoss ? "Strata:" : "Zysk:"}
							</span>
							<span
								className={cn(
									"font-mono text-xs font-black",
									isLoss
										? "text-rose-600 dark:text-rose-500"
										: "text-emerald-600 dark:text-emerald-400",
								)}
							>
								{isLoss ? "" : "+"}
								{estimatedProfit.toFixed(2)} PLN
							</span>
						</div>
					</div>
				)}
			</div>

			{/* ================= FOOTER ================= */}
			<div className="p-6 bg-t-bg-base/30 dark:bg-black/20 border-t border-t-border-subtle">
				<button
					disabled={!isValid || isLoading}
					onClick={() =>
						onConfirm({ quantity, price: totalValue, targetId, note })
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
						"Zatwierdź sprzedaż"
					)}
				</button>
			</div>
		</div>
	);
}

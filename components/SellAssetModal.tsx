"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface SellAssetModalProps {
	asset: any;
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
	const [targetId, setTargetId] = useState<string>("");
	const [note, setNote] = useState("");

	// EN: Step 1: Logic for auto-selecting the target portfolio
	useEffect(() => {
		const hasLocalCash = portfoliosWithCash.some(
			(p) => p.id === currentPortfolioId,
		);

		if (hasLocalCash) {
			setTargetId(currentPortfolioId);
		} else if (portfoliosWithCash.length > 0) {
			setTargetId(portfoliosWithCash[0].id);
		} else {
			setTargetId("none");
		}
	}, [portfoliosWithCash, currentPortfolioId]);

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

	return (
		<div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
			<div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
				<div>
					<h2 className="text-lg font-bold">Zatwierdź Sprzedaż</h2>
					<p className="text-xs text-muted-foreground uppercase font-mono">
						{asset.name}
					</p>
				</div>
				<button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
					<X className="h-5 w-5" />
				</button>
			</div>

			<div className="p-6 space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<label className="text-xs font-bold uppercase opacity-60">
							Ilość sztuk
						</label>
						<input
							type="number"
							className="w-full p-2 bg-muted/40 border border-border rounded-lg text-sm"
							placeholder="0.00"
							onChange={(e) => setQuantity(Number(e.target.value))}
						/>
						<p className="text-[10px] text-muted-foreground">
							Max: {asset.quantity.toFixed(2)}
						</p>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-bold uppercase opacity-60">
							Cena / szt.
						</label>
						<input
							type="number"
							defaultValue={unitPrice}
							className="w-full p-2 bg-muted/40 border border-border rounded-lg text-sm"
							onChange={(e) => setUnitPrice(Number(e.target.value))}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<label className="text-xs font-bold uppercase opacity-60">
						Gdzie przelać gotówkę?
					</label>
					<select
						value={targetId}
						onChange={(e) => setTargetId(e.target.value)}
						className="w-full p-2 bg-muted/40 border border-border rounded-lg text-sm outline-none"
					>
						<option value="none">-- Nie księguj gotówki (Wypłata) --</option>
						{portfoliosWithCash.map((p) => (
							<option key={p.id} value={p.id}>
								🏦 {p.name} {p.id === currentPortfolioId ? "(Ten portfel)" : ""}
							</option>
						))}
					</select>
					{/* {targetId === "none" && (
						<p className="text-[10px] text-muted-foreground italic px-1">
							* Środki nie zostaną dodane do żadnego portfela, ale sprzedaż
							zostanie zapisana w historii.
						</p>
					)} */}
				</div>

				<div className="space-y-2">
					<label className="text-xs font-bold uppercase opacity-60">
						Notatka
					</label>
					<textarea
						className="w-full p-2 bg-muted/40 border border-border rounded-lg text-sm h-16"
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Powód sprzedaży..."
					/>
				</div>

				{quantity > 0 && unitPrice > 0 && (
					<div
						className={cn(
							"p-3 rounded-lg border",
							isLoss ? "bg-red-500/10" : "bg-emerald-500/10",
						)}
					>
						<div className="flex justify-between text-xs font-bold">
							<span className="opacity-60 uppercase">Łączna kwota:</span>
							<span>{totalValue.toLocaleString()} PLN</span>
						</div>
						<div className="flex justify-between text-[10px] mt-1">
							<span className="opacity-60 uppercase">
								{isLoss ? "Strata:" : "Zysk:"}
							</span>
							<span className={isLoss ? "text-red-500" : "text-emerald-500"}>
								{estimatedProfit.toFixed(2)} PLN
							</span>
						</div>
					</div>
				)}
			</div>

			<div className="p-4 bg-muted/20 border-t border-border">
				<button
					disabled={!isValid || isLoading}
					onClick={() =>
						onConfirm({ quantity, price: totalValue, targetId, note })
					}
					className={cn(
						"w-full py-3 rounded-lg font-bold text-sm flex justify-center items-center gap-2",
						isValid && !isLoading
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground",
					)}
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						"Zatwierdź sprzedaż 🚀"
					)}
				</button>
			</div>
		</div>
	);
}

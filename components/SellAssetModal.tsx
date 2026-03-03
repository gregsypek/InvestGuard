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
		price: number;
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
	const [price, setPrice] = useState<number>(
		asset.currentValue / asset.quantity || 0,
	);
	const [targetId, setTargetId] = useState<string>("");
	const [note, setNote] = useState("");

	// Autoselekcja portfela przy otwarciu
	useEffect(() => {
		const hasLocalCash = portfoliosWithCash.some(
			(p) => p.id === currentPortfolioId,
		);
		if (hasLocalCash) {
			setTargetId(currentPortfolioId);
		} else if (portfoliosWithCash.length > 0) {
			setTargetId(portfoliosWithCash[0].id);
		} else {
			setTargetId("none"); // Jeśli nie ma portfeli CASH, domyślnie "nie księguj"
		}
	}, [portfoliosWithCash, currentPortfolioId]);

	const avgPurchasePrice = asset.investedCapital / asset.quantity;
	const result = (price - avgPurchasePrice) * quantity;
	const isLoss = result < 0;

	// Walidacja: ilość musi być poprawna, a targetId nie może być pusty (musi być ID lub "none")
	const isValid =
		quantity > 0 && quantity <= asset.quantity && price > 0 && targetId !== "";

	return (
		<div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
			{/* HEADER */}
			<div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
				<div>
					<h2 className="text-lg font-bold">Sprzedaż Aktywa</h2>
					<p className="text-xs text-muted-foreground uppercase font-mono">
						{asset.name} ({asset.ticker || "Brak Tickera"})
					</p>
				</div>
				<button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
					<X className="h-5 w-5" />
				</button>
			</div>

			<div className="p-6 space-y-4">
				{/* ILOŚĆ */}
				<div className="space-y-2">
					<label className="text-sm font-semibold">Ilość do sprzedaży</label>
					<div className="relative">
						<input
							type="number"
							max={asset.quantity}
							min="0"
							step="any"
							className="w-full p-2.5 bg-muted/40 border border-border rounded-lg text-sm outline-none"
							placeholder="0.00"
							onChange={(e) => setQuantity(Number(e.target.value))}
						/>
						<div className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground uppercase">
							Posiadasz: {asset.quantity.toFixed(4)}
						</div>
					</div>
				</div>

				{/* CENA */}
				<div className="space-y-2">
					<label className="text-sm font-semibold">
						Cena sprzedaży (za 1 szt. PLN)
					</label>
					<input
						type="number"
						step="any"
						defaultValue={price}
						className="w-full p-2.5 bg-muted/40 border border-border rounded-lg text-sm outline-none"
						onChange={(e) => setPrice(Number(e.target.value))}
					/>
				</div>

				{/* TRANSFER GOTÓWKI */}
				<div className="space-y-2">
					<label className="text-sm font-semibold italic text-primary">
						Gdzie przelać gotówkę?
					</label>
					<select
						value={targetId}
						onChange={(e) => setTargetId(e.target.value)}
						className="w-full p-2.5 bg-muted/40 border border-border rounded-lg text-sm outline-none cursor-pointer"
					>
						<option value="none">
							-- Nie księguj gotówki (Wypłata poza system) --
						</option>
						{portfoliosWithCash.map((p) => (
							<option key={p.id} value={p.id}>
								Zaksięguj w: {p.name}{" "}
								{p.id === currentPortfolioId ? "(Ten portfel)" : ""}
							</option>
						))}
					</select>
					{targetId === "none" && (
						<p className="text-[10px] text-muted-foreground italic px-1">
							* Środki nie zostaną dodane do żadnego portfela, ale sprzedaż
							zostanie zapisana w historii.
						</p>
					)}
				</div>

				{/* NOTATKA */}
				<div className="space-y-2">
					<label className="text-sm font-semibold">Notatka do sprzedaży</label>
					<textarea
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Np. realizacja zysku, rebalancing..."
						className="w-full p-2.5 bg-muted/40 border border-border rounded-lg text-sm outline-none min-h-[80px] resize-none"
					/>
				</div>

				{/* FEEDBACK FINANSOWY */}
				{quantity > 0 && price > 0 && (
					<div
						className={cn(
							"p-3 rounded-lg border animate-in slide-in-from-top-2",
							isLoss
								? "bg-red-500/10 border-red-500/20"
								: "bg-emerald-500/10 border-emerald-500/20",
						)}
					>
						<div className="flex justify-between items-center text-xs">
							<span className="font-medium text-muted-foreground uppercase">
								{isLoss ? "Szacowana strata" : "Szacowany zysk"}
							</span>
							<span
								className={cn(
									"font-black font-mono text-sm",
									isLoss ? "text-red-500" : "text-emerald-500",
								)}
							>
								{isLoss ? "" : "+"}
								{result.toFixed(2)} PLN
							</span>
						</div>
					</div>
				)}
			</div>

			{/* FOOTER */}
			<div className="p-4 bg-muted/20 border-t border-border mt-2">
				<button
					disabled={!isValid || isLoading}
					onClick={() => onConfirm({ quantity, price, targetId, note })}
					className={cn(
						"w-full py-3 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2",
						isValid && !isLoading
							? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg"
							: "bg-muted text-muted-foreground cursor-not-allowed",
					)}
				>
					{isLoading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Przetwarzanie...
						</>
					) : (
						"Zatwierdź sprzedaż 🚀"
					)}
				</button>
			</div>
		</div>
	);
}

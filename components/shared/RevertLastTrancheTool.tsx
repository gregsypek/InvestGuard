"use client";

import { Loader2, Undo2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getAssetTransactions,
	revertSpecificTransaction,
} from "@/app/actions/cleanup.actions";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import PremiumDeleteModal from "./PremiumDeleteModal";
import { formatCurrency } from "@/lib/utils/format-currency";
import { toast } from "sonner";

interface RevertToolProps {
	assets: {
		id: string;
		name: string;
		category: string;
		ticker: string | null;
	}[];
}

interface TransactionItem {
	id: string;
	type: string;
	executedAt: Date | string;
	executedValue: number;
	quantity: number;
	comment?: string | null;
}

export function RevertLastTrancheTool({ assets }: RevertToolProps) {
	const [selectedAssetId, setSelectedAssetId] = useState<string>("");
	const [selectedTransactionId, setSelectedTransactionId] =
		useState<string>("");
	const [transactions, setTransactions] = useState<TransactionItem[]>([]);
	const [loadingTx, setLoadingTx] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// 1. Po wyborze aktywa pobieramy z bazy jego historię transakcji
	useEffect(() => {
		if (!selectedAssetId) {
			setTransactions([]);
			setSelectedTransactionId("");
			return;
		}

		async function fetchTransactions() {
			setLoadingTx(true);
			setSelectedTransactionId("");
			const res = await getAssetTransactions(selectedAssetId);
			if (res.success && res.transactions) {
				setTransactions(res.transactions as any[]);
			} else {
				toast.error(res.error || "Błąd wczytywania transakcji");
				setTransactions([]);
			}
			setLoadingTx(false);
		}

		fetchTransactions();
	}, [selectedAssetId]);

	const selectedAsset = useMemo(
		() => assets.find((a) => a.id === selectedAssetId),
		[assets, selectedAssetId],
	);

	const selectedTransaction = useMemo(
		() => transactions.find((t) => t.id === selectedTransactionId),
		[transactions, selectedTransactionId],
	);

	const handleRevert = async () => {
		if (!selectedTransactionId) return;

		try {
			const res = await revertSpecificTransaction(selectedTransactionId);
			if (res.success) {
				toast.success(res.message || "Transakcja została cofnięta.");
				setSelectedTransactionId("");
				// Odświeżamy listę transakcji po usunięciu
				const updated = await getAssetTransactions(selectedAssetId);
				if (updated.success) setTransactions(updated.transactions as any[]);
				setIsModalOpen(false);
			} else {
				toast.error(res.error || "Nie udało się cofnąć transakcji.");
			}
		} catch {
			toast.error("Wystąpił błąd krytyczny podczas wycofywania transakcji.");
		}
	};

	return (
		<div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
			<div className="flex items-center gap-3 mb-2">
				<div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
					<Undo2 className="w-5 h-5 text-amber-500" />
				</div>
				<div>
					<h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">
						Menedżer Korekty Transakcji
					</h3>
					<p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">
						Wybierz aktywo, a następnie wkaż konkretną transakcję do wymazania z
						historii.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 pt-2">
				{/* KROK 1: Wybór Aktywa */}
				<div className="lg:col-span-5 min-w-0">
					<label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
						1. Wybierz Aktywo
					</label>
					<Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
						<SelectTrigger className="w-full h-11 dark:bg-slate-900/80 dark:border-slate-800 text-slate-200">
							<SelectValue placeholder="Szukaj waloru..." />
						</SelectTrigger>
						<SelectContent>
							{assets.map((a) => (
								<SelectItem
									key={a.id}
									value={a.id}
									className="py-2.5 cursor-pointer"
								>
									<div className="flex items-center justify-between w-full min-w-[260px] sm:min-w-[340px] gap-4">
										<div className="flex flex-col text-left">
											<span className="font-bold text-slate-200 text-sm leading-tight">
												{a.name}
											</span>
											{a.ticker && (
												<span className="text-blue-500 font-mono text-[10px] uppercase tracking-widest mt-0.5">
													{a.ticker}
												</span>
											)}
										</div>
										<span className="px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-400 text-[9px] uppercase tracking-widest font-black shrink-0">
											{a.category}
										</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* KROK 2: Wybór Konkretnej Transakcji */}
				<div className="lg:col-span-5 min-w-0">
					<label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1 flex items-center gap-2">
						2. Wybierz Transakcję{" "}
						{loadingTx && (
							<Loader2 className="w-3 h-3 animate-spin text-blue-500" />
						)}
					</label>
					<Select
						value={selectedTransactionId}
						onValueChange={setSelectedTransactionId}
						disabled={
							!selectedAssetId || loadingTx || transactions.length === 0
						}
					>
						<SelectTrigger className="w-full h-11 dark:bg-slate-900/80 dark:border-slate-800 text-slate-200 disabled:opacity-40">
							<SelectValue
								placeholder={
									!selectedAssetId
										? "Najpierw wybierz aktywo..."
										: loadingTx
											? "Pobieranie historii..."
											: transactions.length === 0
												? "Brak transakcji w historii"
												: "Wybierz transakcję z listy..."
								}
							/>
						</SelectTrigger>
						<SelectContent>
							{transactions.map((t) => {
								const dateStr = new Date(t.executedAt).toLocaleDateString(
									"pl-PL",
									{
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
									},
								);
								return (
									<SelectItem
										key={t.id}
										value={t.id}
										className="py-2.5 cursor-pointer"
									>
										<div className="flex items-center justify-between w-full min-w-[280px] sm:min-w-[360px] gap-4">
											<div className="flex items-center gap-2">
												<span
													className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
														t.type === "BUY" || t.type === "DEPOSIT"
															? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
															: "bg-rose-500/10 text-rose-400 border border-rose-500/20"
													}`}
												>
													{t.type}
												</span>
												<span className="font-mono text-xs text-slate-300 font-bold">
													{dateStr}
												</span>
											</div>
											<div className="flex items-center gap-3">
												{t.quantity !== 0 && (
													<span className="text-[10px] text-slate-400 font-medium">
														{t.quantity} szt.
													</span>
												)}
												<span className="font-mono font-bold text-xs text-slate-100">
													{formatCurrency(t.executedValue)} PLN
												</span>
											</div>
										</div>
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				</div>

				{/* PRZYCISK AKCJI */}
				<div className="lg:col-span-2 flex items-end">
					<Button
						onClick={() => setIsModalOpen(true)}
						disabled={!selectedTransactionId}
						className="w-full h-11 rounded-xl font-black uppercase text-[10px] tracking-widest bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 shadow-md transition-all"
					>
						<Undo2 className="w-4 h-4 mr-1.5" />
						Wymaż
					</Button>
				</div>
			</div>

			{/* INTEGRACJA Z PREMIUM DELETE MODAL */}
			<PremiumDeleteModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onConfirm={handleRevert}
				title="Potwierdź usunięcie transakcji"
				description={
					selectedAsset && selectedTransaction
						? `Czy na pewno chcesz usunąć transakcję (${selectedTransaction.type}) z dnia ${new Date(selectedTransaction.executedAt).toLocaleDateString("pl-PL")} na kwotę ${formatCurrency(selectedTransaction.executedValue)} PLN dla aktywa "${selectedAsset.name}"? Odpowiadający jej kapitał zostanie wycofany ze wszystkich historycznych zrzutów.`
						: "Czy na pewno chcesz usunąć wybraną transakcję?"
				}
			/>
		</div>
	);
}

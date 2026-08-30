"use client";

import { AlertTriangle, Loader2, Undo2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { revertLastTransaction } from "@/app/actions/cleanup.actions"; // Lub ścieżka do Twojego pliku z akcjami
import { toast } from "sonner";
import { useState } from "react";

interface RevertToolProps {
	assets: {
		id: string;
		name: string;
		category: string;
		ticker: string | null;
	}[];
}

export function RevertLastTrancheTool({ assets }: RevertToolProps) {
	const [selectedAssetId, setSelectedAssetId] = useState<string>("");
	const [loading, setLoading] = useState(false);

	const handleRevert = async () => {
		if (!selectedAssetId) return;

		const isConfirmed = window.confirm(
			"Czy na pewno chcesz cofnąć OSTATNIĄ transakcję (transzę) dla tego aktywa? Spowoduje to odjęcie jej ilości i kapitału oraz usunięcie wpisu z historii.",
		);
		if (!isConfirmed) return;

		setLoading(true);
		try {
			const res = await revertLastTransaction(selectedAssetId);
			if (res.success) {
				toast.success(res.message || "Ostatnia transza została cofnięta.");
				setSelectedAssetId("");
			} else {
				toast.error(res.error || "Nie udało się cofnąć transakcji.");
			}
		} catch {
			toast.error("Wystąpił błąd krytyczny.");
		} finally {
			setLoading(false);
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
						Korekta: Cofnij Ostatnią Transzę
					</h3>
					<p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">
						Usuwa wyłącznie ostatni wpis historyczny i odejmuje go z pozycji
						aktywa.
					</p>
				</div>
			</div>

			<div className="flex flex-col xl:flex-row gap-4 pt-2">
				<div className="flex-1 min-w-0">
					<Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
						<SelectTrigger className="w-full dark:bg-slate-900/80 dark:border-slate-800 text-slate-200">
							<SelectValue placeholder="Wybierz aktywo do korekty ostatniej transzy..." />
						</SelectTrigger>
						<SelectContent>
							{assets.map((a) => (
								<SelectItem key={a.id} value={a.id}>
									<span className="font-bold">{a.name}</span>
									{a.ticker && (
										<span className="text-blue-400 ml-1">[{a.ticker}]</span>
									)}
									<span className="text-slate-500 ml-2 text-[10px] uppercase">
										({a.category})
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Button
					onClick={handleRevert}
					disabled={loading || !selectedAssetId}
					className="w-full xl:w-auto h-10 px-6 rounded-lg font-black uppercase text-[10px] tracking-widest bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 shrink-0"
				>
					{loading ? (
						<Loader2 className="w-4 h-4 animate-spin mr-2" />
					) : (
						<Undo2 className="w-4 h-4 mr-2" />
					)}
					Ccofnij ostatnią transzę
				</Button>
			</div>
		</div>
	);
}

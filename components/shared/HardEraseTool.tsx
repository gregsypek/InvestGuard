"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { hardDeleteAssetWithHistory } from "@/app/actions/cleanup.actions";
import { toast } from "sonner";
import { useState } from "react";

// Dodane ticker i createdAt, aby móc odróżnić od siebie obligacje
interface HardEraseToolProps {
	assets: {
		id: string;
		name: string;
		category: string;
		ticker: string | null;
		createdAt: Date;
	}[];
}

export function HardEraseTool({ assets }: HardEraseToolProps) {
	const [selectedAssetId, setSelectedAssetId] = useState<string>("");
	const [loading, setLoading] = useState(false);

	const handleErase = async () => {
		if (!selectedAssetId) return;

		// Podwójne ostrzeżenie systemowe
		const isConfirmed = window.confirm(
			"UWAGA! Ta operacja nieodwracalnie skasuje to aktywo oraz CAŁĄ jego historię transakcji! Wykresy zostaną przeliczone na nowo.\n\nCzy na pewno chcesz kontynuować?",
		);
		if (!isConfirmed) return;

		setLoading(true);
		try {
			const res = await hardDeleteAssetWithHistory(selectedAssetId);
			if (res.success) {
				toast.success("Aktywo zostało całkowicie wymazane z systemu.");
				setSelectedAssetId("");
			} else {
				toast.error(res.error || "Nie udało się wymazać aktywa.");
			}
		} catch {
			toast.error("Wystąpił błąd krytyczny.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
			<div className="flex items-center gap-3 mb-2">
				<div className="p-2 bg-rose-500/20 rounded-lg shrink-0">
					<AlertTriangle className="w-5 h-5 text-rose-500" />
				</div>
				<div>
					<h3 className="text-sm font-black text-rose-500 uppercase tracking-widest">
						Całkowite Wymazanie (Danger Zone)
					</h3>
					<p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">
						Usuwa aktywo i jego historię. Wykresy ulegną zmianie.
					</p>
				</div>
			</div>

			<div className="flex flex-col xl:flex-row gap-4 pt-2">
				<div className="flex-1 min-w-0">
					<Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
						<SelectTrigger className="w-full bg-slate-900/80 border-slate-800 text-slate-200">
							<SelectValue placeholder="Wybierz aktywo do wymazania..." />
						</SelectTrigger>
						<SelectContent>
							{assets.map((a) => {
								// Formatuje datę dodania (przydatne przy obligacjach!)
								const dateStr = new Date(a.createdAt).toLocaleDateString(
									"pl-PL",
								);

								return (
									<SelectItem key={a.id} value={a.id}>
										<span className="font-bold">{a.name}</span>
										{a.ticker && (
											<span className="text-blue-400 ml-1">[{a.ticker}]</span>
										)}
										<span className="text-slate-500 ml-2 text-[10px] uppercase">
											({a.category})
										</span>
										<span className="text-slate-400 ml-2 text-[10px]">
											| Dodano: {dateStr}
										</span>
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				</div>

				<Button
					onClick={handleErase}
					disabled={loading || !selectedAssetId}
					className="w-full xl:w-auto h-10 px-6 rounded-lg font-black uppercase text-[10px] tracking-widest bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 shrink-0"
				>
					{loading ? (
						<Loader2 className="w-4 h-4 animate-spin mr-2" />
					) : (
						<Trash2 className="w-4 h-4 mr-2" />
					)}
					Wymaż bezpowrotnie
				</Button>
			</div>
		</div>
	);
}

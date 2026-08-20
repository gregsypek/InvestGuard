"use client";

import { Activity, Globe, Save } from "lucide-react";
import { useState, useTransition } from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { saveObservedMarkets } from "@/app/actions/observed-markets";
import { toast } from "sonner";

// EN: Static list of popular global indices
export const GLOBAL_INDICES = [
	{ id: "SP500", name: "S&P 500", ticker: "^GSPC" },
	{ id: "NASDAQ", name: "NASDAQ 100", ticker: "^IXIC" },
	{ id: "WIG20", name: "WIG20", ticker: "WIG20.WA" },
	{ id: "DAX", name: "DAX 40", ticker: "^GDAXI" },
	{ id: "GOLD", name: "Złoto (XAU/USD)", ticker: "GC=F" },
	{ id: "BTC", name: "Bitcoin", ticker: "BTC-USD" },
];

interface ObservedMarketsManagerProps {
	assets: { name: string; isObserved: boolean; category: string }[];
	maxLimit: number;
	userIndices: string[]; // EN: Current user indices from DB
}

export function ObservedMarketsManager({
	assets,
	maxLimit,
	userIndices,
}: ObservedMarketsManagerProps) {
	const [isPending, startTransition] = useTransition();

	const riskAssets = assets.filter(
		(a) => a.category !== "BONDS" && a.category !== "CASH",
	);
	const initialSelectedAssets = riskAssets
		.filter((a) => a.isObserved)
		.map((a) => a.name);

	const [selectedAssets, setSelectedAssets] = useState<string[]>(
		initialSelectedAssets,
	);
	const [selectedGlobalIndices, setSelectedGlobalIndices] = useState<string[]>(
		userIndices || [],
	);

	const hasChanges =
		JSON.stringify([...selectedAssets].sort()) !==
			JSON.stringify([...initialSelectedAssets].sort()) ||
		JSON.stringify([...selectedGlobalIndices].sort()) !==
			JSON.stringify([...(userIndices || [])].sort());

	const handleAssetToggle = (assetName: string) => {
		setSelectedAssets((prev) => {
			if (prev.includes(assetName))
				return prev.filter((name) => name !== assetName);
			if (prev.length >= maxLimit) {
				toast.error(
					`Możesz obserwować maksymalnie ${maxLimit} rynków z portfela.`,
				);
				return prev;
			}
			return [...prev, assetName];
		});
	};

	const handleIndexToggle = (indexId: string) => {
		setSelectedGlobalIndices((prev) =>
			prev.includes(indexId)
				? prev.filter((id) => id !== indexId)
				: [...prev, indexId],
		);
	};

	const handleSave = () => {
		startTransition(async () => {
			const result = await saveObservedMarkets(
				selectedAssets,
				selectedGlobalIndices,
			);
			if (result.success) toast.success("Zapisano preferencje rynkowe.");
			else toast.error(result.error);
		});
	};

	return (
		<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6">
			{/* ... Nagłówek i przycisk Zapisz tak samo jak wcześniej ... */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-blue-500/10 rounded-lg">
						<Activity className="w-5 h-5 text-blue-500" />
					</div>
					<div>
						<h3 className="font-bold text-t-text-primary">Obserwowane Rynki</h3>
						<p className="text-xs text-t-text-secondary">
							Wybierz aktywa z portfela i globalne indeksy.
						</p>
					</div>
				</div>
			</div>

			<div className="space-y-8">
				{/* SEKCJA 1: Twoje Aktywa */}
				<div>
					<h4 className="text-xs font-bold uppercase tracking-widest text-t-text-secondary mb-3 flex items-center justify-between">
						Aktywa w portfelu
						<span className="text-[10px] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-t-text-secondary">
							{selectedAssets.length} / {maxLimit}
						</span>
					</h4>
					<div className="space-y-2">
						{riskAssets.length === 0 ? (
							<p className="text-sm text-t-text-tertiary">
								Brak aktywów do obserwacji.
							</p>
						) : (
							riskAssets.map((asset) => {
								const isSelected = selectedAssets.includes(asset.name);
								return (
									<div
										key={asset.name}
										onClick={() => handleAssetToggle(asset.name)}
										className={cn(
											"flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
											isSelected
												? "border-blue-500/30 bg-blue-500/5"
												: "border-t-border hover:border-blue-500/30",
										)}
									>
										<span
											className={cn(
												"text-sm font-bold",
												isSelected ? "text-blue-500" : "text-t-text-primary",
											)}
										>
											{asset.name}
										</span>
										<div onClick={(e) => e.stopPropagation()}>
											<Switch
												checked={isSelected}
												disabled={isPending}
												onCheckedChange={() => handleAssetToggle(asset.name)}
											/>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* SEKCJA 2: Globalne Indeksy */}
				<div>
					<h4 className="text-xs font-bold uppercase tracking-widest text-t-text-secondary mb-3 flex items-center gap-2">
						<Globe className="w-4 h-4" /> Popularne Wskaźniki
					</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						{GLOBAL_INDICES.map((index) => {
							const isSelected = selectedGlobalIndices.includes(index.id);
							return (
								<div
									key={index.id}
									onClick={() => handleIndexToggle(index.id)}
									className={cn(
										"flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
										isSelected
											? "border-amber-500/30 bg-amber-500/5"
											: "border-t-border hover:border-amber-500/30",
									)}
								>
									<span
										className={cn(
											"text-sm font-bold",
											isSelected ? "text-amber-500" : "text-t-text-primary",
										)}
									>
										{index.name}
									</span>
									<div onClick={(e) => e.stopPropagation()}>
										<Switch
											checked={isSelected}
											disabled={isPending}
											onCheckedChange={() => handleIndexToggle(index.id)}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</div>
				<div className="flex justify-end">
					<button
						onClick={handleSave}
						disabled={!hasChanges || isPending}
						className={cn(
							"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:cursor-pointer",
							hasChanges && !isPending
								? "bg-blue-600 text-white hover:bg-blue-500 shadow-md"
								: "bg-black/5 dark:bg-white/5 text-t-text-tertiary cursor-not-allowed opacity-50",
						)}
					>
						<Save className="w-4 h-4" />
						{isPending ? "Zapisywanie..." : "Zapisz zmiany"}
					</button>
				</div>
			</div>
		</div>
	);
}

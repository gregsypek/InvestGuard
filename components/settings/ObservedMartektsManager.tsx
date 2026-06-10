"use client";

import { Activity, Save } from "lucide-react";
import { useState, useTransition } from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { saveObservedMarkets } from "@/app/actions/observed-markets";
import { toast } from "sonner";

interface ObservedMarketsManagerProps {
	assets: { name: string; isObserved: boolean; category: string }[];
	maxLimit: number; // PL: Dodajemy prop
}

export function ObservedMarketsManager({
	assets,
	maxLimit,
}: ObservedMarketsManagerProps) {
	const [isPending, startTransition] = useTransition();

	const riskAssets = assets.filter(
		(a) => a.category !== "BONDS" && a.category !== "CASH",
	);

	const initialSelected = riskAssets
		.filter((a) => a.isObserved)
		.map((a) => a.name);
	const [selectedMarkets, setSelectedMarkets] =
		useState<string[]>(initialSelected);

	const hasChanges =
		JSON.stringify([...selectedMarkets].sort()) !==
		JSON.stringify([...initialSelected].sort());

	const handleToggle = (assetName: string) => {
		setSelectedMarkets((prev) => {
			const isCurrentlySelected = prev.includes(assetName);

			if (isCurrentlySelected) {
				return prev.filter((name) => name !== assetName);
			} else {
				// PL: Używamy dynamicznego limitu zamiast MAX_LIMIT
				if (prev.length >= maxLimit) {
					toast.error(`Możesz obserwować maksymalnie ${maxLimit} rynki.`);
					return prev;
				}
				return [...prev, assetName];
			}
		});
	};

	const handleSave = () => {
		startTransition(async () => {
			const result = await saveObservedMarkets(selectedMarkets);

			if (result.success) {
				toast.success("Zapisano preferencje rynkowe.");
			} else {
				toast.error(result.error);
			}
		});
	};

	return (
		<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-blue-500/10 rounded-lg">
						<Activity className="w-5 h-5 text-blue-500" />
					</div>
					<div>
						<h3 className="font-bold text-t-text-primary flex items-center gap-2">
							Obserwowane Rynki
							<span className="text-[10px] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-t-text-secondary font-medium">
								{selectedMarkets.length} / {maxLimit}
							</span>
						</h3>
						<p className="text-xs text-t-text-secondary">
							Wybierz aktywa wyświetlane na głównym panelu.
						</p>
					</div>
				</div>

				{/* Przycisk Zapisz pojawia się tylko wtedy, gdy są zmiany */}
				<button
					onClick={handleSave}
					disabled={!hasChanges || isPending}
					className={cn(
						"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
						hasChanges && !isPending
							? "bg-blue-600 text-white hover:bg-blue-500 shadow-md"
							: "bg-black/5 dark:bg-white/5 text-t-text-tertiary cursor-not-allowed opacity-50",
					)}
				>
					<Save className="w-4 h-4" />
					{isPending ? "Zapisywanie..." : "Zapisz zmiany"}
				</button>
			</div>

			<div className="space-y-4">
				{riskAssets.length === 0 ? (
					<p className="text-sm text-t-text-tertiary">
						Brak aktywów do obserwacji.
					</p>
				) : (
					riskAssets.map((asset) => {
						const isSelected = selectedMarkets.includes(asset.name);

						return (
							<div
								key={asset.name}
								onClick={() => handleToggle(asset.name)}
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
										isSelected
											? "text-blue-500 dark:text-blue-400"
											: "text-t-text-primary",
									)}
								>
									{asset.name}
								</span>
								{/* Zatrzymujemy propagację, aby kliknięcie w sam switch nie dublowało kliknięcia w cały wiersz */}
								<div onClick={(e) => e.stopPropagation()}>
									<Switch
										checked={isSelected}
										disabled={isPending}
										onCheckedChange={() => handleToggle(asset.name)}
									/>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}

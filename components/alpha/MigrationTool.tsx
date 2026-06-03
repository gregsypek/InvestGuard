"use client";

import { ArrowRight, Loader2, Wrench } from "lucide-react";
import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import type { Category } from "@prisma/client";
import { migrateAssetCategory } from "@/lib/actions/cleanup.actions";
import { toast } from "sonner";
import { useState } from "react";

interface SimpleAsset {
	id: string;
	name: string;
	category: Category;
	ticker: string | null;
}

interface MigrationToolProps {
	assets: SimpleAsset[];
	categories: Category[];
	portfolioId: string;
}

export function MigrationTool({
	assets,
	categories,
	portfolioId,
}: MigrationToolProps) {
	const [selectedAssetId, setSelectedAssetId] = useState<string>("");
	const [targetCat, setTargetCat] = useState<Category>("BOOSTER");
	const [loading, setLoading] = useState(false);

	const currentAsset = assets.find((a) => a.id === selectedAssetId);

	const handleMigrate = async () => {
		if (!currentAsset) return toast.error("Wybierz aktywo z listy");

		setLoading(true);
		try {
			const res = await migrateAssetCategory(
				currentAsset.name,
				targetCat,
				portfolioId,
			);
			if (res.success) {
				toast.success(`Zaktualizowano ${currentAsset.name} do ${targetCat}`);
				setSelectedAssetId("");
			}
		} catch {
			toast.error("Błąd zapisu danych");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-t-bg-panel border border-t-border rounded-2xl p-6 shadow-sm mb-8">
			<div className="flex items-center gap-2 mb-6 text-amber-500 font-bold text-[10px] uppercase tracking-widest">
				<Wrench size={14} className="text-amber-500" />
				Narzędzie systemowe: Porządkowanie kategorii
			</div>

			<div className="flex flex-col md:flex-row items-center gap-4 w-full">
				{/* SELECT 1: WYBÓR AKTYWA */}
				<div className="flex-1 w-full">
					<Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
						<SelectTrigger className="h-12 rounded-xl bg-black/5 dark:bg-t-bg-base border-t-border text-t-text-primary">
							<SelectValue placeholder="Wybierz aktywo do migracji..." />
						</SelectTrigger>
						<SelectContent>
							{assets.map((asset) => (
								<SelectItem key={asset.id} value={asset.id}>
									<div className="flex items-center gap-3 py-1">
										<div
											className="w-2 h-2 rounded-full shrink-0 border border-t-border-subtle"
											style={{
												backgroundColor:
													COLORS[asset.category as keyof typeof COLORS],
											}}
										/>
										<div className="flex flex-col items-start leading-tight">
											<span className="text-xs font-bold text-t-text-primary">
												{asset.name}
											</span>
											<span className="text-[9px] font-medium text-t-text-tertiary uppercase tracking-wider mt-0.5">
												Aktualnie:{" "}
												{CATEGORY_LABELS[
													asset.category as keyof typeof CATEGORY_LABELS
												] || asset.category}
											</span>
										</div>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<ArrowRight
					size={18}
					className="text-t-text-tertiary hidden md:block shrink-0"
				/>

				{/* SELECT 2: WYBÓR DOCELOWEJ KATEGORII */}
				<div className="w-full md:w-auto">
					<Select
						value={targetCat}
						onValueChange={(v) => setTargetCat(v as Category)}
					>
						<SelectTrigger className="h-12 md:w-[220px] rounded-xl bg-black/5 dark:bg-t-bg-base border-t-border text-t-text-primary font-bold text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{categories.map((c) => (
								<SelectItem key={c} value={c}>
									<div className="flex items-center gap-2">
										<div
											className="w-2 h-2 rounded-full border border-t-border-subtle"
											style={{
												backgroundColor: COLORS[c as keyof typeof COLORS],
											}}
										/>
										<span className="text-xs font-bold uppercase tracking-wider text-t-text-secondary">
											{CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] || c}
										</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="w-full md:w-auto">
					<Button
						onClick={handleMigrate}
						disabled={loading || !selectedAssetId}
						className="w-full md:w-auto h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-amber-600 hover:bg-amber-600 text-slate-950 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							"Uruchom migrację"
						)}
					</Button>
				</div>
			</div>

			<p className="mt-4 text-[10px] text-t-text-tertiary uppercase tracking-widest font-bold">
				* Uwaga: Operacja zaktualizuje kategorię aktywa oraz wszystkich
				powiązanych wpisów w historii transakcji.
			</p>
		</div>
	);
}

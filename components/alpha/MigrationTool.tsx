"use client";

import {
	AlertCircle,
	ArrowRight,
	CheckSquare,
	Loader2,
	Square,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { migrateAssetCategory } from "@/lib/actions/cleanup.actions";
import { toast } from "sonner";
import { useState } from "react";

interface SimpleAsset {
	id: string;
	name: string;
	category: Category;
	ticker: string | null;
}

interface BulkMigrationToolProps {
	assets: SimpleAsset[];
	categories: Category[];
	portfolioId: string;
}

export function BulkMigrationTool({
	assets,
	categories,
	portfolioId,
}: BulkMigrationToolProps) {
	// Stan dla zaznaczonych aktywów
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [targetCat, setTargetCat] = useState<Category>("BOOSTER");
	const [loading, setLoading] = useState(false);

	const toggleAsset = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((aId) => aId !== id) : [...prev, id],
		);
	};

	const selectAll = () => {
		if (selectedIds.length === assets.length) setSelectedIds([]);
		else setSelectedIds(assets.map((a) => a.id));
	};

	const handleMigrate = async () => {
		if (selectedIds.length === 0)
			return toast.error("Zaznacz minimum jedno aktywo");

		setLoading(true);
		try {
			// Wykonujemy migrację dla wszystkich zaznaczonych asseetów równolegle
			const promises = selectedIds.map((id) => {
				const asset = assets.find((a) => a.id === id);
				if (!asset) return Promise.resolve(null);
				return migrateAssetCategory(asset.name, targetCat, portfolioId);
			});

			const results = await Promise.all(promises);

			const successCount = results.filter((r) => r && r.success).length;

			if (successCount > 0) {
				toast.success(`Pomyślnie zmigrowano ${successCount} aktywów!`);
				setSelectedIds([]); // Czyścimy po sukcesie
			} else {
				toast.error("Migracja się nie powiodła.");
			}
		} catch (error) {
			toast.error("Wystąpił błąd podczas migracji");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-t-bg-panel border border-t-border rounded-2xl p-5 space-y-5 shadow-sm">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
					<ArrowRight className="w-4 h-4 text-blue-500" /> Masowa Migracja
					Kategorii
				</h3>
				<button
					onClick={selectAll}
					className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200"
				>
					{selectedIds.length === assets.length
						? "Odznacz wszystkie"
						: "Zaznacz wszystkie"}
				</button>
			</div>

			{/* Lista checkboxów */}
			<div className="max-h-80 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
				{assets.length === 0 ? (
					<p className="text-xs text-slate-500 italic py-4 text-center">
						Brak aktywów do migracji.
					</p>
				) : (
					assets.map((asset) => {
						const isSelected = selectedIds.includes(asset.id);
						const categoryColor =
							COLORS[asset.category as keyof typeof COLORS] || "#0a0a0a";

						return (
							<div
								key={asset.id}
								onClick={() => toggleAsset(asset.id)}
								className={cn(
									"flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
									isSelected
										? "bg-blue-500/10 border-blue-500/30"
										: "bg-t-bg-sticky border-t-border-subtle hover:border-t-border",
								)}
							>
								<div className="flex items-center gap-3">
									{isSelected ? (
										<CheckSquare className="w-4 h-4 text-blue-500" />
									) : (
										// EN: Using a theme-aware color for the unselected checkbox
										<Square className="w-4 h-4 text-t-text-tertiary" />
									)}
									{/* EN: Using primary text color so it adapts to light/dark mode */}
									<span className="text-sm font-bold text-t-text-primary">
										{asset.name}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: categoryColor }}
									/>
									{/* EN: Using tertiary text color for the category label */}
									<span className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest">
										{CATEGORY_LABELS[
											asset.category as keyof typeof CATEGORY_LABELS
										] || asset.category}
									</span>
								</div>
							</div>
						);
					})
				)}
			</div>

			{/* Panel akcji */}
			<div className="flex flex-col md:flex-row gap-4 items-center pt-4 border-t border-t-border">
				<div className="flex-1 w-full flex items-center gap-3">
					<span className="text-xs font-bold text-slate-500 whitespace-nowrap">
						Nowa kategoria:
					</span>
					<Select
						value={targetCat}
						onValueChange={(val) => setTargetCat(val as Category)}
					>
						<SelectTrigger className="w-full bg-slate-900 border-slate-700 text-slate-200 font-bold text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{categories.map((c) => (
								<SelectItem key={c} value={c}>
									{CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] || c}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Button
					onClick={handleMigrate}
					disabled={loading || selectedIds.length === 0}
					className="w-full md:w-auto h-10 px-6 rounded-lg font-black uppercase text-[10px] tracking-widest bg-amber-600 hover:bg-amber-500 text-slate-950 disabled:opacity-50"
				>
					{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
					Zmigruj ({selectedIds.length})
				</Button>
			</div>
		</div>
	);
}

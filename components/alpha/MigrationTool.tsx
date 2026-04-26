"use client";

import { ArrowRight, Loader2, Wrench } from "lucide-react";
import { Asset, Category } from "@prisma/client";
import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { migrateAssetCategory } from "@/lib/actions/cleanup.actions";
import { toast } from "sonner";
import { useState } from "react";

interface MigrationToolProps {
	assets: Asset[];
	categories: string[];
}

export function MigrationTool({ assets, categories }: MigrationToolProps) {
	// 1. Pierwszy select pusty (Wybierz aktywo...)
	const [selectedAssetId, setSelectedAssetId] = useState<string>("");
	// 2. Domyślnie ustawiony BOOSTER jako cel
	const [targetCat, setTargetCat] = useState<Category>("BOOSTER");
	const [loading, setLoading] = useState(false);

	const currentAsset = assets.find((a) => a.id === selectedAssetId);

	const handleMigrate = async () => {
		if (!currentAsset) return toast.error("Wybierz aktywo z listy");

		setLoading(true);
		try {
			const res = await migrateAssetCategory(currentAsset.name, targetCat);
			if (res.success) {
				toast.success(`Zaktualizowano ${currentAsset.name} do ${targetCat}`);
				setSelectedAssetId(""); // Reset po sukcesie
			}
		} catch {
			toast.error("Błąd zapisu danych");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-5 bg-amber-500/8 border border-amber-500/20 rounded-3xl mb-8">
			<div className="flex items-center gap-2 mb-4 text-amber-600 font-black text-[10px] uppercase tracking-[0.2em]">
				<Wrench size={14} className="text-amber-500" />
				Narzędzie porządkowania kategorii
			</div>

			<div className="flex flex-col md:flex-row items-center gap-4 w-full flex-wrap">
				{/* SELECT 1: WYBÓR AKTYWA */}
				<div className="flex-1 min-w-75 w-full">
					<Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
						<SelectTrigger className="h-12 rounded-2xl bg-background border-border/50">
							<SelectValue placeholder="Wybierz aktywo, które chcesz zmienić" />
						</SelectTrigger>
						<SelectContent>
							{assets.map((asset) => (
								<SelectItem key={asset.id} value={asset.id}>
									<div className="flex items-center gap-3">
										{/* TWOJA KROPKA: Kolor obecnej kategorii */}
										<div
											className="w-2 h-2 rounded-full shrink-0"
											style={{
												backgroundColor:
													COLORS[asset.category as keyof typeof COLORS],
											}}
										/>
										<div className="flex flex-col">
											<span className="text-xs font-bold">{asset.name}</span>
											<span className="text-[9px] text-muted-foreground uppercase">
												Obecnie:{" "}
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
					size={16}
					className="text-muted-foreground opacity-30 shrink-0 hidden md:block"
				/>

				{/* SELECT 2: WYBÓR DOCELOWEJ KATEGORII */}
				<div className="">
					<Select
						value={targetCat}
						onValueChange={(v) => setTargetCat(v as Category)}
					>
						<SelectTrigger className="h-12 rounded-2xl bg-background border-border/50 font-bold text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{categories.map((c) => (
								<SelectItem key={c} value={c}>
									<div className="flex items-center gap-2">
										{/* TWOJA KROPKA: Kolor docelowej kategorii */}
										<div
											className="w-2 h-2 rounded-full"
											style={{
												backgroundColor: COLORS[c as keyof typeof COLORS],
											}}
										/>
										<span className="text-xs font-bold uppercase">
											{CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] || c}
										</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Button
						onClick={handleMigrate}
						disabled={loading || !selectedAssetId}
						className="w-full md:w-auto h-10 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-lg shadow-amber-600/20"
					>
						{loading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							"Zmień kategorię"
						)}
					</Button>
				</div>
			</div>
			<p className="mt-3 text-[11px] text-muted-foreground font-medium px-1 italic">
				* To narzędzie zaktualizuje kategorię wybranego aktywa oraz wszystkich
				powiązanych z nim wpisów w historii transakcji.
			</p>
		</div>
	);
}

"use client";

// Importy dla Dropdown i Dialog (Edycja)
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Trash2, UserCheck } from "lucide-react";
import {
	deleteAssetAction,
	updateAlphaDetails,
} from "@/lib/actions/asset-actions";

import type { Asset } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import PremiumDeleteModal from "../shared/PremiumDeleteModal";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

export function BoosterActionsClient({ asset }: { asset: Asset }) {
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // Nowy stan dla modala usuwania
	const [isPending, setIsPending] = useState(false);

	// Stany dla edycji
	const [newConviction, setNewConviction] = useState(asset.conviction || 50);
	const [newRationale, setNewRationale] = useState(asset.rationale || "");

	const handleUpdate = async () => {
		setIsPending(true);
		const res = await updateAlphaDetails(asset.id, newConviction, newRationale);
		if (res.success) {
			toast.success("Teza zaktualizowana", {
				description: `Nowe parametry dla ${asset.ticker} zostały zapisane.`,
			});
			setIsEditDialogOpen(false);
		} else {
			toast.error("Wystąpił błąd", { description: res.error });
		}
		setIsPending(false);
	};

	return (
		<>
			{/* MENU ROZWIJANE */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-muted-foreground hover:bg-t-border hover:text-blue-500 transition-colors cursor-pointer"
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-48 p-1 rounded-xl shadow-xl bg-t-bg-panel border-t-border"
				>
					<DropdownMenuLabel className="px-2.5 py-2 text-[10px] font-black uppercase tracking-widest text-t-text-tertiary">
						Zarządzaj
					</DropdownMenuLabel>
					<DropdownMenuSeparator className="bg-t-border-subtle" />

					<DropdownMenuItem
						onClick={() => setIsEditDialogOpen(true)}
						className="gap-2 p-2.5 cursor-pointer rounded-lg text-t-text-secondary hover:text-t-text-primary hover:bg-t-hover font-medium text-xs transition-colors"
					>
						<UserCheck className="h-4 w-4 text-blue-500" /> Edytuj tezę
					</DropdownMenuItem>

					{/* Zmieniono akcję: Otwiera nasz nowy modal zamiast native confirm() */}
					<DropdownMenuItem
						onClick={() => setIsDeleteDialogOpen(true)}
						className="gap-2 p-2.5 cursor-pointer rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 font-medium text-xs transition-colors"
					>
						<Trash2 className="h-4 w-4" /> Usuń pozycję
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* ======================================================== */}
			{/* 1. DIALOG EDYCJI TEZY 																   */}
			{/* ======================================================== */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				{/*  Dodane w-[95vw] dla ochrony na małych ekranach mobilnych */}
				<DialogContent className="w-[95vw] max-w-md sm:max-w-md rounded-2xl bg-t-bg-panel border-t-border shadow-2xl p-6 sm:p-8">
					<DialogHeader>
						<DialogTitle className="text-xl font-black uppercase tracking-tight text-t-text-primary">
							Aktualizacja Tezy
						</DialogTitle>
						<DialogDescription className="text-sm font-medium text-t-text-tertiary">
							Dostosuj parametry i uzasadnienie dla{" "}
							<strong className="text-t-text-secondary">
								{asset.name} ({asset.ticker})
							</strong>
							.
						</DialogDescription>
					</DialogHeader>

					{/*  Zastąpiono 'grid' bezpieczniejszym 'flex flex-col' */}
					<div className="flex flex-col gap-6 py-4">
						<div className="flex flex-col gap-4">
							<div className="flex justify-between items-center">
								<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
									Przekonanie (Conviction)
								</Label>
								<span className="text-xs font-black text-blue-500">
									{newConviction}%
								</span>
							</div>
							<Slider
								value={[newConviction]}
								min={1}
								max={100}
								step={1}
								onValueChange={(vals) => setNewConviction(vals[0])}
								className="w-full py-2"
							/>
						</div>

						<div className="flex flex-col gap-3">
							<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
								Uzasadnienie (Teza)
							</Label>
							<Textarea
								value={newRationale}
								onChange={(e) => setNewRationale(e.target.value)}
								className="w-full min-h-[120px] resize-none bg-black/5 dark:bg-white/5 border border-t-border-subtle focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-t-text-primary"
								placeholder="Dlaczego ta spółka podbije Twój wynik?"
							/>
						</div>
					</div>

					<DialogFooter className="pt-4 border-t border-t-border-subtle">
						<Button
							onClick={handleUpdate}
							disabled={isPending}
							className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-md transition-all"
						>
							{isPending ? (
								<Loader2 className="animate-spin h-4 w-4" />
							) : (
								"Zapisz zmiany"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{/* ======================================================== */}
			{/* 2. WYWOŁANIE UNIWERSALNEGO MODALA USUWANIA               */}
			{/* ======================================================== */}
			<PremiumDeleteModal
				isOpen={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				// Jeśli masz dostęp do isDemo w Boosterze, przekaż go tutaj. Jak nie, daj false.
				isDemo={false}
				title="Potwierdź usunięcie"
				description={`Czy na pewno chcesz bezpowrotnie usunąć aktywo ${asset.name} (${asset.ticker})? Tej operacji nie można cofnąć, a historia transakcji zostanie wykasowana.`}
				onConfirm={async () => {
					// Tutaj wrzucamy akcję. Modal zajmie się kółkiem ładowania!
					const res = await deleteAssetAction(asset.id);
					if (res.success) {
						toast.success("Usunięto pomyślnie", {
							description: `Aktywo ${asset.name} zostało usunięte.`,
						});
						setIsDeleteDialogOpen(false);
					} else {
						throw new Error(res.error || "Nie udało się usunąć elementu.");
					}
				}}
			/>
		</>
	);
}

"use client";

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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

export function BoosterActionsClient({ asset }: { asset: Asset }) {
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);

	// Stany dla edycji
	const [newConviction, setNewConviction] = useState(asset.conviction || 50);
	const [newRationale, setNewRationale] = useState(asset.rationale || "");

	const handleDelete = async () => {
		if (!confirm(`Czy na pewno chcesz trwale usunąć ${asset.name} z portfela?`))
			return;

		setIsPending(true);
		const res = await deleteAssetAction(asset.id);
		if (res.success) toast.success("Usunięto aktywo");
		else toast.error(res.error);
		setIsPending(false);
	};

	const handleUpdate = async () => {
		setIsPending(true);
		const res = await updateAlphaDetails(asset.id, newConviction, newRationale);
		if (res.success) {
			toast.success("Teza zaktualizowana");
			setIsEditDialogOpen(false);
		} else {
			toast.error(res.error);
		}
		setIsPending(false);
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-48 p-1 rounded-xl shadow-xl"
				>
					<DropdownMenuLabel className="px-2.5 py-2 text-xs font-black uppercase opacity-50">
						Zarządzaj
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => setIsEditDialogOpen(true)}
						className="gap-2 p-2.5 cursor-pointer rounded-lg"
					>
						<UserCheck className="h-4 w-4 text-emerald-600" /> Edytuj tezę
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={handleDelete}
						className="gap-2 p-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-500/10"
					>
						<Trash2 className="h-4 w-4" /> Usuń pozycję
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* DIALOG EDYCJI */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-106 rounded-3xl">
					<DialogHeader>
						<DialogTitle className="text-xl font-black uppercase tracking-tight">
							Aktualizacja Tezy
						</DialogTitle>
						<DialogDescription>
							Dostosuj parametry dla {asset.name} ({asset.ticker}).
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-6 py-4">
						<div className="space-y-4">
							<div className="flex justify-between">
								<Label className="font-bold">
									Przekonanie: {newConviction}%
								</Label>
							</div>
							<Slider
								value={[newConviction]}
								min={1}
								max={100}
								step={1}
								onValueChange={(vals) => setNewConviction(vals[0])}
							/>
						</div>
						<div className="space-y-2">
							<Label className="font-bold">Uzasadnienie (Teza)</Label>
							<Textarea
								value={newRationale}
								onChange={(e) => setNewRationale(e.target.value)}
								className="min-h-30 resize-none bg-muted/30"
								placeholder="Dlaczego nadal trzymasz tę pozycję?"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							onClick={handleUpdate}
							disabled={isPending}
							className="w-full bg-primary font-bold uppercase tracking-widest text-xs h-12 rounded-xl"
						>
							{isPending ? (
								<Loader2 className="animate-spin" />
							) : (
								"Zapisz zmiany"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

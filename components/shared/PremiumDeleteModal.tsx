"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface PremiumDeleteModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => Promise<void> | void; // Przyjmuje asynchroniczne funkcje!
	title?: string;
	description?: string;
	isDemo?: boolean;
}

export default function PremiumDeleteModal({
	isOpen,
	onClose,
	onConfirm,
	title = "Potwierdź usunięcie",
	description = "Czy na pewno chcesz bezpowrotnie usunąć ten element? Tej operacji nie można cofnąć.",
	isDemo = false,
}: PremiumDeleteModalProps) {
	// Wewnętrzny stan ładowania – rodzic nie musi się tym przejmować!
	const [isDeleting, setIsDeleting] = useState(false);

	const handleConfirmAction = async () => {
		// 1. Ochrona przed trybem DEMO
		if (isDemo) {
			toast.error("Akcja zablokowana", {
				description: "Usuwanie danych jest wyłączone w trybie demonstracyjnym.",
				icon: <Lock className="h-4 w-4 text-rose-500" />,
			});
			onClose();
			return;
		}

		// 2. Włączenie wewnętrznego Loadera
		setIsDeleting(true);

		try {
			// 3. Oczekiwanie na zakończenie akcji (jeśli jest asynchroniczna)
			await onConfirm();
		} finally {
			// 4. Wyłączenie Loadera (nawet jeśli wystąpił błąd)
			setIsDeleting(false);
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<AlertDialogContent className="bg-t-bg-panel border-t-border-subtle shadow-2xl sm:rounded-2xl max-w-md p-0 overflow-hidden">
				<div className="h-2 w-full bg-rose-500" />

				<div className="p-6 sm:p-8 space-y-6">
					<AlertDialogHeader className="space-y-4 text-left">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-rose-500/10 rounded-2xl shrink-0">
								<AlertTriangle className="h-6 w-6 text-rose-500" />
							</div>
							<AlertDialogTitle className="text-xl font-black tracking-tight text-t-text-primary">
								{title}
							</AlertDialogTitle>
						</div>
						<AlertDialogDescription className="text-sm font-medium text-t-text-tertiary leading-relaxed pt-2">
							{description}
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter className="flex sm:justify-end gap-3 pt-4 border-t border-t-border-subtle">
						<AlertDialogCancel
							disabled={isDeleting}
							className="mt-0 h-11 px-6 rounded-xl border-t-border-subtle bg-black/5 dark:bg-white/5 hover:bg-t-hover text-t-text-secondary font-bold uppercase tracking-widest text-[10px] transition-colors"
						>
							Anuluj
						</AlertDialogCancel>

						{/* Przycisk akcji z zintegrowanym Loaderem */}
						<Button
							onClick={handleConfirmAction}
							disabled={isDeleting}
							className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md font-bold uppercase tracking-widest text-[10px] transition-colors"
						>
							{isDeleting ? (
								<span className="flex items-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									Usuwanie...
								</span>
							) : (
								"Usuń bezpowrotnie"
							)}
						</Button>
					</AlertDialogFooter>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}

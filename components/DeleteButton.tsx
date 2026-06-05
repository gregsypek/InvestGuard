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
import { AlertTriangle, Loader2, Lock, Trash2 } from "lucide-react";
import { forwardRef, useState } from "react";

import { ActionResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DeleteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	id: string;
	onDelete: (id: string) => Promise<ActionResponse>;
	confirmMsg?: string;
	title?: string;
	label?: string;
	isDemo?: boolean;
}

export const DeleteButton = forwardRef<HTMLButtonElement, DeleteButtonProps>(
	(
		{
			id,
			onDelete,
			confirmMsg = "Czy na pewno chcesz usunąć ten element? Tej operacji nie można cofnąć.",
			title = "Potwierdź usunięcie",
			label,
			isDemo,
			className,
			...props
		},
		ref,
	) => {
		const [isDeleting, setIsDeleting] = useState(false);
		const [isOpen, setIsOpen] = useState(false);

		// Zamiast automatycznego wyzwalacza z Radix UI, używamy własnej funkcji kliknięcia,
		// żeby najpierw sprawdzić, czy nie jesteśmy w trybie Demo.
		const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
			props.onClick?.(e);
			e.preventDefault();
			e.stopPropagation();

			if (isDemo) {
				toast.error("Akcja zablokowana", {
					description: "Usuwanie jest wyłączone w trybie edukacyjnym.",
					icon: <Lock className="h-4 w-4 text-rose-500" />,
				});
				return;
			}

			setIsOpen(true);
		};

		const handleDelete = async (e: React.MouseEvent) => {
			e.preventDefault();
			setIsDeleting(true);

			try {
				const result = await onDelete(id);

				// Weryfikacja oparta o oryginalny system obiektów { success, error }
				if (result && result.success) {
					toast.success("Usunięto pomyślnie!");
					setIsOpen(false);
				} else if (result && !result.success) {
					toast.error("Wystąpił błąd", {
						description: result.error || "Nie można usunąć elementu.",
					});
					setIsOpen(false); // Możesz zostawić na true, żeby modal się nie zamknął przy błędzie
				} else {
					// Fallback
					setIsOpen(false);
				}
			} catch (error: any) {
				// MAGIA NEXT.JS: Wyłapujemy błąd przekierowania
				const isRedirect =
					error?.message === "NEXT_REDIRECT" ||
					error?.digest?.startsWith("NEXT_REDIRECT");

				if (isRedirect) {
					// SKORO JEST PRZEKIEROWANIE, TO ZNACZY ŻE AKCJA SIĘ UDAŁA!
					// Wywołujemy toasta tuż przed zmianą strony:
					toast.success("Usunięto pomyślnie!");
					setIsOpen(false);
					throw error; // To pozwoli na naturalną zmianę strony
				}

				// Jeśli to był faktyczny błąd bazy danych:
				console.error("Błąd podczas usuwania:", error);
				toast.error("Wystąpił błąd krytyczny", {
					description: "Nie udało się połączyć z bazą danych.",
				});
				setIsOpen(false);
			} finally {
				setIsDeleting(false);
			}
		};

		return (
			<>
				{/* NASZ PRZYCISK WYWOŁUJĄCY */}
				<button
					ref={ref}
					{...props}
					onClick={handleTriggerClick}
					className={cn(
						"p-2 text-t-text-tertiary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all flex items-center gap-2 group cursor-pointer",
						className,
					)}
					title="Usuń"
				>
					<Trash2 className="h-4 w-4 transition-transform group-hover:scale-110 shrink-0" />
					{label && <span className="font-medium text-xs">{label}</span>}
				</button>

				{/* PREMIUM MODAL */}
				<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
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
									{confirmMsg}
								</AlertDialogDescription>
							</AlertDialogHeader>

							<AlertDialogFooter className="flex sm:justify-end gap-3 pt-4 border-t border-t-border-subtle">
								<AlertDialogCancel
									disabled={isDeleting}
									className="mt-0 h-11 px-6 rounded-xl border-t-border-subtle bg-black/5 dark:bg-white/5 hover:bg-t-hover text-t-text-secondary font-bold uppercase tracking-widest text-[10px] transition-colors"
								>
									Anuluj
								</AlertDialogCancel>
								<Button
									onClick={handleDelete}
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
			</>
		);
	},
);

// EN: Adding display name is a good practice for forwardRef components
// UI: Dodanie displayName to dobra praktyka przy komponentach forwardRef

DeleteButton.displayName = "DeleteButton";

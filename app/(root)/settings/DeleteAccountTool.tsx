import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteMyAccount } from "@/app/actions/user";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useState } from "react";

// Zauważ nowe propsy, które przekażesz z SettingsClient: hasPassword i isTwoFactorEnabled
export function DeleteAccountTool({
	hasPassword,
	isTwoFactorEnabled,
}: {
	hasPassword: boolean;
	isTwoFactorEnabled: boolean;
}) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [confirmValue, setConfirmValue] = useState(""); // Zmienna na hasło lub kod 2FA

	const handleDelete = async () => {
		// Walidacja front-endowa
		if ((hasPassword || isTwoFactorEnabled) && !confirmValue) {
			toast.error(isTwoFactorEnabled ? "Wprowadź kod 2FA" : "Wprowadź hasło");
			return;
		}

		setIsDeleting(true);
		try {
			await deleteMyAccount(confirmValue); // Wysyłamy hasło/kod do backendu
			toast.success("Konto zostało trwale usunięte.");
			await signOut({ callbackUrl: "/" });
		} catch (error: any) {
			toast.error(error.message || "Wystąpił błąd podczas usuwania konta.");
			setIsDeleting(false);
		}
	};

	return (
		<>
			{/* PRZYCISK TRIGGER */}
			<button
				onClick={() => setIsOpen(true)}
				disabled={isDeleting}
				className="w-full md:w-auto shrink-0 h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
			>
				{isDeleting ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					<Trash2 className="w-4 h-4" />
				)}
				{isDeleting ? "Usuwanie..." : "Usuń konto"}
			</button>

			{/* MODAL */}
			<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
				<AlertDialogContent className="bg-t-bg-panel border border-rose-500/20 shadow-2xl shadow-rose-900/20 overflow-hidden sm:rounded-2xl">
					<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0" />

					<div className="p-2 space-y-4">
						<AlertDialogHeader>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
									<AlertTriangle className="w-5 h-5 text-rose-500" />
								</div>
								<AlertDialogTitle className="text-lg font-black tracking-tight text-t-text-primary">
									Potwierdź usunięcie konta
								</AlertDialogTitle>
							</div>
							<AlertDialogDescription className="text-sm font-medium text-t-text-tertiary leading-relaxed pt-2">
								UWAGA! Ta operacja nieodwracalnie skasuje Twoje konto,
								ustawienia oraz{" "}
								<strong>całą historię Twoich portfeli i aktywów</strong>. Tej
								operacji nie można cofnąć.
							</AlertDialogDescription>
						</AlertDialogHeader>

						{/* WARUNKOWY INPUT DLA KODU LUB HASŁA */}
						{(hasPassword || isTwoFactorEnabled) && (
							<div className="pt-2">
								<label className="text-[11px] font-bold uppercase tracking-widest text-t-text-tertiary ml-1 mb-2 block">
									Autoryzacja (
									{isTwoFactorEnabled ? "Wymagany kod 2FA" : "Wymagane hasło"})
								</label>
								<input
									type={isTwoFactorEnabled ? "text" : "password"}
									maxLength={isTwoFactorEnabled ? 6 : undefined}
									placeholder={
										isTwoFactorEnabled
											? "000 000"
											: "Wpisz swoje obecne hasło..."
									}
									value={confirmValue}
									onChange={(e) =>
										setConfirmValue(
											isTwoFactorEnabled
												? e.target.value.replace(/\D/g, "")
												: e.target.value,
										)
									}
									className="w-full px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-sm font-medium text-t-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-t-text-tertiary/50"
								/>
							</div>
						)}

						<AlertDialogFooter className="flex sm:justify-end gap-3 pt-6 border-t border-t-border-subtle mt-4">
							<AlertDialogCancel
								disabled={isDeleting}
								className="mt-0 h-11 px-6 rounded-xl border-t-border-subtle bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-t-text-secondary font-bold uppercase tracking-widest text-[10px] transition-colors"
							>
								Anuluj
							</AlertDialogCancel>
							<Button
								onClick={handleDelete}
								disabled={
									isDeleting ||
									((hasPassword || isTwoFactorEnabled) && !confirmValue)
								}
								className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 disabled:opacity-50"
							>
								{isDeleting ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Usuwanie...
									</>
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
}

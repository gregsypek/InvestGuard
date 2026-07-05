"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { changeUserPassword } from "@/app/actions/user";
import { toast } from "sonner";
import { useState } from "react";

export function ChangePasswordModal({ hasPassword }: { hasPassword: boolean }) {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (newPassword.length < 6) {
			setError("Nowe hasło musi mieć co najmniej 6 znaków.");
			return;
		}

		setIsLoading(true);
		try {
			await changeUserPassword(oldPassword, newPassword);
			setSuccess(true);
			toast.success("Hasło zostało pomyślnie zmienione!");

			// Zamykamy modal po 2 sekundach i resetujemy stan
			setTimeout(() => {
				setIsOpen(false);
				setSuccess(false);
				setOldPassword("");
				setNewPassword("");
			}, 2000);
		} catch (err: any) {
			setError(err.message || "Wystąpił błąd.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<button
					disabled={!hasPassword}
					className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg text-xs font-bold text-t-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{hasPassword ? "Zmień hasło" : "Konto Google"}
				</button>
			</AlertDialogTrigger>

			<AlertDialogContent className="bg-t-bg-panel border border-t-border-subtle shadow-2xl sm:rounded-2xl">
				{/* Niebieski akcent */}
				<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0" />

				<form onSubmit={handleSubmit} className="p-2 space-y-4">
					<AlertDialogHeader>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
								<Lock className="w-5 h-5 text-blue-500" />
							</div>
							<AlertDialogTitle className="text-lg font-black tracking-tight text-t-text-primary">
								Zmień hasło
							</AlertDialogTitle>
						</div>
						<AlertDialogDescription className="text-sm font-medium text-t-text-tertiary leading-relaxed pt-2">
							Wprowadź swoje obecne hasło, a następnie zdefiniuj nowe.
						</AlertDialogDescription>
					</AlertDialogHeader>

					{success ? (
						<div className="py-6 flex flex-col items-center justify-center gap-3 text-emerald-500 animate-in zoom-in">
							<CheckCircle2 className="w-12 h-12" />
							<p className="font-bold text-sm">Hasło zostało zmienione!</p>
						</div>
					) : (
						<div className="space-y-3 py-4">
							<input
								type="password"
								placeholder="Obecne hasło"
								required
								value={oldPassword}
								onChange={(e) => setOldPassword(e.target.value)}
								className="w-full px-4 py-3 rounded-xl border border-t-border-subtle bg-black/5 dark:bg-white/5 text-sm text-t-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-t-text-tertiary"
							/>
							<input
								type="password"
								placeholder="Nowe hasło (min. 6 znaków)"
								required
								minLength={6}
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="w-full px-4 py-3 rounded-xl border border-t-border-subtle bg-black/5 dark:bg-white/5 text-sm text-t-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-t-text-tertiary"
							/>
							{error && (
								<p className="text-xs text-rose-500 font-medium text-center">
									{error}
								</p>
							)}
						</div>
					)}

					{!success && (
						<AlertDialogFooter className="flex sm:justify-end gap-3 pt-4 border-t border-t-border-subtle">
							<AlertDialogCancel
								type="button"
								disabled={isLoading}
								className="mt-0 h-11 px-6 rounded-xl border-t-border-subtle bg-black/5 dark:bg-white/5 hover:bg-t-hover text-t-text-secondary font-bold uppercase tracking-widest text-[10px] transition-colors"
							>
								Anuluj
							</AlertDialogCancel>
							<Button
								type="submit"
								disabled={isLoading || !oldPassword || !newPassword}
								className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2"
							>
								{isLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									"Zapisz zmianę"
								)}
							</Button>
						</AlertDialogFooter>
					)}
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}

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
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
// Importujemy prawdziwe funkcje backendowe
import {
	disableTwoFactor,
	setupTwoFactor,
	verifyAndEnableTwoFactor,
} from "@/app/actions/2fa";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";

export function TwoFactorManager({
	initialEnabled = false,
}: {
	initialEnabled?: boolean;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [code, setCode] = useState("");
	const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSetupComplete, setIsSetupComplete] = useState(initialEnabled);

	const handleOpenSetup = async () => {
		setIsOpen(true);
		setIsLoading(true);
		try {
			// Pobieramy kod QR z backendu
			const res = await setupTwoFactor();
			setQrCodeUrl(res.qrCodeDataUrl);
		} catch (error) {
			toast.error("Nie udało się wygenerować kodu QR.");
			setIsOpen(false);
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault();
		if (code.length !== 6) {
			toast.error("Kod weryfikacyjny musi składać się z 6 cyfr.");
			return;
		}

		setIsLoading(true);
		try {
			// Prawdziwa weryfikacja kodu z Google Authenticator
			await verifyAndEnableTwoFactor(code);

			setIsSetupComplete(true);
			setIsOpen(false);
			setCode("");
			toast.success("Uwierzytelnianie 2FA zostało pomyślnie włączone!");
		} catch (error: any) {
			toast.error(error.message || "Błędny kod. Spróbuj ponownie.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDisable = async () => {
		const confirmed = window.confirm(
			"Czy na pewno chcesz wyłączyć uwierzytelnianie dwuetapowe (2FA)? Znacznie obniży to bezpieczeństwo Twojego konta.",
		);
		if (!confirmed) return;

		try {
			await disableTwoFactor();
			setIsSetupComplete(false);
			toast.info("Zabezpieczenie 2FA zostało wyłączone.");
		} catch (error) {
			toast.error("Wystąpił błąd podczas wyłączania 2FA.");
		}
	};

	return (
		<>
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-t-bg-panel border border-t-border-subtle hover:border-blue-500/30 transition-colors group gap-4">
				<div className="flex items-center gap-4">
					<div
						className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${
							isSetupComplete
								? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
								: "bg-black/5 dark:bg-white/5 border-t-border-subtle text-t-text-tertiary group-hover:text-blue-500 group-hover:border-blue-500/30"
						}`}
					>
						<ShieldCheck className="w-6 h-6" />
					</div>
					<div>
						<p className="text-sm font-bold text-t-text-primary transition-colors">
							Aplikacja Authenticator (2FA)
						</p>
						<p className="text-xs font-medium text-t-text-tertiary mt-0.5 leading-relaxed max-w-sm">
							{isSetupComplete
								? "Twoje konto jest aktywnie chronione jednorazowymi kodami z aplikacji."
								: "Zabezpiecz konto za pomocą Google Authenticator lub Authy."}
						</p>
					</div>
				</div>

				<button
					onClick={isSetupComplete ? handleDisable : handleOpenSetup}
					className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
						isSetupComplete
							? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
							: "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
					}`}
				>
					{isSetupComplete ? "Wyłącz 2FA" : "Skonfiguruj"}
				</button>
			</div>

			<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
				<AlertDialogContent className="bg-t-bg-panel border border-t-border-subtle shadow-2xl sm:rounded-2xl max-w-md">
					<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0" />

					<form onSubmit={handleVerify} className="p-2 space-y-6">
						<AlertDialogHeader>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
									<Smartphone className="w-5 h-5 text-blue-500" />
								</div>
								<AlertDialogTitle className="text-lg font-black tracking-tight text-t-text-primary">
									Konfiguracja 2FA
								</AlertDialogTitle>
							</div>
							<AlertDialogDescription className="text-sm font-medium text-t-text-tertiary leading-relaxed pt-2">
								1. Otwórz aplikację Authenticator na swoim telefonie. <br />
								2. Zeskanuj poniższy kod QR, aby połączyć konto.
							</AlertDialogDescription>
						</AlertDialogHeader>

						<div className="flex justify-center py-4">
							<div className="w-48 h-48 bg-white rounded-xl p-2 border border-slate-200 flex items-center justify-center shadow-inner relative overflow-hidden">
								{qrCodeUrl ? (
									<Image
										src={qrCodeUrl}
										alt="QR Code"
										width={176}
										height={176}
										className="rounded-lg"
									/>
								) : (
									<Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
								)}
							</div>
						</div>

						<div className="space-y-3">
							<label className="text-[11px] font-bold uppercase tracking-widest text-t-text-tertiary ml-1">
								3. Wpisz wygenerowany kod
							</label>
							<input
								type="text"
								maxLength={6}
								placeholder="000 000"
								required
								value={code}
								onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
								className="w-full px-4 py-3 rounded-xl border border-t-border-subtle bg-black/5 dark:bg-white/5 text-center text-2xl font-mono tracking-[0.5em] text-t-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-t-text-tertiary/30"
							/>
						</div>

						<AlertDialogFooter className="flex sm:justify-end gap-3 pt-4 border-t border-t-border-subtle">
							<AlertDialogCancel
								type="button"
								disabled={isLoading}
								className="mt-0 h-11 px-6 rounded-xl border-t-border-subtle bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-t-text-secondary font-bold uppercase tracking-widest text-[10px] transition-colors"
							>
								Anuluj
							</AlertDialogCancel>
							<Button
								type="submit"
								disabled={isLoading || code.length !== 6}
								className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2"
							>
								{isLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : null}
								{isLoading ? "Weryfikacja..." : "Włącz zabezpieczenie"}
							</Button>
						</AlertDialogFooter>
					</form>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

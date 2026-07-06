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
import { AlertTriangle, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import {
	disableTwoFactor,
	setupTwoFactor,
	verifyAndEnableTwoFactor,
} from "@/app/actions/2fa";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TwoFactorManager({
	initialEnabled = false,
}: {
	initialEnabled?: boolean;
}) {
	const router = useRouter();

	// Stany dla włączania 2FA
	const [isSetupOpen, setIsSetupOpen] = useState(false);
	const [code, setCode] = useState("");
	const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

	// Stany dla wyłączania 2FA
	const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);

	// Wspólne stany
	const [isLoading, setIsLoading] = useState(false);
	const [isSetupComplete, setIsSetupComplete] = useState(initialEnabled);

	// ==========================================
	// LOGIKA WŁĄCZANIA 2FA
	// ==========================================
	const handleOpenSetup = async () => {
		setIsSetupOpen(true);
		setIsLoading(true);
		try {
			const res = await setupTwoFactor();
			setQrCodeUrl(res.qrCodeDataUrl);
		} catch (error) {
			toast.error("Nie udało się wygenerować kodu QR.");
			setIsSetupOpen(false);
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
			await verifyAndEnableTwoFactor(code);

			setIsSetupComplete(true);
			setIsSetupOpen(false);
			setCode("");
			toast.success("Uwierzytelnianie 2FA zostało pomyślnie włączone!");

			router.refresh();
		} catch (error: any) {
			toast.error(error.message || "Błędny kod. Spróbuj ponownie.");
		} finally {
			setIsLoading(false);
		}
	};

	// ==========================================
	// LOGIKA WYŁĄCZANIA 2FA
	// ==========================================
	const handleDisable = async () => {
		setIsLoading(true);
		try {
			await disableTwoFactor();

			setIsSetupComplete(false);
			setIsDisableModalOpen(false); // Zamykamy modal
			toast.info("Zabezpieczenie 2FA zostało wyłączone.");

			router.refresh();
		} catch (error) {
			toast.error("Wystąpił błąd podczas wyłączania 2FA.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			{/* WIDOK GŁÓWNY W USTAWIENIACH */}
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
					// ZMIANA: Zamiast wywoływać funkcję z window.confirm, otwieramy modal
					onClick={
						isSetupComplete
							? () => setIsDisableModalOpen(true)
							: handleOpenSetup
					}
					className={`w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
						isSetupComplete
							? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
							: "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
					}`}
				>
					{isSetupComplete ? "Wyłącz 2FA" : "Skonfiguruj"}
				</button>
			</div>

			{/* ========================================== */}
			{/* MODAL 1: KONFIGURACJA (WŁĄCZANIE) 2FA */}
			{/* ========================================== */}
			<AlertDialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
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

			{/* ========================================== */}
			{/* MODAL 2: POTWIERDZENIE WYŁĄCZENIA 2FA */}
			{/* ========================================== */}
			<AlertDialog
				open={isDisableModalOpen}
				onOpenChange={setIsDisableModalOpen}
			>
				<AlertDialogContent className="bg-t-bg-panel border border-rose-500/20 shadow-2xl shadow-rose-900/20 overflow-hidden sm:rounded-2xl max-w-md">
					<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0" />

					<div className="p-2">
						<AlertDialogHeader>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
									<AlertTriangle className="w-5 h-5 text-rose-500" />
								</div>
								<AlertDialogTitle className="text-lg font-black tracking-tight text-t-text-primary">
									Wyłącz 2FA
								</AlertDialogTitle>
							</div>
							<AlertDialogDescription className="text-sm font-medium text-t-text-tertiary leading-relaxed pt-3">
								Czy na pewno chcesz wyłączyć uwierzytelnianie dwuetapowe (2FA)?
								Znacznie obniży to bezpieczeństwo Twojego konta i narazi je na
								ataki.
							</AlertDialogDescription>
						</AlertDialogHeader>

						<AlertDialogFooter className="flex sm:justify-end gap-3 pt-6 border-t border-t-border-subtle mt-5">
							<AlertDialogCancel
								disabled={isLoading}
								className="mt-0 h-11 px-6 rounded-xl border-t-border-subtle bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-t-text-secondary font-bold uppercase tracking-widest text-[10px] transition-colors"
							>
								Anuluj
							</AlertDialogCancel>
							<Button
								onClick={handleDisable}
								disabled={isLoading}
								className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2"
							>
								{isLoading ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Wyłączanie...
									</>
								) : (
									"Tak, wyłącz zabezpieczenie"
								)}
							</Button>
						</AlertDialogFooter>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

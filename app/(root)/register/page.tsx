"use client";

import { Loader2, ShieldCheck } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		if (!termsAccepted) {
			setError("Musisz zaakceptować regulamin, aby kontynuować.");
			setIsLoading(false);
			return;
		}

		// 1. Zapisujemy użytkownika w bazie
		const res = await fetch("/api/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password, termsAccepted }),
		});

		if (res.ok) {
			// 2. AUTO-LOGIN: Logujemy go w tle od razu po rejestracji!
			const signInRes = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (signInRes?.error) {
				// Awaryjne przekierowanie, gdyby autologowanie z jakiegoś powodu się nie powiodło
				router.push("/sign-in?registered=true");
			} else {
				// // 🚀 WYMUSZAMY PRZEŁADOWANIE DANYCH Z SERWERA
				// router.refresh();
				// // Sukces! Użytkownik ląduje od razu w swoim nowym kokpicie
				// router.push("/dashboard");
				window.location.href = "/dashboard";
			}
		} else {
			const errMessage = await res.text();
			setError(errMessage);
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-t-bg-base relative overflow-hidden px-4">
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

			<div className="w-full max-w-md rounded-3xl bg-t-bg-panel border border-t-border-subtle p-8 md:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-500 mt-10">
				<div className="text-center flex flex-col items-center mb-8">
					<div className="w-16 h-16 rounded-2xl bg-white dark:bg-black border border-t-border-subtle flex items-center justify-center mb-6 shadow-sm overflow-hidden relative">
						<Image
							src="/logo.svg"
							alt={APP_NAME}
							fill
							className="object-cover dark:hidden"
						/>
						<Image
							src="/logo-light.svg"
							alt={APP_NAME}
							fill
							className="object-cover hidden dark:block"
						/>
					</div>
					<h1 className="text-2xl font-black text-t-text-primary tracking-tight mb-2">
						Załóż konto
					</h1>
					<p className="text-sm font-medium text-t-text-tertiary">
						Przetestuj możliwości {APP_NAME}.
					</p>
				</div>

				<form onSubmit={handleRegister} className="space-y-4">
					<div>
						<input
							type="email"
							placeholder="Adres email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-4 py-3 rounded-xl border border-t-border-subtle bg-black/5 dark:bg-white/5 text-sm text-t-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-t-text-tertiary"
						/>
					</div>
					<div>
						<input
							type="password"
							placeholder="Hasło (min. 6 znaków)"
							required
							minLength={6}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-4 py-3 rounded-xl border border-t-border-subtle bg-black/5 dark:bg-white/5 text-sm text-t-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-t-text-tertiary"
						/>
					</div>

					<div className="flex items-start gap-3 mt-4 mb-2">
						<input
							type="checkbox"
							id="terms"
							checked={termsAccepted}
							onChange={(e) => setTermsAccepted(e.target.checked)}
							className="mt-1 w-4 h-4 rounded border-t-border-subtle text-blue-600 focus:ring-blue-500 bg-black/5 dark:bg-white/5"
						/>
						<label
							htmlFor="terms"
							className="text-xs text-t-text-tertiary leading-tight"
						>
							Akceptuję{" "}
							<Link href="/regulamin" className="text-blue-500 hover:underline">
								Regulamin
							</Link>{" "}
							oraz zgadzam się na zasady przetwarzania danych według{" "}
							<Link
								href="/polityka-prywatnosci"
								className="text-blue-500 hover:underline"
							>
								Polityki Prywatności
							</Link>
							. Rozumiem, że konta nieaktywne mogą zostać usunięte.
						</label>
					</div>

					{error && (
						<p className="text-xs text-rose-500 text-center font-medium">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={isLoading}
						className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center mt-2"
					>
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin" />
						) : (
							"Utwórz konto"
						)}
					</button>
				</form>

				<p className="text-center text-xs font-medium text-t-text-tertiary mt-6">
					Masz już konto?{" "}
					<Link
						href="/sign-in"
						className="text-blue-500 hover:text-blue-400 hover:underline transition-colors"
					>
						Zaloguj się
					</Link>
				</p>
			</div>
		</div>
	);
}

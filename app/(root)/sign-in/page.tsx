"use client";

import { Loader2, ShieldCheck } from "lucide-react";
// 1. Zaktualizowane importy
import { useRouter, useSearchParams } from "next/navigation";

import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	// 2. Odczytujemy parametr z adresu URL
	const searchParams = useSearchParams();
	const isRegistered = searchParams.get("registered") === "true";

	const handleCredentialsLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		const res = await signIn("credentials", {
			email,
			password,
			redirect: false,
		});

		if (res?.error) {
			setError("Nieprawidłowy adres email lub hasło.");
			setIsLoading(false);
		} else {
			// // 🚀 WYMUSZAMY PRZEŁADOWANIE DANYCH Z SERWERA (RootLayout)
			// router.refresh();
			// router.push("/dashboard");
			window.location.href = "/dashboard";
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-t-bg-base relative overflow-hidden px-4">
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

			<div className="w-full max-w-md rounded-3xl bg-t-bg-panel border border-t-border-subtle p-8 md:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-500 mt-10">
				<div className="text-center flex flex-col items-center mb-8">
					<div className="w-16 h-16 rounded-2xl bg-white dark:bg-black border border-t-border-subtle flex items-center justify-center mb-6 shadow-sm overflow-hidden relative">
						{/* 1. Ciemne logo (logo.svg) - WIDOCZNE w jasnym motywie, UKRYTE w ciemnym */}
						<Image
							src="/logo.svg"
							alt={APP_NAME}
							width={32}
							height={32}
							className="block dark:hidden object-contain"
							style={{ width: "auto", height: "auto" }}
						/>

						{/* 2. Jasne logo (logo-light.svg) - UKRYTE w jasnym motywie, WIDOCZNE w ciemnym */}
						<Image
							src="/logo-light.svg"
							alt={APP_NAME}
							width={32}
							height={32}
							className="hidden dark:block object-contain"
							style={{ width: "auto", height: "auto" }}
						/>
					</div>
					<h1 className="text-2xl font-black text-t-text-primary tracking-tight mb-2">
						Witaj w {APP_NAME}
					</h1>
					<p className="text-sm font-medium text-t-text-tertiary">
						Zaloguj się, aby zarządzać swoimi portfelami.
					</p>
				</div>

				{/* 3. ZIELONY BANER SUKCESU REJESTRACJI */}
				{isRegistered && (
					<div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-center">
						<p className="text-sm font-bold text-emerald-500">
							Konto zostało utworzone! Możesz się teraz zalogować.
						</p>
					</div>
				)}

				{/* Przycisk Google */}
				<button
					onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
					className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-t-border-subtle bg-black/5 dark:bg-white/5 px-4 py-4 text-sm font-bold text-t-text-secondary transition-all duration-300 hover:bg-black/10 dark:hover:bg-white/10 hover:text-t-text-primary hover:border-blue-500/30 hover:shadow-lg"
				>
					<Image
						src="https://authjs.dev/img/providers/google.svg"
						alt="Google logo"
						className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
						width={20}
						height={20}
					/>
					<span>Kontynuuj z Google</span>
				</button>

				{/* Separator */}
				<div className="relative my-6">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t border-t-border-subtle" />
					</div>
					<div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
						<span className="bg-t-bg-panel px-3 text-t-text-tertiary">
							LUB EMAIL
						</span>
					</div>
				</div>

				{/* Formularz Email/Hasło */}
				<form onSubmit={handleCredentialsLogin} className="space-y-4">
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
							placeholder="Hasło"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-4 py-3 rounded-xl border border-t-border-subtle bg-black/5 dark:bg-white/5 text-sm text-t-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-t-text-tertiary"
						/>
					</div>

					{error && (
						<p className="text-xs text-rose-500 text-center font-medium">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={isLoading}
						className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center"
					>
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin" />
						) : (
							"Zaloguj się"
						)}
					</button>
				</form>

				<p className="text-center text-xs font-medium text-t-text-tertiary mt-6">
					Nie masz konta?{" "}
					<Link
						href="/register"
						className="text-blue-500 hover:text-blue-400 hover:underline transition-colors"
					>
						Zarejestruj się
					</Link>
				</p>

				{/* Trust Badge (Stopka bezpieczeństwa) */}
				<div className="pt-6 mt-6 border-t border-t-border-subtle flex flex-col items-center gap-2">
					<div className="flex items-center gap-1.5 text-emerald-500">
						<ShieldCheck className="w-4 h-4" />
						<span className="text-[10px] font-bold uppercase tracking-widest">
							Bezpieczne Logowanie
						</span>
					</div>
					<p className="text-[10px] text-t-text-tertiary text-center leading-relaxed">
						Twoje dane są szyfrowane. Nie udostępniamy informacji podmiotom
						trzecim.
					</p>
				</div>
			</div>
		</div>
	);
}

import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { signIn } from "@/auth";

export default function SignInPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-t-bg-base relative overflow-hidden px-4">
			{/* 1. Subtelny Glow w tle (Ambient Light) */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

			{/* 2. Szklany Kontener Logowania */}
			<div className="w-full max-w-md rounded-3xl bg-t-bg-panel border border-t-border-subtle p-8 md:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
				{/* Nagłówek i Logo */}
				<div className="text-center flex flex-col items-center mb-8">
					<div className="w-16 h-16 rounded-2xl bg-white dark:bg-black border border-t-border-subtle flex items-center justify-center mb-6 shadow-sm">
						{/* 1. Ciemne logo (logo.svg) - WIDOCZNE w jasnym motywie, UKRYTE w ciemnym */}
						<Image
							src="/logo.svg"
							alt="InvestGuard Logo"
							width={32}
							height={32}
							className="block dark:hidden object-contain"
							style={{ width: "auto", height: "auto" }}
						/>

						{/* 2. Jasne logo (logo-light.svg) - UKRYTE w jasnym motywie, WIDOCZNE w ciemnym */}
						<Image
							src="/logo-light.svg"
							alt="InvestGuard Logo"
							width={32}
							height={32}
							className="hidden dark:block object-contain"
							style={{ width: "auto", height: "auto" }}
						/>
					</div>
					<h1 className="text-3xl font-black tracking-tighter text-t-text-primary">
						{APP_NAME}
						<span className="text-blue-500">.</span>
					</h1>
					<p className="mt-3 text-sm font-medium text-t-text-tertiary">
						Zaloguj się, aby zarządzać swoimi portfelami i weryfikować
						strategię.
					</p>
				</div>

				{/* Formularz Auth.js */}
				<form
					action={async () => {
						"use server";
						// Jeśli dashboard jest folderem grupowym, może to być proste "/"
						// ale zostawiam "/dashboard" zgodnie z Twoim kodem.
						await signIn("google", { redirectTo: "/dashboard" });
					}}
				>
					<button
						type="submit"
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
				</form>

				{/* Trust Badge (Stopka bezpieczeństwa) */}
				<div className="pt-8 mt-8 border-t border-t-border-subtle">
					<p className="flex items-center justify-center gap-2 text-center text-[10px] font-black uppercase tracking-widest text-t-text-tertiary">
						<ShieldCheck className="w-4 h-4 text-emerald-500" />
						Bezpieczna autoryzacja OAuth 2.0
					</p>
				</div>
			</div>
		</div>
	);
}

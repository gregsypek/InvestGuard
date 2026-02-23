// components/shared/header/LoginButton.tsx
"use client";
import { signIn } from "next-auth/react";

export function LoginButton() {
	return (
		<button
			onClick={() => signIn("google")}
			className="flex items-center gap-3 px-4 py-2 border border-border2 bg-background hover:bg-muted/50 transition-all rounded-md text-[11px] font-bold uppercase tracking-widest shadow-sm"
		>
			{/* Kolorowa ikona Google */}
			<svg width="18" height="18" viewBox="0 0 18 18">
				<path
					fill="#4285F4"
					d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84c-.21 1.12-.84 2.07-1.79 2.71v2.25h2.91c1.71-1.57 2.68-3.88 2.68-6.61z"
				/>
				<path
					fill="#34A853"
					d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.25c-.81.54-1.85.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H1.05v2.32C2.53 15.93 5.56 18 9 18z"
				/>
				<path
					fill="#FBBC05"
					d="M3.97 10.73c-.18-.54-.28-1.12-.28-1.73s.1-1.19.28-1.73V4.95H1.05C.38 6.17 0 7.54 0 9s.38 2.83 1.05 4.05l2.92-2.32z"
				/>
				<path
					fill="#EA4335"
					d="M9 3.57c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.56 0 2.53 2.07 1.05 4.95l2.92 2.32c.71-2.12 2.69-3.7 5.03-3.7z"
				/>
			</svg>
			<span>Zaloguj przez Google</span>
		</button>
	);
}

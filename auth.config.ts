// auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			// EN: Force Google to show the account selection screen
			// PL: Wymuszamy na Google ekran wyboru konta
			authorization: {
				params: {
					prompt: "select_account",
					access_type: "offline",
					response_type: "code",
				},
			},
		}),
	],
	// Tutaj definiujemy stronę logowania, aby middleware wiedział, gdzie przekierować
	pages: {
		// signIn: "/api/auth/signin",
		signIn: "/sign-in",
	},
	callbacks: {
		authorized({ auth, request: { nextUrl } }) {
			const isLoggedIn = !!auth?.user;

			// 1. Sprawdzamy, czy użytkownik próbuje wejść na ścieżkę demo
			// Pozwalamy na /demo, /demo/portfolios, /demo/planning itp.
			const isDemoRoute = nextUrl.pathname.startsWith("/demo");

			// 2. Jeśli to ścieżka demo, wpuszczamy bez pytania
			if (isDemoRoute) return true;

			// 3. Jeśli to dashboard, a użytkownik nie jest zalogowany - przekieruj
			const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
			if (isDashboardRoute) {
				if (isLoggedIn) return true;
				return false; // Przekieruje do /api/auth/signin (lub Twojego customowego)
			}

			return true; // Domyślnie pozwól na inne publiczne strony (np. strona główna)
		},
	},
} satisfies NextAuthConfig;

//NOTE: Zasada jest prosta: wszystko, co wymaga połączenia z bazą danych (Adapter, Prisma), musi trafić do auth.ts. Wszystko inne (Dostawcy jak Google, strony, podstawowa logika) trafia do auth.config.ts.

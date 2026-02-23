// auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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

			// 2. Definiujemy, co jest publiczne (np. strona główna '/')
			const isPublicPage = nextUrl.pathname === "/";

			// 3. Jeśli strona NIE jest publiczna i użytkownik NIE jest zalogowany -> blokuj
			if (!isPublicPage && !isLoggedIn) {
				return false; // To automatycznie przekieruje do logowania
			}

			return true; // W przeciwnym razie wpuść
		},
	},
} satisfies NextAuthConfig;

//NOTE: Zasada jest prosta: wszystko, co wymaga połączenia z bazą danych (Adapter, Prisma), musi trafić do auth.ts. Wszystko inne (Dostawcy jak Google, strony, podstawowa logika) trafia do auth.config.ts.

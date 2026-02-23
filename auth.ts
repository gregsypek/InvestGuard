import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db"; // Upewnij się, że ścieżka do instancji Prisma jest poprawna

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(db),
	session: { strategy: "jwt" },
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
	],
	callbacks: {
		// 1. Najpierw dopisujemy ID do tokena JWT
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		// 2. Potem przekazujemy to ID z tokena do sesji widocznej w aplikacji
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
			}
			return session;
		},
	},
});

// TODO: dopisać do swojego adresu bazy w .env:?sslmode=verify-full (jeśli  dostawca bazy to obsługuje).

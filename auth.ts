import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config"; // Importujemy lekki szkielet
export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(db),
	session: { strategy: "jwt" },
	...authConfig, // Rozpakowujemy dostawców (Google) i strony
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

//TODO: dopisać do swojego adresu bazy w .env:?sslmode=verify-full (jeśli  dostawca bazy to obsługuje).

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import { authConfig } from "./auth.config"; // Importujemy lekki szkielet
import { db } from "@/lib/db";
export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(db),
	session: { strategy: "jwt" },
	...authConfig, // Rozpakowujemy dostawców (Google) i strony
	callbacks: {
		// 1. Najpierw dopisujemy ID do tokena JWT
		async jwt({ token, user }) {
			// Jeśli nie mamy id użytkownika w tokenie, nic nie robimy
			if (!token.sub) return token;

			// Pobieramy użytkownika z bazy, aby mieć pewność, że rola jest aktualna
			const existingUser = await db.user.findUnique({
				where: { id: token.sub },
			});

			if (!existingUser) return token;

			// Zapisujemy rolę w tokenie 🔑
			token.role = existingUser.role;
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		// 2. Potem przekazujemy to ID z tokena do sesji widocznej w aplikacji
		async session({ session, token }) {
			// Przepisujemy rolę z tokena do sesji, aby była dostępna w UI 🖼️
			if (token.role && session.user) {
				session.user.role = (token.role as Role) ?? "REGULAR";
			}

			if (session.user && token.sub) {
				session.user.id = token.sub;
			}

			return session;
		},
	},
});

//TODO: dopisać do swojego adresu bazy w .env:?sslmode=verify-full (jeśli  dostawca bazy to obsługuje).

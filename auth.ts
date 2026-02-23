import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db"; // Upewnij się, że ścieżka do instancji Prisma jest poprawna

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(db),
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
	],
	callbacks: {
		// EN: Attach userId to the session object
		// UI: Przypisujemy ID użytkownika z bazy do sesji, by używać go w akcjach
		async session({ session, user }) {
			if (session.user) {
				session.user.id = user.id;
			}
			return session;
		},
	},
});

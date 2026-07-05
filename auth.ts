import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(db),
	session: { strategy: "jwt" },
	...authConfig,
	providers: [
		...authConfig.providers, // Pobiera Google z auth.config.ts
		CredentialsProvider({
			name: "Email",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Hasło", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error("Brakujące dane logowania.");
				}

				const user = await db.user.findUnique({
					where: { email: credentials.email as string },
				});

				if (!user || !user.password) {
					throw new Error(
						"Nie znaleziono użytkownika lub użyto logowania przez Google.",
					);
				}

				const isValid = await bcrypt.compare(
					credentials.password as string,
					user.password,
				);

				if (!isValid) throw new Error("Nieprawidłowe hasło.");

				return user;
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (!token.sub) return token;
			const existingUser = await db.user.findUnique({
				where: { id: token.sub },
			});

			// EN: CRITICAL FIX - If user was deleted from DB, destroy their JWT token
			if (!existingUser) return null; // Zwrócenie null natychmiast niszczy sesję!
			token.role = existingUser.role;
			if (user) token.id = user.id;
			return token;
		},
		async session({ session, token }) {
			if (token.role && session.user) {
				session.user.role = (token.role as Role) ?? "REGULAR";
				session.user.id = token.sub as string;
			}
			return session;
		},
	},
});

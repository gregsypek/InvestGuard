import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { headers } from "next/headers";

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

			// EN: Fetch user from DB to verify if they still exist
			const existingUser = await db.user.findUnique({
				where: { id: token.sub },
			});

			// EN: CRITICAL FIX - If user was deleted from DB, destroy their JWT token
			if (!existingUser) return null;

			token.role = existingUser.role;
			if (user) token.id = user.id;

			// EN: Handle new session creation on initial login (when 'user' object is available)
			if (user) {
				try {
					// EN: Await is strictly required for headers() in newer Next.js versions
					const headersList = await headers();
					const ip =
						headersList.get("x-forwarded-for") ||
						headersList.get("x-real-ip") ||
						"Unknown IP";
					const userAgent = headersList.get("user-agent") || "Unknown Device";

					const newSession = await db.deviceSession.create({
						data: {
							userId: user.id as string,
							ipAddress: ip,
							userAgent: userAgent,
						},
					});

					token.sessionId = newSession.id;
				} catch (error) {
					console.error("Session creation error:", error);
				}
			}

			// EN: Check if session was revoked from the settings panel
			if (token.sessionId) {
				const activeSession = await db.deviceSession.findUnique({
					where: { id: token.sessionId as string },
					select: { isValid: true },
				});

				// EN: Return empty object to destroy the token gracefully
				if (!activeSession || !activeSession.isValid) {
					return {} as any;
				}
			}

			return token;
		},

		async session({ session, token }) {
			if (token.sub && session.user) {
				session.user.id = token.sub;
			}
			if (token.role && session.user) {
				session.user.role = (token.role as Role) ?? "REGULAR";
				session.user.id = token.sub as string;
			}

			// EN: Pass sessionId to the frontend client for active session highlighting
			if (token.sessionId && session.user) {
				// @ts-ignore
				session.user.sessionId = token.sessionId as string;
			}

			return session;
		},
	},
});

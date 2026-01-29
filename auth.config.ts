// auth.config.ts
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

// This configuration object will be used by both Middleware and the main Auth
export const authConfig = {
	providers: [GitHub],
	pages: {
		signIn: "/login", // Optional: custom login page
	},
	callbacks: {
		authorized({ auth, request: { nextUrl } }) {
			const isLoggedIn = !!auth?.user;
			const isOnBooster = nextUrl.pathname.startsWith("/booster");
			if (isOnBooster) {
				if (isLoggedIn) return true;
				return false; // Redirect unauthenticated users to login
			}
			return true;
		},
	},
} satisfies NextAuthConfig;

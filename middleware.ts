// middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
	// Specify which routes should be handled by this middleware
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
// This middleware - matcher-  will run on all routes except those starting with /api, /_next/static, /_next/image, and the favicon.ico. It ensures that NextAuth's authentication logic is applied to all relevant pages in the application.
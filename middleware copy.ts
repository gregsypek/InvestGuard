import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Inicjalizujemy NextAuth tylko za pomocą lekkiej konfiguracji
export default NextAuth(authConfig).auth;

export const config = {
	// Ten matcher pomija pliki statyczne i API
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

// This middleware - matcher-  will run on all routes except those starting with /api, /_next/static, /_next/image, and the favicon.ico. It ensures that NextAuth's authentication logic is applied to all relevant pages in the application.

//NOTE: Middleware działa w środowisku Edge, które jest bardzo restrykcyjne. Jeśli w middleware.ts zaimportujesz cokolwiek z pliku auth.ts, Next.js spróbuje załadować cały ten plik, włącznie z:

// PrismaAdapter

// db (instancja Prismy)

// Biblioteką pg (która wymaga modułu crypto)

// To właśnie ten łańcuch importów powoduje błąd. Rozwiązaniem jest upewnienie się, że Middleware korzysta wyłącznie z auth.config.ts.

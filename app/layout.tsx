import "./globals.css";

import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from "@/lib/constants";

import BulbTip from "@/components/shared/BulbTip";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: {
		template: `%s | Invest Guard`,
		default: APP_NAME,
	},
	// icons: {
	// 	icon: [
	// 		{ url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
	// 		{ url: "/favicon.svg", type: "image/svg+xml" },
	// 	],
	// 	shortcut: "/favicon.ico",
	// 	apple: "/apple-touch-icon.png",
	// },
	manifest: "/site.webmanifest",
	// Odpowiednik <meta name="apple-mobile-web-app-title" ... />
	appleWebApp: {
		title: "InvestGuard",
		statusBarStyle: "default",
		capable: true,
	},
	description: APP_DESCRIPTION,
	metadataBase: new URL(SERVER_URL),
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className="overflow-y-hidden">
			<body
				className={`${inter.className} antialiased overflow-x-hidden`}
				suppressHydrationWarning
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark" /* Startujemy w dark mode! */
					enableSystem={
						false
					} /* Ignorujemy system, wymuszamy giełdowy klimat */
					disableTransitionOnChange
				>
					{children}
					<Toaster position="bottom-right" richColors />
					<BulbTip />
				</ThemeProvider>
			</body>
		</html>
	);
}

// app/(root)/layout.tsx
import Aside from "@/components/Aside";
import Header from "@/components/Header";
import UserButton from "@/components/shared/header/userButton";
import { db } from "@/lib/db";
import { cookies } from "next/headers"; // Importujemy narzędzie do ciasteczek
export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Fetch portfolios from DB
	const portfolios = await db.portfolio.findMany({
		where: { userId: "1" }, // Using our hardcoded ID for now
	});

	const cookieStore = await cookies();
	// Pobieramy wartość ciasteczka na serwerze
	const selectedPortfolioId =
		cookieStore.get("selectedPortfolioId")?.value || "";
	return (
		<div className="flex h-screen overflow-hidden bg-background">
			{/* Sidebar*/}
			<Aside />
			<div className="flex flex-col flex-1 min-w-0">
				{/* Composition Pattern  Dzięki przekazaniu komponentu jako prop UserButton 👤 jest renderowany na serwerze (ma dostęp do sesji i nagłówków), a Header 🧭 zajmuje się tylko interakcją w przeglądarce.*/}
				<Header
					selectedPortfolioId={selectedPortfolioId}
					portfolios={portfolios}
					userButton={<UserButton />}
				/>{" "}
				{/* scrollable main part */}
				<main className="flex-1 overflow-y-auto p-4 md:p-8">
					<div className="max-w-7xl mx-auto">{children}</div>
				</main>
			</div>
		</div>
	);
}

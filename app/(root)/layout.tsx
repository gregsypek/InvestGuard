import Aside from "@/components/Aside";
import Header from "@/components/Header";
import { LoginButton } from "@/components/shared/header/LoginButton";
import UserButton from "@/components/shared/header/UserButton";
import { auth } from "@/auth";
import { cookies } from "next/headers"; // Importujemy narzędzie do ciasteczek
import { db } from "@/lib/db";
export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	const userRole = session?.user?.role || "REGULAR";

	// EN: Get real userId from session or null
	// PL: Pobieramy realne ID użytkownika z sesji
	const userId = session?.user?.id;

	// EN: Fetch portfolios belonging to the logged-in user
	// PL: Pobieramy portfele należące do zalogowanego użytkownika
	const portfolios = userId
		? await db.portfolio.findMany({
				where: { userId },
				select: { id: true, name: true },
			})
		: [];

	const cookieStore = await cookies();
	const selectedPortfolioId =
		cookieStore.get("selectedPortfolioId")?.value || "";

	const userControl = session ? <UserButton /> : <LoginButton />;

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Aside />
			<div className="flex flex-col flex-1 min-w-0">
				{/* Composition Pattern  Dzięki przekazaniu komponentu jako prop UserButton 👤 jest renderowany na serwerze (ma dostęp do sesji i nagłówków), a Header 🧭 zajmuje się tylko interakcją w przeglądarce.*/}
				<Header
					selectedPortfolioId={selectedPortfolioId}
					portfolios={portfolios}
					userButton={userControl}
					userRole={userRole}
				/>
				{/* scrollable main part */}
				<main className="flex-1 overflow-y-auto ">
					<div className="max-w-7xl mx-auto">{children}</div>
				</main>
			</div>
		</div>
	);
}

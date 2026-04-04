import Aside from "@/components/Aside";
import Header from "@/components/Header";
import { LoginButton } from "@/components/shared/header/LoginButton";
import { MarketTicker } from "@/components/MarketTicker";
import UserButton from "@/components/shared/header/UserButton";
import { auth } from "@/auth";
import { cookies } from "next/headers"; // Importujemy narzędzie do ciasteczek
import { db } from "@/lib/db";
import { getStockLogo } from "@/lib/utils";
export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	const userRole = session?.user?.role || "REGULAR";

	const marketRates = await db.exchangeRate.findMany();

	console.log("🚀 ~ RootLayout ~ marketRates:", marketRates);

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

	const fxRates = await db.exchangeRate.findMany();
	// Pobierz tylko aktywa rynkowe (bez obligacji), żeby pokazać ich "ruch" na pasku
	const marketAssets = await db.asset.findMany({
		where: {
			portfolioId: selectedPortfolioId,
			NOT: { category: "BONDS" },
		},
		// take: 5, // Pokaż tylko 5 pierwszych, żeby nie przeładować paska
	});
	// Sformatuj dane dla komponentu
	const tickerData = [
		// 1. Kursy walut
		...fxRates.map((fx) => ({
			label: fx.code.replace("PLN", "/PLN"),
			value: fx.value.toFixed(4) + " PLN",
			change: (fx.change >= 0 ? "+" : "") + fx.change.toFixed(2) + "%",
			// Zmiana na Google API dla lepszej wykrywalności logo
			logo: `https://www.google.com/s2/favicons?domain=${fx.code.substring(0, 3).toLowerCase()}.com&sz=128`,
		})),

		// 2. Aktywa rynkowe
		...marketAssets.map((asset) => {
			const currentPrice =
				asset.quantity > 0 ? asset.currentValue / asset.quantity : 0;
			const changePct =
				asset.investedCapital > 0
					? ((asset.currentValue - asset.investedCapital) /
							asset.investedCapital) *
						100
					: 0;

			return {
				label: (asset.name || asset.ticker || "").slice(0, 25),
				value:
					currentPrice.toLocaleString("pl-PL", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					}) + " PLN",
				change: (changePct >= 0 ? "+" : "") + changePct.toFixed(2) + "%",
				logo: getStockLogo(asset.ticker), // Upewnij się, że funkcja zwraca link Google
			};
		}),
	];
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
				<MarketTicker data={tickerData} /> {/* scrollable main part */}
				<main className="flex-1 overflow-y-auto ">
					<div className="max-w-7xl mx-auto">{children}</div>
				</main>
			</div>
		</div>
	);
}

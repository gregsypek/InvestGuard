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

	// === SZUKAMY NAJŚWIEŻSZEJ DATY ===
	let lastUpdated = null;

	if (session?.user?.id) {
		const latestAsset = await db.asset.findFirst({
			where: { portfolio: { userId: session.user.id } },
			orderBy: { updatedAt: "desc" },
			select: { updatedAt: true },
		});

		if (latestAsset) {
			lastUpdated = latestAsset.updatedAt.toISOString();
		}
	}

	const userRole = session?.user?.role || "REGULAR";

	// const marketRates = await db.exchangeRate.findMany();

	// console.log("🚀 ~ RootLayout ~ marketRates:", marketRates);

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

			// EN: Use the stored daily change for the ticker instead of total P&L
			// PL: Używamy zapisanej zmiany dziennej dla paska zamiast całkowitego zysku
			const displayChange = asset.dailyChange || 0;
			// const changePct =
			// 	asset.investedCapital > 0
			// 		? ((asset.currentValue - asset.investedCapital) /
			// 				asset.investedCapital) *
			// 			100
			// 		: 0;

			return {
				label: (asset.name || asset.ticker || "").slice(0, 25),
				value:
					currentPrice.toLocaleString("pl-PL", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					}) + " PLN",
				// EN: Show the 24h change with a plus/minus sign
				// PL: Pokazujemy zmianę 24h z plusem lub minusem
				change:
					(displayChange >= 0 ? "+" : "") + displayChange.toFixed(2) + "%",
				logo: getStockLogo(asset.ticker),
			};
		}),
	];
	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Aside />
			<div className="flex flex-col flex-1 min-w-0">
				<Header
					selectedPortfolioId={selectedPortfolioId}
					portfolios={portfolios}
					userButton={userControl}
					userRole={userRole}
					lastUpdated={lastUpdated}
				/>
				<main className="flex-1 overflow-y-auto">
					<MarketTicker data={tickerData} />

					{/* Zamiast sztywnego p-6, używamy responsywnego paddingu, 
              a górny margines (pt-0) pozwala Hero sekcji przylegać do góry */}
					<div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-10 pt-0 space-y-8">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}

//NOTE: Baza Danych jako Buffer Layout (Odświeżenie strony): Kiedy user wchodzi na stronę lub ją odświerza, kod w layout.tsx wykonuje zapytania db.exchangeRate.findMany() oraz db.asset.findMany(). Są to bardzo szybkie operacje czytania z  bazy danych. Na tym etapie nie następuje połączenie z Yahoo Finance. User widzi to, co zostało zapisane podczas ostatniej aktualizacji.

//HandleRefresh (Przycisk): Dopiero kliknięcie przycisku uruchamia funkcję refreshPortfolioPrices. To ona jest "silnikiem", który łączy się z zewnętrznym API, pobiera świeże kursy i nadpisuje dane w  bazie.

//Dzięki temu strona główna ładuje się błyskawicznie (w milisekundach), a limity Yahoo zuzywane są tylko wtedy, gdy faktycznie user wywoła zapytanie.

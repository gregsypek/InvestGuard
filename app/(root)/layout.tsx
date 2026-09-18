import Aside from "@/components/Aside";
import { ChartProvider } from "@/components/providers/ChartProvider";
import Header from "@/components/Header";
import { LoginButton } from "@/components/shared/header/LoginButton";
import { MarketTicker } from "@/components/MarketTicker";
import UserButton from "@/components/shared/header/UserButton";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getStockLogo } from "@/lib/utils";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

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

	const cookieStore = await cookies();
	const hideMarketTicker =
		cookieStore.get("hide_market_ticker")?.value === "true";

	let tickerIndices: { symbol: string; price: number; dailyChange: number }[] =
		[];
	if (!hideMarketTicker) {
		tickerIndices = await db.marketIndex.findMany({
			select: { symbol: true, price: true, dailyChange: true },
		});
	}

	const userRole = session?.user?.role || "REGULAR";
	const userId = session?.user?.id;

	// 🚀 KLUCZOWA ZMIANA 1: Pobieramy colorTheme z bazy!
	const portfolios = userId
		? await db.portfolio.findMany({
				where: { userId },
				select: { id: true, name: true, colorTheme: true },
			})
		: [];

	const selectedPortfolioId =
		cookieStore.get("selectedPortfolioId")?.value || "";

	// 🚀 KLUCZOWA ZMIANA 2: Ustalamy aktywny motyw
	const activePortfolio = portfolios.find((p) => p.id === selectedPortfolioId);
	let effectiveTheme = activePortfolio?.colorTheme || "blue";

	// Wymuszenie koloru dla trybu demo i widoku globalnego
	if (selectedPortfolioId.startsWith("demo-")) {
		effectiveTheme = "emerald";
	} else if (selectedPortfolioId === "ALL") {
		effectiveTheme = "indigo";
	}

	const userControl = session ? <UserButton /> : <LoginButton />;

	const fxRates = await db.exchangeRate.findMany();
	const marketAssets = await db.asset.findMany({
		where: {
			portfolioId: selectedPortfolioId,
			category: {
				notIn: ["BONDS", "CASH"],
			},
		},
	});

	const tickerData = [
		...fxRates.map((fx) => ({
			label: fx.code.replace("PLN", "/PLN"),
			value: fx.value.toFixed(4) + " PLN",
			change: (fx.change >= 0 ? "+" : "") + fx.change.toFixed(2) + "%",
			// Zmiana na Google API dla lepszej wykrywalności logo
			logo: `https://www.google.com/s2/favicons?domain=${fx.code.substring(0, 3).toLowerCase()}.com&sz=128`,
		})),
		...marketAssets.map((asset) => {
			const currentPrice =
				asset.quantity > 0 ? asset.currentValue / asset.quantity : 0;
			const displayChange = asset.dailyChange || 0;

			return {
				label: (asset.name || asset.ticker || "").slice(0, 25),
				value:
					currentPrice.toLocaleString("pl-PL", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					}) + " PLN",
				change:
					(displayChange >= 0 ? "+" : "") + displayChange.toFixed(2) + "%",
				logo: getStockLogo(asset.ticker),
			};
		}),
		...tickerIndices.map((idx) => {
			const isPositive = idx.dailyChange >= 0;
			return {
				label: idx.symbol === "GOLD" ? "ZŁOTO" : idx.symbol,
				value: idx.price.toLocaleString("pl-PL", { maximumFractionDigits: 2 }),
				change: (isPositive ? "+" : "") + idx.dailyChange.toFixed(2) + "%",
				logo: `https://www.google.com/s2/favicons?domain=${
					idx.symbol === "SP500"
						? "spglobal.com"
						: idx.symbol === "NASDAQ"
							? "nasdaq.com"
							: idx.symbol === "BTC"
								? "bitcoin.org"
								: "finance.yahoo.com"
				}&sz=128`,
			};
		}),
	];
	return (
		// 🚀 KLUCZOWA ZMIANA 3: Wstrzyknięcie atrybutu data-theme={effectiveTheme}
		<div
			id="app-wrapper"
			className="flex h-screen overflow-hidden bg-background"
			data-theme={effectiveTheme}
		>
			<ChartProvider>
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
						{!hideMarketTicker && tickerData.length > 0 && (
							<MarketTicker data={tickerData} />
						)}

						{/* 1. Główny wrapper rozciągnięty na pełny ekran z tłem systemowym */}
						<div className="w-full min-h-screen bg-t-bg-base transition-colors duration-300">
							{/* 2. Wewnętrzny kontener trzymający strukturę i szerokość treści */}
							<div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-10 pt-0 space-y-8">
								{children}
							</div>
						</div>
					</main>
				</div>
			</ChartProvider>
		</div>
	);
}

//NOTE: Baza Danych jako Buffer Layout (Odświeżenie strony): Kiedy user wchodzi na stronę lub ją odświerza, kod w layout.tsx wykonuje zapytania db.exchangeRate.findMany() oraz db.asset.findMany(). Są to bardzo szybkie operacje czytania z  bazy danych. Na tym etapie nie następuje połączenie z Yahoo Finance. User widzi to, co zostało zapisane podczas ostatniej aktualizacji.

//HandleRefresh (Przycisk): Dopiero kliknięcie przycisku uruchamia funkcję refreshPortfolioPrices. To ona jest "silnikiem", który łączy się z zewnętrznym API, pobiera świeże kursy i nadpisuje dane w  bazie.

//Dzięki temu strona główna ładuje się błyskawicznie (w milisekundach), a limity Yahoo zuzywane są tylko wtedy, gdy faktycznie user wywoła zapytanie.

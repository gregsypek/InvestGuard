import Aside from "@/components/Aside";
import { ChartProvider } from "@/components/providers/ChartProvider";
import Header from "@/components/Header";
import { MarketTicker } from "@/components/MarketTicker";
import UserButton from "@/components/shared/header/UserButton";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/format-currency";
import { getStockLogo } from "@/lib/utils";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	// =========================================================================
	// 🚀 TARCZA OCHRONNA (EARLY RETURN) - Blokuje "spalanie" bazy danych
	// Jeśli nie ma sesji, renderujemy tylko szkielet potrzebny do ekranu logowania
	// i NIE wykonujemy ŻADNEGO zapytania do bazy danych poniżej.
	// =========================================================================
	if (!session?.user?.id) {
		return (
			<div
				id="app-wrapper"
				className="flex h-screen overflow-hidden bg-background"
			>
				<main className="flex-1 overflow-y-auto page-container section-gap pb-10">
					{children}
				</main>
			</div>
		);
	}

	// =========================================================================
	// SEKCJA DLA ZALOGOWANYCH UŻYTKOWNIKÓW (Odpytywanie bazy)
	// =========================================================================
	const cookieStore = await cookies();
	const hideMarketTicker =
		cookieStore.get("hide_market_ticker")?.value === "true";
	const selectedPortfolioId =
		cookieStore.get("selectedPortfolioId")?.value || "";

	const userId = session.user.id;
	const userRole = session.user.role || "REGULAR";

	// 1. Równoległe pobranie podstawowych danych zoptymalizowane pod wydajność
	const [dbUser, portfolios, fxRates, tickerIndices, marketAssets] =
		await Promise.all([
			db.user.findUnique({
				where: { id: userId },
				select: { mainCurrency: true },
			}),
			db.portfolio.findMany({
				where: { userId },
				select: {
					id: true,
					name: true,
					colorTheme: true,
					lastRefreshedAt: true,
				},
			}),
			db.exchangeRate.findMany(),
			hideMarketTicker
				? Promise.resolve([])
				: db.marketIndex.findMany({
						select: { symbol: true, price: true, dailyChange: true },
					}),
			db.asset.findMany({
				where: {
					portfolioId: selectedPortfolioId,
					category: { notIn: ["BONDS", "CASH"] },
				},
			}),
		]);

	// --- GLOBALNA WALUTA ---
	const initialCurrency = dbUser?.mainCurrency || "PLN";
	const ratesMap: Record<string, number> = { PLN: 1.0 };

	fxRates.forEach((rate) => {
		const currencyCode = rate.code.replace("PLN", ""); // np. USDPLN -> USD
		ratesMap[currencyCode] = rate.value;
	});

	// --- LOGIKA PORTFELI I MOTYWU ---
	const activePortfolio = portfolios.find((p) => p.id === selectedPortfolioId);
	const lastUpdated = activePortfolio?.lastRefreshedAt
		? activePortfolio.lastRefreshedAt.toISOString()
		: null;

	let effectiveTheme = activePortfolio?.colorTheme || "blue";
	if (selectedPortfolioId.startsWith("demo-")) {
		effectiveTheme = "emerald";
	} else if (selectedPortfolioId === "ALL") {
		effectiveTheme = "indigo";
	}

	const userControl = <UserButton />;

	// --- MARKET TICKER ---
	const tickerData = [
		...fxRates.map((fx) => ({
			label: fx.code.replace("PLN", "/PLN"),
			value: fx.value.toFixed(4) + " PLN",
			change: (fx.change >= 0 ? "+" : "") + fx.change.toFixed(2) + "%",
			logo: `https://www.google.com/s2/favicons?domain=${fx.code.substring(0, 3).toLowerCase()}.com&sz=128`,
		})),
		...marketAssets.map((asset) => {
			const currentPrice =
				asset.quantity > 0 ? asset.currentValue / asset.quantity : 0;
			const displayChange = asset.dailyChange || 0;
			return {
				label: (asset.name || asset.ticker || "").slice(0, 25),
				value: formatCurrency(currentPrice) + " PLN",
				change:
					(displayChange >= 0 ? "+" : "") + displayChange.toFixed(2) + "%",
				logo: getStockLogo(asset.ticker),
			};
		}),
		...tickerIndices.map((idx) => {
			const isPositive = idx.dailyChange >= 0;
			return {
				label: idx.symbol === "GOLD" ? "ZŁOTO" : idx.symbol,
				value: formatCurrency(idx.price),
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
		<div
			id="app-wrapper"
			className="flex h-screen overflow-hidden bg-background"
			data-theme={effectiveTheme}
		>
			<ChartProvider initialCurrency={initialCurrency} exchangeRates={ratesMap}>
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
						<div className="w-full min-h-screen bg-t-bg-base transition-colors duration-300">
							<div className="page-container section-gap pb-10">{children}</div>
						</div>
					</main>
				</div>
			</ChartProvider>
		</div>
	);
}

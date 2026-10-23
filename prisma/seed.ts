import "dotenv/config";

import { CATEGORY_ASSETS } from "@/lib/constants";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DAYS_BACK = 1095; // 3 lata danych (aby działały filtry 1Y, 3Y)

const getPastDate = (daysAgo: number) => {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	date.setUTCHours(0, 0, 0, 0);
	return date;
};

// Funkcja do generowania "szumu" rynkowego (symulacja wykresu)
const generateMarketNoise = (dayIndex: number, volatility: number) => {
	const wave1 = Math.sin(dayIndex / 10) * volatility;
	const wave2 = Math.cos(dayIndex / 25) * (volatility * 1.5);
	const random = (Math.random() - 0.5) * (volatility * 0.5);
	return wave1 + wave2 + random;
};

async function main() {
	console.log("🧹 Czyszczenie starej bazy danych...");
	await prisma.user.deleteMany({ where: { email: "demo@example.com" } });
	await prisma.marketIndex.deleteMany();
	await prisma.indexHistory.deleteMany();
	// Wyczyść ewentualne sieroty (zazwyczaj Cascade to robi, ale dla pewności)
	await prisma.investmentPlan.deleteMany();

	console.log(
		"🚀 Rozpoczynam generowanie w pełni zsynchronizowanego środowiska testowego...",
	);

	// ==========================================
	// 1. UŻYTKOWNIK
	// ==========================================
	const hashedPassword = await bcrypt.hash("demoInvestGuard123!", 10);
	const user = await prisma.user.create({
		data: {
			email: "demo@example.com",
			name: "Tester Wykresów",
			password: hashedPassword,
			role: "ADMIN",
			observedIndices: ["SP500", "NASDAQ", "BTC"],
		},
	});

	// ==========================================
	// 2. INDEKSY RYNKOWE I ICH HISTORIA
	// ==========================================
	console.log("📈 Generowanie historycznych notowań indeksów (3 lata)...");
	const indices = [
		{ symbol: "SP500", name: "S&P 500", startPrice: 4000, trend: 1.2 },
		{ symbol: "NASDAQ", name: "NASDAQ 100", startPrice: 12000, trend: 2.5 },
		{ symbol: "BTC", name: "Bitcoin", startPrice: 30000, trend: 5.0 },
	];

	for (const idx of indices) {
		await prisma.marketIndex.create({
			data: {
				symbol: idx.symbol,
				name: idx.name,
				price: idx.startPrice + idx.trend * DAYS_BACK,
				dailyChange: 0.5,
				updatedAt: new Date(),
			},
		});

		const historyRecords = [];
		let currentPrice = idx.startPrice;
		for (let i = DAYS_BACK; i >= 0; i--) {
			currentPrice += idx.trend + generateMarketNoise(i, idx.trend * 10);
			historyRecords.push({
				symbol: idx.symbol,
				date: getPastDate(i),
				closePrice: Math.max(100, currentPrice),
			});
		}
		await prisma.indexHistory.createMany({ data: historyRecords });
	}

	// ==========================================
	// 3. PORTFELE
	// ==========================================
	console.log("💼 Tworzenie 3 zróżnicowanych portfeli...");
	const portfolios = await Promise.all([
		prisma.portfolio.create({
			data: {
				userId: user.id,
				name: "Ofensywny (Tech & Krypto)",
				colorTheme: "blue",
			},
		}),
		prisma.portfolio.create({
			data: {
				userId: user.id,
				name: "Zrównoważony 60/40",
				colorTheme: "emerald",
			},
		}),
		prisma.portfolio.create({
			data: {
				userId: user.id,
				name: "Defensywny (Obligacje & Złoto)",
				colorTheme: "indigo",
			},
		}),
	]);

	// ==========================================
	// 4. GENEROWANIE SNAPSHOTÓW + OBLICZENIA DLA ASSETÓW
	// ==========================================
	console.log(
		"📉 Generowanie krzywych wycen (Zsynchronizowane z tabelą Asset)...",
	);

	const profiles = [
		{ pId: portfolios[0].id, volatility: 400, trend: 15 },
		{ pId: portfolios[1].id, volatility: 150, trend: 8 },
		{ pId: portfolios[2].id, volatility: 30, trend: 3 },
	];

	const transactionsData = [
		// Portfel Ofensywny
		{ pIdx: 0, type: "DEPOSIT", val: 50000, daysAgo: 1000 },
		{
			pIdx: 0,
			type: "BUY",
			val: 30000,
			daysAgo: 990,
			asset: "BTC",
			cat: "CRYPTO",
			alpha: {
				expectedRoi: 120,
				conviction: 85,
				riskLevel: "HIGH",
				rationale: "Zabezpieczenie przed inflacją.",
			},
		},
		{ pIdx: 0, type: "DEPOSIT", val: 20000, daysAgo: 500 },
		{
			pIdx: 0,
			type: "BUY",
			val: 20000,
			daysAgo: 490,
			asset: "NVDA",
			cat: "BOOSTER",
			alpha: {
				expectedRoi: 60,
				conviction: 95,
				riskLevel: "MEDIUM-HIGH",
				rationale: "Monopol na rynku AI.",
			},
		},
		{
			pIdx: 0,
			type: "SELL",
			val: 15000,
			daysAgo: 100,
			asset: "BTC",
			cat: "CRYPTO",
		},

		// Portfel Zrównoważony
		{ pIdx: 1, type: "DEPOSIT", val: 100000, daysAgo: 1050 },
		{
			pIdx: 1,
			type: "BUY",
			val: 60000,
			daysAgo: 1040,
			asset: "SPY",
			cat: "DEVELOPED",
		},
		{
			pIdx: 1,
			type: "BUY",
			val: 40000,
			daysAgo: 1040,
			asset: "TOS",
			cat: "BONDS",
		},

		// Portfel Defensywny
		{ pIdx: 2, type: "DEPOSIT", val: 150000, daysAgo: 1090 },
		{
			pIdx: 2,
			type: "BUY",
			val: 100000,
			daysAgo: 1080,
			asset: "EDO",
			cat: "BONDS",
		},
		{
			pIdx: 2,
			type: "BUY",
			val: 50000,
			daysAgo: 1080,
			asset: "GOLD",
			cat: "GOLD",
		},
	];

	const allSnapshots = [];
	const finalAssetValues: Record<number, number> = { 0: 0, 1: 0, 2: 0 };

	for (const profile of profiles) {
		const pIdx = profiles.indexOf(profile);
		let currentInvested = 0;
		let simulatedValue = 0;

		for (let i = DAYS_BACK; i >= 0; i--) {
			const txsToday = transactionsData.filter(
				(t) => t.pIdx === pIdx && t.daysAgo === i,
			);

			for (const tx of txsToday) {
				if (tx.type === "DEPOSIT") {
					currentInvested += tx.val;
					simulatedValue += tx.val;
				}
				if (tx.type === "WITHDRAW") {
					currentInvested -= tx.val;
					simulatedValue -= tx.val;
				}
			}

			if (currentInvested > 0) {
				simulatedValue +=
					profile.trend + generateMarketNoise(i, profile.volatility);
			}

			simulatedValue = Math.max(0, simulatedValue);

			allSnapshots.push({
				portfolioId: profile.pId,
				date: getPastDate(i),
				totalValue: Number(simulatedValue.toFixed(2)),
				investedValue: currentInvested,
			});

			// Zapisz wartość w dniu "dzisiejszym" (0 days ago), aby precyzyjnie rozdzielić ją między aktywa
			if (i === 0) {
				finalAssetValues[pIdx] = simulatedValue;
			}
		}
	}

	await prisma.portfolioSnapshot.createMany({
		data: allSnapshots,
		skipDuplicates: true,
	});

	// ==========================================
	// 5. ZAPIS TRANSAKCJI I AKTYWÓW Z DOKŁADNĄ WYCENĄ
	// ==========================================
	for (let pIdx = 0; pIdx < profiles.length; pIdx++) {
		const portfolioTransactions = transactionsData.filter(
			(t) => t.pIdx === pIdx,
		);
		const buyTransactions = portfolioTransactions.filter(
			(t) => t.type === "BUY",
		);

		let totalInvestedInPortfolio = 0;
		buyTransactions.forEach((tx) => (totalInvestedInPortfolio += tx.val));

		for (const tx of portfolioTransactions) {
			await prisma.transactionHistory.create({
				data: {
					portfolioId: portfolios[pIdx].id,
					type: tx.type as any,
					executedValue: tx.val,
					executedAt: getPastDate(tx.daysAgo),
					assetName: tx.asset || "Gotówka",
					category: (tx.cat as keyof typeof CATEGORY_ASSETS) || "CASH",
				},
			});

			if (tx.type === "BUY") {
				// Przypisanie obecnej wartości proporcjonalnie do wpłaconego kapitału, aby suma idealnie zgadzała się ze snapshotem z dzisiaj
				const shareOfPortfolio = tx.val / totalInvestedInPortfolio;
				const calculatedCurrentValue =
					finalAssetValues[pIdx] * shareOfPortfolio;

				await prisma.asset.create({
					data: {
						portfolioId: portfolios[pIdx].id,
						name: tx.asset!,
						ticker: tx.asset!,
						category: tx.cat as any,
						quantity: 1,
						investedCapital: tx.val,
						currentValue: Number(calculatedCurrentValue.toFixed(2)),
						purchaseDate: getPastDate(tx.daysAgo),
						isObserved: true,
						// Pola dla sekcji Alpha
						...(tx.alpha || {}),
					},
				});
			}
		}
	}

	// ==========================================
	// 6. PLANNER - DODANIE PLANÓW
	// ==========================================
	console.log("🗓 Dodaję plany inwestycyjne do modułu Planner...");

	const now = new Date();
	const nextMonthDate = new Date(now);
	nextMonthDate.setDate(1);
	nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

	const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;
	const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

	const defaultPlannerPortfolioId = portfolios[0].id; // Planujemy główne zakupy do portfela ofensywnego

	const plans = [
		{
			portfolioId: defaultPlannerPortfolioId,
			name: "Vanguard S&P 500",
			ticker: "VUAA.L",
			value: 3000.0,
			plannedDate: thisMonthStr,
			targetCategory: "DEVELOPED",
		},
		{
			portfolioId: defaultPlannerPortfolioId,
			name: "Gotówka Rezerwowa",
			ticker: null,
			value: 1000.0,
			plannedDate: thisMonthStr,
			targetCategory: "CASH",
		},
		{
			portfolioId: defaultPlannerPortfolioId,
			name: "Złoto Fizyczne ETC",
			ticker: "IGLN.L",
			value: 1500.0,
			plannedDate: nextMonthStr,
			targetCategory: "COMMODITIES",
		},
		{
			portfolioId: defaultPlannerPortfolioId,
			name: "Obligacje 3-letnie (TOS)",
			ticker: "TOS",
			value: 4000.0,
			plannedDate: nextMonthStr,
			targetCategory: "BONDS",
		},
		{
			portfolioId: defaultPlannerPortfolioId,
			name: "Nvidia Booster",
			ticker: "NVDA",
			value: 2000.0,
			plannedDate: nextMonthStr,
			targetCategory: "BOOSTER",
		},
	];

	await prisma.investmentPlan.createMany({ data: plans as any });

	console.log(
		"✨ SUKCES! Potężne środowisko testowe gotowe. Zaloguj się na: demo@example.com (hasło: demoInvestGuard123!)",
	);
}

main()
	.catch((e) => {
		console.error("❌ Błąd:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

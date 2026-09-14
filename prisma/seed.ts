import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const getPastDate = (daysAgo: number) => {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	return date;
};

async function main() {
	console.log("🧹 Czyszczenie starego konta Demo...");
	await prisma.user.deleteMany({
		where: { email: "demo@example.com" },
	});
	console.log("🚀 Rozpoczynam generowanie Pokazowego Portfela (Demo)...");

	const hashedPassword = await bcrypt.hash("demo123", 10);
	const user = await prisma.user.upsert({
		where: { email: "demo@example.com" },
		update: {},
		create: {
			email: "demo@example.com",
			name: "Inwestor Demo",
			password: hashedPassword,
			observedIndices: ["SP500", "NASDAQ", "WIG20", "DAX", "GOLD", "BTC"],
		},
	});

	const portfolio = await prisma.portfolio.upsert({
		where: { id: "demo-portfolio-id" },
		update: {},
		create: {
			id: "demo-portfolio-id",
			userId: user.id,
			name: "Główny Portfel (Tech & Crypto)",
			targetDeveloped: 50,
			targetCrypto: 30,
			targetCash: 20,
		},
	});

	console.log("✅ Użytkownik i Portfel utworzeni.");

	// --- 1. WALORY (Dodano więcej Boosterów i Krypto do testowania Alpha) ---
	const assetsData = [
		// Bezpieczna Baza (Ignorowana przez stronę Alpha)
		{
			name: "Obligacje Skarbowe (TOS)",
			ticker: "TOS",
			category: "BONDS",
			quantity: 100,
			investedCapital: 10000.0,
			currentValue: 10160.0,
			purchaseDate: getPastDate(90),
		},
		{
			name: "S&P 500 ETF",
			ticker: "SPY",
			category: "DEVELOPED",
			quantity: 20,
			investedCapital: 40000.0,
			currentValue: 45000.0,
			purchaseDate: getPastDate(85),
		},

		// KRYPTOWALUTY (Sekcja Alpha)
		{
			name: "Bitcoin",
			ticker: "BTC",
			category: "CRYPTO",
			quantity: 0.15,
			investedCapital: 38000.0,
			currentValue: 39750.0,
			purchaseDate: getPastDate(60),
		},
		{
			name: "Ethereum",
			ticker: "ETH",
			category: "CRYPTO",
			quantity: 2.5,
			investedCapital: 15000.0,
			currentValue: 18500.0,
			purchaseDate: getPastDate(50),
		},
		{
			name: "Solana",
			ticker: "SOL",
			category: "CRYPTO",
			quantity: 45,
			investedCapital: 4500.0,
			currentValue: 12000.0,
			purchaseDate: getPastDate(80),
		}, // Duży zysk (Top Performer)

		// AKCJE BOOSTER (Sekcja Alpha)
		{
			name: "NVIDIA Corporation",
			ticker: "NVDA",
			category: "BOOSTER",
			quantity: 15,
			investedCapital: 18000.0,
			currentValue: 27500.0,
			purchaseDate: getPastDate(60),
			expectedRoi: 75.0,
			conviction: 90,
			riskLevel: "HIGH",
			rationale: "Dominacja GPU.",
		},
		{
			name: "Palantir Technologies",
			ticker: "PLTR",
			category: "BOOSTER",
			quantity: 40,
			investedCapital: 8000.0,
			currentValue: 11200.0,
			purchaseDate: getPastDate(45),
			expectedRoi: 50.0,
			conviction: 80,
			riskLevel: "MEDIUM-HIGH",
			rationale: "AIP rośnie.",
		},
		{
			name: "Tesla Inc.",
			ticker: "TSLA",
			category: "BOOSTER",
			quantity: 25,
			investedCapital: 22000.0,
			currentValue: 19500.0,
			purchaseDate: getPastDate(30),
			expectedRoi: 30.0,
			conviction: 55,
			riskLevel: "HIGH",
			rationale: "Zniżka cen w Chinach, ryzyko.",
		}, // Aktywo na minusie (Psuje Win Rate)
	];

	for (const a of assetsData) {
		await prisma.asset.create({
			data: { ...a, portfolioId: portfolio.id, updatedAt: new Date() } as any,
		});
	}

	// --- 2. HISTORIA TRANSAKCJI (Dodano sprzedaże, by przetestować zyski i wypłaty w Alpha) ---
	const transactions = [
		{
			type: "DEPOSIT",
			executedValue: 200000.0,
			executedAt: getPastDate(90),
			assetName: "Wpłata PLN",
			category: "CASH",
		},
		{
			ticker: "TOS",
			type: "BUY",
			quantity: 100,
			executedValue: 10000.0,
			executedAt: getPastDate(90),
			assetName: "Obligacje",
			category: "BONDS",
		},
		{
			ticker: "SPY",
			type: "BUY",
			quantity: 20,
			executedValue: 40000.0,
			executedAt: getPastDate(85),
			assetName: "S&P 500 ETF",
			category: "DEVELOPED",
		},
		{
			ticker: "SOL",
			type: "BUY",
			quantity: 45,
			executedValue: 4500.0,
			executedAt: getPastDate(80),
			assetName: "Solana",
			category: "CRYPTO",
		},
		{
			ticker: "BTC",
			type: "BUY",
			quantity: 0.1,
			executedValue: 25000.0,
			executedAt: getPastDate(60),
			assetName: "Bitcoin",
			category: "CRYPTO",
		},
		{
			ticker: "NVDA",
			type: "BUY",
			quantity: 15,
			executedValue: 18000.0,
			executedAt: getPastDate(60),
			assetName: "NVIDIA",
			category: "BOOSTER",
		},
		{
			ticker: "ETH",
			type: "BUY",
			quantity: 2.5,
			executedValue: 15000.0,
			executedAt: getPastDate(50),
			assetName: "Ethereum",
			category: "CRYPTO",
		},
		{
			ticker: "PLTR",
			type: "BUY",
			quantity: 40,
			executedValue: 8000.0,
			executedAt: getPastDate(45),
			assetName: "Palantir",
			category: "BOOSTER",
		},
		{
			ticker: "TSLA",
			type: "BUY",
			quantity: 25,
			executedValue: 22000.0,
			executedAt: getPastDate(30),
			assetName: "Tesla",
			category: "BOOSTER",
		},
		{
			ticker: "BTC",
			type: "BUY",
			quantity: 0.05,
			executedValue: 13000.0,
			executedAt: getPastDate(15),
			assetName: "Bitcoin",
			category: "CRYPTO",
		},

		// SYMULACJA SPRZEDAŻY Z ZYSKIEM (W połowie okresu sprzedajemy część NVDA, żeby zobaczyć jak reagują wskaźniki Alpha)
		{
			ticker: "NVDA",
			type: "SELL",
			quantity: 5,
			executedValue: 8500.0,
			executedAt: getPastDate(10),
			assetName: "NVIDIA",
			category: "BOOSTER",
			rationale: "Realizacja części zysków po rajdzie.",
		},
	];

	for (const tx of transactions) {
		await prisma.transactionHistory.create({
			data: { ...tx, portfolioId: portfolio.id } as any,
		});
	}

	// --- 3. SNAPSHOTY (Zrzuty wyceny całego portfela wstecz) ---
	let currentInvested = 0;
	const snapshots = [];

	for (let i = 90; i >= 0; i--) {
		const date = getPastDate(i);
		date.setUTCHours(0, 0, 0, 0);

		// Odwzorowanie dodawania kapitału w czasie w oparciu o transakcje wyżej
		if (i === 90) currentInvested += 10000;
		if (i === 85) currentInvested += 40000;
		if (i === 80) currentInvested += 4500;
		if (i === 60) currentInvested += 43000;
		if (i === 50) currentInvested += 15000;
		if (i === 45) currentInvested += 8000;
		if (i === 30) currentInvested += 22000;
		if (i === 15) currentInvested += 13000;
		if (i === 10) currentInvested -= 8500; // Odejmujemy wypłatę ze sprzedaży

		const marketFluctuation = Math.sin(i / 5) * 4000 + Math.cos(i / 2) * 2000;
		const baseValue = currentInvested + (90 - i) * 350 + marketFluctuation;

		snapshots.push({
			portfolioId: portfolio.id,
			date: date,
			totalValue: Number(baseValue.toFixed(2)),
			investedValue: currentInvested,
		});
	}

	await prisma.portfolioSnapshot.createMany({
		data: snapshots,
		skipDuplicates: true,
	});

	console.log(
		"✅ Zakończono seedowanie bogatych danych testowych dla Alpha Selection.",
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

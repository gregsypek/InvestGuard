import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Pomocnicza funkcja do cofania się w czasie (np. o 30 dni)
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

	// 1. Tworzenie użytkownika testowego
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

	// 2. Tworzenie Portfela
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

	// 3. Tworzenie Walorów (Assets)
	const assetApple = await prisma.asset.create({
		data: {
			portfolioId: portfolio.id,
			name: "Apple Inc.",
			ticker: "AAPL",
			category: "DEVELOPED",
			quantity: 50,
			investedCapital: 37500.0,
			currentValue: 44025.0,
			purchaseDate: getPastDate(45),
			updatedAt: new Date(),
		},
	});

	const assetSP500 = await prisma.asset.create({
		data: {
			portfolioId: portfolio.id,
			name: "S&P 500 ETF",
			ticker: "SPY",
			category: "DEVELOPED",
			quantity: 20,
			investedCapital: 40000.0,
			currentValue: 45000.0,
			purchaseDate: getPastDate(85),
			updatedAt: new Date(),
		},
	});

	const assetBTC = await prisma.asset.create({
		data: {
			portfolioId: portfolio.id,
			name: "Bitcoin",
			ticker: "BTC",
			category: "CRYPTO",
			quantity: 0.15,
			investedCapital: 38000.0,
			currentValue: 39750.0,
			purchaseDate: getPastDate(60),
			updatedAt: new Date(),
		},
	});

	// Poprawiono wycenę obligacji o narosłe odsetki (ok. 160 PLN zysku po 90 dniach)
	const assetBonds = await prisma.asset.create({
		data: {
			portfolioId: portfolio.id,
			name: "Obligacje Skarbowe (TOS)",
			ticker: "TOS",
			category: "BONDS",
			quantity: 100,
			investedCapital: 10000.0,
			currentValue: 10160.0,
			purchaseDate: getPastDate(90),
			interestRate: 6.5,
			updatedAt: new Date(),
		},
	});

	const assetBondsEDO = await prisma.asset.create({
		data: {
			portfolioId: portfolio.id,
			name: "Obligacje Skarbowe 10-letnie (EDO)",
			ticker: "EDO1133",
			category: "BONDS",
			quantity: 50,
			investedCapital: 5000.0, // 50 sztuk po 100 PLN
			currentValue: 5074.5, // 5000 + ok. 74.5 PLN odsetek (7.25% przez 75 dni)
			purchaseDate: getPastDate(75),
			interestRate: 7.25, // Wyższe oprocentowanie dla 10-latek
			updatedAt: new Date(),
		},
	});

	const assetNvidia = await prisma.asset.create({
		data: {
			portfolioId: portfolio.id,
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
			rationale: "Dominacja w segmencie sztucznej inteligencji i układów GPU.",
			updatedAt: new Date(),
		},
	});

	const assetPalantir = await prisma.asset.create({
		data: {
			portfolioId: portfolio.id,
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
			rationale: "Kontrakty rządowe i dynamiczny wzrost platformy AIP.",
			updatedAt: new Date(),
		},
	});

	console.log("✅ Wszystkie walory dodane.");

	// 4. Historia Transakcji (Zbilansowane kwotowo)
	const transactions = [
		{
			portfolioId: portfolio.id,
			type: "DEPOSIT",
			executedValue: 160000.0, // Zwiększono depozyt startowy do 160k, by pokryć wszystkie zakupy i zostawić gotówkę
			executedAt: getPastDate(90),
			assetName: "Wpłata PLN",
			category: "CASH",
		},
		{
			portfolioId: portfolio.id,
			ticker: "TOS",
			type: "BUY",
			quantity: 100,
			executedValue: 10000.0,
			executedAt: getPastDate(90),
			assetName: "Obligacje Skarbowe",
			category: "BONDS",
		},
		{
			portfolioId: portfolio.id,
			ticker: "SPY",
			type: "BUY",
			quantity: 20,
			executedValue: 40000.0,
			executedAt: getPastDate(85),
			assetName: "S&P 500 ETF",
			category: "DEVELOPED",
		},
		{
			portfolioId: portfolio.id,
			ticker: "BTC",
			type: "BUY",
			quantity: 0.1,
			executedValue: 25000.0,
			executedAt: getPastDate(60),
			assetName: "Bitcoin",
			category: "CRYPTO",
		},
		{
			portfolioId: portfolio.id,
			ticker: "NVDA",
			type: "BUY",
			quantity: 15,
			executedValue: 18000.0,
			executedAt: getPastDate(60),
			assetName: "NVIDIA Corporation",
			category: "BOOSTER",
		},
		{
			portfolioId: portfolio.id,
			ticker: "AAPL",
			type: "BUY",
			quantity: 50,
			executedValue: 37500.0,
			executedAt: getPastDate(45),
			assetName: "Apple Inc.",
			category: "DEVELOPED",
		},
		{
			portfolioId: portfolio.id,
			ticker: "PLTR",
			type: "BUY",
			quantity: 40,
			executedValue: 8000.0,
			executedAt: getPastDate(45),
			assetName: "Palantir Technologies",
			category: "BOOSTER",
		},
		{
			portfolioId: portfolio.id,
			ticker: "BTC",
			type: "BUY",
			quantity: 0.05,
			executedValue: 13000.0,
			executedAt: getPastDate(15),
			assetName: "Bitcoin",
			category: "CRYPTO",
		},
		{
			portfolioId: portfolio.id,
			ticker: "EDO1133",
			type: "BUY",
			quantity: 50,
			executedValue: 5000.0,
			executedAt: getPastDate(75), // Kupione 75 dni temu
			assetName: "Obligacje 10-letnie",
			category: "BONDS",
		},
	];

	for (const tx of transactions) {
		await prisma.transactionHistory.create({ data: tx as any });
	}

	console.log("✅ Historia transakcji wygenerowana.");

	// 5. Generowanie sztucznych Snaphotów na 90 dni wstecz
	console.log("⏳ Generowanie historycznych wycen portfela (Snapshots)...");

	let currentInvested = 50000; // Start z 90 dni temu: Obligacje (10k) + SPY (40k)
	let baseValue = 50000;

	const snapshots = [];
	for (let i = 90; i >= 0; i--) {
		const date = getPastDate(i);
		date.setUTCHours(0, 0, 0, 0);

		const marketFluctuation = Math.sin(i / 5) * 2000 + Math.cos(i / 2) * 1000;

		// Synchronizacja kapitału z realnymi datami zakupów z tablicy transakcji
		if (i === 75) currentInvested += 5000; // Zakup obligacji 10-letnich
		if (i === 60) currentInvested += 25000 + 18000; // Zakup BTC + Nvidia
		if (i === 45) currentInvested += 37500 + 8000; // Zakup Apple + Palantir
		if (i === 15) currentInvested += 13000; // Dokupienie BTC

		baseValue = currentInvested + (90 - i) * 180 + marketFluctuation;

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

	console.log("✅ Wgrano 90 dni historii dla trybu Rzeczywistego!");
	console.log(
		"🎉 Seedowanie zakończone sukcesem. Możesz się zalogować jako demo@example.com (hasło: demo123)",
	);
}

main()
	.catch((e) => {
		console.error("❌ Błąd podczas seedowania:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

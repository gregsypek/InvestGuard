import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
	console.log("🚀 Rozpoczynam generowanie danych dla Planner Dashboard...");

	// 1. Znajdź użytkownika Demo
	const user = await prisma.user.findUnique({
		where: { email: "demo@example.com" },
	});

	if (!user) {
		console.error(
			"❌ Użytkownik demo@example.com nie istnieje. Uruchom najpierw zwykły seed.ts!",
		);
		process.exit(1);
	}

	// 2. Znajdź główny portfel
	const portfolio = await prisma.portfolio.findFirst({
		where: { userId: user.id },
	});

	if (!portfolio) {
		console.error("❌ Użytkownik demo nie posiada portfela.");
		process.exit(1);
	}

	// 3. DATY LOGIKI PLANERA
	const now = new Date();

	// Transakcje zaksięgowane "w tym miesiącu" (wczoraj)
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);

	// Plany na "przyszły miesiąc" (obliczane tak samo jak w PlannerDashboardClient)
	const nextMonthDate = new Date(now);
	nextMonthDate.setDate(1); // Zabezpieczenie przed przewinięciem (np. z 31 na 1)
	nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
	const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

	// Plany na "ten miesiąc" (niezrealizowane)
	const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

	console.log(
		`📅 Dodaję transakcje z: ${yesterday.toLocaleDateString("pl-PL")}`,
	);
	console.log(`🎯 Dodaję plany na: ${thisMonthStr} oraz ${nextMonthStr}`);

	// 4. GENEROWANIE ZAKSIĘGOWANYCH TRANSAKCJI (Ten miesiąc)
	const recentTransactions = [
		{
			portfolioId: portfolio.id,
			ticker: "EDO",
			type: "BUY",
			quantity: 15,
			executedValue: 1500.0,
			executedAt: yesterday,
			assetName: "Obligacje 10-letnie (Bieżący miesiąc)",
			category: "BONDS",
		},
		{
			portfolioId: portfolio.id,
			ticker: "AAPL",
			type: "BUY",
			quantity: 5,
			executedValue: 4200.0,
			executedAt: yesterday,
			assetName: "Apple Inc.",
			category: "DEVELOPED",
			originalPrice: 215.5,
			originalCurrency: "USD",
		},
		{
			portfolioId: portfolio.id,
			ticker: "PLTR",
			type: "BUY",
			quantity: 20,
			executedValue: 2400.0,
			executedAt: yesterday,
			assetName: "Palantir",
			category: "BOOSTER",
			originalPrice: 30.1,
			originalCurrency: "USD",
		},
	];

	for (const tx of recentTransactions) {
		await prisma.transactionHistory.create({ data: tx as any });
	}
	console.log("✅ Dodano 3 najnowsze transakcje z tego miesiąca.");

	// 5. GENEROWANIE PLANÓW INWESTYCYJNYCH (InvestmentPlan)
	// Aby uniknąć duplikatów przy kilkukrotnym odpalaniu testów, kasujemy stare plany tego portfela
	await prisma.investmentPlan.deleteMany({
		where: { portfolioId: portfolio.id },
	});

	const plans = [
		// Plany na BIEŻĄCY MIESIĄC (zasilą sekcję "Oczekujące Realizacje" na dole)
		{
			portfolioId: portfolio.id,
			name: "Vanguard S&P 500",
			ticker: "VUAA.L",
			value: 3000.0,
			plannedDate: thisMonthStr,
			targetCategory: "DEVELOPED",
		},
		{
			portfolioId: portfolio.id,
			name: "Gotówka Rezerwowa",
			ticker: null,
			value: 1000.0,
			plannedDate: thisMonthStr,
			targetCategory: "CASH",
		},
		// Plany na PRZYSZŁY MIESIĄC (zasilą sekcję "Na celowniku" w Zestawieniu Miesiąca)
		{
			portfolioId: portfolio.id,
			name: "Złoto Fizyczne ETC",
			ticker: "IGLN.L",
			value: 1500.0,
			plannedDate: nextMonthStr,
			targetCategory: "COMMODITIES",
		},
		{
			portfolioId: portfolio.id,
			name: "Obligacje 3-letnie (TOS)",
			ticker: "TOS",
			value: 4000.0,
			plannedDate: nextMonthStr,
			targetCategory: "BONDS",
		},
		{
			portfolioId: portfolio.id,
			name: "Nvidia Booster",
			ticker: "NVDA",
			value: 2000.0,
			plannedDate: nextMonthStr,
			targetCategory: "BOOSTER",
		},
	];

	await prisma.investmentPlan.createMany({
		data: plans as any,
	});
	console.log(
		"✅ Dodano 5 planów inwestycyjnych (2 na ten miesiąc, 3 na przyszły).",
	);

	console.log("🎉 Środowisko testowe dla Plannera gotowe!");
}

main()
	.catch((e) => {
		console.error("❌ Błąd:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

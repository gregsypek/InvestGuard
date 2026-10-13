import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { syncPortfolioAssets } from "../lib/actions/asset-actions"; // Upewnij się, że ścieżka jest poprawna!

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
	console.log("🧹 Czyszczenie bazy pod testy XTB...");
	await prisma.user.deleteMany({
		where: { email: "testxtb@example.com" },
	});

	console.log("🔐 Generowanie bezpiecznego konta...");
	// Mocne hasło, żeby przeglądarki nie krzyczały
	const hashedPassword = await bcrypt.hash("InvestGuard!2026Demo", 10);

	const user = await prisma.user.create({
		data: {
			email: "testxtb@example.com",
			name: "QA Tester XTB",
			password: hashedPassword,
		},
	});

	const portfolio = await prisma.portfolio.create({
		data: {
			userId: user.id,
			name: "Laboratorium XTB",
			targetDeveloped: 100,
		},
	});

	console.log(
		"📊 Wstrzykiwanie surowych logów transakcji (Symulacja Importu CSV)...",
	);

	// Wstrzykujemy transakcje dokładnie tak, jak robi to Twój parser XTB
	const transactions = [
		// 1. Zasilenie konta (gotówka na zakupy)
		{
			portfolioId: portfolio.id,
			type: "DEPOSIT",
			executedValue: 10000.0,
			executedAt: new Date("2026-09-01"),
			assetName: "Wpłata PLN",
			category: "CASH",
			ticker: "CASH",
		},
		// 2. TEST "ZAMKNIĘTEJ SPÓŁKI" (Błąd ułamków)
		{
			portfolioId: portfolio.id,
			ticker: "AAPL.US",
			type: "BUY",
			quantity: 10.3333, // Ułamki z XTB
			executedValue: 2000.0,
			executedAt: new Date("2026-09-05"),
			assetName: "Apple Inc.",
			category: "DEVELOPED",
			originalCurrency: "USD",
		},
		{
			portfolioId: portfolio.id,
			ticker: "AAPL.US",
			type: "SELL",
			quantity: 10.3333, // Sprzedaż całości
			executedValue: 2100.0,
			executedAt: new Date("2026-09-15"),
			assetName: "Apple Inc.",
			category: "DEVELOPED",
			originalCurrency: "USD",
		},
		// 3. TEST SOWY (Błąd -90%)
		{
			portfolioId: portfolio.id,
			ticker: "OWL.US",
			type: "BUY",
			quantity: 100.0, // Przykładowa ilość
			executedValue: 5126.86, // ~51,26 PLN za sztukę po przeliczeniu z USD (jak z Twojego logu)
			executedAt: new Date("2026-10-09"),
			assetName: "Blue Owl Capital Inc.",
			category: "DEVELOPED",
			originalPrice: 9.68,
			originalCurrency: "USD",
			exchangeRate: 5.29, // 51.26 / 9.68
		},
	];

	for (const tx of transactions) {
		await prisma.transactionHistory.create({ data: tx as any });
	}
	console.log("✅ Wstrzyknięto logi do bazy.");

	console.log(
		"⚙️ Uruchamianie mechanizmu odbudowy portfela (syncPortfolioAssets)...",
	);
	// 🚀 To jest kluczowe: puszczamy Twoją główną funkcję na naszych testowych danych
	await syncPortfolioAssets(portfolio.id);

	// Odczytujemy jak system to zinterpretował
	const savedAssets = await prisma.asset.findMany({
		where: { portfolioId: portfolio.id },
	});

	console.log("\n================ WYNIK SYNCHRONIZACJI ================\n");
	savedAssets.forEach((a) => {
		console.log(`📌 Aktywo: ${a.name} (${a.ticker})`);
		console.log(`   - Sztuk: ${a.quantity}`);
		console.log(`   - Baza kosztowa: ${a.investedCapital} PLN`);
		console.log(`   - Obecna wycena: ${a.currentValue} PLN`);
		console.log("------------------------------------------------------");
	});

	console.log(
		"\n🚀 Gotowe! Zaloguj się na testxtb@example.com (hasło: InvestGuard!2026Demo)",
	);
	console.log(
		"   i kliknij 'Aktualizuj Kursy', aby przetestować połączenie z Yahoo!",
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

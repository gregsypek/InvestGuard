import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Inicjalizacja klienta Prisma dokładnie tak jak w seed.ts
const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
	console.log("🧹 Rozpoczynam czyszczenie historii S&P 500...");

	// 2. Usuwamy WSZYSTKIE wpisy dla SP500 z tabeli IndexHistory
	const deleted = await prisma.indexHistory.deleteMany({
		where: {
			symbol: "SP500",
		},
	});

	console.log(
		`✅ Sukces! Usunięto ${deleted.count} fałszywych rekordów S&P 500.`,
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

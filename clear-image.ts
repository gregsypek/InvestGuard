import * as dotenv from "dotenv"; // 🚀 DODANE: Import dotenv

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 🚀 DODANE: Załadowanie zmiennych z pliku .env przed połączeniem
dotenv.config({ path: ".env" });

const { Pool } = pg;

// Teraz process.env.DATABASE_URL na pewno istnieje
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("🧹 Usuwanie gigantycznych zdjęć (Cookie Bomb) z bazy...");

	await prisma.user.updateMany({
		data: {
			image: null,
		},
	});

	console.log(
		"✅ Gotowe! Zdjęcia wyczyszczone. Możesz się teraz zalogować w Safari.",
	);
}

main()
	.catch((e) => console.error(e))
	.finally(async () => {
		await prisma.$disconnect();
	});

// lib/data.ts
import { auth } from "@/auth";
import { db } from "@/lib/db"; // EN: Your prisma instance

export async function getBonds(portfolioId?: string) {
	// 1. Zabezpieczenie sesji
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	// 2. Jeśli nie przekazano portfolioId, nie mamy czego szukać
	if (!portfolioId) {
		return [];
	}

	// 3. Pobieranie z bazy DANYCH TYLKO DLA TEGO PORTFELA I TEGO UŻYTKOWNIKA
	const bonds = await db.asset.findMany({
		where: {
			category: "BONDS",
			portfolioId: portfolioId, // Filtrowanie po ID portfela
			portfolio: {
				userId: session.user.id, // OSTATECZNE ZABEZPIECZENIE: Upewniamy się, że portfel należy do zalogowanego usera
			},
			OR: [
				{ ticker: { contains: "EDO" } },
				{ ticker: { contains: "DOS" } },
				{ ticker: { contains: "COI" } },
				{ ticker: { contains: "TOZ" } },
				{ ticker: { contains: "ROD" } },
				{ ticker: { contains: "OTS" } },
				{ ticker: { contains: "ROS" } },
			],
		},
		orderBy: {
			purchaseDate: "desc",
		},
	});

	return bonds;
}

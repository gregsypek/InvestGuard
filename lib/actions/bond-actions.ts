// lib/data.ts
import { db } from "@/lib/db"; // EN: Your prisma instance

export async function getBonds() {
	// EN: Fetching assets that are categorized as bonds or have specific tickers
	const bonds = await db.asset.findMany({
		where: {
			// EN: Adjust the filter based on your schema (e.g., category: 'BOND')
			OR: [
				{ ticker: { contains: "EDO" } },
				{ ticker: { contains: "DOS" } },
				{ ticker: { contains: "COI" } },
				{ ticker: { contains: "TOZ" } },
			],
		},
		orderBy: {
			purchaseDate: "desc",
		},
	});

	return bonds;
}

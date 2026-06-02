"use server";

import { db } from "../db";
import { revalidatePath } from "next/cache";

export async function getTransactionHistory(
	page: number = 1,
	take: number = 10,
	userId: string,
	search: string = "", // <-- Nowy parametr
	category: string = "ALL", // <-- Nowy parametr
	sort: string = "date_desc", // <-- Nowy parametr
	portfolioIdFilter: string = "ALL", //  Nowy parametr
) {
	try {
		const skip = (page - 1) * take;

		// 1. Budujemy dynamiczne warunki wyszukiwania (WHERE)
		// Używamy typu 'any' lub Record<string, any> dla uproszczenia,
		// ale Prisma to bez problemu przetrawi.
		const whereClause: any = {
			portfolio: {
				userId: userId, // <-- Podstawa: tylko transakcje tego usera
			},
		};

		// Jeśli wpisano coś w wyszukiwarkę (szukamy po nazwie lub tickerze bez względu na wielkość liter)
		if (search) {
			whereClause.OR = [
				{ assetName: { contains: search, mode: "insensitive" } },
				{ ticker: { contains: search, mode: "insensitive" } },
			];
		}

		// Jeśli wybrano konkretną kategorię inną niż "Wszystkie"
		if (category && category !== "ALL") {
			whereClause.category = category;
		}

		// ZMIANA 2: Filtr konkretnego portfela
		if (portfolioIdFilter && portfolioIdFilter !== "ALL") {
			whereClause.portfolioId = portfolioIdFilter;
		}

		// 2. Budujemy dynamiczne sortowanie (ORDER BY)
		let orderByClause: any = { executedAt: "desc" };
		switch (sort) {
			case "date_desc":
				orderByClause = { executedAt: "desc" };
				break;
			case "date_asc":
				orderByClause = { executedAt: "asc" };
				break;
			case "value_desc":
				orderByClause = { executedValue: "desc" };
				break;
			case "value_asc":
				orderByClause = { executedValue: "asc" };
				break;
		}

		// 3. Uruchamiamy zapytania równolegle (z nowymi warunkami)
		const [transactions, totalCount] = await Promise.all([
			// A. Pobieranie konkretnych 10 rekordów
			db.transactionHistory.findMany({
				where: whereClause, // <-- Wrzucamy nasze filtry
				take,
				skip,
				orderBy: orderByClause, // <-- Wrzucamy sortowanie
				include: {
					portfolio: { select: { name: true } },
				},
			}),

			// B. Zliczanie WSZYSTKICH rekordów pasujących do filtra (niezbędne do paginacji)
			db.transactionHistory.count({
				where: whereClause, // <-- Wrzucamy DOKŁADNIE TE SAME filtry!
			}),
		]);

		const totalPages = Math.ceil(totalCount / take);

		return {
			success: true,
			data: transactions,
			meta: {
				totalCount,
				totalPages,
				currentPage: page,
			},
		};
	} catch (error) {
		console.error("Failed to fetch history:", error);
		return { success: false, error: "Could not load transaction history" };
	}
}

export async function deleteHistoryItem(id: string) {
	try {
		await db.transactionHistory.delete({ where: { id } });
		revalidatePath("/activity");
		return { success: true };
	} catch {
		return { success: false, error: "Błąd usuwania" };
	}
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";

export async function getTransactionHistory(
	page: number = 1,
	take: number = 10,
) {
	try {
		const skip = (page - 1) * take;

		// We run both queries in parallel for better performance
		const [transactions, totalCount] = await Promise.all([
			db.transactionHistory.findMany({
				take,
				skip,
				orderBy: {
					executedAt: "desc", // Latest transactions first
				},
				include: {
					portfolio: {
						select: { name: true }, // Just to show which portfolio it belongs to
					},
				},
			}),
			db.transactionHistory.count(),
		]);

		const totalPages = Math.ceil(totalCount / take); // Jeśli masz 21 rekordów i take wynosi 10, to 21/10=2.1. Math.ceil zaokrągli to do 3, więc będziesz miał 3 strony (10+10+1).

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

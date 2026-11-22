"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { TransactionHistory } from "@prisma/client";
import { db } from "../db";

export type TransactionWithPortfolio = TransactionHistory & {
	portfolio: { name: string };
};

export async function getTransactionHistory(
	page: number = 1,
	take: number = 10,
	userId: string,
	search: string = "",
	category: string = "ALL",
	sort: string = "date_desc",
	portfolioIdFilter: string = "ALL",
) {
	try {
		const skip = (page - 1) * take;

		// 1. Build dynamic search filters (WHERE) scoped strictly to the logged-in user
		const whereClause: any = {
			portfolio: {
				userId,
			},
		};

		// Case-insensitive search across assetName and ticker
		if (search) {
			whereClause.OR = [
				{ assetName: { contains: search, mode: "insensitive" } },
				{ ticker: { contains: search, mode: "insensitive" } },
			];
		}

		// Filter by specific asset category
		if (category && category !== "ALL") {
			whereClause.category = category;
		}

		// Filter by specific portfolio ID
		if (portfolioIdFilter && portfolioIdFilter !== "ALL") {
			whereClause.portfolioId = portfolioIdFilter;
		}

		// 2. Build dynamic sorting (ORDER BY)
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

		// 3. Execute paginated query and total count in parallel with lightweight projection
		const [transactions, totalCount] = await Promise.all([
			db.transactionHistory.findMany({
				where: whereClause,
				take,
				skip,
				orderBy: orderByClause,
				select: {
					id: true,
					type: true,
					assetName: true,
					ticker: true,
					quantity: true,
					executedAt: true,
					executedValue: true,
					category: true,
					comment: true,
					exchangeRate: true,
					originalPrice: true,
					originalCurrency: true,
					portfolioId: true,
					portfolio: {
						select: { name: true },
					},
				},
			}),

			db.transactionHistory.count({
				where: whereClause,
			}),
		]);

		const totalPages = Math.ceil(totalCount / take);

		return {
			success: true,
			data: transactions as unknown as TransactionWithPortfolio[],
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
		revalidateTag("snapshots", "max");
		revalidatePath("/activity");
		return { success: true };
	} catch {
		return { success: false, error: "Błąd usuwania" };
	}
}

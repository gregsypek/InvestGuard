// lib/actions/cleanup.actions.ts
"use server";

import type { Category } from "@prisma/client";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function migrateAssetCategory(
	assetName: string,
	targetCategory: Category,
) {
	try {
		const result = await db.$transaction(async (tx) => {
			// 1. Aktualizacja w tabeli Aktywów
			const assets = await tx.asset.updateMany({
				where: { name: { contains: assetName, mode: "insensitive" } },
				data: { category: targetCategory },
			});

			// 2. Aktualizacja w Historii (Kluczowe dla Twojego wykresu!)
			const history = await tx.transactionHistory.updateMany({
				where: { assetName: { contains: assetName, mode: "insensitive" } },
				data: { category: targetCategory },
			});

			return { assets: assets.count, history: history.count };
		});

		revalidatePath("/alpha");
		return { success: true, ...result };
	} catch (error) {
		console.error("Migration error:", error);
		return { success: false, error: "Błąd bazy danych" };
	}
}

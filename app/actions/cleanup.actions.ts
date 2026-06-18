"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function hardDeleteAssetWithHistory(assetId: string) {
	try {
		// 1. Kasujemy całą historię transakcji powiązaną z tym aktywem
		// (Zależnie od Twojego schematu DB, może to wymagać nazwy, tickera lub id)
		const asset = await db.asset.findUnique({ where: { id: assetId } });
		if (!asset) return { success: false, error: "Nie znaleziono aktywa" };

		// Zakładam, że historia jest powiązana po nazwie i kategorii (zgodnie z systemem)
		await db.transactionHistory.deleteMany({
			where: {
				portfolioId: asset.portfolioId,
				assetName: asset.name,
				category: asset.category,
			},
		});

		// 2. Kasujemy samo aktywo
		await db.asset.delete({ where: { id: assetId } });

		revalidatePath("/", "layout"); // Odświeża wszystko
		return { success: true };
	} catch {
		return { success: false, error: "Błąd serwera podczas usuwania" };
	}
}

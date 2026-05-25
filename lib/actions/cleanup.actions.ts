// lib/actions/cleanup.actions.ts
"use server";

import type { Category } from "@prisma/client";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { syncPortfolioAssets } from "./asset-actions";

export async function migrateAssetCategory(
	identifier: string, // np. "mWIG40TR" lub "ETFBM40TR.PL"
	targetCategory: Category,
	portfolioId: string,
) {
	try {
		const result = await db.$transaction(async (tx) => {
			// 1. Znajdź poprawne dane aktywa (aby naprawić "undefined")
			const targetAsset = await tx.asset.findFirst({
				where: {
					OR: [{ name: identifier }, { ticker: identifier }],
					portfolioId,
				},
			});

			const correctName = targetAsset?.name || identifier;
			const correctTicker = targetAsset?.ticker || identifier;

			// 2. Szukamy wszystkiego co pasuje do identyfikatora LUB jest "undefined"
			// ale ma ten sam ticker.
			const history = await tx.transactionHistory.updateMany({
				where: {
					portfolioId,
					OR: [
						{ assetName: identifier },
						{ ticker: identifier },
						{ assetName: "undefined" }, // Czyścimy widma
						{ ticker: "undefined" },
					],
					// Dodatkowy bezpiecznik: jeśli szukamy konkretnego tickera
					...(targetAsset?.ticker && {
						OR: [
							{ ticker: targetAsset.ticker },
							{ assetName: targetAsset.name },
						],
					}),
				},
				data: {
					category: targetCategory,
					assetName: correctName,
					ticker: correctTicker,
				},
			});

			// 3. Napraw Główne Aktywo
			const assets = await tx.asset.updateMany({
				where: {
					portfolioId,
					OR: [{ name: identifier }, { ticker: identifier }],
				},
				data: { category: targetCategory },
			});

			return { assets: assets.count, history: history.count };
		});

		// 🚀 PRZELICZENIE PORTFELA (Kluczowe dla wykresów!)
		await syncPortfolioAssets(portfolioId);

		revalidatePath("/dashboard");
		return { success: true, ...result };
	} catch (error) {
		console.error("Migration error:", error);
		return { success: false, error: "Błąd bazy danych" };
	}
}

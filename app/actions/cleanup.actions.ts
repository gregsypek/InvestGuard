"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { rollbackSnapshotsForDeletedTransaction } from "@/lib/actions/transactions";
import { syncPortfolioAssets } from "@/lib/actions/asset-actions"; // Ważne: Zaimportuj to!

export async function hardDeleteAssetWithHistory(assetId: string) {
	try {
		const asset = await db.asset.findUnique({ where: { id: assetId } });
		if (!asset) return { success: false, error: "Nie znaleziono aktywa" };

		await db.transactionHistory.deleteMany({
			where: {
				portfolioId: asset.portfolioId,
				assetName: asset.name,
				category: asset.category,
			},
		});

		await db.asset.delete({ where: { id: assetId } });

		revalidatePath("/", "layout");
		return { success: true };
	} catch {
		return { success: false, error: "Błąd serwera podczas usuwania" };
	}
}

/**
 * 🚀 NOWOŚĆ: Pobiera historię transakcji dla konkretnego aktywa
 */
export async function getAssetTransactions(assetId: string) {
	try {
		const asset = await db.asset.findUnique({ where: { id: assetId } });
		if (!asset)
			return {
				success: false,
				error: "Nie znaleziono aktywa.",
				transactions: [],
			};

		const transactions = await db.transactionHistory.findMany({
			where: {
				portfolioId: asset.portfolioId,
				OR: [
					{ ticker: asset.ticker },
					{ assetName: asset.name, category: asset.category },
				],
			},
			orderBy: { executedAt: "desc" },
		});

		return { success: true, transactions };
	} catch (error) {
		console.error("Błąd pobierania historii transakcji:", error);
		return {
			success: false,
			error: "Błąd podczas pobierania transakcji.",
			transactions: [],
		};
	}
}

/**
 * 🚀 NOWOŚĆ: Usuwa KONKRETNĄ transakcję po jej ID i dostosowuje zrzuty
 */

export async function revertSpecificTransaction(transactionId: string) {
	try {
		const txToRevert = await db.transactionHistory.findUnique({
			where: { id: transactionId },
		});

		if (!txToRevert) {
			return {
				success: false,
				error: "Nie znaleziono transakcji do usunięcia.",
			};
		}

		// A. Usuwamy wpis z historii (tylko to!)
		await db.transactionHistory.delete({
			where: { id: transactionId },
		});

		// B. Wywołujemy przebudowanie całego portfela
		// To sprawi, że gotówka (CASH) oraz akcje przeliczą się na nowo bez brakującej transakcji!
		await syncPortfolioAssets(txToRevert.portfolioId);

		// C. Korygujemy historyczne zrzuty portfela
		await rollbackSnapshotsForDeletedTransaction(
			txToRevert.portfolioId,
			txToRevert.executedAt,
			txToRevert.executedValue,
			txToRevert.type as any,
		);

		revalidatePath("/", "layout");
		return {
			success: true,
			message:
				"Wybrana transakcja została wycofana, a wykresy i gotówka zaktualizowane.",
		};
	} catch (error) {
		console.error("Błąd podczas cofania konkretnej transakcji:", error);
		return { success: false, error: "Błąd serwera podczas wymazywania." };
	}
}

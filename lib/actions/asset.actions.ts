"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "../types";

export async function updateAssetValues(
	assetId: string,
	newCurrentValue: number,
	newInvestedCapital?: number, // Opcjonalnie, jeśli chcesz zmienić też bazę
): Promise<ActionResponse> {
	try {
		await db.asset.update({
			where: { id: assetId },
			data: {
				currentValue: newCurrentValue,
				// Jeśli nie podamy investedCapital, zostanie stare (lub 0)
				...(newInvestedCapital !== undefined && {
					investedCapital: newInvestedCapital,
				}),
			},
		});

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Błąd aktualizacji aktywa:", error);
		return { success: false, error: "Nie udało się zaktualizować wyceny." };
	}
}

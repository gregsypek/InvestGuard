"use server";

import { Category } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// app/actions.ts
export async function addAssetAction(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id)
		return { success: false, message: "Błąd autoryzacji" };

	const portfolioId = formData.get("portfolioId") as string;
	const existingAssetId = formData.get("existingAssetId") as string;
	const quantity = Number(formData.get("quantity"));
	const investedCapital = Number(formData.get("investedCapital"));
	const currentValue = Number(formData.get("currentValue"));

	const executedAtRaw = formData.get("executedAt") as string;
	const executedAt = executedAtRaw ? new Date(executedAtRaw) : new Date();

	const name = formData.get("name") as string;
	const ticker = (formData.get("ticker") as string)?.trim() || null;
	const category = formData.get("category") as Category;

	try {
		let targetAssetId = existingAssetId;

		// 1. BEZPIECZNE SZUKANIE (zapobiega duplikatom) 🛡️
		if (!targetAssetId || targetAssetId === "new") {
			const searchConditions: any[] = [{ name, portfolioId }];
			if (ticker) searchConditions.push({ ticker, portfolioId });

			const existing = await db.asset.findFirst({
				where: { OR: searchConditions },
			});
			if (existing) targetAssetId = existing.id;
		}

		// 2. AKTUALIZACJA LUB TWORZENIE ⚖️
		if (targetAssetId && targetAssetId !== "new") {
			await db.asset.update({
				where: { id: targetAssetId },
				data: {
					quantity: { increment: quantity },
					investedCapital: { increment: investedCapital },
					currentValue: { increment: currentValue },
				},
			});
		} else {
			const newAsset = await db.asset.create({
				data: {
					name,
					ticker,
					quantity,
					investedCapital,
					currentValue,
					category,
					portfolioId,
					targetPercentage: 0,
				},
			});
			targetAssetId = newAsset.id;
		}

		// 3. ZAPIS NOWEJ PACZKI DO HISTORII 📜
		await db.transactionHistory.create({
			data: {
				portfolioId,
				assetName: name,
				ticker,
				quantity,
				executedValue: investedCapital,
				executedAt, // Używamy wybranej daty z kalendarza!
				category,
				rationale: existingAssetId !== "new" ? "Dokupienie" : "Pierwszy zakup",
			},
		});

		revalidatePath("/dashboard");
		return {
			success: true,
			portfolioId,
			newAssetId: targetAssetId,
			message: "Dodano aktywo! 🚀",
		};
	} catch (error) {
		console.error("Database error while adding asset:", error);
		// Returning an error message for the client
		return { success: false, message: "Błąd bazy danych" };
	}
}

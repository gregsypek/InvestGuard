"use server";

import { BoosterSchema } from "@/lib/validations/booster";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function createBoosterAsset(
	values: z.infer<typeof BoosterSchema>,
) {
	// 1. Validation of data on the server side
	const validatedFields = BoosterSchema.safeParse(values);

	if (!validatedFields.success) {
		return { error: "Niepoprawne dane formularza" };
	}

	// Wyciągamy portfolioId z walidacji (upewnij się, że jest w Zod Schema!)
	const { name, ticker, value, timeHorizon, rationale, portfolioId } =
		validatedFields.data;

	try {
		await db.asset.create({
			data: {
				name,
				category: "BOOSTER",
				// Mapujemy 'value' na pola z modelu Prisma
				investedCapital: value,
				currentValue: value,

				// Pola wymagane przez Twój model, których brakowało:
				portfolioId: portfolioId,
				purchaseDate: new Date(), // Ustawiamy datę zakupu na "teraz"

				ticker: ticker || null,
				rationale,
				timeHorizon,
				targetPercentage: 0,
				quantity: 1, // Domyślnie 1 jednostka, chyba że masz to w formularzu
			},
		});

		revalidatePath("/dashboard");
		revalidatePath("/booster");

		return { success: true };
	} catch {
		return { error: "Wystąpił błąd podczas zapisu w bazie" };
	}
}

/**
 * Deletes a booster asset from the database by its ID.
 * @param id - The unique identifier of the asset.
 */
export async function deleteBoosterAsset(id: string) {
	try {
		await db.asset.delete({
			where: { id },
		});

		// Refresh the specific route to show updated data
		revalidatePath("/booster");
		return { success: true };
	} catch (error) {
		console.error("Delete Error:", error);
		return {
			success: false,
			error: "Failed to delete the asset from database.",
		};
	}
}

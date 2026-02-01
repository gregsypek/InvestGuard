"use server";

import { db } from "@/lib/db";
import { BoosterSchema } from "@/lib/validations/booster";
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

	const { name, ticker, value, timeHorizon, rationale } = validatedFields.data;

	try {
		await db.asset.create({
			data: {
				name,
				category: "BOOSTER",
				value,
				// If ticker is an empty string, we store null in the DB
				ticker: ticker || null,
				rationale,
				timeHorizon,
				targetPercentage: 0,
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

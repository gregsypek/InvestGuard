"use server";

import { db } from "@/lib/db";
import { BoosterSchema } from "@/lib/validations";
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

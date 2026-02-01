"use server";

import { db } from "../db";
import { revalidatePath } from "next/cache";
import { PortfolioFormValues, PortfolioSchema } from "../validations/portfolio";

export async function createPortfolio(values: PortfolioFormValues) {
	// Validate data on the server side using the same schema
	const validatedFields = PortfolioSchema.safeParse(values);

	if (!validatedFields.success) {
		return { error: "Unproperly formatted data" };
	}

	const { name, description, goal } = validatedFields.data;

	try {
		await db.portfolio.create({
			data: {
				name,
				description: description || null,
				goal: goal ?? null, // Save as null if goal is undefined
			},
		});

		revalidatePath("/portfolios");
		return { success: true };
	} catch {
		return { error: "There was an error during saving in database" };
	}
}

"use server";

import { db } from "@/lib/db";
import { Category } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function addAssetAction(formData: FormData) {
	// Extracting data from the form
	const name = formData.get("name") as string;
	const ticker = formData.get("ticker") as string;
	const value = parseFloat(formData.get("value") as string);
	const category = formData.get("category") as Category;
	// Extracting the selected portfolio ID to establish a relationship
	const portfolioId = formData.get("portfolioId") as string;
	try {
		// Creating the asset in the database with a link to the chosen portfolio
		const newAsset = await db.asset.create({
			data: {
				name,
				ticker,
				value,
				category,
				portfolioId, // Foreign key linking to the Portfolio model
				targetPercentage: 0, // Placeholder for future dynamic calculations
			},
		});

		// Refreshing the dashboard to show the newly added asset
		revalidatePath("/dashboard");
		return {
			success: true,
			newAssetId: newAsset.id,
			portfolioId: newAsset.portfolioId,
			message: "Asset added successfully! 🚀",
		};
	} catch (error) {
		console.error("Database error while adding asset:", error);
		// Returning an error message for the client
		return { success: false, message: "Failed to add asset. ❌" };
	}
}

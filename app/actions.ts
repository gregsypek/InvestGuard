"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Category } from "@prisma/client";

// Action to save a new asset to Postgres
export async function addAssetAction(formData: FormData) {
	// Extracting data from form fields
	const name = formData.get("name") as string;
	const ticker = formData.get("ticker") as string;
	const value = parseFloat(formData.get("value") as string);
	const category = formData.get("category") as Category;

	await db.asset.create({
		data: {
			name,
			ticker,
			value,
			category,
			targetPercentage: 0, // We'll calculate this automatically later
		},
	});

	// Refresh the dashboard page to show new data
	revalidatePath("/dashboard");
}

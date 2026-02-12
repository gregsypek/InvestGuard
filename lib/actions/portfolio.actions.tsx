"use server";

import { db } from "../db";
import { revalidatePath } from "next/cache";
import { PortfolioFormValues, PortfolioSchema } from "../validations/portfolio";

export async function createPortfolio(values: PortfolioFormValues) {
	// Server-side validation
	const validatedFields = PortfolioSchema.safeParse(values);

	if (!validatedFields.success) {
		return { error: "Invalid data format" };
	}

	try {
		// Create new portfolio using spread operator for targets
		const newPortfolio = await db.portfolio.create({
			data: {
				...validatedFields.data,
				description: validatedFields.data.description || null,
				goal: validatedFields.data.goal ?? null,
				// Linking to a temporary user ID
				user: {
					connect: {
						id: "1", // TODO: Replace with dynamic ID from auth session later
					},
				},
			},
		});

		revalidatePath("/portfolios");

		return {
			success: true,
			id: newPortfolio.id,
		};
	} catch (error) {
		console.error("Prisma Create Error:", error);
		return { error: "Database connection error during creation" };
	}
}

export async function updatePortfolio(id: string, values: PortfolioFormValues) {
	// Server-side validation
	const validatedFields = PortfolioSchema.safeParse(values);

	if (!validatedFields.success) {
		return { error: "Invalid data format" };
	}

	try {
		// Update record using validated data
		await db.portfolio.update({
			where: { id },
			data: {
				...validatedFields.data,
				description: validatedFields.data.description || null,
				goal: validatedFields.data.goal ?? null,
			},
		});

		// Refresh cache to reflect changes in UI
		revalidatePath("/portfolios");
		revalidatePath("/dashboard");

		return { success: true };
	} catch (error) {
		console.error("Prisma Update Error:", error);
		return { error: "Database connection error during update" };
	}
}

export async function deletePortfolio(id: string) {
	try {
		await db.portfolio.delete({
			where: { id },
		});

		revalidatePath("/portfolios");
		return { success: true };
	} catch (error) {
		console.error("Delete error:", error);
		return { error: "Failed to remove the portfolio." };
	}
}

export async function deleteAsset(assetId: string) {
	try {
		await db.asset.delete({
			where: { id: assetId },
		});

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Asset Delete Error:", error);
		return { success: false, error: "Failed to delete asset" };
	}
}

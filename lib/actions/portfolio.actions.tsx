"use server";

import { db } from "../db";
import { revalidatePath } from "next/cache";
import { PortfolioFormValues, PortfolioSchema } from "../validations/portfolio";

export async function createPortfolio(values: PortfolioFormValues) {
	const validatedFields = PortfolioSchema.safeParse(values);

	if (!validatedFields.success) {
		return { error: "Unproperly formatted data" };
	}

	const { name, description, goal } = validatedFields.data;

	try {
		// 1. Capture the created portfolio object
		const newPortfolio = await db.portfolio.create({
			data: {
				name,
				description: description || null,
				goal: goal ?? null,
				// We must link the portfolio to a user
				user: {
					connect: {
						id: "1", //TODO: You need to get this from your auth session
					},
				},
			},
		});

		revalidatePath("/portfolios");

		// 2. Return the new ID to the client
		return {
			success: true,
			id: newPortfolio.id, // Pass the ID for redirection
		};
	} catch (error) {
		console.error("Prisma Error:", error);
		return { error: "There was an error during saving in database" };
	}
}

export async function updatePortfolio(id: string, values: PortfolioFormValues) {
	// 1. Walidacja danych po stronie serwera
	const validatedFields = PortfolioSchema.safeParse(values);

	if (!validatedFields.success) {
		return { error: "Niepoprawne dane" };
	}

	const { name, description, goal } = validatedFields.data;

	try {
		// 2. Aktualizacja rekordu w bazie danych 🗄️
		await db.portfolio.update({
			where: { id },
			data: {
				name,
				description: description || null,
				goal: goal ?? null,
			},
		});

		// 3. Odświeżenie cache'u, aby zmiany były widoczne 🔄
		revalidatePath("/portfolios");
		revalidatePath("/dashboard");

		return { success: true };
	} catch (error) {
		console.error("Prisma Error:", error);
		return { error: "Błąd podczas aktualizacji bazy danych" };
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
		return { error: "Nie udało się usunąć portfela." };
	}
}
export async function deleteAsset(assetId: string) {
	try {
		await db.asset.delete({
			where: { id: assetId },
		});

		revalidatePath("/dashboard");

		return { success: true };
	} catch {
		return { success: false, error: "Failed to delete asset" };
	}
}

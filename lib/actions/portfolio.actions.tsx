"use server";

import { PortfolioFormValues, PortfolioSchema } from "../validations/portfolio";

import { PORTFOLIO_STRATEGY_MAP } from "../constants";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPortfolio(values: PortfolioFormValues) {
	const session = await auth();
	if (!session?.user?.id) return { success: false, error: "Błąd autoryzacji" };

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
						id: session.user.id,
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

// EN: Performs a hard delete of an asset and its entire transaction history
export async function deleteAsset(assetId: string) {
	try {
		// EN: 1. Retrieve the asset to get its identifiers
		const asset = await db.asset.findUnique({
			where: { id: assetId },
		});

		if (!asset) {
			return { success: false, error: "Asset not found" };
		}

		// EN: 2. Execute deletion of both history and the asset within a Prisma transaction
		await db.$transaction(async (tx) => {
			// EN: Delete the transaction history linked to this specific asset in this portfolio
			await tx.transactionHistory.deleteMany({
				where: {
					portfolioId: asset.portfolioId,
					assetName: asset.name,
					...(asset.ticker ? { ticker: asset.ticker } : {}),
				},
			});

			// EN: Finally, delete the actual asset from the Asset table
			await tx.asset.delete({
				where: { id: assetId },
			});
		});

		// EN: Force refresh the client side to immediately reflect the deletion
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Delete asset error:", error);
		return { success: false, error: "Failed to delete asset" };
	}
}

export async function getPortfolioCategories(id: string) {
	try {
		const portfolio = await db.portfolio.findUnique({
			where: { id },
			select: {
				targetDeveloped: true,
				targetEmerging: true,
				targetBonds: true,
				targetGold: true,
				targetBooster: true,
				targetCash: true,
				targetCrypto: true,
				targetCommodities: true,
			},
		});
		console.log("🚀 ~ getPortfolioCategories ~ portfolio:", portfolio);

		if (!portfolio) return { success: false, categories: [] };

		// EN: Map numeric targets to category strings if target > 0
		// UI: Mapujemy cele liczbowe na nazwy kategorii, jeśli cel > 0
		// const activeCategories = [];
		// if (portfolio.targetBonds > 0) activeCategories.push("BONDS");
		// if (portfolio.targetDeveloped > 0) activeCategories.push("DEVELOPED");
		// if (portfolio.targetEmerging > 0) activeCategories.push("EMERGING");
		// if (portfolio.targetGold > 0) activeCategories.push("GOLD");
		// if (portfolio.targetBooster > 0) activeCategories.push("BOOSTER");
		// if (portfolio.targetCash > 0) activeCategories.push("CASH");
		// if (portfolio.targetCrypto > 0) activeCategories.push("CRYPTO");
		// if (portfolio.targetCommodities > 0) activeCategories.push("COMMODITIES");
		// Twoja logika w formie "reusable function"

		const activeCategories = Object.entries(PORTFOLIO_STRATEGY_MAP)
			.filter(([key]) => portfolio[key as keyof typeof portfolio] > 0) // Najpierw odsiewamy to, co nas nie interesuje
			.map(([, value]) => value); // Potem zostawiamy tylko nazwy kategorii

		return { success: true, categories: activeCategories };
	} catch (error) {
		console.error("Error:", error);
		return { success: false, categories: [] };
	}
}

export async function getPortfolioAssets(portfolioId: string) {
	try {
		const assets = await db.asset.findMany({
			where: { portfolioId },
			select: {
				id: true,
				name: true,
				ticker: true,
				category: true,
			},
			orderBy: { name: "asc" }, // Ułatwi to szukanie na liście
		});

		return { success: true, data: assets };
	} catch (error) {
		console.error("Error fetching assets:", error);
		return { success: false, data: [] };
	}
}

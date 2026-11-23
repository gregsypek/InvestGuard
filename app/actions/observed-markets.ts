"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { backfillObservedAssetHistory } from "@/lib/actions/backfill-asset-history";
import { db } from "@/lib/db";

const ROLE_LIMITS = {
	REGULAR: 3,
	SUBSCRIBER: 10,
	ADMIN: 99,
};

export async function saveObservedMarkets(
	selectedAssetNames: string[],
	selectedIndices: string[],
) {
	const session = await auth();
	if (!session?.user?.id) {
		return { success: false, error: "Unauthorized" };
	}

	const userRole = session.user.role || "REGULAR";
	const maxLimit = ROLE_LIMITS[userRole as keyof typeof ROLE_LIMITS];

	if (selectedAssetNames.length > maxLimit) {
		return {
			success: false,
			error: `Twój plan pozwala na obserwowanie maksymalnie ${maxLimit} rynków z Twojego portfela.`,
		};
	}

	try {
		// 1. Reset and update observed portfolio assets
		await db.asset.updateMany({
			where: { portfolio: { userId: session.user.id } },
			data: { isObserved: false },
		});

		if (selectedAssetNames.length > 0) {
			await db.asset.updateMany({
				where: {
					portfolio: { userId: session.user.id },
					name: { in: selectedAssetNames },
				},
				data: { isObserved: true },
			});

			// 2. Backfill 2-year history in IndexHistory for paid tiers (SUBSCRIBER / ADMIN)
			if (userRole === "ADMIN" || userRole === "SUBSCRIBER") {
				const observedAssets = await db.asset.findMany({
					where: {
						portfolio: { userId: session.user.id },
						name: { in: selectedAssetNames },
						ticker: { not: null },
						category: { notIn: ["BONDS", "CASH"] },
					},
					select: { ticker: true, name: true },
				});

				await Promise.all(
					observedAssets.map((asset) =>
						backfillObservedAssetHistory(asset.ticker!, asset.name),
					),
				);
			}
		}

		// 3. Save global indices in user profile
		await db.user.update({
			where: { id: session.user.id },
			data: { observedIndices: selectedIndices },
		});

		revalidateTag("indices", { expire: 0 });

		revalidatePath("/dashboard");
		revalidatePath("/");
		revalidatePath("/settings");

		return { success: true };
	} catch (error) {
		console.error("Error saving observed markets:", error);
		return { success: false, error: "Wystąpił błąd podczas zapisu." };
	}
}

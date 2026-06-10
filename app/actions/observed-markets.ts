"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const ROLE_LIMITS = {
	REGULAR: 3,
	SUBSCRIBER: 10,
	ADMIN: 99,
};

export async function saveObservedMarkets(
	selectedAssetNames: string[],
	selectedIndices: string[], // EN: New parameter for global indices
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
		// 1. Zapisz aktywa z portfela (reset i update)
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
		}

		// 2. Zapisz globalne indeksy w profilu użytkownika
		await db.user.update({
			where: { id: session.user.id },
			data: { observedIndices: selectedIndices },
		});

		revalidatePath("/dashboard");
		revalidatePath("/settings");

		return { success: true };
	} catch (error) {
		console.error("Error saving observed markets:", error);
		return { success: false, error: "Wystąpił błąd podczas zapisu." };
	}
}

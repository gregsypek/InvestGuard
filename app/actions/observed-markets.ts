"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const ROLE_LIMITS = {
	REGULAR: 3,
	SUBSCRIBER: 10,
	ADMIN: 99,
};

export async function saveObservedMarkets(selectedAssetNames: string[]) {
	const session = await auth();
	if (!session?.user?.id) {
		return { success: false, error: "Unauthorized" };
	}

	const userRole = session.user.role || "REGULAR";
	const maxLimit = ROLE_LIMITS[userRole as keyof typeof ROLE_LIMITS];

	// 1. Walidacja limitu po stronie serwera (bezpieczeństwo)
	if (selectedAssetNames.length > maxLimit) {
		return {
			success: false,
			error: `Twój plan pozwala na obserwowanie maksymalnie ${maxLimit} rynków.`,
		};
	}

	try {
		// 2. Najpierw "resetujemy" - wyłączamy obserwację dla wszystkich aktywów użytkownika
		await db.asset.updateMany({
			where: { portfolio: { userId: session.user.id } },
			data: { isObserved: false },
		});

		// 3. Włączamy obserwację tylko dla tych z listy
		if (selectedAssetNames.length > 0) {
			await db.asset.updateMany({
				where: {
					portfolio: { userId: session.user.id },
					name: { in: selectedAssetNames },
				},
				data: { isObserved: true },
			});
		}

		revalidatePath("/dashboard");
		revalidatePath("/settings");

		return { success: true };
	} catch (error) {
		console.error("Error saving observed markets:", error);
		return { success: false, error: "Wystąpił błąd podczas zapisu." };
	}
}

"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateUserData(formData: FormData) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: "Brak autoryzacji." };
		}

		const name = formData.get("name") as string;
		const avatarFile = formData.get("avatar") as File | null;

		let avatarUrl = undefined;

		// Jeśli użytkownik wgrał nowy plik
		if (avatarFile && avatarFile.size > 0) {
			// Zabezpieczenie przed zbyt dużym plikiem (np. > 2MB)
			if (avatarFile.size > 2 * 1024 * 1024) {
				return { success: false, error: "Zdjęcie nie może przekraczać 2MB." };
			}

			// Konwersja obrazu na format Base64 (idealne na początek bez zewnętrznych storage'y)
			const arrayBuffer = await avatarFile.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const base64 = buffer.toString("base64");
			avatarUrl = `data:${avatarFile.type};base64,${base64}`;
		}

		await db.user.update({
			where: { id: session.user.id },
			data: {
				...(name && { name }),
				...(avatarUrl && { image: avatarUrl }),
			},
		});

		// Wymuś odświeżenie danych na stronie profilu i w Headerze
		revalidatePath("/", "layout");

		return { success: true };
	} catch (error) {
		console.error("Błąd aktualizacji profilu:", error);
		return { success: false, error: "Wystąpił błąd podczas zapisu danych." };
	}
}

export async function updateUserAlerts(alerts: {
	alertBonds: boolean;
	alertRebalancing: boolean;
	alertPlans: boolean;
}) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: "Brak autoryzacji." };
		}

		await db.user.update({
			where: { id: session.user.id },
			data: {
				alertBonds: alerts.alertBonds,
				alertRebalancing: alerts.alertRebalancing,
				alertPlans: alerts.alertPlans,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Błąd zapisu ustawień powiadomień:", error);
		return { success: false, error: "Nie udało się zapisać ustawień." };
	}
}

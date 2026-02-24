"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Category } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function addAssetAction(formData: FormData) {
	const session = await auth(); // Pobieramy sesję "na żywo"
	if (!session?.user?.id) {
		throw new Error("Musisz być zalogowany!");
	}
	const userId = session.user.id; // To jest nasze bezpieczne ID

	// Extracting data from the form
	const name = formData.get("name") as string;
	const ticker = formData.get("ticker") as string;
	const currentValue = parseFloat(formData.get("currentValue") as string);
	const category = formData.get("category") as Category;
	// Extracting the selected portfolio ID to establish a relationship
	const portfolioId = formData.get("portfolioId") as string;

	// 1. Sprawdzamy, czy portfel należy do usera
	const portfolio = await db.portfolio.findFirst({
		where: {
			id: portfolioId,
			userId: userId, // ID z sesji
		},
	});

	// 2. Jeśli nie ma dopasowania, przerywamy
	if (!portfolio) {
		return {
			success: false,
			message: "Nie masz uprawnień do tego portfela! ❌",
		};
	}
	try {
		// Creating the asset in the database with a link to the chosen portfolio
		const newAsset = await db.asset.create({
			data: {
				name,
				ticker,
				currentValue,
				// Dodajemy brakujące pole investedCapital (na start równe currentValue)
				investedCapital: currentValue,
				category,
				targetPercentage: 0,
				// Naprawiamy relację z Portfolio
				portfolio: {
					connect: { id: portfolioId },
				},
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

//NOTE: Użycie connect w Prismie jest o tyle lepsze, że zamiast tylko „wklejać” ID do tabeli, mówimy bazie danych: „znajdź ten konkretny rekord w tabeli Portfolio i stwórz między nami oficjalne powiązanie”. To pomaga zachować integralność danych.

"use server";

import { db } from "@/lib/db";
import { PlannerSchema } from "@/lib/validations/planner";
import { Category } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createInvestmentPlan(
	values: z.infer<typeof PlannerSchema>,
) {
	// 1. Walidacja danych na serwerze
	const validatedFields = PlannerSchema.safeParse(values);

	if (!validatedFields.success) {
		throw new Error("Nieprawidłowe dane formularza");
	}

	const {
		name,
		ticker,
		value,
		plannedDate,
		portfolioId,
		category,
		rationale,
		isRecurring,
	} = validatedFields.data;

	try {
		// 2. Zapis do bazy danych
		await db.investmentPlan.create({
			data: {
				name,
				ticker,
				value,
				plannedDate,
				portfolioId,
				targetCategory: category as Category,
				rationale,
				isRecurring,
				// Na tym etapie pomijamy userId, bo nie mamy autentykacji
			},
		});

		// 3. Odświeżenie widoku, aby nowy plan od razu się pojawił
		revalidatePath("/planner");

		return { success: true };
	} catch (error) {
		console.error("Błąd podczas tworzenia planu:", error);
		return { success: false, error: "Nie udało się zapisać planu" };
	}
}

/**
 * Helper to add exactly one month to a YYYY-MM string
 */
function getNextMonth(dateStr: string): string {
	const [year, month] = dateStr.split("-").map(Number);
	// Date constructor uses 0-11 for months, so month (1-12) is already "next month" index
	const date = new Date(year, month, 1);

	const nextYear = date.getFullYear();
	const nextMonth = String(date.getMonth() + 1).padStart(2, "0"); // Jeśli miesiąc to "3", padStart(2, "0") zmieni go na "03".

	return `${nextYear}-${nextMonth}`;
}

export async function executePlan(
	planId: string,
	finalValue: number,
	purchasePrice: number, // EN: New parameter from the UI
	executionNote?: string,
) {
	try {
		return await db.$transaction(async (tx) => {
			// 1. Pobieramy szczegóły planu
			const plan = await tx.investmentPlan.findUnique({
				where: { id: planId },
			});

			if (!plan) throw new Error("Plan not found");

			// 2. OBLICZAMY ILOŚĆ JEDNOSTEK 🧱
			// UI przesyła nam kurs (purchasePrice), więc dzielimy kwotę przez kurs
			const calculatedQuantity = finalValue / purchasePrice;

			// 3. SZUKAMY CZY MAMY JUŻ TAKI ASSET (Uśrednianie) ⚖️
			// Szukamy w tym samym portfelu po tickerze (jeśli jest) lub nazwie
			const existingAsset = await tx.asset.findFirst({
				where: {
					portfolioId: plan.portfolioId,
					OR: [
						{
							ticker:
								plan.ticker && plan.ticker !== "" ? plan.ticker : undefined,
						},
						{ name: plan.name },
					],
				},
			});

			if (existingAsset) {
				// AKTUALIZACJA: Dodajemy nową ilość i kapitał do istniejącego rekordu
				await tx.asset.update({
					where: { id: existingAsset.id },
					data: {
						quantity: existingAsset.quantity + calculatedQuantity,
						investedCapital: existingAsset.investedCapital + finalValue,
						currentValue: existingAsset.currentValue + finalValue, // Na start zakładamy cenę zakupu
					},
				});
			} else {
				// NOWY ASSET: Tworzymy go od zera z ilością
				await tx.asset.create({
					data: {
						name: plan.name,
						ticker: plan.ticker,
						category: plan.targetCategory,
						investedCapital: finalValue,
						currentValue: finalValue,
						quantity: calculatedQuantity, // Zapisujemy wyliczoną ilość
						portfolioId: plan.portfolioId,
					},
				});
			}

			// 4. HISTORIA TRANSAKCJI 📜
			// Dodajemy ilość również do historii, żeby w ActivityPage było widać ile kupiliśmy
			await tx.transactionHistory.create({
				data: {
					assetName: plan.name,
					ticker: plan.ticker,
					executedValue: finalValue,
					quantity: calculatedQuantity, // NOWE POLE W HISTORII
					category: plan.targetCategory,
					rationale: executionNote
						? `PLAN: ${plan.rationale || "Brak"} | REALIZACJA: ${executionNote}`
						: plan.rationale,
					executedAt: new Date(),
					portfolioId: plan.portfolioId,
				},
			});

			// 5. OBSŁUGA PLANÓW CYKLICZNYCH 🔁
			if (plan.isRecurring) {
				await tx.investmentPlan.create({
					data: {
						name: plan.name,
						ticker: plan.ticker,
						value: plan.value,
						plannedDate: getNextMonth(plan.plannedDate),
						targetCategory: plan.targetCategory,
						portfolioId: plan.portfolioId,
						isRecurring: true,
						rationale: plan.rationale,
					},
				});
			}

			// 6. USUWANIE WYKONANEGO PLANU 🗑️
			await tx.investmentPlan.delete({
				where: { id: planId },
			});

			revalidatePath("/dashboard");
			revalidatePath("/planner");
			revalidatePath("/activity");

			return { success: true };
		});
	} catch (error) {
		console.error("Execute Plan Error:", error);
		return { success: false, error: "Failed to finalize investment" };
	}
}

export async function deleteInvestmentPlan(planId: string) {
	try {
		await db.investmentPlan.delete({
			where: { id: planId },
		});
		revalidatePath("/planner");
		return { success: true };
	} catch {
		return { success: false, error: "Nie udało się usunąć planu" };
	}
}

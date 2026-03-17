"use server";

import { Category } from "@prisma/client";
import { PlannerSchema } from "@/lib/validations/planner";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createInvestmentPlan(
	values: z.infer<typeof PlannerSchema>,
) {
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
			},
		});

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
	// Date constructor: month 0-11, so passing 'month' (1-12) effectively picks the next month
	const date = new Date(year, month, 1);

	const nextYear = date.getFullYear();
	const nextMonth = String(date.getMonth() + 1).padStart(2, "0");

	return `${nextYear}-${nextMonth}`;
}

export async function executePlan(
	planId: string,
	finalValue: number,
	purchasePrice: number,
	isBooked: boolean,
	sourcePortfolioId?: string,
	executionNote?: string,
) {
	try {
		return await db.$transaction(async (tx) => {
			// 1. Pobieramy szczegóły planu wraz z relacją do portfela
			const plan = await tx.investmentPlan.findUnique({
				where: { id: planId },
				include: { portfolio: true },
			});

			if (!plan) throw new Error("Plan not found");

			// 2. PRZYGOTOWANIE DANYCH (Safe Mapping)
			const targetCategory = (plan.targetCategory as Category) || "CASH";
			const isCash = targetCategory === "CASH";
			const isBond = targetCategory === "BONDS";

			const effectivePrice = isCash ? 1 : purchasePrice || 1;
			const calculatedQuantity = finalValue / effectivePrice;

			// EN: Logic for Bond tickers consistent with addAssetAction
			const finalTicker =
				isBond && plan.ticker
					? `${plan.ticker}_${Date.now()}`
					: plan.ticker || (isCash ? "CASH" : "UNIT");

			const finalName = plan.name || (isCash ? "Gotówka" : "Nowe Aktywo");

			// 3. WYPŁATA (ŹRÓDŁO) - Jeśli isBooked jest zaznaczone
			if (isBooked && sourcePortfolioId) {
				const sourceCash = await tx.asset.findFirst({
					where: { portfolioId: sourcePortfolioId, ticker: "CASH" },
				});

				if (!sourceCash || sourceCash.currentValue < finalValue) {
					throw new Error(
						"Niewystarczające środki w portfelu źródłowym (CASH).",
					);
				}

				await tx.asset.update({
					where: { id: sourceCash.id },
					data: {
						quantity: { decrement: finalValue },
						investedCapital: { decrement: finalValue },
						currentValue: { decrement: finalValue },
					},
				});

				// EN: Correct SELL transaction in history
				await tx.transactionHistory.create({
					data: {
						type: "SELL",
						portfolioId: sourcePortfolioId,
						assetName: sourceCash.name,
						ticker: sourceCash.ticker,
						quantity: -finalValue,
						executedValue: finalValue,
						category: "CASH",
						executedAt: new Date(),
						rationale: `Transfer na poczet planu: ${plan.name}`,
					},
				});
			}

			// 4. WPŁATA (CEL) - Uśrednianie lub Tworzenie
			let targetAssetId: string;

			// EN: Search for existing asset to average price (skip for bonds as they are tranches)
			const existingAsset = !isBond
				? await tx.asset.findFirst({
						where: {
							portfolioId: plan.portfolioId,
							OR: [
								{
									ticker:
										plan.ticker && plan.ticker !== "" ? plan.ticker : undefined,
								},
								{ name: plan.name },
								{ category: isCash ? "CASH" : undefined },
							],
						},
					})
				: null;

			if (existingAsset) {
				// AKTUALIZACJA (Dla Akcji, Krypto, Gotówki)
				const updated = await tx.asset.update({
					where: { id: existingAsset.id },
					data: {
						quantity: { increment: calculatedQuantity },
						investedCapital: { increment: finalValue },
						currentValue: { increment: finalValue },
					},
				});
				targetAssetId = updated.id;
			} else {
				// TWORZENIE (Dla nowych aktywów lub Obligacji)
				// EN: Ensuring no null values for required fields to prevent P2011
				const newAsset = await tx.asset.create({
					data: {
						name: finalName,
						ticker: finalTicker,
						category: targetCategory,
						quantity: calculatedQuantity,
						investedCapital: finalValue,
						currentValue: finalValue,
						portfolioId: plan.portfolioId,
						purchaseDate: new Date(),
						interestRate: 0,
						targetPercentage: 0,
					},
				});
				targetAssetId = newAsset.id;
			}

			// 5. HISTORIA WPŁATY (Cel)
			await tx.transactionHistory.create({
				data: {
					type: "BUY",
					portfolioId: plan.portfolioId,
					assetName: finalName,
					ticker: finalTicker,
					quantity: calculatedQuantity,
					executedValue: finalValue,
					category: targetCategory,
					executedAt: new Date(),
					rationale: executionNote || plan.rationale || "Realizacja planu",
				},
			});

			// 6. OBSŁUGA CYKLICZNOŚCI
			if (plan.isRecurring) {
				await tx.investmentPlan.create({
					data: {
						name: plan.name,
						ticker: plan.ticker,
						value: plan.value,
						plannedDate: getNextMonth(plan.plannedDate),
						targetCategory: targetCategory,
						portfolioId: plan.portfolioId,
						isRecurring: true,
						rationale: plan.rationale,
					},
				});
			}

			// 7. PORZĄDKI
			await tx.investmentPlan.delete({ where: { id: planId } });

			revalidatePath("/dashboard");
			revalidatePath("/planner");
			revalidatePath("/activity");

			return { success: true };
		});
	} catch (error: any) {
		console.error("Execute Plan Error:", error);
		return {
			success: false,
			error: error.message || "Błąd podczas realizacji planu",
		};
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

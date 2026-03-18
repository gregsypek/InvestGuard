// lib/actions/planner.actions.tsx
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
	if (!validatedFields.success)
		throw new Error("Nieprawidłowe dane formularza");

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
		console.error("Błąd tworzenia planu:", error);
		return { success: false, error: "Błąd zapisu" };
	}
}

/**
 * Helper to add exactly one month to a YYYY-MM or YYYY-MM-DD string
 */
function getNextMonth(dateStr: string): string {
	const parts = dateStr.split("-");
	const year = parseInt(parts[0]);
	const month = parseInt(parts[1]);
	const day = parts[2] ? parseInt(parts[2]) : null;

	// Date(year, month, day) - month is 0-indexed in JS, but here 'month'
	// is already the next month relative to 0-indexing.
	const date = new Date(year, month, day || 1);

	const nextYear = date.getFullYear();
	const nextMonth = String(date.getMonth() + 1).padStart(2, "0");

	if (day) {
		const nextDay = String(date.getDate()).padStart(2, "0");
		return `${nextYear}-${nextMonth}-${nextDay}`;
	}
	return `${nextYear}-${nextMonth}`;
}

export async function executePlan(
	planId: string,
	finalValue: number,
	purchasePrice: number,
	isBooked: boolean,
	sourcePortfolioId?: string,
	executionNote?: string,
	finalNameParam?: string, // EN: Renamed parameter to avoid shadowing
	customDate?: string, // EN: New parameter for exact purchase date
) {
	try {
		return await db.$transaction(async (tx) => {
			const plan = await tx.investmentPlan.findUnique({
				where: { id: planId },
				include: { portfolio: true },
			});

			if (!plan) throw new Error("Plan not found");

			// 1. PRZYGOTOWANIE DANYCH
			const targetCategory = (plan.targetCategory as Category) || "CASH";
			const isCash = targetCategory === "CASH";
			const isBond = targetCategory === "BONDS";

			const effectivePrice = isCash ? 1 : purchasePrice || 1;
			const calculatedQuantity = finalValue / effectivePrice;

			// EN: Use the name from the UI if provided, otherwise the plan name
			const resolvedName =
				finalNameParam || plan.name || (isCash ? "Gotówka" : "Nowe Aktywo");

			const resolvedTicker =
				isBond && plan.ticker
					? `${plan.ticker}_${Date.now()}`
					: plan.ticker || (isCash ? "CASH" : "UNIT");

			// EN: Parse the exact date if provided by the user
			const executionDate = customDate ? new Date(customDate) : new Date();

			// 2. WYPŁATA (ŹRÓDŁO)
			if (isBooked && sourcePortfolioId) {
				const sourceCash = await tx.asset.findFirst({
					where: { portfolioId: sourcePortfolioId, ticker: "CASH" },
				});

				if (!sourceCash || sourceCash.currentValue < finalValue) {
					throw new Error("Niewystarczająca gotówka w portfelu źródłowym.");
				}

				await tx.asset.update({
					where: { id: sourceCash.id },
					data: {
						quantity: { decrement: finalValue },
						investedCapital: { decrement: finalValue },
						currentValue: { decrement: finalValue },
					},
				});

				await tx.transactionHistory.create({
					data: {
						type: "SELL",
						portfolioId: sourcePortfolioId,
						assetName: sourceCash.name,
						ticker: sourceCash.ticker,
						quantity: -finalValue,
						executedValue: finalValue,
						category: "CASH",
						executedAt: executionDate,
						rationale: `Transfer na poczet: ${resolvedName}`,
					},
				});
			}

			// 3. WPŁATA (CEL)
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
				await tx.asset.update({
					where: { id: existingAsset.id },
					data: {
						quantity: { increment: calculatedQuantity },
						investedCapital: { increment: finalValue },
						currentValue: { increment: finalValue },
					},
				});
			} else {
				await tx.asset.create({
					data: {
						name: resolvedName,
						ticker: resolvedTicker,
						category: targetCategory,
						quantity: calculatedQuantity,
						investedCapital: finalValue,
						currentValue: finalValue,
						portfolioId: plan.portfolioId,
						purchaseDate: executionDate,
						// ✅ FIX: Nominał 100 PLN dla obligacji (ważne dla tabeli)
						nominalValue: isBond ? 100 : 0,
						interestRate: 0,
						targetPercentage: 0,
					},
				});
			}

			// 4. HISTORIA WPŁATY
			await tx.transactionHistory.create({
				data: {
					type: "BUY",
					portfolioId: plan.portfolioId,
					assetName: resolvedName,
					ticker: resolvedTicker,
					quantity: calculatedQuantity,
					executedValue: finalValue,
					category: targetCategory,
					executedAt: executionDate,
					rationale: executionNote || plan.rationale || "Realizacja planu",
				},
			});

			// 5. CYKLICZNOŚĆ
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

			await tx.investmentPlan.delete({ where: { id: planId } });

			revalidatePath("/dashboard");
			revalidatePath("/planner");
			revalidatePath("/activity");
			return { success: true };
		});
	} catch (error: any) {
		console.error("Execute Plan Error:", error);
		return { success: false, error: error.message || "Błąd bazy danych" };
	}
}

export async function deleteInvestmentPlan(planId: string) {
	try {
		await db.investmentPlan.delete({ where: { id: planId } });
		revalidatePath("/planner");
		return { success: true };
	} catch {
		return { success: false, error: "Błąd usuwania" };
	}
}

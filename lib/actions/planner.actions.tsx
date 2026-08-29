"use server";

import { BOND_DURATIONS } from "../constants";
import type { Category } from "@prisma/client";
import { PlannerSchema } from "@/lib/validations/planner";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * EN: Durations for bonds in years to calculate maturity date
 * UI: Czas trwania obligacji w latach do obliczenia daty wykupu
 */

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
		conviction,
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
				conviction,
			},
		});
		revalidatePath("/planner");
		return { success: true };
	} catch (error) {
		console.error("Błąd tworzenia planu:", error);
		return { success: false, error: "Błąd zapisu" };
	}
}

// Funkcja pomocnicza do obliczania narosłych odsetek
function calculateAccruedValue(
	principal: number,
	rate: number,
	purchaseDate: Date,
) {
	const now = new Date();
	const diffTime = now.getTime() - purchaseDate.getTime();
	if (diffTime <= 0) return principal;

	const yearsPassed = diffTime / (1000 * 60 * 60 * 24 * 365.25);
	// Proste naliczanie odsetek (możesz tu wstawić bardziej złożony wzór dla EDO/COI)
	return principal * (1 + (rate / 100) * yearsPassed);
}

/**
 * EN: Execute a plan, creating an asset and potentially withdrawing cash
 * UI: Realizacja planu - tworzenie aktywa i opcjonalne pobranie gotówki
 */
export async function executePlan(
	planId: string,
	finalValue: number,
	purchasePrice: number,
	isBooked: boolean,
	sourcePortfolioId?: string,
	executionNote?: string,
	finalNameParam?: string,
	purchaseDate?: string,
	interestRate?: number,
	finalTickerParam?: string,
	originalCurrencyParam: string = "PLN",
	exchangeRateParam: number = 1,
) {
	try {
		return await db.$transaction(
			async (tx) => {
				const plan = await tx.investmentPlan.findUnique({
					where: { id: planId },
					include: { portfolio: true },
				});

				if (!plan) throw new Error("Plan nie znaleziony");

				const targetCategory = (plan.targetCategory as Category) || "CASH";
				const isBond = targetCategory === "BONDS";
				const isCash = targetCategory === "CASH";

				const effectivePrice = isCash ? 1 : purchasePrice || 1;
				const calculatedQuantity = finalValue / effectivePrice;
				const executionDate = purchaseDate
					? new Date(purchaseDate)
					: new Date();

				const currentTicker = finalTickerParam || plan.ticker;
				if (!currentTicker && !isCash) {
					throw new Error(
						"Musisz podać Ticker podczas zatwierdzania realizacji.",
					);
				}

				const resolvedTicker =
					isBond && currentTicker
						? `${currentTicker}_${executionDate.getTime()}`
						: currentTicker || "CASH";

				// 🚀 NOWE: Szukamy, czy mamy już to aktywo w historii (np. z importu XTB)
				const existingTx = await tx.transactionHistory.findFirst({
					where: { portfolioId: plan.portfolioId, ticker: resolvedTicker },
				});

				// 🚀 POPRAWKA 1: Najpierw szukamy aktywa, żeby odziedziczyć PRAWIDŁOWĄ nazwę
				const existingAsset = !isBond
					? await tx.asset.findFirst({
							where: { portfolioId: plan.portfolioId, ticker: resolvedTicker },
						})
					: null;

				// Jeśli aktywo istnieje, bierzemy jego nazwę (np. iShares Core...), w przeciwnym razie nazwę z modalu/planera

				const resolvedName =
					finalNameParam ||
					plan.name ||
					existingTx?.assetName ||
					resolvedTicker;

				// 2. LOGIKA OBLIGACJI
				const baseTickerForDuration = currentTicker
					? currentTicker.split("_")[0]
					: "";
				const rate = interestRate || 0;
				const initialCurrentValue = isBond
					? calculateAccruedValue(finalValue, rate, executionDate)
					: finalValue;

				let maturityDate = null;
				if (isBond && baseTickerForDuration) {
					const duration = BOND_DURATIONS[baseTickerForDuration] || 0;
					if (duration > 0) {
						maturityDate = new Date(executionDate);
						if (duration < 1) {
							maturityDate.setMonth(maturityDate.getMonth() + 3);
						} else {
							maturityDate.setFullYear(
								maturityDate.getFullYear() + Math.floor(duration),
							);
						}
					}
				}
				const transactionType = isCash ? "DEPOSIT" : "BUY";

				// 3. WYPŁATA GOTÓWKI (ŹRÓDŁO)
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
							type: transactionType,
							portfolioId: plan.portfolioId,
							assetName: resolvedName,
							ticker: resolvedTicker,
							quantity: calculatedQuantity,
							executedValue: finalValue,
							originalPrice: purchasePrice, // Prawidłowa cena (np. 708 EUR)
							originalCurrency: originalCurrencyParam, // Prawidłowa waluta
							exchangeRate: exchangeRateParam, // Prawidłowy kurs
							category: targetCategory,
							executedAt: executionDate,
							rationale: executionNote || plan.rationale || "Realizacja planu",
							// Nadajemy unikalny klucz, który pozwoli wyłapać duplikaty
							externalId: `PLAN_${resolvedTicker}_${executionDate.toISOString().split("T")[0]}_${calculatedQuantity}`,
						},
					});
				}

				// 4. WPŁATA / ZAKUP (AKTUALIZACJA/TWORZENIE ASSET)
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
							currentValue: initialCurrentValue,
							portfolioId: plan.portfolioId,
							purchaseDate: executionDate,
							maturityDate: maturityDate,
							nominalValue: isBond ? 100 : 0,
							interestRate: Number(interestRate) || 0,
							targetPercentage: 0,
							conviction: plan.conviction,
							rationale: plan.rationale,
						},
					});
				}

				// 🚀 POPRAWKA 2: Pełne dane dla TransactionHistory (wymagane dla AssetLedger)
				await tx.transactionHistory.create({
					data: {
						type: transactionType,
						portfolioId: plan.portfolioId,
						assetName: resolvedName,
						ticker: resolvedTicker,
						quantity: calculatedQuantity,
						executedValue: finalValue,
						originalPrice: effectivePrice, // Zamiast 0, wstawiamy realny kurs
						originalCurrency: "PLN", // Domyślnie baza przyjmuje zapis w PLN
						exchangeRate: 1, // Kurs wymiany domyślnie 1
						category: targetCategory,
						executedAt: executionDate,
						rationale: executionNote || plan.rationale || "Realizacja planu",
					},
				});

				// 6. CYKLICZNOŚĆ I CZYSZCZENIE
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
							conviction: plan.conviction,
						},
					});
				}
				await tx.investmentPlan.delete({ where: { id: planId } });

				return { success: true };
			},
			{
				maxWait: 10000,
				timeout: 30000,
			},
		);
	} catch (error: any) {
		console.error("Execute Plan Error:", error);
		return { success: false, error: error.message || "Błąd bazy danych" };
	}
}

export async function deleteInvestmentPlan(id: string) {
	try {
		await db.investmentPlan.delete({ where: { id } });
		revalidatePath("/planner");
		return { success: true };
	} catch (error) {
		console.error("Delete Plan Error:", error);
		return { success: false, error: "Błąd usuwania planu" };
	}
}

function getNextMonth(dateStr: string): string {
	const parts = dateStr.split("-");
	const year = parseInt(parts[0]);
	const month = parseInt(parts[1]);

	const date = new Date(year, month - 1);
	date.setMonth(date.getMonth() + 1);

	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

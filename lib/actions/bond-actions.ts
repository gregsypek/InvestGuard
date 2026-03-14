"use server";

import { ActionResponse, Bond } from "../types";

import { BOND_TEMPLATES } from "../constants";
import { auth } from "@/auth";
import { db } from "@/lib/db"; // EN: Your prisma instance
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function getBonds(portfolioId?: string) {
	// 1. Zabezpieczenie sesji
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	// 2. Jeśli nie przekazano portfolioId, nie mamy czego szukać
	if (!portfolioId) {
		return [];
	}

	// 3. Pobieranie z bazy DANYCH TYLKO DLA TEGO PORTFELA I TEGO UŻYTKOWNIKA
	const bonds = await db.asset.findMany({
		where: {
			category: "BONDS",
			portfolioId: portfolioId, // Filtrowanie po ID portfela
			portfolio: {
				userId: session.user.id, // OSTATECZNE ZABEZPIECZENIE: Upewniamy się, że portfel należy do zalogowanego usera
			},
			OR: [
				{ ticker: { contains: "EDO" } },
				{ ticker: { contains: "DOS" } },
				{ ticker: { contains: "COI" } },
				{ ticker: { contains: "TOZ" } },
				{ ticker: { contains: "ROD" } },
				{ ticker: { contains: "OTS" } },
				{ ticker: { contains: "ROS" } },
			],
		},
		orderBy: {
			purchaseDate: "desc",
		},
	});

	return bonds;
}

export async function getBondsData(portfolioId: string) {
	const session = await auth();
	if (!session?.user?.id) return null;

	const [portfolio, rawBonds] = await Promise.all([
		db.portfolio.findUnique({
			where: { id: portfolioId, userId: session.user.id },
			select: { name: true },
		}),
		getBonds(portfolioId),
	]);

	// Jeśli portfel nie istnieje lub nie należy do usera -> błąd 404
	if (!portfolio) notFound();

	// Formatowanie danych
	const bonds: Bond[] = rawBonds.map((b) => {
		const cleanTicker = b.ticker ? b.ticker.split("_")[0] : "NIEZNANY";
		return {
			id: b.id,
			ticker: cleanTicker,
			name: b.name,
			purchaseDate:
				b.purchaseDate instanceof Date
					? b.purchaseDate.toISOString()
					: String(b.purchaseDate),
			maturityDate: b.maturityDate
				? b.maturityDate instanceof Date
					? b.maturityDate.toISOString()
					: String(b.maturityDate)
				: null,
			investedCapital: Number(b.investedCapital) ?? 0,
			currentValue: Number(b.currentValue) ?? 0,
			interestRate: b.interestRate ?? 0,
			quantity: b.quantity ?? 0,
		};
	});

	// EN: Calculate statistics for the cards directly in the layout
	const totals = bonds.reduce(
		(acc, bond) => {
			acc.totalInvested += bond.investedCapital;
			acc.currentValue += bond.currentValue;
			acc.weightedSum += (bond.interestRate ?? 0) * bond.investedCapital;
			return acc;
		},
		{ totalInvested: 0, currentValue: 0, weightedSum: 0 },
	);

	return {
		portfolioName: portfolio.name,
		bonds,
		stats: {
			totalInvested: totals.totalInvested.toLocaleString(),
			currentValue: totals.currentValue.toLocaleString(),
			profit: (totals.currentValue - totals.totalInvested).toLocaleString(),
			avgYield:
				totals.totalInvested > 0
					? (totals.weightedSum / totals.totalInvested).toFixed(2)
					: "0",
		},
	};
}

export async function deleteBond(id: string) {
	try {
		// 1. Pobieramy dane przed usunięciem
		const bond = await db.asset.findUnique({
			where: { id },
		});

		if (!bond) return { success: false, message: "Nie znaleziono obligacji" };

		await db.$transaction([
			// 2. Dodajemy wpis do historii (bilansujący na zero)
			db.transactionHistory.create({
				data: {
					portfolioId: bond.portfolioId,
					assetName: bond.name || (bond.ticker ?? "NIE PODANO"),
					ticker: bond.ticker,
					quantity: -bond.quantity, // Ujemna ilość, żeby wyzerować stos na wykresie
					executedValue: -bond.currentValue, // Ujemna wartość
					executedAt: new Date(),
					category: "BONDS",
					rationale: "[ZAMKNIĘCIE POZYCJI] Usunięcie transzy z portfela",
				},
			}),
			// 3. Usuwamy samo aktywo
			db.asset.delete({
				where: { id },
			}),
		]);

		// 4. Revalidujemy wszystkie ścieżki, gdzie te dane występują
		revalidatePath("/bond-reports");
		revalidatePath("/dashboard");

		return {
			success: true,
			message: "Obligacja usunięta i zarchiwizowana w historii",
		};
	} catch (error) {
		console.error("Delete error:", error);
		return { success: false, message: "Nie udało się usunąć obligacji" };
	}
}

// EN: Ensure the function always returns a valid ActionResponse
export const handleDeleteBond = async (id: string): Promise<ActionResponse> => {
	try {
		await deleteBond(id);

		// EN: Important - you must return a success object here!
		return {
			success: true,
			id: id,
		};
	} catch (error) {
		console.error("Delete Error:", error);
		return {
			success: false,
			error: "Niestety nie udało się usunąć tej obligacji",
		};
	}
};

// Logika mapowania tickerów na typ oprocentowania
function getRateTypeByTicker(ticker: string): "VARIABLE" | "FIXED" {
	const cleanTicker = ticker
		.toUpperCase()
		.split("_")[0] as keyof typeof BOND_TEMPLATES;

	const type = BOND_TEMPLATES[cleanTicker]?.rateType as
		| "FIXED"
		| "VARIABLE"
		| undefined;

	return type || "FIXED";
}

function getBondMaturityDate(purchaseDate: Date, ticker: string): Date {
	const cleanTicker = ticker
		.toUpperCase()
		.split("_")[0] as keyof typeof BOND_TEMPLATES;

	const template = BOND_TEMPLATES[cleanTicker];
	const maturity = new Date(purchaseDate);

	if (template) {
		maturity.setMonth(maturity.getMonth() + template.duration * 12);
	}
	return maturity;
}

export async function addBond(formData: FormData, portfolioId: string) {
	try {
		const rawTicker = formData.get("ticker") as string;
		const name = formData.get("name") as string;
		const investedCapital = Number(formData.get("investedCapital"));
		const purchaseDate = new Date(formData.get("purchaseDate") as string);
		const interestRate = Number(formData.get("interestRate")) || 0;
		const manualCurrentValueRaw = formData.get("manualCurrentValue");

		const quantity = Number(formData.get("quantity")) || 1;
		// 2. MAGIC TRICK - Omijamy limit unikalności Prismy
		const dbTicker = `${rawTicker}_${Date.now()}`;
		const rateType = getRateTypeByTicker(rawTicker);
		const maturityDate = getBondMaturityDate(purchaseDate, rawTicker);

		// EN: NEW INITIAL VALUATION LOGIC
		let startingCurrentValue = investedCapital;

		if (manualCurrentValueRaw) {
			// EN: If the user entered the valuation manually, we trust them
			startingCurrentValue = Number(manualCurrentValueRaw);
		} else if (interestRate > 0) {
			// EN: If only the percentage was provided, the server calculates the valuation itself
			const now = new Date();
			const diffYears = Math.max(
				0,
				(now.getTime() - purchaseDate.getTime()) /
					(1000 * 60 * 60 * 24 * 365.25),
			);
			const r = interestRate / 100;

			if (rateType === "FIXED" || rawTicker === "OTS" || rawTicker === "DOS") {
				startingCurrentValue = investedCapital * (1 + r * diffYears); // EN: Simple interest
			} else {
				startingCurrentValue = investedCapital * Math.pow(1 + r, diffYears); // EN: Compound interest
			}
		}

		startingCurrentValue = Number(startingCurrentValue.toFixed(2)); // EN: Round to two decimal places

		await db.$transaction(async (tx) => {
			await tx.asset.create({
				data: {
					name,
					ticker: dbTicker,
					portfolioId,
					category: "BONDS",
					quantity,
					rateType,
					investedCapital,
					currentValue: startingCurrentValue, // EN: Save the CALCULATED valuation
					interestRate,
					purchaseDate,
					maturityDate,
				},
			});
			// Zapisujemy ślad w historii (TransactionHistory)
			await tx.transactionHistory.create({
				data: {
					portfolioId,
					assetName: name,
					ticker: dbTicker,
					quantity,
					executedValue: investedCapital, // EN: Record initial investment in history (so the chart starts from zero)
					executedAt: purchaseDate,
					category: "BONDS",
					type: "BUY",
					rationale: "Zakup nowej serii obligacji",
				},
			});
		});
		// 4. REWALIDACJA - Odświeżamy wszystkie miejsca, gdzie obligacja ma być widoczna
		revalidatePath(`/bond-reports/${portfolioId}`);
		revalidatePath("/dashboard");
		revalidatePath("/bond-reports");

		return { success: true };
	} catch (error) {
		console.error("Prisma DB Error during addBond:", error);
		return {
			success: false,
			error: "Nie udało się zapisać obligacji w bazie.",
		};
	}
}

export async function updateBondValue(id: string, newValue: number) {
	try {
		const bond = await db.asset.findUnique({ where: { id } });
		if (!bond) throw new Error("Bond not found");

		// RÓŻNICA DO HISTORII TRANSAKCJI
		const valueDelta = newValue - bond.currentValue;

		await db.$transaction([
			db.asset.update({
				where: { id },
				data: { currentValue: newValue },
			}),
			db.transactionHistory.create({
				data: {
					portfolioId: bond.portfolioId,
					type: "UPDATE",
					assetName: bond.name,
					ticker: bond.ticker,
					quantity: 0,
					executedValue: valueDelta, // Różnica
					category: "BONDS",
					rationale: `Ręczna korekta wyceny: ${newValue} PLN`,
				},
			}),
		]);

		revalidatePath("/bond-reports");
		return { success: true };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Błąd aktualizacji kwoty PLN" };
	}
}

export async function updateBondInterestRate(id: string, newRate: number) {
	try {
		const bond = await db.asset.findUnique({ where: { id } });
		if (!bond) throw new Error("Bond not found");

		const purchaseDate = new Date(bond.purchaseDate!);
		const now = new Date();

		const diffYears = Math.max(
			0,
			(now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
		);

		const cleanTicker = bond.ticker?.split("_")[0].toUpperCase() || "";
		const capital = bond.investedCapital ?? 0;

		let simulatedValue = capital;
		const r = newRate / 100;

		if (
			bond.rateType === "FIXED" ||
			cleanTicker === "OTS" ||
			cleanTicker === "DOS"
		) {
			simulatedValue = capital * (1 + r * diffYears);
		} else {
			simulatedValue = capital * Math.pow(1 + r, diffYears);
		}

		const finalValue =
			newRate === 0 ? bond.currentValue : Number(simulatedValue.toFixed(2));

		// 🆕 RÓŻNICA DO HISTORII TRANSAKCJI (Delta zysku/straty)
		const valueDelta = finalValue - bond.currentValue;

		await db.$transaction([
			db.asset.update({
				where: { id },
				data: {
					interestRate: newRate,
					currentValue: finalValue,
				},
			}),
			db.transactionHistory.create({
				data: {
					type: "UPDATE",
					assetName: bond.name,
					ticker: bond.ticker,
					executedValue: valueDelta,
					quantity: 0,
					portfolioId: bond.portfolioId,
					category: bond.category,
					rationale: `Korekta: ${newRate}% (Nowa wycena: ${finalValue} PLN)`,
				},
			}),
		]);

		revalidatePath("/bond-reports");
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("🔥 Błąd TypeScript w updateBondInterestRate:", error);
		return { success: false, error: "Błąd aktualizacji stopy procentowej." };
	}
}

export async function sellBondAction(formData: FormData) {
	// 1. Pobieranie danych (Używamy klucza 'bondId', bo tak wysyła BondLedgerTable)
	const bondId = formData.get("bondId") as string;
	const quantityToSell = Number(formData.get("quantity"));

	// ZMIANA: Pobieramy gotową kwotę całkowitą (np. 300), NIE mnożymy jej ponownie przez ilość
	const totalSellValue = Number(formData.get("sellPrice"));

	const targetPortfolioId = formData.get("targetPortfolioId") as string;
	const note = (formData.get("note") as string) || "";
	const executedAt =
		new Date(formData.get("executedAt") as string) || new Date();

	try {
		const bond = await db.asset.findUnique({ where: { id: bondId } });
		if (!bond || bond.quantity < quantityToSell) {
			return {
				success: false,
				error: "Niewystarczająca ilość jednostek obligacji.",
			};
		}

		const ratio = quantityToSell / bond.quantity;
		const capitalReduction = bond.investedCapital * ratio;
		const realizedProfit = totalSellValue - capitalReduction;

		const isFullSale = bond.quantity === quantityToSell;

		await db.$transaction(async (tx) => {
			// 2. AKTUALIZACJA OBLIGACJI
			if (isFullSale) {
				await tx.asset.delete({ where: { id: bondId } });
			} else {
				await tx.asset.update({
					where: { id: bondId },
					data: {
						quantity: { decrement: quantityToSell },
						investedCapital: { decrement: capitalReduction },
						currentValue: { decrement: bond.currentValue * ratio },
					},
				});
			}

			// 3. HISTORIA SPRZEDAŻY (Zostaje w portfelu OBLIGACJI dla wykresu)
			await tx.transactionHistory.create({
				data: {
					type: "SELL",
					portfolioId: bond.portfolioId, // Historia tam, gdzie było aktywo
					assetName: bond.name,
					ticker: bond.ticker,
					quantity: -quantityToSell,
					executedValue: totalSellValue,
					category: "BONDS",
					executedAt,
					rationale:
						note ||
						`Sprzedaż: ${quantityToSell} szt. Zysk: +${realizedProfit.toFixed(2)} PLN`,
				},
			});

			// 4. KSIĘGOWANIE GOTÓWKI (Jeśli wybrano portfel docelowy)
			if (targetPortfolioId && targetPortfolioId !== "none") {
				const existingCash = await tx.asset.findFirst({
					where: { portfolioId: targetPortfolioId, ticker: "CASH" },
				});

				if (existingCash) {
					await tx.asset.update({
						where: { id: existingCash.id },
						data: {
							quantity: { increment: totalSellValue },
							currentValue: { increment: totalSellValue },
							investedCapital: { increment: totalSellValue },
						},
					});
				} else {
					// Tworzymy nową pozycję CASH
					await tx.asset.create({
						data: {
							portfolioId: targetPortfolioId,
							name: "Gotówka",
							ticker: "CASH",
							category: "CASH",
							quantity: totalSellValue,
							currentValue: totalSellValue,
							investedCapital: totalSellValue,
							purchaseDate: executedAt,
						},
					});
				}

				// Historia wpływu do portfela CASH (Zielony plus)
				await tx.transactionHistory.create({
					data: {
						type: "BUY",
						portfolioId: targetPortfolioId,
						assetName: "Gotówka",
						ticker: "CASH",
						quantity: totalSellValue,
						executedValue: totalSellValue,
						category: "CASH",
						executedAt,
						rationale: `Wpływ ze sprzedaży obligacji ${bond.name}`,
					},
				});
			}
		});

		revalidatePath("/bond-reports");
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Błąd sprzedaży obligacji:", error);
		return { success: false, error: "Błąd serwera podczas sprzedaży." };
	}
}

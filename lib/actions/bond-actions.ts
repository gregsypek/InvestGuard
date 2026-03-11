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

// EN: The main Server Action remains async because it writes to the DB
export async function addBond(formData: FormData, portfolioId: string) {
	try {
		const rawTicker = formData.get("ticker") as string;
		const name = formData.get("name") as string;
		const investedCapital = Number(formData.get("investedCapital"));
		const purchaseDate = new Date(formData.get("purchaseDate") as string);
		const interestRate = Number(formData.get("interestRate")) || 0;
		const manualCurrentValueRaw = formData.get("manualCurrentValue");

		// Jeśli użytkownik wpisał wycenę z banku, używamy jej. Jeśli nie, wycena = wkład.
		const startingCurrentValue = manualCurrentValueRaw
			? Number(manualCurrentValueRaw)
			: investedCapital;

		// 1. ZGUBIONA ILOŚĆ 🧱
		const quantity = Number(formData.get("quantity")) || 1;

		// 2. MAGIC TRICK - Omijamy limit unikalności Prismy
		const dbTicker = `${rawTicker}_${Date.now()}`;

		// UWAGA: Do logiki i wyliczeń używamy "czystego" tickera (np. EDO), a nie tego z datą
		const rateType = getRateTypeByTicker(rawTicker);
		const maturityDate = getBondMaturityDate(purchaseDate, rawTicker);

		// 3. TRANSAKCJA - Zapisujemy do OBU tabel naraz ⚖️
		await db.$transaction(async (tx) => {
			// Zapisujemy samą obligację (Asset)
			await tx.asset.create({
				data: {
					name,
					ticker: dbTicker, // Zapisujemy unikalny ticker z datą
					portfolioId,
					category: "BONDS",
					quantity, // Dodajemy ilość sztuk!
					rateType,
					investedCapital,
					currentValue: startingCurrentValue,
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
					quantity, // Tu też ilość
					executedValue: investedCapital,
					executedAt: purchaseDate,
					category: "BONDS",
					type: "BUY", // Wymagany przez Twój enum
					rationale: "Zakup nowej serii obligacji",
				},
			});
		});

		// 4. REWALIDACJA - Odświeżamy wszystkie miejsca, gdzie obligacja ma być widoczna 🔄
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

// export async function updateBondInterestRate(id: string, newRate: number) {
// 	try {
// 		const bond = await db.asset.findUnique({ where: { id } });
// 		if (!bond) throw new Error("Bond not found");

// 		const capital = bond.investedCapital ?? 0;
// 		const purchaseDate = bond.purchaseDate
// 			? new Date(bond.purchaseDate)
// 			: new Date();
// 		const now = new Date();

// 		const diffYears = Math.max(
// 			0,
// 			(now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
// 		);

// 		let newCurrentValue = capital;
// 		const r = newRate / 100;

// 		// 1. CZYSZCZENIE TICKERA Z DATY (np. EDO_17098273 -> EDO)
// 		const cleanTicker = bond.ticker
// 			? bond.ticker.split("_")[0].toUpperCase()
// 			: "";

// 		// LOGIKA ROZPOZNAWANIA TYPU OBLIGACJI (Używamy czystego tickera!)
// 		if (
// 			bond.rateType === "FIXED" ||
// 			cleanTicker === "OTS" ||
// 			cleanTicker === "DOS"
// 		) {
// 			newCurrentValue = capital * (1 + r * diffYears);
// 		} else {
// 			newCurrentValue = capital * Math.pow(1 + r, diffYears);
// 		}

// 		// 2. TRANSAKCJA PRISMA
// 		await db.$transaction([
// 			db.asset.update({
// 				where: { id },
// 				data: {
// 					interestRate: newRate,
// 					currentValue: Number(newCurrentValue.toFixed(2)),
// 				},
// 			}),
// 			db.transactionHistory.create({
// 				data: {
// 					// UWAGA: Upewnij się, że masz "UPDATE" w schema.prisma!
// 					type: "UPDATE",
// 					assetName: bond.name,
// 					ticker: bond.ticker, // W historii zostawiamy pełny ticker dla śladu
// 					executedValue: Number(newCurrentValue.toFixed(2)),
// 					quantity: bond.quantity, // Dodano ilość dla spójności
// 					category: bond.category,
// 					portfolioId: bond.portfolioId,
// 					rationale: `Aktualizacja oprocentowania: ${newRate}%`,
// 				},
// 			}),
// 		]);

// 		// Odświeżamy widoki
// 		revalidatePath("/bond-reports");
// 		revalidatePath("/dashboard");

// 		return { success: true };
// 	} catch (error) {
// 		// 3. LOGOWANIE BŁĘDU DO TERMINALA
// 		console.error("🔥 Błąd Prisma w updateBondInterestRate:", error);
// 		// Zwracamy klucz 'error', na który czeka QuickAdjustCell
// 		return {
// 			success: false,
// 			error: "Błąd aktualizacji wyceny. Sprawdź terminal.",
// 		};
// 	}
// }
// lib/actions/bond-actions.ts

export async function updateBondValue(id: string, newValue: number) {
	try {
		const bond = await db.asset.findUnique({ where: { id } });
		if (!bond) throw new Error("Bond not found");

		await db.$transaction([
			db.asset.update({
				where: { id },
				data: { currentValue: newValue },
			}),
			db.transactionHistory.create({
				data: {
					type: "UPDATE",
					assetName: bond.name,
					ticker: bond.ticker,
					executedValue: newValue,
					quantity: bond.quantity,
					category: bond.category,
					portfolioId: bond.portfolioId,
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

		// 1. PRZYWRACAMY CZYSZCZENIE TICKERA
		const cleanTicker = bond.ticker?.split("_")[0].toUpperCase() || "";

		// 2. PRZYWRACAMY MATEMATYKĘ (Logika rozpoznawania typu)
		const capital = bond.investedCapital ?? 0;
		const purchaseDate = new Date(bond.purchaseDate);
		const now = new Date();
		const diffYears = Math.max(
			0,
			(now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
		);

		let simulatedValue = capital;
		const r = newRate / 100;

		if (
			bond.rateType === "FIXED" ||
			cleanTicker === "OTS" ||
			cleanTicker === "DOS"
		) {
			simulatedValue = capital * (1 + r * diffYears); // Prosty
		} else {
			simulatedValue = capital * Math.pow(1 + r, diffYears); // Składany
		}

		// 3. BEZPIECZNIK: Jeśli nowe oprocentowanie to 0, NIE dotykamy wyceny (zostawiamy ręczną)
		// Jeśli > 0, system "proponuje" nową wycenę na podstawie matematyki
		const finalValue =
			newRate === 0 ? bond.currentValue : Number(simulatedValue.toFixed(2));

		await db.$transaction([
			db.asset.update({
				where: { id },
				data: {
					interestRate: newRate,
					currentValue: finalValue, // Przywracamy automatyczną aktualizację!
				},
			}),
			db.transactionHistory.create({
				data: {
					type: "UPDATE",
					assetName: bond.name,
					ticker: bond.ticker,
					executedValue: finalValue,
					category: bond.category,
					portfolioId: bond.portfolioId,
					rationale: `Automatyczna aktualizacja wyceny przy zmianie stopy na ${newRate}%`,
				},
			}),
		]);

		revalidatePath("/bond-reports");
		return { success: true };
	} catch (error) {
		console.error("Błąd przeliczeń:", error);
		return { success: false, error: "Błąd automatyki obligacji" };
	}
}

// lib/actions/bond-actions.ts

export async function sellBondAction(formData: FormData) {
	try {
		const bondId = formData.get("bondId") as string;
		const quantityToSell = Number(formData.get("quantity"));
		const sellPrice = Number(formData.get("sellPrice")); // Total value received
		const portfolioId = formData.get("portfolioId") as string;
		const targetPortfolioId = formData.get("targetPortfolioId") as string;
		const note = formData.get("note") as string;
		const bond = await db.asset.findUnique({ where: { id: bondId } });
		if (!bond || bond.quantity < quantityToSell) {
			return { success: false, error: "Insufficient bond quantity" };
		}

		// 1. SMART LOGIC: Calculate proportional reduction
		const ratio = quantityToSell / bond.quantity;
		const capitalReduction = bond.investedCapital * ratio;
		const valueReduction = bond.currentValue * ratio;

		const isFullSale = bond.quantity === quantityToSell;

		await db.$transaction(async (tx) => {
			if (isFullSale) {
				// Delete asset if everything is sold
				await tx.asset.delete({ where: { id: bondId } });
			} else {
				// Update asset with reduced values
				await tx.asset.update({
					where: { id: bondId },
					data: {
						quantity: { decrement: quantityToSell },
						investedCapital: { decrement: capitalReduction },
						currentValue: { decrement: valueReduction },
					},
				});
			}

			// 2. Record the sale in history
			await tx.transactionHistory.create({
				data: {
					portfolioId: targetPortfolioId, // Gotówka wpływa tutaj
					type: "SELL",
					assetName: bond.name,
					ticker: bond.ticker,
					quantity: -quantityToSell, // Negative for sales
					executedValue: sellPrice,
					category: "BONDS",
					rationale: note || `Sprzedaż częściowa: ${quantityToSell} sztuk`,
				},
			});
		});

		revalidatePath("/bond-reports");
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Bond Sale Error:", error);
		return { success: false, error: "Failed to process sale" };
	}
}

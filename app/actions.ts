"use server";

import { Category } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// app/actions.ts
export async function addAssetAction(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id)
		return { success: false, message: "Błąd autoryzacji" };

	const portfolioId = formData.get("portfolioId") as string;
	const existingAssetId = formData.get("existingAssetId") as string;
	const quantity = Number(formData.get("quantity"));
	const investedCapital = Number(formData.get("investedCapital"));
	const currentValue = Number(formData.get("currentValue"));

	const executedAtRaw = formData.get("executedAt") as string;
	const executedAt = executedAtRaw ? new Date(executedAtRaw) : new Date();
	const name = formData.get("name") as string;
	const ticker = (formData.get("ticker") as string)?.trim() || null;
	const category = formData.get("category") as Category;

	const isBond = category === "BONDS"; // EN: Identify if it's a bond tranche

	// EN: MAGIC TRICK - Append timestamp to bond tickers to bypass DB constraints
	const dbTicker = isBond && ticker ? `${ticker}_${Date.now()}` : ticker;

	try {
		let targetAssetId = existingAssetId;

		// 1. ZMODYFIKOWANE SZUKANIE 🛡️
		// EN: Skip searching for duplicates if it's a bond
		if (!isBond && (!targetAssetId || targetAssetId === "new")) {
			const searchConditions: any[] = [{ name, portfolioId }];
			if (ticker) searchConditions.push({ ticker, portfolioId });

			const existing = await db.asset.findFirst({
				where: { OR: searchConditions },
			});
			if (existing) targetAssetId = existing.id;
		}

		// 2. AKTUALIZACJA LUB TWORZENIE ⚖️
		if (!isBond && targetAssetId && targetAssetId !== "new") {
			// EN: Update existing stock/crypto
			await db.asset.update({
				where: { id: targetAssetId },
				data: {
					quantity: { increment: quantity },
					investedCapital: { increment: investedCapital },
					currentValue: { increment: currentValue },
				},
			});
		} else {
			// EN: Always create a new record for bonds, using the unique dbTicker
			const newAsset = await db.asset.create({
				data: {
					name,
					ticker: dbTicker, // <-- Używamy unikalnego tickera!
					quantity,
					investedCapital,
					currentValue,
					category,
					portfolioId,
					purchaseDate: executedAt,
					interestRate: 0,
					targetPercentage: 0,
				},
			});
			targetAssetId = newAsset.id;
		}

		// 3. ZAPIS DO HISTORII 📜
		await db.transactionHistory.create({
			data: {
				portfolioId,
				assetName: name,
				ticker: dbTicker, // <-- Tu też używamy unikalnego
				quantity,
				executedValue: investedCapital,
				executedAt,
				category,
				rationale: existingAssetId !== "new" ? "Dokupienie" : "Pierwszy zakup",
			},
		});

		revalidatePath("/dashboard");
		revalidatePath("/bond-reports"); // EN: Make sure reports page refreshes too

		return {
			success: true,
			portfolioId,
			newAssetId: targetAssetId,
			message: "Dodano aktywo! 🚀",
		};
	} catch (error) {
		console.error("Database error while adding asset:", error);
		return { success: false, message: "Błąd bazy danych" };
	}
}

export async function sellAssetAction(formData: FormData) {
	// Extracting data from the modal form
	const assetId = formData.get("assetId") as string;
	const quantityToSell = Number(formData.get("quantity"));
	const sellPricePerUnit = Number(formData.get("sellPrice"));
	const targetCashPortfolioId = formData.get("targetPortfolioId") as string; // Selected from dropdown
	const executedAt = new Date(formData.get("executedAt") as string);

	// EN: 1. Fetch the note from the form (can be null if not provided)
	const note = formData.get("note") as string | null;

	const totalSellValue = quantityToSell * sellPricePerUnit;

	return await db.$transaction(async (tx) => {
		// 1. Fetch the current state of the asset
		const asset = await tx.asset.findUnique({ where: { id: assetId } });
		if (!asset) throw new Error("Asset not found");

		const ratio = quantityToSell / asset.quantity;
		const newQuantity = asset.quantity - quantityToSell;

		// 2. Update or Delete the asset record
		if (newQuantity <= 0) {
			await tx.asset.delete({ where: { id: assetId } });
		} else {
			await tx.asset.update({
				where: { id: assetId },
				data: {
					quantity: newQuantity,
					investedCapital: { decrement: asset.investedCapital * ratio },
					currentValue: { decrement: asset.currentValue * ratio },
				},
			});
		}

		// 3. Create the SELL transaction history record (The orange minus)
		await tx.transactionHistory.create({
			data: {
				type: "SELL",
				portfolioId: asset.portfolioId,
				assetName: asset.name,
				ticker: asset.ticker,
				quantity: -quantityToSell,
				executedValue: totalSellValue,
				category: asset.category,
				executedAt,
				rationale: note, // EN: Save the user's note here
			},
		});

		// 4. Handle Cash Flow if a target portfolio was selected AND it is not "none"
		if (targetCashPortfolioId && targetCashPortfolioId !== "none") {
			// EN: 2. Replaced broken upsert with findFirst + update/create logic
			const existingCashAsset = await tx.asset.findFirst({
				where: {
					portfolioId: targetCashPortfolioId,
					ticker: "CASH",
				},
			});

			if (existingCashAsset) {
				// Update existing cash
				await tx.asset.update({
					where: { id: existingCashAsset.id },
					data: {
						quantity: { increment: totalSellValue },
						currentValue: { increment: totalSellValue },
						investedCapital: { increment: totalSellValue },
					},
				});
			} else {
				// Create new cash position
				await tx.asset.create({
					data: {
						portfolioId: targetCashPortfolioId,
						name: "Gotówka",
						ticker: "CASH",
						category: "CASH",
						quantity: totalSellValue,
						currentValue: totalSellValue,
						investedCapital: totalSellValue,
					},
				});
			}

			// Create the CASH INFLOW history record (The green plus)
			await tx.transactionHistory.create({
				data: {
					type: "BUY", // Cash inflow is treated as a "purchase" of currency
					portfolioId: targetCashPortfolioId,
					assetName: "Gotówka",
					ticker: "CASH",
					quantity: totalSellValue,
					executedValue: totalSellValue,
					category: "CASH",
					executedAt,
					rationale: `Wpływ ze sprzedaży ${asset.name}`,
				},
			});
		}

		return { success: true };
	});
}

export async function adjustAssetAction(formData: FormData) {
	const assetId = formData.get("assetId") as string;
	const newQuantity = Number(formData.get("newQuantity"));
	const newInvestedCapital = Number(formData.get("newInvestedCapital"));
	const newCurrentValue = Number(formData.get("newCurrentValue"));
	const note = formData.get("note") as string | null;

	return await db.$transaction(async (tx) => {
		// 1. Pobieramy obecny stan
		const asset = await tx.asset.findUnique({ where: { id: assetId } });
		if (!asset) throw new Error("Nie znaleziono aktywa");

		// 2. Wyliczamy różnicę (ile sztuk przybyło/ubyło i jaka jest różnica w wartości)
		const quantityDiff = newQuantity - asset.quantity;

		// Zabezpieczenie przed tworzeniem pustych logów
		if (
			quantityDiff === 0 &&
			newInvestedCapital === asset.investedCapital &&
			newCurrentValue === asset.currentValue
		) {
			return { success: true, message: "Brak zmian do zapisania." };
		}

		// 3. Nadpisujemy aktywo "na twardo" nowymi wartościami
		await tx.asset.update({
			where: { id: assetId },
			data: {
				quantity: newQuantity,
				investedCapital: newInvestedCapital,
				currentValue: newCurrentValue,
			},
		});

		// 4. Zapisujemy w historii korektę TYLKO wtedy, gdy zmieniła się fizyczna ilość sztuk
		if (quantityDiff !== 0) {
			await tx.transactionHistory.create({
				data: {
					type: quantityDiff > 0 ? "BUY" : "SELL",
					portfolioId: asset.portfolioId,
					assetName: asset.name,
					ticker: asset.ticker,
					quantity: quantityDiff,
					executedValue: 0,
					category: asset.category,
					executedAt: new Date(),
					rationale: `[KOREKTA STANU] ${note ? note : `Zmieniono z ${asset.quantity} szt. na ${newQuantity} szt.`}`,
				},
			});
		}

		return { success: true };
	});
}
// EN: Update interest rate and automatically recalculate current value
export async function updateBondInterestRate(id: string, newRate: number) {
	try {
		// 1. Fetch current bond data to get invested capital and purchase date
		const bond = await db.asset.findUnique({ where: { id } });
		if (!bond) throw new Error("Bond not found");

		const capital = bond.investedCapital ?? 0;
		const purchaseDate = bond.purchaseDate
			? new Date(bond.purchaseDate)
			: new Date();
		const now = new Date();

		// 2. Simple interest calculation: (Capital * Rate * Time)
		// EN: We calculate years elapsed to get an estimated accrued interest
		const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
		const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);

		// EN: New value = Initial capital + estimated interest earned
		const newCurrentValue = capital + capital * (newRate / 100) * diffYears;

		// 3. Update both fields in the database
		await db.asset.update({
			where: { id },
			data: {
				interestRate: newRate,
				currentValue: Number(newCurrentValue.toFixed(2)),
			},
		});

		revalidatePath("/bond-reports");
		return { success: true, message: "Zaktualizowano stawkę i wycenę" };
	} catch {
		return { success: false, message: "Błąd podczas przeliczania" };
	}
}

// EN: Action to remove a bond tranche from the ledger
export async function deleteBond(id: string) {
	try {
		await db.asset.delete({ where: { id } });
		revalidatePath("/bond-reports");
		return { success: true, message: "Transza usunięta pomyślnie" };
	} catch {
		return { success: false, message: "Nie udało się usunąć transzy" };
	}
}

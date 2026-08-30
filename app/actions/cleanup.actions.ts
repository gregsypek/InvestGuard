"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function hardDeleteAssetWithHistory(assetId: string) {
	try {
		// 1. Kasujemy całą historię transakcji powiązaną z tym aktywem
		// (Zależnie od Twojego schematu DB, może to wymagać nazwy, tickera lub id)
		const asset = await db.asset.findUnique({ where: { id: assetId } });
		if (!asset) return { success: false, error: "Nie znaleziono aktywa" };

		// Zakładam, że historia jest powiązana po nazwie i kategorii (zgodnie z systemem)
		await db.transactionHistory.deleteMany({
			where: {
				portfolioId: asset.portfolioId,
				assetName: asset.name,
				category: asset.category,
			},
		});

		// 2. Kasujemy samo aktywo
		await db.asset.delete({ where: { id: assetId } });

		revalidatePath("/", "layout"); // Odświeża wszystko
		return { success: true };
	} catch {
		return { success: false, error: "Błąd serwera podczas usuwania" };
	}
}

export async function revertLastTransaction(assetId: string) {
	try {
		return await db.$transaction(
			async (tx) => {
				// 1. Znajdujemy aktywo
				const asset = await tx.asset.findUnique({
					where: { id: assetId },
				});
				if (!asset) return { success: false, error: "Nie znaleziono aktywa" };

				// 2. Znajdujemy OSTATNIĄ transakcję zakupu dla tego tickera i portfela
				const lastTx = await tx.transactionHistory.findFirst({
					where: {
						portfolioId: asset.portfolioId,
						ticker: asset.ticker,
						type: { in: ["BUY", "DEPOSIT"] },
					},
					orderBy: { executedAt: "desc" },
				});

				if (!lastTx) {
					return {
						success: false,
						error: "Brak historii transakcji do cofnięcia dla tego aktywa.",
					};
				}

				// 3. Sprawdzamy, czy to była jedyna transakcja - jeśli tak, informujemy użytkownika, że lepiej użyć pełnego usunięcia
				const txCount = await tx.transactionHistory.count({
					where: { portfolioId: asset.portfolioId, ticker: asset.ticker },
				});

				// 4. Korekta tabeli Asset (odejmujemy wartości ostatniej transzy)
				const newQuantity = asset.quantity - lastTx.quantity;
				const newInvested = asset.investedCapital - lastTx.executedValue;
				const newCurrent = asset.currentValue - lastTx.executedValue;

				if (newQuantity <= 0 || txCount <= 1) {
					// Jeśli to była ostatnia transakcja, usuwamy całe aktywo i całą historię
					await tx.transactionHistory.deleteMany({
						where: { portfolioId: asset.portfolioId, ticker: asset.ticker },
					});
					await tx.asset.delete({ where: { id: assetId } });
				} else {
					// Jeśli to była tylko jedna z wielu dawek (dokupienie), aktualizujemy aktywo
					await tx.asset.update({
						where: { id: assetId },
						data: {
							quantity: newQuantity,
							investedCapital: newInvested > 0 ? newInvested : 0,
							currentValue: newCurrent > 0 ? newCurrent : 0,
						},
					});
					// Usuwamy tylko ten jeden wpis z historii
					await tx.transactionHistory.delete({
						where: { id: lastTx.id },
					});
				}

				revalidatePath("/", "layout");
				return {
					success: true,
					message: `Cofnięto transakcję z dnia ${new Date(lastTx.executedAt).toLocaleDateString("pl-PL")} na kwotę ${lastTx.executedValue} PLN`,
				};
			},
			{ maxWait: 10000, timeout: 30000 },
		);
	} catch (error: any) {
		console.error("Revert Last Tx Error:", error);
		return {
			success: false,
			error: error.message || "Błąd podczas cofania transakcji",
		};
	}
}

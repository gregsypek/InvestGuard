"use server"; // EN: Ensures all functions in this file run only on the server
// PL: Gwarantuje, że wszystkie funkcje w tym pliku będą uruchamiane tylko na serwerze

import { ParsedXtbTransaction } from "../utils/xtb-parser";
import { db } from "../db";
import { revalidatePath } from "next/cache";
import { syncPortfolioAssets } from "./asset-actions";

export async function saveXtbTransaction(
	data: ParsedXtbTransaction,
	portfolioId: string,
) {
	return await db.transactionHistory.upsert({
		// where: { externalId: data.uniqueKey },
		where: {
			portfolioId_externalId: {
				portfolioId: portfolioId,
				externalId: data.uniqueKey,
			},
		},
		update: {},
		create: {
			externalId: data.uniqueKey,
			type: data.type,
			assetName: data.assetName,
			ticker: data.ticker,
			quantity: data.quantity,
			executedAt: data.date,
			executedValue: data.amountPLN,
			originalPrice: data.originalPrice,
			originalCurrency: data.currency,
			exchangeRate: data.exchangeRate,
			category: data.category,
			// EN: Use connect to link the relation properly
			// PL: Używamy connect, aby poprawnie połączyć relację
			portfolio: {
				connect: { id: portfolioId },
			},
			comment: data.comment,
		},
	});
}


export async function addManualDeposit(formData: {
	portfolioId: string;
	amount: number;
	date: Date;
	description?: string;
}) {
	try {
		const { portfolioId, amount, date, description } = formData;

		// 1. Tworzymy transakcję typu DEPOSIT
		await db.transactionHistory.create({
			data: {
				portfolioId,
				externalId: `MANUAL_${Date.now()}`, // Unikalny klucz
				type: "DEPOSIT",
				ticker: "CASH",
				assetName: "Wpłata gotówkowa",
				quantity: 1,
				executedAt: date,
				executedValue: Math.abs(amount),
				category: "CASH",
				comment: description || "Ręczne zasilenie portfela",
			},
		});

		// 2. Automatycznie przeliczamy aktywa (aby CASH w tabeli się zaktualizował)
		await syncPortfolioAssets(portfolioId);

		// 3. Odświeżamy widoki
		revalidatePath(`/dashboard/${portfolioId}`);

		return { success: true };
	} catch (error) {
		console.error("Błąd podczas dodawania wpłaty:", error);
		return { success: false, error: "Nie udało się dodać wpłaty" };
	}
}

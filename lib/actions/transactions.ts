"use server"; // EN: Ensures all functions in this file run only on the server
// PL: Gwarantuje, że wszystkie funkcje w tym pliku będą uruchamiane tylko na serwerze

import { ParsedXtbTransaction } from "../utils/xtb-parser";
// export async function saveXtbTransaction(
// 	data: ParsedXtbTransaction,
// 	portfolioId: string,
// ) {
// 	return await db.transactionHistory.upsert({
// 		// where: { externalId: data.uniqueKey },
// 		where: {
// 			portfolioId_externalId: {
// 				portfolioId: portfolioId,
// 				externalId: data.uniqueKey,
// 			},
// 		},
// 		update: {},
// 		create: {
// 			externalId: data.uniqueKey,
// 			type: data.type,
// 			assetName: data.assetName,
// 			ticker: data.ticker,
// 			quantity: data.quantity,
// 			executedAt: data.date,
// 			executedValue: data.amountPLN,
// 			originalPrice: data.originalPrice,
// 			originalCurrency: data.currency,
// 			exchangeRate: data.exchangeRate,
// 			category: data.category,
// 			// EN: Use connect to link the relation properly
// 			// PL: Używamy connect, aby poprawnie połączyć relację
// 			portfolio: {
// 				connect: { id: portfolioId },
// 			},
// 			comment: data.comment,
// 		},
// 	});
// }
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { revalidatePath } from "next/cache";
import { syncPortfolioAssets } from "./asset-actions";

export async function saveXtbTransaction(
	data: ParsedXtbTransaction,
	portfolioId: string,
) {
	try {
		// EN: Perform a strict creation to enforce underlying unique constraint checks
		// PL: Wykonujemy twarde utworzenie, aby wymusić sprawdzenie unikalności klucza
		return await db.transactionHistory.create({
			data: {
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
				portfolio: {
					connect: { id: portfolioId },
				},
				comment: data.comment,
			},
		});
	} catch (error) {
		// EN: Check if the thrown exception matches Prisma's unique constraint violation code (P2002)
		// PL: Sprawdzamy, czy rzucony wyjątek to błąd naruszenia unikalności Prisma (kod P2002)
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			throw new Error(
				"Wybrane aktywo z tą datą i kwotą jest już dodane w tym portfelu.",
			);
		}

		// EN: Forward any other unexpected database exceptions downstream
		// PL: Przekazujemy wszelkie inne nieoczekiwane błędy bazy danych dalej
		throw error;
	}
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

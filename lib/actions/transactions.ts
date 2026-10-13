"use server"; // EN: Ensures all functions in this file run only on the server
// PL: Gwarantuje, że wszystkie funkcje w tym pliku będą uruchamiane tylko na serwerze

import { ParsedXtbTransaction } from "../utils/xtb-parser";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { revalidatePath } from "next/cache";
import { syncPortfolioAssets } from "./asset-actions";

export async function saveXtbTransaction(
	data: ParsedXtbTransaction,
	portfolioId: string,
) {
	try {
		// 🚀 FIX: Tworzymy precyzyjny klucz (ID Zlecenia + Typ)
		const finalExternalId = `${data.uniqueKey}_${data.type}`;

		// 🚀 FIX: Usunięto agresywny `softDuplicate`. Baza danych sama zablokuje
		// ponowny import tego samego pliku, ale przepuści transze z tego samego dnia.
		// EN: Perform a strict creation to enforce underlying unique constraint checks
		// PL: Wykonujemy twarde utworzenie, aby wymusić sprawdzenie unikalności klucza
		return await db.transactionHistory.create({
			data: {
				externalId: finalExternalId,
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
			throw new Error("Ta dokładna transakcja została już zaimportowana.");
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
				externalId: `MANUAL_${Date.now()}`,
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
		revalidatePath(`/dashboard/${portfolioId}`);

		return { success: true };
	} catch (error) {
		console.error("Błąd podczas dodawania wpłaty:", error);
		return { success: false, error: "Nie udało się dodać wpłaty" };
	}
}

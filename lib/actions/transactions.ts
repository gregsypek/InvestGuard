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

		// 🚀 KROK 3: Aktualizujemy historyczne zrzuty, aby wykres wykrył Cash Flow!
		await backfillSnapshotsForRetroactiveTransaction(
			portfolioId,
			date,
			Math.abs(amount),
			"DEPOSIT",
		);

		revalidatePath(`/dashboard/${portfolioId}`);

		return { success: true };
	} catch (error) {
		console.error("Błąd podczas dodawania wpłaty:", error);
		return { success: false, error: "Nie udało się dodać wpłaty" };
	}
}
/**
 * EN: Backfills historical PortfolioSnapshots when a transaction is imported retroactively.
 * PL: Koryguje historyczne zrzuty portfela, gdy transakcja z przeszłości zostaje wgrana "wstecz".
 */
export async function backfillSnapshotsForRetroactiveTransaction(
	portfolioId: string,
	transactionDate: Date,
	transactionValuePLN: number,
	transactionType: "BUY" | "SELL" | "DEPOSIT" | "INTEREST" | "UPDATE",
) {
	// Interesują nas tylko te transakcje, które wpływają na całkowity wkład kapitałowy w portfelu.
	// W Twojej architekturze wpłaty/wypłaty (DEPOSIT, SELL na zewnątrz) bezpośrednio zmieniają całkowity zainwestowany kapitał.

	let cashFlowDelta = 0;
	if (transactionType === "DEPOSIT")
		cashFlowDelta = Math.abs(transactionValuePLN);
	if (transactionType === "SELL")
		cashFlowDelta = -Math.abs(transactionValuePLN); // Wypłata zdejmuje kapitał

	// Zakupy (BUY) za gotówkę Wewnątrz portfela nie zmieniają całkowitego zainwestowanego kapitału (tylko przesuwają między Asset CASH a Asset Akcji)
	if (cashFlowDelta === 0) return { success: true, skipped: true };

	// 1. Znajdź wszystkie historyczne zrzuty, które wydarzyły się PO dacie transakcji
	// (i wymagają teraz "podniesienia" lub "obniżenia" o ten kapitał)
	const snapshotsToFix = await db.portfolioSnapshot.findMany({
		where: {
			portfolioId: portfolioId,
			date: {
				// Ustawiamy na sam początek dnia transakcji (bo zrzut mógł być wieczorem, a transakcja rano)
				gte: new Date(new Date(transactionDate).setUTCHours(0, 0, 0, 0)),
			},
		},
	});

	if (snapshotsToFix.length === 0) return { success: true, fixedCount: 0 };

	// 2. Hurtowa aktualizacja zrzutów - podbijamy wartość zainwestowaną
	// Transaction API w Prisma zapewni bezpieczeństwo bazy
	await db.$transaction(
		snapshotsToFix.map((snap) =>
			db.portfolioSnapshot.update({
				where: { id: snap.id },
				data: {
					investedValue: snap.investedValue + cashFlowDelta,
					// Opcjonalnie podbijamy totalValue, by nie generować fałszywych strat,
					// ale zrzut zapisywał tylko historyczną wycenę aktywów. Jeśli wpłacono czystą gotówkę wstecz:
					totalValue: snap.totalValue + cashFlowDelta,
				},
			}),
		),
	);

	return { success: true, fixedCount: snapshotsToFix.length };
}

/**
 * EN: Rolls back historical PortfolioSnapshots when a transaction is DELETED retroactively.
 * PL: Cofa wartości w zrzutach portfela, gdy wymazujemy historyczną transakcję.
 */
export async function rollbackSnapshotsForDeletedTransaction(
	portfolioId: string,
	transactionDate: Date,
	transactionValuePLN: number,
	transactionType: "BUY" | "SELL" | "DEPOSIT" | "INTEREST" | "UPDATE",
) {
	let cashFlowDelta = 0;

	// 🚀 UWAGA: Tu logika jest ODWROTNA niż przy dodawaniu!
	// Jeśli usuwamy wpłatę (DEPOSIT), musimy ODJĄĆ ten kapitał ze zrzutów.
	if (transactionType === "DEPOSIT")
		cashFlowDelta = -Math.abs(transactionValuePLN);

	// Jeśli usuwamy wypłatę (SELL, która uszczupliła portfel), musimy ZWRÓCIĆ ten kapitał do zrzutów.
	if (transactionType === "SELL") cashFlowDelta = Math.abs(transactionValuePLN);

	// Zakupy wewnątrz portfela nie zmieniają całkowitego wkładu
	if (cashFlowDelta === 0) return { success: true, skipped: true };

	const snapshotsToFix = await db.portfolioSnapshot.findMany({
		where: {
			portfolioId: portfolioId,
			date: {
				gte: new Date(new Date(transactionDate).setUTCHours(0, 0, 0, 0)),
			},
		},
	});

	if (snapshotsToFix.length === 0) return { success: true, fixedCount: 0 };

	// Aktualizujemy zrzuty w przód, korygując je o odwróconą różnicę
	await db.$transaction(
		snapshotsToFix.map((snap) =>
			db.portfolioSnapshot.update({
				where: { id: snap.id },
				data: {
					investedValue: snap.investedValue + cashFlowDelta,
					totalValue: snap.totalValue + cashFlowDelta,
				},
			}),
		),
	);

	return { success: true, fixedCount: snapshotsToFix.length };
}

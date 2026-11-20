"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { ParsedXtbTransaction } from "../utils/xtb-parser";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { syncPortfolioAssets } from "./asset-actions";

export async function saveXtbTransaction(
	data: ParsedXtbTransaction,
	portfolioId: string,
) {
	try {
		// Create deterministic unique key (Order ID + Type)
		const finalExternalId = `${data.uniqueKey}_${data.type}`;

		// Enforce underlying unique constraint check in database
		const created = await db.transactionHistory.create({
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

		revalidateTag("snapshots", "max");
		return created;
	} catch (error) {
		// Check if the thrown exception matches Prisma's unique constraint violation code (P2002)
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			throw new Error("Ta dokładna transakcja została już zaimportowana.");
		}
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

		// 1. Create DEPOSIT transaction record
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

		// 2. Recalculate portfolio assets to update CASH balance
		await syncPortfolioAssets(portfolioId);

		// 3. Adjust historical snapshots so charts reflect the retroactive cash flow
		await backfillSnapshotsForRetroactiveTransaction(
			portfolioId,
			date,
			Math.abs(amount),
			"DEPOSIT",
		);

		revalidateTag("snapshots", "max");
		revalidatePath(`/dashboard/${portfolioId}`);

		return { success: true };
	} catch (error) {
		console.error("Błąd podczas dodawania wpłaty:", error);
		return { success: false, error: "Nie udało się dodać wpłaty" };
	}
}

/**
 * Backfills historical PortfolioSnapshots when a transaction is imported retroactively.
 * Uses atomic updateMany with increment to update all affected rows in a single DB query (0 egress).
 */
export async function backfillSnapshotsForRetroactiveTransaction(
	portfolioId: string,
	transactionDate: Date,
	transactionValuePLN: number,
	transactionType: "BUY" | "SELL" | "DEPOSIT" | "INTEREST" | "UPDATE",
) {
	let cashFlowDelta = 0;
	if (transactionType === "DEPOSIT")
		cashFlowDelta = Math.abs(transactionValuePLN);
	if (transactionType === "SELL")
		cashFlowDelta = -Math.abs(transactionValuePLN);

	// Internal BUY operations shift CASH to Asset without altering total invested capital
	if (cashFlowDelta === 0) return { success: true, skipped: true };

	const startOfTransactionDay = new Date(
		new Date(transactionDate).setUTCHours(0, 0, 0, 0),
	);

	// Single atomic SQL UPDATE across all subsequent snapshots instead of N+1 fetch-and-update loop
	const result = await db.portfolioSnapshot.updateMany({
		where: {
			portfolioId,
			date: {
				gte: startOfTransactionDay,
			},
		},
		data: {
			investedValue: { increment: cashFlowDelta },
			totalValue: { increment: cashFlowDelta },
		},
	});

	if (result.count > 0) {
		revalidateTag("snapshots", "max");
	}

	return { success: true, fixedCount: result.count };
}

/**
 * Rolls back historical PortfolioSnapshots when a transaction is deleted retroactively.
 * Uses atomic updateMany with increment/decrement in a single DB query.
 */
export async function rollbackSnapshotsForDeletedTransaction(
	portfolioId: string,
	transactionDate: Date,
	transactionValuePLN: number,
	transactionType: "BUY" | "SELL" | "DEPOSIT" | "INTEREST" | "UPDATE",
) {
	let cashFlowDelta = 0;

	// Reverse delta direction compared to backfill
	if (transactionType === "DEPOSIT")
		cashFlowDelta = -Math.abs(transactionValuePLN);
	if (transactionType === "SELL") cashFlowDelta = Math.abs(transactionValuePLN);

	if (cashFlowDelta === 0) return { success: true, skipped: true };

	const startOfTransactionDay = new Date(
		new Date(transactionDate).setUTCHours(0, 0, 0, 0),
	);

	const result = await db.portfolioSnapshot.updateMany({
		where: {
			portfolioId,
			date: {
				gte: startOfTransactionDay,
			},
		},
		data: {
			investedValue: { increment: cashFlowDelta },
			totalValue: { increment: cashFlowDelta },
		},
	});

	if (result.count > 0) {
		revalidateTag("snapshots", "max");
	}

	return { success: true, fixedCount: result.count };
}

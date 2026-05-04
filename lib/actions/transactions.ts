"use server"; // EN: Ensures all functions in this file run only on the server
// PL: Gwarantuje, że wszystkie funkcje w tym pliku będą uruchamiane tylko na serwerze

import { ParsedXtbTransaction } from "../utils/xtb-parser";
import { db } from "../db";

export async function saveXtbTransaction(
	data: ParsedXtbTransaction,
	portfolioId: string,
) {
	return await db.transactionHistory.upsert({
		where: { externalId: data.uniqueKey },
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

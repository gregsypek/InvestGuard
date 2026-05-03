import { Category, TransactionType } from "@prisma/client";

import { db } from "../db";

// EN: Raw structure of a row from XTB Excel export
// PL: Surowa struktura wiersza z eksportu Excel XTB
interface XtbExcelRow {
	ID: string | number;
	Time: string;
	Type: string;
	Symbol: string;
	Comment: string;
	Amount: number;
}

export interface ParsedXtbTransaction {
	type: TransactionType;
	date: Date;
	amountPLN: number;
	assetName: string;
	ticker?: string | null;
	quantity: number;
	originalPrice?: number | null;
	currency?: string | null;
	exchangeRate: number;
	category: Category;
	uniqueKey: string;
	comment: string;
}

// EN: Main parsing engine (Now with XtbExcelRow instead of any)
// PL: Główny silnik parsujący (Teraz z XtbExcelRow zamiast any)
export function parseXtbRow(row: XtbExcelRow): ParsedXtbTransaction | null {
	const uniqueKey = `${row.Time}-${row.Amount}-${row.Comment}`;

	if (
		row.Type.includes("Stock") ||
		row.Comment.includes("buy") ||
		row.Comment.includes("sell")
	) {
		const regex = /([A-Z0-9\.]+)\s+([0-9\.]+)\s+@\s+([0-9\.]+)/i;
		const match = row.Comment.match(regex);

		if (match) {
			const [_, ticker, qtyStr, priceStr] = match;
			const quantity = parseFloat(qtyStr);
			const originalPrice = parseFloat(priceStr);
			const amountPLN = Math.abs(row.Amount);

			let currency = "PLN";
			if (ticker.endsWith(".DE") || ticker.endsWith(".NL")) currency = "EUR";
			if (ticker.endsWith(".US")) currency = "USD";

			const exchangeRate =
				currency === "PLN" ? 1.0 : amountPLN / (quantity * originalPrice);

			return {
				type: row.Amount > 0 ? TransactionType.SELL : TransactionType.BUY,
				date: new Date(row.Time),
				amountPLN: amountPLN,
				assetName: row.Symbol || ticker,
				ticker,
				quantity,
				originalPrice,
				currency,
				exchangeRate,
				category: Category.UNKNOWN, // EN: Category from Prisma Enum
				uniqueKey,
				comment: row.Comment,
			};
		}
	}

	if (row.Type === "Deposit" || row.Type === "Interest") {
		return {
			type:
				row.Type === "Deposit"
					? TransactionType.DEPOSIT
					: TransactionType.INTEREST,
			date: new Date(row.Time),
			amountPLN: Math.abs(row.Amount),
			assetName:
				row.Type === "Deposit" ? "Wpłata środków" : "Odsetki od gotówki",
			ticker: "CASH",
			quantity: 1,
			originalPrice: Math.abs(row.Amount),
			currency: "PLN",
			exchangeRate: 1.0,
			category: Category.CASH,
			uniqueKey,
			comment: row.Comment,
		};
	}

	return null;
}

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
			portfolioId: portfolioId,
			comment: data.comment,
		},
	});
}

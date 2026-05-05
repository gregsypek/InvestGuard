// lib/utils/xtb-parser.ts

import { Category, TransactionType } from "@prisma/client";

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
	positionId?: string;
}

const TICKER_TO_CATEGORY: Record<string, Category> = {
	"EUNL.DE": Category.DEVELOPED,
	"EIMI.UK": Category.EMERGING,
	"IGLN.UK": Category.GOLD,
};

export function parseXtbRow(row: any): ParsedXtbTransaction | null {
	// 1. Zabezpieczenie przed różnymi nazwami kolumn w XTB
	const type = String(row.Type || row.Typ || "").toLowerCase();
	const comment = String(row.Comment || "").toUpperCase();
	const amount = Number(row.Amount || 0);
	const time = row.Time || row.Czas || "";

	// Pobieramy Ticker (XTB używa "Ticker" lub "Symbol")
	const ticker = String(row.Ticker || row.Symbol || "")
		.toUpperCase()
		.trim();

	// Pobieramy Nazwę (XTB używa "Instrument")
	const instrument = String(
		row.Instrument || ticker || "Nieznane Aktywo",
	).trim();

	if (!type) return null;

	const positionIdMatch = comment.match(/#(\d+)/);
	const positionId = positionIdMatch ? positionIdMatch[1] : undefined;

	// 2. WPŁATY / DEPOZYTY
	if (
		type.includes("deposit") ||
		type.includes("wpłata") ||
		type.includes("transfer")
	) {
		return {
			type: TransactionType.DEPOSIT,
			date: new Date(time),
			amountPLN: Math.abs(amount),
			assetName: "Wpłata gotówkowa",
			ticker: "CASH",
			quantity: Math.abs(amount),
			originalPrice: 1.0,
			currency: "PLN",
			exchangeRate: 1.0,
			category: Category.CASH,
			uniqueKey: `${time}--${amount}`,
			comment: row.Comment || "",
			positionId: undefined,
		};
	}

	// 3. TRANSAKCJE GIEŁDOWE I ZYSKI/STRATY
	const isStockAction =
		type.includes("stock") ||
		type.includes("akcj") ||
		type.includes("buy") ||
		type.includes("sell");
	const isProfit = comment.includes("PROFIT") || comment.includes("ZYSK");

	if (isStockAction || isProfit) {
		let txType: TransactionType;

		// Niezawodna logika rozpoznawania kierunku transakcji
		if (isProfit) {
			txType = TransactionType.SELL;
		} else if (type.includes("buy") || type.includes("kupno")) {
			txType = TransactionType.BUY;
		} else if (type.includes("sell") || type.includes("sprzedaż")) {
			txType = TransactionType.SELL;
		} else {
			// Zapasowe sprawdzenie po kwocie (minus to koszt zakupu, plus to zysk ze sprzedaży)
			txType = amount < 0 ? TransactionType.BUY : TransactionType.SELL;
		}

		// Zapasowe szukanie tickera w komentarzu (Tylko jeśli kolumny były puste)
		let finalTicker = ticker;
		if (!finalTicker && comment) {
			// Szukamy wzorca np. AAPL.US lub IGLN.UK
			const regex = /([A-Z0-9]+\.[A-Z]+)/;
			const match = comment.match(regex);
			if (match) finalTicker = match[1];
			else finalTicker = "UNKNOWN";
		}

		const finalName = instrument !== "UNKNOWN" ? instrument : finalTicker;

		return {
			type: txType,
			date: new Date(time),
			amountPLN: Math.abs(amount),
			assetName: finalName,
			ticker: finalTicker,
			quantity: isProfit ? 0 : 1,
			originalPrice: Math.abs(amount),
			currency: "PLN",
			exchangeRate: 1.0,
			category: TICKER_TO_CATEGORY[finalTicker] || Category.UNKNOWN,
			uniqueKey: `${time}--${amount}`,
			comment: row.Comment || "",
			positionId: positionId,
		};
	}

	return null;
}

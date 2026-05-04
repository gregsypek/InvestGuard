// EN: Raw structure of a row from XTB Excel export

import { Category, TransactionType } from "@prisma/client";

import { XtbExcelRow } from "../types";

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
	positionId?: string; // Dodajemy to pole
}

// EN: Simple map to automatically categorize known tickers
// PL: Prosta mapa do automatycznej kategoryzacji znanych tickerów
const TICKER_TO_CATEGORY: Record<string, Category> = {
	"EUNL.DE": Category.DEVELOPED, // Developed Markets
	"EIMI.UK": Category.EMERGING, // Emerging Markets
	"IGLN.UK": Category.GOLD, // Gold
};

// EN: Main parsing engine (Now with XtbExcelRow instead of any)
// PL: Główny silnik parsujący (Teraz z XtbExcelRow zamiast any)
// EN: Enhanced parser for Cash and Tickers
// PL: Wzmocniony parser dla gotówki i tickerów
// lib/utils/xtb-parser.ts
// lib/utils/xtb-parser.ts

export function parseXtbRow(row: XtbExcelRow): ParsedXtbTransaction | null {
	const normalizedRow = {
		Type: String(row.Type || "").toLowerCase(),
		Comment: String(row.Comment || ""),
		Amount: Number(row.Amount || 0),
		Time: row.Time || "",
		Symbol: row.Symbol || "",
	};

	if (!normalizedRow.Type) return null;

	const comment = String(row.Comment || "").toLowerCase();
	const type = String(row.Type || "").toLowerCase();
	const amount = Number(row.Amount || 0);
	// EN: Extract Position ID (e.g., #123456789)
	// PL: Wyciągamy ID pozycji (np. #123456789)
	const positionIdMatch = normalizedRow.Comment.match(/#(\d+)/);
	const positionId = positionIdMatch ? positionIdMatch[1] : undefined;

	// EN: If it's a deposit, it MUST be TransactionType.DEPOSIT and positive amount
	// PL: Jeśli to wpłata, MUSI być TransactionType.DEPOSIT i dodatnia kwota
	if (type.includes("deposit") || type.includes("wpłata")) {
		return {
			type: TransactionType.DEPOSIT, // PL: Zmieniamy na DEPOSIT
			date: new Date(row.Time),
			amountPLN: Math.abs(amount), // PL: Zawsze dodatnie, bo to wpływ
			assetName: "Wpłata IKE",
			ticker: "CASH",
			quantity: Math.abs(amount), // PL: 1000 PLN = 1000 jednostek gotówki
			originalPrice: 1.0,
			currency: "PLN",
			exchangeRate: 1.0,
			category: Category.CASH,
			uniqueKey: `${row.Time}--${amount}`,
			comment: row.Comment,
			positionId: undefined,
		};
	}

	// 2. ZYSK ZE SPRZEDAŻY AKCJI (Np. te +17,42 PLN)
	if (
		comment.includes("profit of position") ||
		comment.includes("zysk z pozycji")
	) {
		const tickerRegex = /(?:position)\s+([A-Z0-9\._]+)/i;
		const match = row.Comment.match(tickerRegex);
		const ticker = row.Symbol || (match ? match[1] : "Unknown");

		return {
			type: TransactionType.SELL, // PL: To jest CZĘŚĆ sprzedaży akcji
			date: new Date(row.Time),
			amountPLN: Math.abs(amount),
			assetName: ticker,
			ticker: ticker,
			quantity: 0, // PL: Ilość 0, bo to tylko dopisanie zysku do istniejącej sprzedaży
			originalPrice: 0,
			currency: "PLN",
			exchangeRate: 1.0,
			category: Category.UNKNOWN,
			uniqueKey: `${row.Time}--${amount}`,
			comment: row.Comment,
			positionId: positionId, // PL: Dzięki temu XtbImporter złączy to ze sprzedażą
		};
	}
	// 2. EN: STOCK OPERATIONS & PROFITS
	// 2. PL: OPERACJE GIEŁDOWE I ZYSKI (np. ten +17,42 PLN)
	const isStockAction = type.includes("stock") || type.includes("akcj");
	const isProfit = comment.includes("profit") || comment.includes("zysk");

	if (isStockAction || isProfit) {
		// EN: Priority for Ticker: 1. Symbol column, 2. Regex from comment
		// PL: Priorytet dla Tickera: 1. Kolumna Symbol, 2. Regex z komentarza
		const tickerRegex = /(?:buy|sell|close|position)\s+([A-Z0-9\._]+)/i;
		const match = normalizedRow.Comment.match(tickerRegex);
		const ticker = normalizedRow.Symbol || (match ? match[1] : "Unknown");

		// EN: Logic for determining Transaction Type
		// PL: Logika określająca typ transakcji (KUPNO/SPRZEDAŻ)
		let txType: TransactionType;
		if (isProfit) {
			// EN: Profit is always part of a SALE in your case
			// PL: Zysk w Twoim przypadku jest zawsze częścią SPRZEDAŻY
			txType = TransactionType.SELL;
		} else {
			txType =
				normalizedRow.Amount < 0 ? TransactionType.BUY : TransactionType.SELL;
		}

		return {
			type: txType,
			date: new Date(normalizedRow.Time),
			amountPLN: Math.abs(normalizedRow.Amount),
			assetName: ticker,
			ticker: ticker,
			// EN: If it's a pure profit line, set quantity 0 to not mess up the average price
			// PL: Jeśli to linia zysku, ilość = 0, aby nie psuć średniej ceny zakupu
			quantity: isProfit ? 0 : 1,
			originalPrice: Math.abs(normalizedRow.Amount),
			currency: "PLN",
			exchangeRate: 1.0,
			category: TICKER_TO_CATEGORY[ticker] || Category.UNKNOWN,
			uniqueKey: `${normalizedRow.Time}--${normalizedRow.Amount}`,
			comment: normalizedRow.Comment,
			positionId: positionId,
		};
	}

	return null;
}

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

// EN: Enhanced Regex to capture fractional units like 0.9526/2.9526
// PL: Wzmocniony Regex do wyłapywania ułamkowych jednostek
const qtyRegex = /(?:BUY|SELL|OPEN|CLOSE)\s+([0-9./]+)\s*@/i;

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
			// const regex = /([A-Z0-9]+\.[A-Z]+)/;
			const match = comment.match(qtyRegex);
			if (match) finalTicker = match[1];
			else finalTicker = "UNKNOWN";
		}

		const finalName = instrument !== "UNKNOWN" ? instrument : finalTicker;
		const rawVolume = Number(row.Volume || row.Wolumen || 0);
		let finalQuantity = isProfit
			? 0
			: rawVolume !== 0
				? Math.abs(rawVolume)
				: 1;
		const match = comment.match(qtyRegex);

		// 🚀 NOWA LOGIKA: Jeśli Volume = 1 (domyślne), sprawdź czy w komentarzu nie ma innej ilości
		if (!isProfit && finalQuantity === 1 && comment) {
			// Szukamy wzorca "BUY 2 @" lub "BUY 2.5 @"
			const qtyMatch = comment.match(/(?:BUY|SELL)\s+(\d+(?:\.\d+)?)\s*@/i);
			if (qtyMatch) {
				finalQuantity = Number(qtyMatch[1]);
			}
		}
		// let finalQuantity = isProfit ? 0 : 1;

		if (!isProfit && match) {
			// EN: If format is "0.9526/2.9526", take the first part
			// PL: Jeśli format to "0.9526/2.9526", bierzemy pierwszą część przed slashem
			const rawValue = match[1].split("/")[0];
			finalQuantity = Number(rawValue.replace(",", ".")); // Support for different decimal separators
		} else {
			// EN: Fallback to volume column if regex fails
			const rawVolume = Number(row.Volume || row.Wolumen || 0);
			if (rawVolume !== 0) finalQuantity = Math.abs(rawVolume);
		}
		return {
			type: txType,
			date: new Date(time),
			amountPLN: Math.abs(amount),
			assetName: finalName,
			ticker: finalTicker,
			quantity: finalQuantity, // Teraz to będzie "2" zamiast "1"
			originalPrice: Math.abs(amount) / (finalQuantity || 1), // Realna cena za sztukę
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

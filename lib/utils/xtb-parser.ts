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

	// 🚀 NOWOŚĆ: 3. DYWIDENDY I PODATKI
	if (
		type.includes("dividend") ||
		type.includes("dywidenda") ||
		type.includes("withholding tax") ||
		type.includes("podatek")
	) {
		return {
			type: TransactionType.INTEREST,
			date: new Date(time),
			// WAŻNE: Zostawiamy oryginalny znak! Dywidenda będzie na plus, podatek na minus.
			amountPLN: amount,
			assetName:
				instrument !== "UNKNOWN" ? instrument : ticker || "Nieznana Spółka",
			ticker: ticker || "CASH",
			quantity: 0, // Dywidendy nie są akcjami, wpisujemy 0 sztuk
			originalPrice: 0,
			currency: "PLN",
			exchangeRate: 1.0,
			// Przypisujemy odpowiednią kategorię, żeby ładnie wyglądało w tabeli
			category: TICKER_TO_CATEGORY[ticker] || Category.CASH,
			uniqueKey: `${time}--${amount}--INTEREST`,
			comment: row.Comment || "",
			positionId: positionId,
		};
	}

	// 4. TRANSAKCJE GIEŁDOWE I ZYSKI/STRATY
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
			const match = comment.match(/(?:BUY|SELL|OPEN|CLOSE)\s+([0-9./]+)\s*@/i);
			if (match)
				finalTicker = match[1]; // Tu poprawiłem zmienną żeby nie nadpisywała regexu z wolumenu
			else finalTicker = "UNKNOWN";
		}

		const finalName = instrument !== "UNKNOWN" ? instrument : finalTicker;
		const rawVolume = Number(row.Volume || row.Wolumen || 0);
		let finalQuantity = isProfit
			? 0
			: rawVolume !== 0
				? Math.abs(rawVolume)
				: 1;

		// Szukamy ułamkowych ilości, np. 0.9526
		const matchQty = comment.match(/(?:BUY|SELL|OPEN|CLOSE)\s+([0-9./]+)\s*@/i);

		// Jeśli Volume = 1 (domyślne), sprawdź czy w komentarzu nie ma innej ilości
		if (!isProfit && finalQuantity === 1 && comment) {
			const qtyMatch = comment.match(/(?:BUY|SELL)\s+(\d+(?:\.\d+)?)\s*@/i);
			if (qtyMatch) {
				finalQuantity = Number(qtyMatch[1]);
			}
		}

		if (!isProfit && matchQty) {
			const rawValue = matchQty[1].split("/")[0];
			finalQuantity = Number(rawValue.replace(",", "."));
		} else {
			if (rawVolume !== 0) finalQuantity = Math.abs(rawVolume);
		}

		// 🚀 NOWOŚĆ: Automatyczne rozpoznawanie waluty i wyliczanie kursu historycznego
		let originalCurrency = "PLN";
		if (finalTicker.endsWith(".US")) originalCurrency = "USD";
		else if (finalTicker.endsWith(".UK")) originalCurrency = "GBP";
		else if (/[.](DE|FR|NL|ES|IT|EU)$/.test(finalTicker))
			originalCurrency = "EUR";

		let fxOriginalPrice = Math.abs(amount) / (finalQuantity || 1); // Domyślnie cena w PLN
		let computedExchangeRate = 1.0;

		// Szukamy ceny w walucie obcej po znaku @ (np. z "OPEN BUY 1/1.1361 @ 114.07")
		const priceMatch = comment.match(/@\s*([0-9.]+)/);
		if (priceMatch && originalCurrency !== "PLN") {
			fxOriginalPrice = Number(priceMatch[1]);
			// Kurs historyczny = Kwota w PLN / (Ilość sztuk * Cena w oryginalnej walucie)
			computedExchangeRate =
				Math.abs(amount) / ((finalQuantity || 1) * fxOriginalPrice);
		}

		return {
			type: txType,
			date: new Date(time),
			amountPLN: Math.abs(amount),
			assetName: finalName,
			ticker: finalTicker,
			quantity: finalQuantity,
			originalPrice: fxOriginalPrice, // 🚀 ZAPISZEMY: Cenę w walucie oryginalnej (np. 114.07)
			currency: originalCurrency, // 🚀 ZAPISZEMY: Prawdziwą walutę (np. USD)
			exchangeRate: computedExchangeRate, // 🚀 ZAPISZEMY: Wyliczony kurs historyczny (np. 3.6769)
			category: TICKER_TO_CATEGORY[finalTicker] || Category.UNKNOWN,
			uniqueKey: `${time}--${amount}`,
			comment: row.Comment || "",
			positionId: positionId,
		};
	}

	return null;
}

// EN: Interface for the grouped XTB transaction
// PL: Interfejs dla zgrupowanej transakcji z XTB
interface XtbTransaction {
	externalId: string;
	symbol: string;
	type: "BUY" | "SELL" | "DEPOSIT";
	amount: number;
	date: Date;
	comment: string;
}

/**
 * EN: Parses and aggregates data from XTB Cash Operation History
 * PL: Parsuje i agreguje dane z historii operacji gotówkowych XTB
 */
export function parseXtbData(rawData: any[]): XtbTransaction[] {
	const transactions: XtbTransaction[] = [];

	// EN: Temporary map to store sales and pair them with profits
	// PL: Mapa do przechowywania sprzedaży i parowania ich z zyskami
	const salesMap = new Map<string, any>();

	rawData.forEach((row) => {
		const { ID, Type, Time, Symbol, Amount, Comment } = row;

		if (Type === "IKE Deposit") {
			transactions.push({
				externalId: String(ID),
				symbol: "CASH",
				type: "DEPOSIT",
				amount: Math.abs(Amount),
				date: new Date(Time),
				comment: Comment,
			});
		}

		if (Type === "Stock purchase") {
			transactions.push({
				externalId: String(ID),
				symbol: Symbol,
				type: "BUY",
				amount: Math.abs(Amount),
				date: new Date(Time),
				comment: Comment,
			});
		}

		// EN: Handling the split sale logic (Stock sale + close trade)
		// PL: Obsługa rozbitej sprzedaży (Stock sale + zysk z zamknięcia)
		if (Type === "Stock sale" || Type === "close trade") {
			const key = `${Time}_${Symbol}`;
			if (salesMap.has(key)) {
				const existing = salesMap.get(key);
				transactions.push({
					externalId: String(ID), // Używamy ID głównego wpisu
					symbol: Symbol,
					type: "SELL",
					amount: Math.abs(existing.Amount) + Math.abs(Amount),
					date: new Date(Time),
					comment: `Combined XTB Sale: ${existing.Type} & ${Type}`,
				});
				salesMap.delete(key);
			} else {
				salesMap.set(key, row);
			}
		}
	});

	return transactions;
}

// lib/utils/bond-parser.ts

export interface ParsedBond {
	ticker: string; // EMISJA
	assetName: string;
	quantity: number;
	investedValue: number; // WARTOŚĆ NOMINALNA (Cena zakupu)
	currentValue: number; // WARTOŚĆ AKTUALNA (Z odsetkami)
	expiryDate: Date;
}

export function parseBondRow(row: any): ParsedBond | null {
	const ticker = row["EMISJA"];
	if (!ticker) return null;

	// Helper to clean PKO BP strings like "1 035,00" to "1035.00"
	const cleanNum = (val: any) =>
		parseFloat(val?.toString().replace(/\s/g, "").replace(",", ".")) || 0;

	const qtyAvailable = parseFloat(row["DOSTĘPNA LICZBA OBLIGACJI"]) || 0;
	const qtyBlocked = parseFloat(row["ZABLOKOWANA LICZBA OBLIGACJI"]) || 0;

	return {
		ticker: ticker.toString(),
		assetName: `Obligacje ${ticker}`,
		quantity: qtyAvailable + qtyBlocked,
		investedValue: cleanNum(row["WARTOŚĆ NOMINALNA"]), // 🚀 Wartość Nominalna
		currentValue: cleanNum(row["WARTOŚĆ AKTUALNA"]), // 🚀 Wartość Aktualna
		expiryDate: new Date(row["DATA WYKUPU"]),
	};
}

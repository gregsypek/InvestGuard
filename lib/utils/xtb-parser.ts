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

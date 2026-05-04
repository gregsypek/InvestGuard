// test-parser.ts

import { parseXtbRow } from "./utils/xtb-parser";

// EN: Mock data representing typical rows from XTB Excel
// PL: Przykładowe dane reprezentujące typowe wiersze z Excela XTB
const mockRows = [
	{
		ID: 1,
		Time: "2026-03-10 14:30:00",
		Type: "Stock Buy",
		Symbol: "EUNL.DE",
		Comment: "buy EUNL.DE 5 @ 92.50",
		Amount: -462.5, // Negative because it's a purchase
	},
	{
		ID: 2,
		Time: "2026-03-12 10:00:00",
		Type: "Deposit",
		Symbol: "",
		Comment: "Wpłata własna",
		Amount: 2000.0,
	},
	{
		ID: 3,
		Time: "2026-03-31 23:59:59",
		Type: "Interest",
		Symbol: "",
		Comment: "Free funds interest",
		Amount: 12.45,
	},
];

// EN: Run the dry test
// PL: Uruchomienie testu na sucho
console.log("=== XTB PARSER DRY RUN ===");
mockRows.forEach((row, index) => {
	const result = parseXtbRow(row);
	if (result) {
		console.log(`\n[Row ${index + 1}] Success:`);
		console.log(`- Type: ${result.type}`);
		console.log(`- Asset: ${result.assetName} (${result.ticker})`);
		console.log(`- Value in PLN: ${result.amountPLN}`);
		if (result.originalPrice) {
			console.log(
				`- Original Price: ${result.originalPrice} ${result.currency}`,
			);
			console.log(
				`- Calculated Exchange Rate: ${result.exchangeRate.toFixed(4)}`,
			);
		}
	} else {
		console.log(`\n[Row ${index + 1}] Failed to parse row: ${row.Comment}`);
	}
});

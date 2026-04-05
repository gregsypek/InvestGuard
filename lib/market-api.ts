// lib/market-api.ts
export function formatYahooTicker(xtbTicker: string): string {
	if (!xtbTicker) return "";
	let t = xtbTicker.toUpperCase().trim();

	// Tłumacz XTB -> Yahoo Finance
	const mapping: Record<string, string> = {
		".PL": ".WA", // Warszawa
		".UK": ".L", // Londyn (np. ALAG.UK -> ALAG.L)
		".US": "", // USA zazwyczaj nie ma przyrostka (np. AAPL.US -> AAPL)
		".DE": ".DE", // Frankfurt zostaje
		".FR": ".PA", // Paryż
	};

	for (const [xtbExt, yahooExt] of Object.entries(mapping)) {
		if (t.endsWith(xtbExt)) {
			t = t.slice(0, -xtbExt.length) + yahooExt; // bezpieczniejsze niż replace
			break; // <- ważne! zatrzymaj po pierwszym dopasowaniu - nie ma sensu sprawdzać dalej  i ryzykowac błednych kolejnych dopasowań
		}
	}

	if (t === "S&P500") return "^GSPC";

	return t;
}

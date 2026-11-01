// Helper function to handle robust multi-currency formatting and automatic conversion
export const formatCurrency = (
	val: string | number | null | undefined,
	decimals: number = 2,
	currency: string = "PLN", // Waluta docelowa (wybrana przez użytkownika w UI)
	sourceCurrency: string = "PLN", // Waluta źródłowa danych (np. "USD" dla BTC/Złota, "PLN" dla portfela)
	exchangeRates: Record<string, number> = {}, // Słownik kursów, np. { USDPLN: 4.0, EURPLN: 4.3 }
) => {
	if (val === null || val === undefined) return "0,00";

	let normalized = val.toString().replace(/\s/g, "");

	if (normalized.includes(",") && normalized.includes(".")) {
		normalized = normalized.replace(/,/g, "");
	} else if (normalized.includes(",") && !normalized.includes(".")) {
		if (normalized.split(",")[1]?.length === 3) {
			normalized = normalized.replace(/,/g, "");
		} else {
			normalized = normalized.replace(/,/g, ".");
		}
	}

	let num = parseFloat(normalized);
	if (isNaN(num)) return val.toString();

	// --- 🚀 INTELIGENTNA KONWERSJA WALUT ZABIEGAJĄCA PODWÓJNEMU PRZELICZANIU ---
	const src = sourceCurrency.toUpperCase();
	const tgt = currency.toUpperCase();

	if (src !== tgt) {
		// Szukamy kursu w bazie (np. USDPLN lub EURPLN)
		const rateKeyUSDPLN = "USDPLN";
		const rateKeyEURPLN = "EURPLN";

		let rateToPLN = 1;
		if (src === "USD") rateToPLN = exchangeRates[rateKeyUSDPLN] || 4.0; // Fallback 4.0 jeśli brak w bazie
		if (src === "EUR") rateToPLN = exchangeRates[rateKeyEURPLN] || 4.3;

		// 1. Najpierw przeliczamy źródło do PLN
		let valueInPLN = num;
		if (src === "USD" || src === "EUR") {
			valueInPLN = num * rateToPLN;
		}

		// 2. Następnie z PLN przeliczamy na walutę docelową (tgt)
		if (tgt === "PLN") {
			num = valueInPLN;
		} else if (tgt === "USD") {
			const targetRate = exchangeRates[rateKeyUSDPLN] || 4.0;
			num = valueInPLN / targetRate;
		} else if (tgt === "EUR") {
			const targetRate = exchangeRates[rateKeyEURPLN] || 4.3;
			num = valueInPLN / targetRate;
		}
	}
	// --------------------------------------------------------------------------

	const localeMap: Record<string, string> = {
		PLN: "pl-PL",
		USD: "en-US",
		EUR: "de-DE",
		GBP: "en-GB",
	};

	const locale = localeMap[tgt] || "pl-PL";

	return num.toLocaleString(locale, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
};

// EN: Helper to get symbol for dynamic UI labels ($ / € / zł)
export const getCurrencySymbol = (currency: string = "PLN"): string => {
	switch (currency.toUpperCase()) {
		case "USD":
			return "$";
		case "EUR":
			return "€";
		case "GBP":
			return "£";
		case "PLN":
		default:
			return "PLN";
	}
};

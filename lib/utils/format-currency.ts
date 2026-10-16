// Helper function to handle robust multi-currency formatting
export const formatCurrency = (
	val: string | number | null | undefined,
	decimals: number = 2,
	currency: string = "PLN",
) => {
	if (val === null || val === undefined) return "0,00";

	let normalized = val.toString().replace(/\s/g, "");

	// If the server sent "16,322.50" (US format)
	if (normalized.includes(",") && normalized.includes(".")) {
		normalized = normalized.replace(/,/g, "");
		// If the server sent "16,322" (no decimals) or "16,32" (Polish decimal)
	} else if (normalized.includes(",") && !normalized.includes(".")) {
		if (normalized.split(",")[1]?.length === 3) {
			normalized = normalized.replace(/,/g, "");
		} else {
			normalized = normalized.replace(/,/g, ".");
		}
	}

	const num = parseFloat(normalized);
	if (isNaN(num)) return val.toString();

	// EN: Map currency code to appropriate locale for proper thousand/decimal separators
	const localeMap: Record<string, string> = {
		PLN: "pl-PL",
		USD: "en-US",
		EUR: "de-DE",
		GBP: "en-GB",
	};

	const locale = localeMap[currency.toUpperCase()] || "pl-PL";

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

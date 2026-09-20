// Inteligentny parser, który naprawia błędy amerykańskiego formatowania z serwera

export const formatCurrency = (
	val: string | number | null | undefined,
	decimals: number = 2,
) => {
	if (val === null || val === undefined) return "0,00";

	let normalized = val.toString().replace(/\s/g, "");
	// Jeśli serwer przysłał "16,322.50" (format US)
	if (normalized.includes(",") && normalized.includes(".")) {
		normalized = normalized.replace(/,/g, "");
		// Jeśli serwer przysłał "16,322" (bez groszy) lub "16,32" (polski ułamek)
	} else if (normalized.includes(",") && !normalized.includes(".")) {
		if (normalized.split(",")[1].length === 3) {
			normalized = normalized.replace(/,/g, "");
		} else {
			normalized = normalized.replace(/,/g, ".");
		}
	}

	const num = parseFloat(normalized);
	if (isNaN(num)) return val.toString();

	return num.toLocaleString("pl-PL", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
};

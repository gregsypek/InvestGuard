// Helper function to handle robust currency formatting
export const formatCurrency = (
	val: string | number | null | undefined,
	decimals: number = 2,
) => {
	if (val === null || val === undefined) return "0,00";

	let normalized = val.toString().replace(/\s/g, "");

	// If the server sent "16,322.50" (US format)
	if (normalized.includes(",") && normalized.includes(".")) {
		normalized = normalized.replace(/,/g, "");
		// If the server sent "16,322" (no decimals) or "16,32" (Polish decimal)
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

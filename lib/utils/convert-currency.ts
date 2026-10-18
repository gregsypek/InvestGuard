// EN: Helper map holding fallbacks in case exchange rates are not yet fetched in DB
const DEFAULT_RATES: Record<string, number> = {
	PLN: 1.0,
	USD: 4.0,
	EUR: 4.3,
	GBP: 5.0,
};

export interface ExchangeRateMap {
	[code: string]: number; // e.g. { USD: 4.02, EUR: 4.31, GBP: 4.98 }
}

/**
 * EN: Converts an amount in PLN to the user's main currency based on exchange rates.
 * @param amountInPLN Amount in PLN to be converted
 * @param targetCurrency Currency code selected in user preferences (e.g. "USD", "EUR")
 * @param rates Map of current PLN exchange rates (e.g. { USD: 4.02 })
 */
export const convertFromPLN = (
	amountInPLN: number | null | undefined,
	targetCurrency: string = "PLN",
	rates: ExchangeRateMap = DEFAULT_RATES,
): number => {
	if (!amountInPLN || isNaN(amountInPLN)) return 0;

	const upperTarget = targetCurrency.toUpperCase();
	if (upperTarget === "PLN") return amountInPLN;

	// EN: Get the exchange rate (PLN per 1 unit of foreign currency, e.g. USDPLN = 4.00)
	const rate = rates[upperTarget] || DEFAULT_RATES[upperTarget] || 1.0;

	if (rate <= 0) return amountInPLN;

	// EN: Value in target currency = Amount in PLN / Exchange Rate
	return amountInPLN / rate;
};

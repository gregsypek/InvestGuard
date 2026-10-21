export interface PricingPlan {
	id: string;
	name: string;
	badge?: string;
	description: string;
	pricePLN: { monthly: number; yearly: number };
	isPopular?: boolean;
	features: string[];
	highlightedFeatures?: string[];
	buttonText: string;
	buttonVariant: "default" | "outline";
}

export const PRICING_PLANS: PricingPlan[] = [
	{
		id: "free",
		name: "Starter",
		description:
			"Dla początkujących inwestorów budujących swój pierwszy portfel.",
		pricePLN: { monthly: 0, yearly: 0 },
		features: [
			"1 Portfel inwestycyjny",
			"Podstawowy Radar Rynkowy (do 6 aktywów)",
			"Ręczne wprowadzanie transakcji",
			"Dzienny limit odświeżania wycen (1x / 24h)",
			"Podstawowe wykresy PnL",
		],
		buttonText: "Rozpocznij Za Darmo",
		buttonVariant: "outline",
	},
	{
		id: "pro",
		name: "Inwestor Pro",
		badge: "Najpopularniejszy",
		isPopular: true,
		description: "Pełna automatyzacja i kontrola nad wieloma portfelami.",
		pricePLN: { monthly: 19, yearly: 190 }, // 290 zł / rok = ~24 zł/mc (2 miesiące gratis)
		features: [
			"Nielimitowana liczba portfeli",
			"Automatyczny Importer Raportów XTB & PKO BP",
			"Pełen silnik obligacji skarbowych (EDO, ROD, TOS + inflacja GUS)",
			"Automatyczne odświeżanie wycen (co godzina)",
			"Wielowalutowość (PLN, USD, EUR, GBP)",
			"Zaawansowana analityka i porównania z rynkiem",
		],
		buttonText: "Wybierz Plan Pro",
		buttonVariant: "default",
	},
	{
		id: "alpha",
		name: "Alpha Selection",
		badge: "Dla Wymagających",
		description: "Algorytmy wspomagające decyzje i realizację zysków.",
		pricePLN: { monthly: 29, yearly: 290 },
		features: [
			"Wszystkie funkcje planu Inwestor Pro",
			"Moduł Alpha Selection (rekomendacje wyjścia z pozycji)",
			"Inteligentny Kalkulator Rebalansowania Portfela",
			"Priorytetowe odświeżanie kursów na żywo",
			"Szybkie wsparcie techniczne 1-on-1",
		],
		buttonText: "Dołącz do Alpha",
		buttonVariant: "outline",
	},
];

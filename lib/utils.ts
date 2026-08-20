// lib/market-api.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BOND_TEMPLATES } from "./constants";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getStockLogo(ticker: string | null): string | null {
	if (!ticker) return null;

	const cleanTicker = ticker.split(".")[0].toUpperCase();

	const domainMap: Record<string, string> = {
		// --- GPW (Polska) ---
		DNP: "dino.pl",
		CBF: "cyberfolks.pl",
		ALE: "allegro.eu",
		PKO: "pkobp.pl",
		PKN: "orlen.pl",
		PZU: "pzu.pl",
		KGH: "kghm.com",
		LPP: "lpp.com",
		CDR: "cdprojekt.com",
		PEA: "pekao.com.pl",
		SPL: "santander.pl",
		CPS: "cyfrowypolsat.pl",
		TPE: "tauron.pl",
		JSW: "jsw.pl",
		OPL: "orange.pl",
		KRU: "kruk.eu",
		PGE: "gkpge.pl",
		ACP: "assecopol.pl",
		MBK: "mback.pl",
		ALR: "aliorbank.pl",
		ATT: "grupaazoty.com",
		BDX: "budimex.pl",
		CCC: "ccc.eu",
		ENA: "enea.pl",
		GPW: "gpw.pl",
		GTC: "gtc.com.pl",
		ING: "ingbank.pl",
		LVC: "livechat.com",
		MIL: "bankmillennium.pl",
		NET: "netia.pl",
		PKP: "pkpcargo.com",

		// --- USA (Technologia & Big Tech) ---
		AAPL: "apple.com",
		MSFT: "microsoft.com",
		GOOGL: "google.com",
		GOOG: "google.com",
		AMZN: "amazon.com",
		NVDA: "nvidia.com",
		META: "meta.com",
		TSLA: "tesla.com",
		AVGO: "broadcom.com",
		ADBE: "adobe.com",
		CRM: "salesforce.com",
		AMD: "amd.com",
		NFLX: "netflix.com",
		INTC: "intel.com",
		QCOM: "qualcomm.com",
		TXN: "ti.com",
		IBM: "ibm.com",
		ORCL: "oracle.com",
		NOW: "servicenow.com",
		AMAT: "appliedmaterials.com",

		// --- USA (Finanse & Inne) ---
		BRK: "berkshirehathaway.com",
		JPM: "jpmorganchase.com",
		V: "visa.com",
		MA: "mastercard.com",
		WMT: "walmart.com",
		JNJ: "jnj.com",
		PG: "pg.com",
		HD: "homedepot.com",
		BAC: "bankofamerica.com",
		KO: "cocacola.com",
		PEP: "pepsico.com",
		COST: "costco.com",
		DIS: "disney.com",
		MCD: "mcdonalds.com",
		NKE: "nike.com",
		PFE: "pfizer.com",

		// --- ETF (Emitenci) ---
		EUNL: "ishares.com",
		EIMI: "ishares.com",
		IGLN: "ishares.com",
		CSPX: "ishares.com",
		VUSA: "vanguard.com",
		VWRL: "vanguard.com",
		VHYL: "vanguard.com",
		IDUS: "ishares.com",
		DFND: "ishares.com",
		ALAG: "ishares.com",
		LYX: "amundietf.com",
		AMUN: "amundietf.com",

		// ---Makro ---
		SP500: "spglobal.com",
		NASDAQ: "nasdaq.com",
		WIG20: "gpw.pl",
		DAX: "deutsche-boerse.com",
		GOLD: "gold.org",
		BTC: "bitcoin.org",

		// --- Inne / OWL ---
		OWL: "blueowl.com",
	};

	const domain = domainMap[cleanTicker];

	if (domain) {
		// ZMIANA: Używamy Google Favicon API zamiast Clearbit
		// sz=128 zapewnia nam ikonę w dobrej jakości
		return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
	}

	// Jeśli nie ma w mapie i jest to czysty ticker z USA
	if (!ticker.includes(".")) {
		return `https://www.google.com/s2/favicons?domain=${cleanTicker.toLowerCase()}.com&sz=128`;
	}

	return null;
}

export const generateBondName = (ticker: string, dateStr: string) => {
	// Sprawdzamy czy to obligacja z naszych szablonów
	const template = BOND_TEMPLATES[ticker as keyof typeof BOND_TEMPLATES];
	if (!template) return ticker;

	const date = new Date(dateStr);
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();
	// Wyliczamy rok zapadalności (rok zakupu + czas trwania z szablonu)
	const maturityYearShort = String(year + template.duration).slice(-2);

	return `${ticker}${month}${maturityYearShort}`;
};

"use client";

import React, {
	createContext,
	useContext,
	useState,
	useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Cookies from "js-cookie";
import { DateRange } from "react-day-picker";
import { convertFromPLN } from "@/lib/utils/convert-currency";
import { format } from "date-fns";

// Define the shape of our global chart context
interface ChartContextType {
	chartMode: "VALUE" | "PERCENTAGE";
	setChartMode: (mode: "VALUE" | "PERCENTAGE") => void;
	dataMode: "REAL" | "SIMULATED";
	setDataMode: (mode: "REAL" | "SIMULATED") => void;
	selectedIds: string[];
	setSelectedIds: (ids: string[]) => void; // 🚀 FIX: Udostępniamy metodę bezpośrednio dla filtrów!
	togglePortfolio: (id: string) => void;
	activeRange: string;
	fromDate: Date | undefined;
	toDate: Date | undefined;
	handleRangeChange: (range: string) => void;
	handleDateRangeSelect: (range: DateRange | undefined) => void;
	isPending: boolean;
	currency: string;
	setCurrency: (currency: string) => void;
	convertPLN: (amount: number) => number;
	exchangeRates: Record<string, number>;
}

const ChartContext = createContext<ChartContextType | null>(null);

export function ChartProvider({
	children,
	initialCurrency = "PLN",
	exchangeRates = {},
}: {
	children: React.ReactNode;
	initialCurrency?: string;
	exchangeRates?: Record<string, number>;
}) {
	const searchParams = useSearchParams();
	// Zamiast tylko searchParams.get("portfolio"), sprawdzamy oba warianty:
	const portfolioParam =
		searchParams.get("portfolio") || searchParams.get("portfolioId");
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const pathname = usePathname();

	const [chartMode, setChartMode] = useState<"VALUE" | "PERCENTAGE">("VALUE");
	const [dataMode, setDataMode] = useState<"REAL" | "SIMULATED">("SIMULATED");
	const [currency, setCurrency] = useState(initialCurrency);

	// Pobieramy OBA parametry niezależnie
	const localPortfolioParam = searchParams.get("portfolio"); // Z filtra Activity
	const globalPortfolioParam = searchParams.get("portfolioId"); // Z Głównego Headera

	// 1. Inicjalizacja z zachowaniem hierarchii ważności
	const [selectedIds, setSelectedIds] = useState<string[]>(() => {
		if (localPortfolioParam) return [localPortfolioParam]; // Najwyższy priorytet ma to, co klikniesz lokalnie
		if (globalPortfolioParam) return [globalPortfolioParam]; // Potem to, co weszło z głównego headera
		const cookiePortfolioId = Cookies.get("selectedPortfolioId"); // Na końcu ciasteczko
		return cookiePortfolioId ? [cookiePortfolioId] : ["ALL"];
	});

	// 🚀 FIX: Derived State z hierarchią.
	// Pozwala wykresowi natychmiast zareagować na zmianę z OBU headerów,
	// bez konfliktów i bez pętli renderowania.
	const [prevLocalParam, setPrevLocalParam] = useState<string | null>(
		localPortfolioParam,
	);
	const [prevGlobalParam, setPrevGlobalParam] = useState<string | null>(
		globalPortfolioParam,
	);

	if (
		localPortfolioParam !== prevLocalParam ||
		globalPortfolioParam !== prevGlobalParam
	) {
		setPrevLocalParam(localPortfolioParam);
		setPrevGlobalParam(globalPortfolioParam);

		if (localPortfolioParam) {
			setSelectedIds([localPortfolioParam]);
		} else if (globalPortfolioParam) {
			setSelectedIds([globalPortfolioParam]);
		} else {
			const cookiePortfolioId = Cookies.get("selectedPortfolioId");
			setSelectedIds(cookiePortfolioId ? [cookiePortfolioId] : ["ALL"]);
		}
	}

	// 2. Multi-select dla pigułek na samym wykresie
	const togglePortfolio = (id: string) => {
		setSelectedIds((prev) => {
			if (id === "ALL") return ["ALL"];
			const newIds = prev.includes(id)
				? prev.filter((p) => p !== id)
				: [...prev.filter((p) => p !== "ALL"), id];
			return newIds.length === 0 ? ["ALL"] : newIds;
		});
	};

	const activeRange = searchParams.get("range") || "1M";
	const currentFrom = searchParams.get("from") || "";
	const currentTo = searchParams.get("to") || "";
	const fromDate = currentFrom ? new Date(currentFrom) : undefined;
	const toDate = currentTo ? new Date(currentTo) : undefined;

	const convertPLN = (amount: number) => {
		return convertFromPLN(amount, currency, exchangeRates);
	};

	const handleRangeChange = (range: string) => {
		startTransition(() => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("range", range);
			if (range !== "CUSTOM") {
				params.delete("from");
				params.delete("to");
			}
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		});
	};

	const handleDateRangeSelect = (range: DateRange | undefined) => {
		const params = new URLSearchParams(searchParams.toString());
		if (range?.from) {
			params.set("range", "CUSTOM");
			params.set("from", format(range.from, "yyyy-MM-dd"));
		} else {
			params.delete("from");
		}
		if (range?.to) {
			params.set("to", format(range.to, "yyyy-MM-dd"));
		} else {
			params.delete("to");
		}
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	return (
		<ChartContext.Provider
			value={{
				chartMode,
				setChartMode,
				dataMode,
				setDataMode,
				selectedIds,
				setSelectedIds, // 🚀 FIX: Udostępniamy!
				togglePortfolio,
				activeRange,
				fromDate,
				toDate,
				handleRangeChange,
				handleDateRangeSelect,
				isPending,
				currency,
				setCurrency,
				convertPLN,
				exchangeRates,
			}}
		>
			{children}
		</ChartContext.Provider>
	);
}

export const useChartContext = () => {
	const context = useContext(ChartContext);
	if (!context) {
		throw new Error("useChartContext must be used within a ChartProvider");
	}
	return context;
};

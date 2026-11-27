"use client";

import React, {
	createContext,
	useContext,
	useState,
	useTransition,
} from "react";
import { format, isValid } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Cookies from "js-cookie";
import { DateRange } from "react-day-picker";
import { convertFromPLN } from "@/lib/utils/convert-currency";

// Define the shape of our global chart context
interface ChartContextType {
	chartMode: "VALUE" | "PERCENTAGE";
	setChartMode: (mode: "VALUE" | "PERCENTAGE") => void;
	dataMode: "REAL" | "SIMULATED";
	setDataMode: (mode: "REAL" | "SIMULATED") => void;
	selectedIds: string[];
	setSelectedIds: (ids: string[]) => void;
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
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const pathname = usePathname();

	const [chartMode, setChartMode] = useState<"VALUE" | "PERCENTAGE">("VALUE");
	const [dataMode, setDataMode] = useState<"REAL" | "SIMULATED">("SIMULATED");
	const [currency, setCurrency] = useState(initialCurrency);

	const localPortfolioParam = searchParams.get("portfolio");
	const globalPortfolioParam = searchParams.get("portfolioId");

	// 1. Initialize selected portfolios with priority hierarchy
	const [selectedIds, setSelectedIds] = useState<string[]>(() => {
		if (localPortfolioParam) return [localPortfolioParam];
		if (globalPortfolioParam) return [globalPortfolioParam];
		const cookiePortfolioId = Cookies.get("selectedPortfolioId");
		return cookiePortfolioId ? [cookiePortfolioId] : ["ALL"];
	});

	// Derived state reacting immediately to changes in URL portfolio params
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

	// 2. Multi-select toggle for chart portfolio pills
	const togglePortfolio = (id: string) => {
		setSelectedIds((prev) => {
			if (id === "ALL") return ["ALL"];
			const newIds = prev.includes(id)
				? prev.filter((p) => p !== id)
				: [...prev.filter((p) => p !== "ALL"), id];
			return newIds.length === 0 ? ["ALL"] : newIds;
		});
	};

	// Safely parse date range query params while ignoring navigation source flags like "overview"
	const activeRange = searchParams.get("range") || "1M";
	const currentFrom = searchParams.get("from") || "";
	const currentTo = searchParams.get("to") || "";

	const parsedFrom =
		currentFrom && currentFrom !== "overview"
			? new Date(currentFrom)
			: undefined;
	const parsedTo = currentTo ? new Date(currentTo) : undefined;

	const fromDate = parsedFrom && isValid(parsedFrom) ? parsedFrom : undefined;
	const toDate = parsedTo && isValid(parsedTo) ? parsedTo : undefined;

	const convertPLN = (amount: number) => {
		return convertFromPLN(amount, currency, exchangeRates);
	};

	const handleRangeChange = (range: string) => {
		startTransition(() => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("range", range);
			if (range !== "CUSTOM") {
				// Preserve navigation origin parameter when resetting chart date bounds
				if (params.get("from") !== "overview") {
					params.delete("from");
				}
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
		} else if (params.get("from") !== "overview") {
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
				setSelectedIds,
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

"use client";

import React, { createContext, useContext, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DateRange } from "react-day-picker";
import { format } from "date-fns";

// Define the shape of our global chart context
interface ChartContextType {
	chartMode: "VALUE" | "PERCENTAGE";
	setChartMode: (mode: "VALUE" | "PERCENTAGE") => void;
	dataMode: "REAL" | "SIMULATED";
	setDataMode: (mode: "REAL" | "SIMULATED") => void;
	selectedIds: string[];
	togglePortfolio: (id: string) => void;
	activeRange: string;
	fromDate: Date | undefined;
	toDate: Date | undefined;
	handleRangeChange: (range: string) => void;
	handleDateRangeSelect: (range: DateRange | undefined) => void;
}

const ChartContext = createContext<ChartContextType | null>(null);

export function ChartProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Local state for UI toggles
	const [chartMode, setChartMode] = useState<"VALUE" | "PERCENTAGE">("VALUE");
	const [dataMode, setDataMode] = useState<"REAL" | "SIMULATED">("SIMULATED");
	const [selectedIds, setSelectedIds] = useState<string[]>(["ALL"]);

	// Extract date ranges from URL parameters
	const activeRange = searchParams.get("range") || "1M";
	const currentFrom = searchParams.get("from") || "";
	const currentTo = searchParams.get("to") || "";
	const fromDate = currentFrom ? new Date(currentFrom) : undefined;
	const toDate = currentTo ? new Date(currentTo) : undefined;

	// Toggle portfolio selection
	const togglePortfolio = (id: string) => {
		setSelectedIds((prev) => {
			if (id === "ALL") return ["ALL"];
			const newIds = prev.includes(id)
				? prev.filter((p) => p !== id)
				: [...prev.filter((p) => p !== "ALL"), id];
			return newIds.length === 0 ? ["ALL"] : newIds;
		});
	};

	// Update URL when predefined range changes
	const handleRangeChange = (range: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("range", range);
		if (range !== "CUSTOM") {
			params.delete("from");
			params.delete("to");
		}
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	};

	// Update URL for custom date selection
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
				togglePortfolio,
				activeRange,
				fromDate,
				toDate,
				handleRangeChange,
				handleDateRangeSelect,
			}}
		>
			{children}
		</ChartContext.Provider>
	);
}

// Custom hook to consume the context easily
export const useChartContext = () => {
	const context = useContext(ChartContext);
	if (!context) {
		throw new Error("useChartContext must be used within a ChartProvider");
	}
	return context;
};

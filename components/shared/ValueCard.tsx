import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChartContext } from "../providers/ChartProvider";

interface ValueCardProps {
	label: string;
	value?: number;
	icon?: LucideIcon;
	className?: string;
	suffix?: string;
	formatString?: boolean;
	children?: React.ReactNode;
}

export function ValueCard({
	label,
	value,
	icon: Icon,
	className,
	suffix,
	formatString = false,
	children,
}: ValueCardProps) {
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	// 🚀 TARCZA: Sprawdzamy, czy karta ma wyświetlać walutę, czy coś innego (np. "%", "szt.")
	const isCurrencyMode = suffix === "PLN" || suffix === "zł";

	// Przeliczamy wartość TYLKO, jeśli to waluta (i chronimy przed błędem, gdy value to tekst)
	const displayValue =
		isCurrencyMode && typeof value === "number" ? convertPLN(value) : value;

	return (
		<div className={cn("flex flex-col gap-1 shrink-0", className)}>
			{/* Mała, techniczna etykieta */}
			<p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
				{Icon && <Icon className="h-3 w-3" />}
				{label}
			</p>

			{/* Wartość */}
			<div className="flex items-center gap-2 text-slate-200">
				{children ? (
					children
				) : (
					<span className="font-mono text-lg font-semibold tracking-tight">
						{formatString
							? formatCurrency(displayValue as number)
							: displayValue}
						{suffix && (
							<span className="ml-1.5 text-[11px] font-bold text-slate-500">
								{/* 🚀 Zmiana: Zastępujemy twarde "PLN" na dynamiczny symbol, resztę zostawiamy */}
								{isCurrencyMode ? currencySymbol : suffix}
							</span>
						)}
					</span>
				)}
			</div>
		</div>
	);
}

"use client";

import { Check, Sparkles } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/format-currency";

import { Button } from "@/components/ui/button";
import { PRICING_PLANS } from "@/lib/constants/pricing";
import { cn } from "@/lib/utils";
import { useChartContext } from "@/components/providers/ChartProvider";
import { useState } from "react";

export default function PricingSection() {
	const [isYearly, setIsYearly] = useState(true);
	const { currency, convertPLN } = useChartContext();
	const currencySymbol = getCurrencySymbol(currency);

	// Funkcja przeliczająca cenę bazową (PLN) na aktualnie wybraną walutę
	const getDisplayPrice = (pricePLN: number) => {
		if (pricePLN === 0) return "0";
		const converted = convertPLN(pricePLN);
		// Formatujemy bez miejsc po przecinku dla czystego wyglądu (np. 29 zamiast 29,00)
		return formatCurrency(converted, 0);
	};

	return (
		<section className="relative z-10 py-24 container mx-auto px-4 max-w-6xl">
			<div className="text-center mb-16">
				<h2 className="text-3xl md:text-5xl font-black tracking-tighter text-t-text-primary mb-4">
					Prosty cennik,{" "}
					<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
						żadnych ukrytych opłat
					</span>
				</h2>
				<p className="text-t-text-secondary text-lg max-w-2xl mx-auto font-medium">
					Wybierz plan dopasowany do Twojego stylu inwestowania. Oszczędź 16%
					wybierając rozliczenie roczne (2 miesiące gratis).
				</p>

				{/* Przełącznik Miesięcznie / Rocznie */}
				<div className="flex items-center justify-center gap-3 mt-10">
					<span
						className={cn(
							"text-sm font-bold transition-colors",
							!isYearly ? "text-t-text-primary" : "text-t-text-tertiary",
						)}
					>
						Miesięcznie
					</span>
					<button
						onClick={() => setIsYearly(!isYearly)}
						className="relative w-14 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 transition-colors focus:outline-none"
					>
						<div
							className={cn(
								"absolute top-[3px] left-[4px] w-5 h-5 rounded-full bg-blue-500 transition-transform duration-300 shadow-md",
								isYearly ? "translate-x-7" : "translate-x-0",
							)}
						/>
					</button>
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"text-sm font-bold transition-colors",
								isYearly ? "text-t-text-primary" : "text-t-text-tertiary",
							)}
						>
							Rocznie
						</span>
						<span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 animate-pulse">
							-16%
						</span>
					</div>
				</div>
			</div>

			{/* Karty Cennika */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
				{PRICING_PLANS.map((plan) => {
					// Obliczamy wyświetlaną cenę zależnie od przełącznika i wybranej waluty
					const basePrice = isYearly
						? plan.pricePLN.yearly / 12
						: plan.pricePLN.monthly;
					const displayPrice = getDisplayPrice(basePrice);

					return (
						<div
							key={plan.id}
							className={cn(
								"relative flex flex-col p-8 rounded-3xl border transition-all duration-300 bg-t-bg-panel shadow-lg",
								plan.isPopular
									? "border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.15)] md:-translate-y-4"
									: "border-t-border hover:border-t-border-subtle",
							)}
						>
							{/* Baretka dla wyróżnionego planu */}
							{plan.badge && (
								<div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md flex items-center gap-1.5">
									{plan.isPopular && <Sparkles className="w-3 h-3" />}
									{plan.badge}
								</div>
							)}

							<div className="mb-8">
								<h3 className="text-xl font-black text-t-text-primary mb-2">
									{plan.name}
								</h3>
								<p className="text-sm text-t-text-tertiary h-10 leading-relaxed font-medium">
									{plan.description}
								</p>
							</div>

							<div className="mb-8 flex items-baseline gap-1">
								<span className="text-4xl font-black tracking-tighter text-t-text-primary">
									{displayPrice}
								</span>
								<span className="text-lg font-bold text-t-text-secondary mr-1">
									{currencySymbol}
								</span>
								<span className="text-sm font-medium text-t-text-tertiary">
									/ mc
								</span>
							</div>

							<Button
								variant={plan.buttonVariant}
								className={cn(
									"w-full h-12 rounded-xl font-bold uppercase tracking-widest text-[11px] mb-8 transition-all",
									plan.isPopular
										? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 border-0"
										: "border-t-border bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
								)}
							>
								{plan.buttonText}
							</Button>

							<div className="flex flex-col gap-4 grow">
								<p className="text-[10px] font-bold uppercase tracking-widest text-t-text-primary mb-1">
									Zawiera:
								</p>
								{plan.features.map((feature, i) => (
									<div key={i} className="flex items-start gap-3">
										<div className="mt-0.5 rounded-full bg-blue-500/10 p-1 shrink-0">
											<Check className="w-3 h-3 text-blue-500" />
										</div>
										<span className="text-sm font-medium text-t-text-secondary leading-snug">
											{feature}
										</span>
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}

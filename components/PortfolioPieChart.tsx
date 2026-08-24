"use client";

import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
import {
	Cell,
	Legend,
	LegendPayload,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import { CheckCircle2, Circle, PieChart as PieChartIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { CategoryStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PortfolioPieChartProps {
	title: string;
	dataKey: string;
	data: CategoryStatus[];
}

export default function PortfolioPieChart({
	title,
	dataKey,
	data,
}: PortfolioPieChartProps) {
	// 🚀 STATE: Ukryte kategorie (do wyłączania z legendy)
	const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(
		new Set(),
	);
	// 🚀 STATE: Aktualnie podświetlony kawałek (do środka donuta)
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setHasMounted(true), 0);
		return () => clearTimeout(t);
	}, []);

	// Filtrujemy dane wykluczając ukryte kategorie
	const visibleData = data.filter((d) => !hiddenCategories.has(d.category));

	const isEmpty =
		visibleData.length === 0 ||
		visibleData.every(
			(item) => (item[dataKey as keyof CategoryStatus] as number) === 0,
		);

	if (!hasMounted)
		return (
			<div className="w-full h-[400px] bg-white/5 animate-pulse rounded-2xl" />
		);

	// Funkcja do obsługi kliknięć w legendę
	const toggleCategory = (category: string) => {
		setHiddenCategories((prev) => {
			const next = new Set(prev);
			if (next.has(category)) next.delete(category);
			else next.add(category);
			return next;
		});
		setActiveIndex(null); // Resetujemy środek po kliknięciu
	};

	// 🚀 ZMIANA: Zwykła funkcja, nie potrzebuje już propsów z Recharts
	// 🚀 ZMIANA: Legenda wykorzystująca ikony CheckCircle2 / Circle
	const renderCustomLegend = () => {
		return (
			<div className="mt-4">
				<ul className="flex flex-wrap justify-center gap-x-4 gap-y-3">
					{data.map((entry, index) => {
						const labelKey = entry.category as keyof typeof CATEGORY_LABELS;

						// Jeśli kategoria JEST w hiddenCategories, to znaczy, że jest wyłączona
						const isHidden = hiddenCategories.has(entry.category);

						return (
							<li
								key={`item-${index}`}
								onClick={() => toggleCategory(entry.category)}
								className={cn(
									"flex items-center gap-1.5 cursor-pointer transition-all duration-300",
									isHidden
										? "opacity-40 grayscale" // Stan odznaczony
										: "opacity-100 hover:opacity-80 hover:scale-105", // Stan zaznaczony
								)}
							>
								{/* Warunkowe renderowanie ikony w zależności od stanu */}
								{!isHidden ? (
									<CheckCircle2
										className="w-4 h-4 transition-all"
										style={{
											color: COLORS[entry.category],
											// Zachowujemy efekt glow (poświaty) dla zaznaczonych elementów
											filter: `drop-shadow(0 0 6px ${COLORS[entry.category]}60)`,
										}}
									/>
								) : (
									<Circle
										className="w-4 h-4 transition-all"
										style={{ color: COLORS[entry.category] }}
									/>
								)}
								<span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
									{CATEGORY_LABELS[labelKey] || entry.category}
								</span>
							</li>
						);
					})}
				</ul>
				<p className="text-[9px] text-center text-t-text-tertiary uppercase tracking-widest font-bold mt-4 opacity-70">
					💡 Kliknij w kategorię, aby włączyć lub wyłączyć ją z obliczeń
				</p>
			</div>
		);
	};
	// Etykiety wyświetlane bezpośrednio NA kawałkach wykresu
	const renderCustomizedLabel = ({
		cx,
		cy,
		midAngle,
		innerRadius,
		outerRadius,
		percent,
	}: any) => {
		//  Pokazuj procenty dla kawałków większych niż 2% (zamiast 5%)
		if (percent < 0.02) return null;

		const RADIAN = Math.PI / 180;
		// Umiejscowienie na środku grubości paska
		const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
		const x = cx + radius * Math.cos(-midAngle * RADIAN);
		const y = cy + radius * Math.sin(-midAngle * RADIAN);

		return (
			<text
				x={x}
				y={y}
				fill="white"
				textAnchor="middle"
				dominantBaseline="central"
				className="text-[10px] font-black pointer-events-none drop-shadow-md"
			>
				{`${(percent * 100).toFixed(0)}%`}
			</text>
		);
	};

	// Pobranie danych dla elementu aktywnego (w środku wykresu)
	const activeItem = activeIndex !== null ? visibleData[activeIndex] : null;

	// 🚀 NOWE: Wyliczamy całkowitą sumę do wyświetlania w środku
	const totalVisibleAmount = visibleData.reduce(
		(sum, item) => sum + (item.actualAmount || 0),
		0,
	);
	const totalVisibleWeight = visibleData.reduce(
		(sum, item) => sum + (item.weight || 0),
		0,
	);

	return (
		<div className="flex flex-col bg-t-bg-panel border border-t-border rounded-2xl p-6 relative w-full h-full ">
			<h4 className="text-sm font-bold uppercase tracking-widest text-t-text-tertiary text-center mb-2">
				{title}
			</h4>

			{/* 🚀 ZMIANA: Zmniejszyliśmy wysokość (np. h-[260px]) - to jest kontener WYŁĄCZNIE na donuta */}
			<div className="w-full h-[260px] min-h-[260px] relative mt-4">
				{isEmpty ? (
					<div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 pb-8">
						<div className="rounded-full border border-t-border bg-t-bg-base p-6 shadow-inner">
							<PieChartIcon className="h-10 w-10 text-t-text-tertiary" />
						</div>
						<div className="text-center">
							<p className="text-sm font-semibold text-t-text-primary">
								Brak widocznych danych
							</p>
							<p className="text-[10px] uppercase tracking-widest text-t-text-tertiary mt-1">
								Zmień filtry lub dodaj aktywa
							</p>
						</div>
					</div>
				) : (
					<>
						{/* RAZEM będzie teraz IDEALNIE w środku geometrycznym donuta */}
						<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-300">
							{activeItem ? (
								<div className="text-center flex flex-col items-center bg-t-bg-panel/80 backdrop-blur-md p-4 rounded-full shadow-lg border border-t-border-subtle transition-all scale-110">
									<span
										className="text-[9px] font-bold uppercase tracking-widest"
										style={{ color: COLORS[activeItem.category] }}
									>
										{CATEGORY_LABELS[
											activeItem.category as keyof typeof CATEGORY_LABELS
										] || activeItem.category}
									</span>
									<span className="text-xl font-black text-t-text-primary leading-tight mt-0.5">
										{dataKey === "actualPercentage"
											? new Intl.NumberFormat("pl-PL", {
													style: "currency",
													currency: "PLN",
													maximumFractionDigits: 0,
												}).format(activeItem.actualAmount)
											: // 🚀 ZMIANA 1: Pokazujemy kwotę celu (Total Portfolio * (Weight / 100)) zamiast suchego 55%
												new Intl.NumberFormat("pl-PL", {
													style: "currency",
													currency: "PLN",
													maximumFractionDigits: 0,
												}).format(
													totalVisibleAmount * (activeItem.weight / 100),
												)}
									</span>
									{/* 🚀 ZMIANA 2: Procent wyświetlamy jako dodatkową metkę (dla obu trybów) */}
									<span className="text-[10px] font-bold text-t-text-tertiary mt-1 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md">
										{dataKey === "actualPercentage"
											? `${activeItem.actualPercentage.toFixed(2)}% obecnie`
											: `${activeItem.weight}% celu`}
									</span>
								</div>
							) : (
								<div className="text-center flex flex-col items-center transition-all">
									<span className="text-[10px] uppercase tracking-widest text-t-text-tertiary font-bold">
										{dataKey === "actualPercentage" ? "WARTOŚĆ" : "CEL (RAZEM)"}
									</span>
									<span className="text-lg font-black text-t-text-primary leading-tight mt-0.5">
										{new Intl.NumberFormat("pl-PL", {
											style: "currency",
											currency: "PLN",
											maximumFractionDigits: 0,
										}).format(totalVisibleAmount)}
									</span>
									{/* Opcjonalny dopisek pod kwotą główną dla Docelowej Strategii */}
									{dataKey === "weight" && (
										<span className="text-[9px] font-bold text-t-text-tertiary mt-1 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md">
											{totalVisibleWeight}% zainwestowano
										</span>
									)}
								</div>
							)}
						</div>

						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={visibleData}
									dataKey={dataKey}
									nameKey="category"
									cx="50%"
									cy="50%"
									innerRadius={90}
									outerRadius={125}
									paddingAngle={2}
									minAngle={8}
									stroke="var(--t-bg-panel)"
									strokeWidth={2}
									labelLine={false} // Wyłączamy domyślne kreski Recharts
									label={renderCustomizedLabel} // Wrzucamy nasze procenty
									onMouseEnter={(_, index) => setActiveIndex(index)}
									onMouseLeave={() => setActiveIndex(null)}
								>
									{visibleData.map((entry) => (
										<Cell
											key={entry.category}
											fill={COLORS[entry.category as keyof typeof COLORS]}
											className="outline-none hover:opacity-80 transition-all duration-300 cursor-pointer"
										/>
									))}
								</Pie>

								{/* <Legend content={renderCustomLegend} verticalAlign="bottom" /> */}
							</PieChart>
						</ResponsiveContainer>
					</>
				)}
			</div>
			{/* 🚀 ZMIANA: Legenda musi być ZAWSZE widoczna, chyba że portfel jest fizycznie pusty */}
			{data.length > 0 && renderCustomLegend()}
		</div>
	);
}

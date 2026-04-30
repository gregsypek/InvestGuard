// EN: Interfaces for chart data points
// PL: Interfejsy dla punktów danych na wykresach
export interface AreaChartPoint {
	name: string;
	wkład: number;
	wycena: number;
}

export interface BarChartPoint {
	month: string;
	amount: number;
}

/**
 * EN: Prepares data for AlphaChart and MonthlyDepositsChart based on transactions
 * PL: Przygotowuje dane dla AlphaChart i MonthlyDepositsChart na podstawie transakcji
 */
import { Transaction } from "./types";

export const prepareChartAnalytics = (
	transactions: Transaction[],
	roiFactor: number,
) => {
	// 1. Logika dla AreaChart (Trend skumulowany)
	const sortedTx = [...transactions].sort(
		(a, b) =>
			new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime(),
	);

	let cumulative = 0;
	const areaPoints = sortedTx.map((t) => {
		cumulative += Number(t.executedValue);
		return {
			name: new Date(t.executedAt).toLocaleDateString("pl-PL", {
				day: "2-digit",
				month: "2-digit",
			}),
			wkład: Math.round(cumulative),
			wycena: Math.round(cumulative * roiFactor),
		};
	});

	// 2. Logika dla MonthlyDeposits (Słupki - chronologicznie)
	const monthlyMap: Record<
		string,
		{ month: string; amount: number; sortKey: number }
	> = {};

	transactions.forEach((t) => {
		const date = new Date(t.executedAt);
		const monthKey = date.toLocaleDateString("pl-PL", {
			month: "short",
			year: "2-digit",
		});
		const sortKey = date.getFullYear() * 100 + date.getMonth(); // RRRRMM dla sortowania

		if (!monthlyMap[monthKey]) {
			monthlyMap[monthKey] = { month: monthKey, amount: 0, sortKey };
		}
		monthlyMap[monthKey].amount += Number(t.executedValue);
	});

	const barPoints = Object.values(monthlyMap)
		.sort((a, b) => a.sortKey - b.sortKey)
		.map(({ month, amount }) => ({ month, amount: Number(amount.toFixed(2)) }));
	console.log("🚀 ~ prepareChartAnalytics ~ barPoints:", barPoints);

	return { areaPoints, barPoints };
};

// lib/chart-helpers.ts

/**
 * EN: Calculates the projection of reaching a financial goal
 * PL: Oblicza projekcję osiągnięcia celu finansowego
 */
export const calculateGoalProjection = (
	currentValue: number,
	targetValue: number,
	monthlyDeposit: number,
	annualReturn: number = 0.07, // Domyślnie 7% rocznie
) => {
	const monthlyRate = annualReturn / 12;
	const projectionData = [];
	let balance = currentValue;
	let month = 0;

	// Zabezpieczenie przed nieskończoną pętlą (limit 40 lat / 480 miesięcy)
	while (balance < targetValue && month < 480) {
		if (month % 12 === 0 || balance >= targetValue) {
			projectionData.push({
				month: month,
				label: `Rok ${Math.floor(month / 12)}`,
				wartość: Math.round(balance),
				cel: targetValue,
			});
		}

		// Procent składany + miesięczna dopłata
		balance = balance * (1 + monthlyRate) + monthlyDeposit;
		month++;
	}

	// Ostatni punkt - osiągnięcie celu
	projectionData.push({
		month: month,
		label: "CEL",
		wartość: Math.round(balance),
		cel: targetValue,
	});

	return {
		projectionData,
		monthsToGoal: month,
		yearsToGoal: (month / 12).toFixed(1),
	};
};

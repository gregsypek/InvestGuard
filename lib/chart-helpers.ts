// lib/chart-helpers.ts
import { Transaction } from "./types";

export interface AreaChartPoint {
	name: string;
	wkład: number;
	wycena: number;
}

export interface BarChartPoint {
	month: string;
	amount: number;
}

export const prepareChartAnalytics = (
	transactions: Transaction[],
	roiFactor: number,
) => {
	const sortedTx = [...transactions].sort(
		(a, b) =>
			new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime(),
	);

	// 1. Grupujemy transakcje po miesiącach (RRRR-MM) → jeden punkt = jeden miesiąc
	const monthlyArea: Record<
		string,
		{ label: string; cumulative: number; sortKey: number }
	> = {};

	let cumulative = 0;
	sortedTx.forEach((t) => {
		const date = new Date(t.executedAt);
		const sortKey = date.getFullYear() * 100 + date.getMonth();
		const label = date.toLocaleDateString("pl-PL", {
			month: "2-digit",
			year: "2-digit",
		});

		// 🚀 FIX: Rozróżniamy napływ kapitału (BUY) od wycofania środków z aktywów (SELL)
		if (t.type === "BUY") {
			cumulative += Number(t.executedValue);
		} else if (t.type === "SELL") {
			cumulative -= Number(t.executedValue);
		}

		// Zabezpieczenie przed spadkiem poniżej zera (np. gdy zrealizowany zysk ze sprzedaży przewyższa wkład pierwotny)
		const safeCumulative = cumulative < 0 ? 0 : cumulative;

		// Nadpisujemy — interesuje nas skumulowana wartość NA KONIEC każdego miesiąca
		monthlyArea[sortKey] = { label, cumulative: safeCumulative, sortKey };
	});

	const areaPoints = Object.values(monthlyArea)
		.sort((a, b) => a.sortKey - b.sortKey)
		.map(({ label, cumulative }) => ({
			name: label,
			wkład: Math.round(cumulative),
			wycena: Math.round(cumulative * roiFactor),
		}));

	// 2. Logika dla MonthlyDeposits (Słupki - bez zmian)
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
		const sortKey = date.getFullYear() * 100 + date.getMonth();

		if (t.type === "DEPOSIT" || t.type === "BUY") {
			if (!monthlyMap[monthKey]) {
				monthlyMap[monthKey] = { month: monthKey, amount: 0, sortKey };
			}
			monthlyMap[monthKey].amount += Number(t.executedValue);
		}
	});

	const barPoints = Object.values(monthlyMap)
		.sort((a, b) => a.sortKey - b.sortKey)
		.map(({ month, amount }) => ({
			month,
			amount: Math.round(amount),
		}));

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

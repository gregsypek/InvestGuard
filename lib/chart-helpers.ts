import { Transaction } from "./types";

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

		cumulative += Number(t.executedValue);

		// Nadpisujemy — interesuje nas skumulowana wartość NA KONIEC każdego miesiąca
		monthlyArea[sortKey] = { label, cumulative, sortKey };
	});

	const areaPoints = Object.values(monthlyArea)
		.sort((a, b) => a.sortKey - b.sortKey)
		.map(({ label, cumulative }) => ({
			name: label,
			wkład: Math.round(cumulative),
			wycena: Math.round(cumulative * roiFactor),
		}));

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
		const sortKey = date.getFullYear() * 100 + date.getMonth();

		if (!monthlyMap[monthKey]) {
			monthlyMap[monthKey] = { month: monthKey, amount: 0, sortKey };
		}
		monthlyMap[monthKey].amount += Number(t.executedValue);
	});

	const barPoints = Object.values(monthlyMap)
		.sort((a, b) => a.sortKey - b.sortKey)
		.map(({ month, amount }) => ({ month, amount: Number(amount.toFixed(2)) }));

	return { areaPoints, barPoints };
};

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

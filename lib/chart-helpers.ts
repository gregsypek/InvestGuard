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

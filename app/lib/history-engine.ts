import { addDays, differenceInDays, isSameDay, startOfDay } from "date-fns";

export function generatePortfolioHistory(
	portfolios: any[],
	daysBack: number = 30,
	customEndDate?: Date,
) {
	const history: any[] = [];
	const actualToday = startOfDay(new Date()); // Prawdziwe "dzisiaj"
	const chartEndDate = startOfDay(customEndDate || new Date()); // Koniec wykresu (np. z filtra DO)
	const startDate = addDays(chartEndDate, -daysBack); // Początek wykresu

	let step = 1;
	if (daysBack > 90) step = 7;
	if (daysBack >= 365) step = 30;

	portfolios.forEach((portfolio) => {
		let prevInvested = 0;
		let prevTotal = 0;

		for (let i = 0; i <= daysBack; i += step) {
			const currentDate = addDays(startDate, i);
			// Używamy actualToday, żeby wiedzieć, czy narysować twarde dane z bazy dla ryzykownych aktywów
			const isCurrentDayActualToday = isSameDay(currentDate, actualToday);

			let dailyInvested = 0;
			let dailyValue = 0;

			portfolio.assets.forEach((asset: any) => {
				const purchaseDate = startOfDay(
					new Date(asset.purchaseDate || asset.createdAt),
				);

				// Jeśli aktywa nie było w danym dniu w historii -> pomijamy
				if (currentDate < purchaseDate) return;

				dailyInvested += asset.investedCapital;

				// =========================================================
				// 1. OBLIGACJE (Symulujemy zawsze, ignorujemy bazę dla wykresu,
				// by uniknąć sztucznego spadku "dzisiaj")
				// =========================================================
				if (asset.category === "BONDS" && Number(asset.interestRate) > 0) {
					const daysOwnedAtCurrentDate = Math.max(
						0,
						differenceInDays(currentDate, purchaseDate),
					);
					// Zysk z odsetek np: 6% w skali roku to 0.06 / 365 dziennie
					const dailyRate = (Number(asset.interestRate) || 0) / 100 / 365;
					const accruedForDay =
						asset.investedCapital * dailyRate * daysOwnedAtCurrentDate;

					dailyValue += asset.investedCapital + accruedForDay;
				}
				// =========================================================
				// 2. POZOSTAŁE AKTYWA (Akcje, Krypto, Złoto)
				// =========================================================
				else {
					if (isCurrentDayActualToday) {
						// Na dzisiaj bierzemy to, co podaje rynek
						dailyValue += asset.currentValue;
					} else {
						// Na przeszłość rozkładamy całkowity zysk liniowo
						const totalDaysOwned = Math.max(
							1,
							differenceInDays(actualToday, purchaseDate),
						);
						const daysOwnedAtCurrentDate = Math.max(
							0,
							differenceInDays(currentDate, purchaseDate),
						);

						const totalProfit = asset.currentValue - asset.investedCapital;
						const profitPerDay = totalProfit / totalDaysOwned;

						dailyValue +=
							asset.investedCapital + profitPerDay * daysOwnedAtCurrentDate;
					}
				}
			});

			let change = 0;
			let isPositive = true;

			if (i > 0) {
				const addedCapital = dailyInvested - prevInvested;
				// PnL: Zmiana całkowitej wartości minus wpłacony kapitał w tym dniu
				change = dailyValue - prevTotal - addedCapital;
				isPositive = change >= 0;
			}

			prevInvested = dailyInvested;
			prevTotal = dailyValue;

			history.push({
				id: `sim-${portfolio.id}-${i}`,
				portfolioId: portfolio.id,
				date: currentDate,
				totalValue: Number(dailyValue.toFixed(2)),
				investedValue: dailyInvested,
				dailyChange: change,
				isPositive,
			});
		}
	});

	return history;
}

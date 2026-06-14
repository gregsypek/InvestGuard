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
			// Używamy actualToday, żeby wiedzieć, czy narysować twarde dane z bazy
			const isCurrentDayActualToday = isSameDay(currentDate, actualToday);

			let dailyInvested = 0;
			let dailyValue = 0;

			portfolio.assets.forEach((asset: any) => {
				const purchaseDate = startOfDay(
					new Date(asset.purchaseDate || asset.createdAt),
				);

				if (currentDate < purchaseDate) return;

				dailyInvested += asset.investedCapital;

				if (isCurrentDayActualToday) {
					dailyValue += asset.currentValue;
				} else {
					// Zysk dzielimy na podstawie prawdziwego czasu posiadania
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
			});

			let change = 0;
			let isPositive = true;

			if (i > 0) {
				const addedCapital = dailyInvested - prevInvested;
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
				investedValue: Number(dailyInvested.toFixed(2)),
				dailyChange: Number(change.toFixed(2)),
				isPositive,
			});
		}
	});

	return history;
}

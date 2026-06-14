import { addDays, differenceInDays, isSameDay, startOfDay } from "date-fns";

export function generatePortfolioHistory(
	portfolios: any[],
	daysBack: number = 30,
) {
	const history: any[] = [];
	const today = startOfDay(new Date());
	const startDate = addDays(today, -daysBack);

	let step = 1;
	if (daysBack > 90) step = 7;
	if (daysBack >= 365) step = 30;

	portfolios.forEach((portfolio) => {
		let prevInvested = 0;
		let prevTotal = 0;

		for (let i = 0; i <= daysBack; i += step) {
			const currentDate = addDays(startDate, i);

			// EN: Check if the loop reached the present day
			const isCurrentDayToday = isSameDay(currentDate, today);

			let dailyInvested = 0;
			let dailyValue = 0;

			portfolio.assets.forEach((asset: any) => {
				// EN: Use purchaseDate or fallback to createdAt
				const purchaseDate = startOfDay(
					new Date(asset.purchaseDate || asset.createdAt),
				);

				// EN: Skip if the asset was not owned on the current date
				if (currentDate < purchaseDate) return;

				dailyInvested += asset.investedCapital;

				// EN: If calculating for TODAY, use the exact real value.
				// EN: Otherwise, interpolate historical values smoothly.
				if (isCurrentDayToday) {
					dailyValue += asset.currentValue;
				} else {
					const totalDaysOwned = Math.max(
						1,
						differenceInDays(today, purchaseDate),
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
				// EN: Real change = total value growth minus newly injected capital
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

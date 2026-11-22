import {
	calculateLiveBondValue,
	getBondDictionaries,
} from "@/lib/bond-calculations";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { runSmartAlerts } from "@/lib/actions/alerts.actions";
import { syncInflationIfNeeded } from "@/lib/actions/sync-gus-inflation";

export async function GET(req: Request) {
	try {
		if (
			req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
		) {
			return new Response("Unauthorized", { status: 401 });
		}

		// 1. Check and sync latest GUS inflation reading if previous month is missing
		await syncInflationIfNeeded();

		// 2. Fetch bond dictionaries and portfolios in parallel
		const [{ inflationMap, configMap }, portfolios] = await Promise.all([
			getBondDictionaries(),
			db.portfolio.findMany({
				select: {
					id: true,
					assets: {
						select: {
							id: true,
							ticker: true,
							category: true,
							investedCapital: true,
							currentValue: true,
							interestRate: true,
							purchaseDate: true,
						},
					},
				},
			}),
		]);

		const snapshotsToCreate = [];
		const bondUpdates: Promise<unknown>[] = [];

		for (const portfolio of portfolios) {
			let totalValue = 0;
			let investedValue = 0;

			for (const asset of portfolio.assets) {
				investedValue += Number(asset.investedCapital) || 0;

				let calculatedValue = Number(asset.currentValue) || 0;

				if (asset.category === "BONDS") {
					const cleanTicker = asset.ticker
						? asset.ticker.split("_")[0]
						: "UNKNOWN";
					const liveBond = calculateLiveBondValue(
						Number(asset.investedCapital),
						asset.interestRate ?? 0,
						asset.purchaseDate,
						cleanTicker,
						inflationMap,
						configMap,
					);
					calculatedValue = liveBond.value;

					// Keep Asset table synced with accrued compound interest
					if (Math.abs(calculatedValue - Number(asset.currentValue)) > 0.01) {
						bondUpdates.push(
							db.asset.update({
								where: { id: asset.id },
								data: { currentValue: calculatedValue },
							}),
						);
					}
				}

				totalValue += calculatedValue;
			}

			snapshotsToCreate.push({
				portfolioId: portfolio.id,
				totalValue: Number(totalValue.toFixed(2)),
				investedValue: Number(investedValue.toFixed(2)),
				date: new Date(),
			});
		}

		await Promise.all([
			...bondUpdates,
			snapshotsToCreate.length > 0
				? db.portfolioSnapshot.createMany({ data: snapshotsToCreate })
				: Promise.resolve(),
		]);

		revalidateTag("snapshots", "max");

		// 3. Run automated smart alerts
		const alertsResult = await runSmartAlerts(false);

		return NextResponse.json({
			success: true,
			message: `Zapisano ${snapshotsToCreate.length} migawek. Alerty: ${alertsResult.success ? "OK" : "Błąd"}`,
		});
	} catch (error) {
		console.error("[CRON DAILY] Błąd:", error);
		return NextResponse.json(
			{ success: false, error: "Błąd serwera" },
			{ status: 500 },
		);
	}
}

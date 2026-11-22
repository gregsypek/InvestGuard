import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { runSmartAlerts } from "@/lib/actions/alerts.actions";

function getBondAccruedValue(asset: {
	investedCapital: unknown;
	interestRate: number | null;
	currentValue: unknown;
	purchaseDate: Date | null;
	createdAt: Date;
}) {
	const invested = Number(asset.investedCapital) || 0;
	const interestRate = Number(asset.interestRate) || 0;
	if (interestRate <= 0 || invested <= 0)
		return Number(asset.currentValue) || 0;
	const purchaseDate = new Date(asset.purchaseDate || asset.createdAt);
	const diffDays = Math.floor(
		(new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24),
	);
	if (diffDays <= 0) return invested;
	return invested + invested * (interestRate / 100 / 365) * diffDays;
}

export async function GET(req: Request) {
	try {
		if (
			req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
		) {
			return new Response("Unauthorized", { status: 401 });
		}

		// 1. Fetch minimal fields needed to compute daily snapshots
		const portfolios = await db.portfolio.findMany({
			select: {
				id: true,
				assets: {
					select: {
						id: true,
						category: true,
						investedCapital: true,
						currentValue: true,
						interestRate: true,
						purchaseDate: true,
						createdAt: true,
					},
				},
			},
		});

		const snapshotsToCreate = [];
		const bondUpdates: Promise<unknown>[] = [];

		for (const portfolio of portfolios) {
			let totalValue = 0;
			let investedValue = 0;

			for (const asset of portfolio.assets) {
				investedValue += Number(asset.investedCapital) || 0;

				const calculatedValue =
					asset.category === "BONDS"
						? getBondAccruedValue(asset)
						: Number(asset.currentValue) || 0;

				totalValue += calculatedValue;

				// Sync accrued bond value back to Asset table if changed
				if (
					asset.category === "BONDS" &&
					Math.abs(calculatedValue - Number(asset.currentValue)) > 0.01
				) {
					bondUpdates.push(
						db.asset.update({
							where: { id: asset.id },
							data: { currentValue: Number(calculatedValue.toFixed(2)) },
						}),
					);
				}
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

		// Invalidate snapshot cache so charts display today's snapshot immediately
		revalidateTag("snapshots", "max");

		// 2. Run automated smart alerts
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

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runSmartAlerts } from "@/lib/actions/alerts.actions";

function getBondAccruedValue(asset: any) {
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

		// 1. Tworzenie migawek (Snapshots)
		const portfolios = await db.portfolio.findMany({
			include: { assets: true },
		});
		const snapshotsToCreate = [];

		for (const portfolio of portfolios) {
			let totalValue = 0;
			let investedValue = 0;
			for (const asset of portfolio.assets) {
				investedValue += Number(asset.investedCapital) || 0;
				totalValue +=
					asset.category === "BONDS"
						? getBondAccruedValue(asset)
						: Number(asset.currentValue) || 0;
			}
			snapshotsToCreate.push({
				portfolioId: portfolio.id,
				totalValue: Number(totalValue.toFixed(2)),
				investedValue: Number(investedValue.toFixed(2)),
				date: new Date(),
			});
		}

		if (snapshotsToCreate.length > 0) {
			await db.portfolioSnapshot.createMany({ data: snapshotsToCreate });
		}

		// 2. Uruchomienie inteligentnych alertów (Strażnik)
		// Parametr false oznacza tryb automatyczny (bez wymuszania)
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

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// EN: Function to safely calculate accrued interest for a bond asset at the current moment
function getBondAccruedValue(asset: any) {
	const invested = Number(asset.investedCapital) || 0;
	const interestRate = Number(asset.interestRate) || 0; // np. 6.5 dla 6.5%

	if (interestRate <= 0 || invested <= 0)
		return Number(asset.currentValue) || 0;

	// Pobieramy datę zakupu (fallback do createdAt)
	const purchaseDate = new Date(asset.purchaseDate || asset.createdAt);
	const today = new Date();

	// Liczymy ile pełnych dni minęło od zakupu do dzisiaj
	const diffTime = today.getTime() - purchaseDate.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays <= 0) return invested;

	// Standardowy dzienny przyrost obligacji: Kapitał * (Oprocentowanie / 100) / 365 dni * dni posiadania
	const dailyRate = interestRate / 100 / 365;
	const accruedInterest = invested * dailyRate * diffDays;

	return invested + accruedInterest;
}

export async function GET(req: Request) {
	try {
		const authHeader = req.headers.get("authorization");
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return new Response("Unauthorized", { status: 401 });
		}

		const portfolios = await db.portfolio.findMany({
			include: { assets: true },
		});

		const snapshotsToCreate = [];

		for (const portfolio of portfolios) {
			let totalValue = 0;
			let investedValue = 0;

			for (const asset of portfolio.assets) {
				investedValue += Number(asset.investedCapital) || 0;

				// EN: Check if asset is a bond and calculate its accrued value dynamically for the snapshot
				if (asset.category === "BONDS") {
					totalValue += getBondAccruedValue(asset);
				} else {
					// Dla akcji/ETF/Złota bierzemy standardową bieżącą wycenę rynkową
					totalValue += Number(asset.currentValue) || 0;
				}
			}

			snapshotsToCreate.push({
				portfolioId: portfolio.id,
				totalValue: Number(totalValue.toFixed(2)), // Zaokrąglamy do groszy
				investedValue: Number(investedValue.toFixed(2)),
				date: new Date(),
			});
		}

		if (snapshotsToCreate.length > 0) {
			await db.portfolioSnapshot.createMany({
				data: snapshotsToCreate,
			});
		}

		return NextResponse.json({
			success: true,
			message: `Zapisano ${snapshotsToCreate.length} migawek z uwzględnieniem narastania obligacji.`,
		});
	} catch (error) {
		console.error("Błąd podczas tworzenia snapshota:", error);
		return NextResponse.json(
			{ success: false, error: "Błąd serwera" },
			{ status: 500 },
		);
	}
}

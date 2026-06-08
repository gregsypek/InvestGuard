import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
	try {
		// Zabezpieczenie na samym początku
		const authHeader = req.headers.get("authorization");
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return new Response("Unauthorized", { status: 401 });
		}
		// 1. Pobieramy wszystkie portfele wraz z aktywami
		const portfolios = await db.portfolio.findMany({
			include: { assets: true },
		});

		const snapshotsToCreate = [];

		// 2. Obliczamy wartość dla każdego portfela
		for (const portfolio of portfolios) {
			let totalValue = 0;
			let investedValue = 0;

			for (const asset of portfolio.assets) {
				totalValue += Number(asset.currentValue) || 0;
				investedValue += Number(asset.investedCapital) || 0;
			}

			// 3. Przygotowujemy dane do zapisu
			snapshotsToCreate.push({
				portfolioId: portfolio.id,
				totalValue,
				investedValue,
				date: new Date(), // Dzisiejsza data
			});
		}

		// 4. Zapisujemy wszystko do bazy za jednym zamachem (Bulk Insert)
		if (snapshotsToCreate.length > 0) {
			await db.portfolioSnapshot.createMany({
				data: snapshotsToCreate,
			});
		}

		return NextResponse.json({
			success: true,
			message: `Zapisano ${snapshotsToCreate.length} migawek.`,
		});
	} catch (error) {
		console.error("Błąd podczas tworzenia snapshota:", error);
		return NextResponse.json(
			{ success: false, error: "Błąd serwera" },
			{ status: 500 },
		);
	}
}

"use server";

import { ActionResponse, Bond } from "../types";

import { auth } from "@/auth";
import { db } from "@/lib/db"; // EN: Your prisma instance
import { deleteBond } from "@/app/actions";
import { notFound } from "next/navigation";

export async function getBonds(portfolioId?: string) {
	// 1. Zabezpieczenie sesji
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	// 2. Jeśli nie przekazano portfolioId, nie mamy czego szukać
	if (!portfolioId) {
		return [];
	}

	// 3. Pobieranie z bazy DANYCH TYLKO DLA TEGO PORTFELA I TEGO UŻYTKOWNIKA
	const bonds = await db.asset.findMany({
		where: {
			category: "BONDS",
			portfolioId: portfolioId, // Filtrowanie po ID portfela
			portfolio: {
				userId: session.user.id, // OSTATECZNE ZABEZPIECZENIE: Upewniamy się, że portfel należy do zalogowanego usera
			},
			OR: [
				{ ticker: { contains: "EDO" } },
				{ ticker: { contains: "DOS" } },
				{ ticker: { contains: "COI" } },
				{ ticker: { contains: "TOZ" } },
				{ ticker: { contains: "ROD" } },
				{ ticker: { contains: "OTS" } },
				{ ticker: { contains: "ROS" } },
			],
		},
		orderBy: {
			purchaseDate: "desc",
		},
	});

	return bonds;
}

export async function getBondsData(portfolioId: string) {
	const session = await auth();
	if (!session?.user?.id) return null;

	const [portfolio, rawBonds] = await Promise.all([
		db.portfolio.findUnique({
			where: { id: portfolioId, userId: session.user.id },
			select: { name: true },
		}),
		getBonds(portfolioId),
	]);

	// Jeśli portfel nie istnieje lub nie należy do usera -> błąd 404
	if (!portfolio) notFound();

	// Formatowanie danych
	const bonds: Bond[] = rawBonds.map((b) => {
		const cleanTicker = b.ticker ? b.ticker.split("_")[0] : "NIEZNANY";
		return {
			id: b.id,
			ticker: cleanTicker,
			name: b.name,
			purchaseDate:
				b.purchaseDate instanceof Date
					? b.purchaseDate.toISOString()
					: String(b.purchaseDate),
			maturityDate: b.maturityDate
				? b.maturityDate instanceof Date
					? b.maturityDate.toISOString()
					: String(b.maturityDate)
				: null,
			investedCapital: Number(b.investedCapital) ?? 0,
			currentValue: Number(b.currentValue) ?? 0,
			interestRate: b.interestRate ?? 0,
		};
	});

	// EN: Calculate statistics for the cards directly in the layout
	const totals = bonds.reduce(
		(acc, bond) => {
			acc.totalInvested += bond.investedCapital;
			acc.currentValue += bond.currentValue;
			acc.weightedSum += (bond.interestRate ?? 0) * bond.investedCapital;
			return acc;
		},
		{ totalInvested: 0, currentValue: 0, weightedSum: 0 },
	);

	return {
		portfolioName: portfolio.name,
		bonds,
		stats: {
			totalInvested: totals.totalInvested.toLocaleString(),
			currentValue: totals.currentValue.toLocaleString(),
			profit: (totals.currentValue - totals.totalInvested).toLocaleString(),
			avgYield:
				totals.totalInvested > 0
					? (totals.weightedSum / totals.totalInvested).toFixed(2)
					: "0",
		},
	};
}

// EN: Ensure the function always returns a valid ActionResponse
export const handleDeleteBond = async (id: string): Promise<ActionResponse> => {
	try {
		await deleteBond(id);

		// EN: Important - you must return a success object here!
		return {
			success: true,
			id: id,
		};
	} catch (error) {
		console.error("Delete Error:", error);
		return {
			success: false,
			error: "Niestety nie udało się usunąć tej obligacji",
		};
	}
};

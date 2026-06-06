import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import React from "react";
import { db } from "@/lib/db";
import { getActivePortfolioId } from "@/lib/session";

// Definiujemy warianty, jeśli chcemy by strażnik sprawdził też, czy portfel jest pusty
type EmptyAssetVariant = "PLANNER" | "ACTIVITY" | "BONDS" | "PORTFOLIOS";

interface GuardOptions {
	searchParams: Promise<{ portfolioId?: string }>;
	userId: string;
	emptyAssetVariant?: EmptyAssetVariant;
}

export async function getGuardedPortfolio({
	searchParams,
	userId,
	emptyAssetVariant,
}: GuardOptions) {
	// 1. Próbujemy pobrać ID portfela z URL lub ciasteczek
	const portfolioId = await getActivePortfolioId(searchParams);

	// =================================================================
	// ZMIANA: Inteligentne wykrywanie pustego konta
	// =================================================================
	if (!portfolioId) {
		// Sprawdzamy, czy użytkownik w ogóle ma jakiekolwiek portfele
		const userPortfoliosCount = await db.portfolio.count({
			where: { userId: userId },
		});

		// Jeśli ma 0 portfeli -> Wyświetlamy ekran zachęcający do stworzenia pierwszego
		if (userPortfoliosCount === 0) {
			return { errorComponent: <PortfolioEmptyState variant="PORTFOLIOS" /> };
		}

		// Jeśli ma jakieś portfele, ale nie wybrał żadnego -> Każe mu wybrać
		return { errorComponent: <PortfolioEmptyState variant="NOT_SELECTED" /> };
	}

	// 2. Pobieramy portfel wraz z aktywami i historią
	const portfolio = await db.portfolio.findUnique({
		where: {
			id: portfolioId,
			userId: userId, // Zabezpieczenie: portfel musi należeć do zalogowanego usera
		},
		include: {
			assets: true,
			transactionHistories: {
				orderBy: {
					executedAt: "asc",
				},
			},
		},
	});

	// 3. Wariant NOT_FOUND: Mamy ID, ale nie ma go w bazie (ktoś usunął portfel lub wpisał zły link)
	if (!portfolio) {
		return { errorComponent: <PortfolioEmptyState variant="NOT_FOUND" /> };
	}

	// 4. (Opcjonalnie) Wariant PUSTY PORTFEL: Jeśli strona wymaga, by portfel miał już jakieś aktywa
	if (emptyAssetVariant && portfolio.assets.length === 0) {
		return {
			errorComponent: (
				<PortfolioEmptyState
					variant={emptyAssetVariant}
					portfolioId={portfolioId}
				/>
			),
		};
	}

	// 5. Pełen sukces: zwracamy gotowy portfel i ID!
	return { portfolio, portfolioId };
}

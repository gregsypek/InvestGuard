import { Category, TransactionHistory } from "@prisma/client";

import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import React from "react";
import { db } from "@/lib/db";
import { getActivePortfolioId } from "@/lib/session";

// Define variants if the guard should also check whether the portfolio is empty
type EmptyAssetVariant = "PLANNER" | "ACTIVITY" | "BONDS" | "PORTFOLIOS";

interface GuardOptions {
	searchParams: Promise<{ portfolioId?: string }>;
	userId: string;
	emptyAssetVariant?: EmptyAssetVariant;
	transactionCategories?: Category[];
}

export async function getGuardedPortfolio({
	searchParams,
	userId,
	emptyAssetVariant,
	transactionCategories,
}: GuardOptions) {
	// Resolve active portfolioId from searchParams or session cookie
	let portfolioId = await getActivePortfolioId(searchParams);

	// =================================================================
	// Smart detection of empty account and auto-selection
	// =================================================================
	if (!portfolioId) {
		const userPortfolios = await db.portfolio.findMany({
			where: { userId },
			select: { id: true },
		});

		// If user has 0 portfolios -> prompt to create the first one
		if (userPortfolios.length === 0) {
			return { errorComponent: <PortfolioEmptyState variant="PORTFOLIOS" /> };
		}

		// If user has exactly ONE portfolio, auto-select it
		if (userPortfolios.length === 1) {
			portfolioId = userPortfolios[0].id;
		} else {
			return { errorComponent: <PortfolioEmptyState variant="NOT_SELECTED" /> };
		}
	}

	// =================================================================
	// Fetch portfolio with assets and lightweight transaction projection
	// =================================================================
	const portfolio = await db.portfolio.findUnique({
		where: {
			id: portfolioId,
			userId, // Security: portfolio must belong to the logged-in user
		},
		include: {
			assets: true,
			transactionHistories: {
				...(transactionCategories?.length
					? { where: { category: { in: transactionCategories } } }
					: {}),
				orderBy: {
					executedAt: "asc",
				},
				select: {
					id: true,
					type: true,
					assetName: true,
					ticker: true,
					executedValue: true,
					category: true,
					executedAt: true,
					quantity: true,
					portfolioId: true,
				},
			},
		},
	});

	// Handle NOT_FOUND: ID provided, but missing in DB (deleted or unauthorized)
	if (!portfolio) {
		return { errorComponent: <PortfolioEmptyState variant="NOT_FOUND" /> };
	}

	// Optional EMPTY PORTFOLIO check if the page requires existing assets
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

	return {
		portfolio: {
			...portfolio,
			transactionHistories:
				portfolio.transactionHistories as unknown as TransactionHistory[],
		},
		portfolioId,
	};
}

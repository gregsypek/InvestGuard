import { useMemo } from "react";

// 1. Definiujemy minimalny kształt aktywa, jakiego wymaga ten Hook
export interface SortableAsset {
	id: string;
	quantity: number;
	category: string | null;
	ticker?: string | null;
	name: string;
	purchaseDate?: Date | null | string;
	createdAt: Date | string;
	currentValue?: number | null;
}

// 2. Definiujemy minimalny kształt transakcji z historii
export interface SortableTransaction {
	category?: string | null;
	ticker?: string | null;
	assetName?: string | null;
	executedAt: Date | string;
}

// 🚀 ZMIANA: Zamiast "any", wymagamy aby T rozszerzało nasz SortableAsset

//NOTE: Dzięki T extends SortableAsset TypeScript wie, że bezpiecznie może sprawdzać a.quantity > 0. Jednocześnie, jeśli przekażesz do Hooka rozbudowany typ (np. AssetWithPL z tabeli, który ma dodatkowe pole profitAmount), Hook go przyjmie, przetworzy i zwróci Ci go na końcu bez utraty tych dodatkowych pól!
export function useSortedAssets<T extends SortableAsset>(
	assets: T[],
	transactions: SortableTransaction[],
	hideClosed: boolean,
	sortBy: string,
) {
	return useMemo(() => {
		// 1. FILTROWANIE
		let result = assets;
		if (hideClosed) {
			result = result.filter(
				(a) =>
					a.quantity > 0 ||
					a.category === "CASH" ||
					a.id === "bonds-summary-id", // Ochrona wirtualnego wiersza obligacji
			);
		}

		// 2. WYLICZANIE DATY OSTATNIEJ AKTYWNOŚCI
		const mappedResult = result.map((asset) => {
			const assetTxs = transactions.filter((t) => {
				if (asset.id === "bonds-summary-id") return t.category === "BONDS";
				return (
					(asset.ticker && t.ticker === asset.ticker) ||
					t.assetName === asset.name
				);
			});

			const lastActivity =
				assetTxs.length > 0
					? new Date(
							Math.max(
								...assetTxs.map((t) => new Date(t.executedAt).getTime()),
							),
						)
					: new Date(asset.purchaseDate || asset.createdAt || new Date());

			// Hook zwraca obiekt rozszerzony o wyliczoną datę
			return { ...asset, lastActivityDate: lastActivity };
		});

		// 3. SORTOWANIE
		mappedResult.sort((a, b) => {
			if (sortBy === "ALPHA") return a.name.localeCompare(b.name);
			if (sortBy === "VALUE")
				return (b.currentValue || 0) - (a.currentValue || 0);

			// DEFAULT (ACTIVITY)
			return b.lastActivityDate.getTime() - a.lastActivityDate.getTime();
		});

		return mappedResult;
	}, [assets, transactions, hideClosed, sortBy]);
}

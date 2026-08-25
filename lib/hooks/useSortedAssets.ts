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
	investedCapital?: number | null;
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
	filterCategory: string = "ALL",
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

		// 🚀 NOWOŚĆ: Filtrowanie tylko wybranych kategorii
		if (filterCategory !== "ALL") {
			result = result.filter(
				(a) =>
					a.category === filterCategory ||
					(a.id === "bonds-summary-id" && filterCategory === "BONDS"), // Ochrona obligacji
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

			// Zysk kwotowy
			if (sortBy === "PROFIT") {
				const profitA = (a.currentValue || 0) - (a.investedCapital || 0);
				const profitB = (b.currentValue || 0) - (b.investedCapital || 0);
				return profitB - profitA;
			}

			// Zysk procentowy
			if (sortBy === "PROFIT_PCT") {
				const getPct = (asset: any) => {
					const invested = asset.investedCapital || 0;
					const current = asset.currentValue || 0;
					if (invested <= 0) return 0;
					return ((current - invested) / invested) * 100;
				};
				return getPct(b) - getPct(a);
			}

			// 🚀 NOWOŚĆ: Sortowanie (grupowanie) po kategorii alokacji
			if (sortBy === "CATEGORY") {
				const catA = a.category || "";
				const catB = b.category || "";
				// Jeśli to ta sama kategoria, ułóż po wartości od największej
				if (catA === catB) {
					return (b.currentValue || 0) - (a.currentValue || 0);
				}
				// Jeśli różne kategorie, ułóż alfabetycznie po nazwie kategorii
				return catA.localeCompare(catB);
			}

			// DEFAULT (ACTIVITY)
			return b.lastActivityDate.getTime() - a.lastActivityDate.getTime();
		});

		return mappedResult;
	}, [assets, transactions, hideClosed, sortBy, filterCategory]);
}

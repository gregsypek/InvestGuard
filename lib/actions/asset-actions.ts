"use server";

import { ActionResponse } from "../types";
import { Category } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateAssetValues(
	assetId: string,
	newCurrentValue: number,
	newInvestedCapital?: number, // Opcjonalnie, jeśli chcesz zmienić też bazę
): Promise<ActionResponse> {
	try {
		await db.asset.update({
			where: { id: assetId },
			data: {
				currentValue: newCurrentValue,
				// Jeśli nie podamy investedCapital, zostanie stare (lub 0)
				...(newInvestedCapital !== undefined && {
					investedCapital: newInvestedCapital,
				}),
			},
		});

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Błąd aktualizacji aktywa:", error);
		return { success: false, error: "Nie udało się zaktualizować wyceny." };
	}
}

export async function addAssetAction(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id)
		return { success: false, message: "Błąd autoryzacji" };

	const portfolioId = formData.get("portfolioId") as string;
	const existingAssetId = formData.get("existingAssetId") as string;
	const quantity = Number(formData.get("quantity"));
	const investedCapital = Number(formData.get("investedCapital"));
	const currentValue = Number(formData.get("currentValue"));

	const convictionRaw = formData.get("conviction");
	const conviction = convictionRaw ? Number(convictionRaw) : null;
	const rationale = formData.get("rationale") as string;

	const executedAtRaw = formData.get("executedAt") as string;
	const executedAt = executedAtRaw ? new Date(executedAtRaw) : new Date();
	const name = formData.get("name") as string;
	const ticker =
		(formData.get("ticker") as string)?.trim().toUpperCase() || null;
	const category = formData.get("category") as Category;

	const isBond = category === "BONDS";
	const purchaseDateRaw = formData.get("purchaseDate") as string;
	const purchaseDate = purchaseDateRaw ? new Date(purchaseDateRaw) : executedAt;
	const isNewAsset = !existingAssetId || existingAssetId === "new";
	try {
		// 1. Logika limitów dla użytkownika REGULAR
		if (session.user.role === "REGULAR" && isNewAsset && !isBond) {
			const assetCount = await db.asset.count({
				where: {
					portfolioId: portfolioId,
					NOT: { category: "BONDS" }, // Liczymy tylko aktywa, które nie są obligacjami
				},
			});

			if (assetCount >= 10) {
				return {
					success: false,
					message:
						"Osiągnąłeś limit 10 unikalnych akcji/ETF. Obligacje możesz dodawać bez limitu, ale by dodać nowe akcje, przejdź na Premium! 🚀",
				};
			}
		}

		let targetAssetId = existingAssetId;

		// 1. INTELIGENTNE SZUKANIE (Unikanie P2002)
		if (!isBond && (!targetAssetId || targetAssetId === "new")) {
			// Szukamy aktywa o tym samym tickerze w TYM SAMYM portfelu (bez filtrowania kategorii)
			const existing = await db.asset.findFirst({
				where: { ticker, portfolioId },
			});

			if (existing) {
				// Jeśli kategoria się zgadza - aktualizujemy
				if (existing.category === category) {
					targetAssetId = existing.id;
				} else {
					// Jeśli kategoria jest INNA (np. CASH w Passive vs CASH w Booster)
					// to MUSIMY stworzyć nowy wpis, ale z innym dbTicker, żeby baza nie wywaliła błędu
					// targetAssetId pozostaje "new", a my modyfikujemy ticker dla bazy poniżej
				}
			}
		}

		// 2. GENEROWANIE TICKERA DLA BAZY (Magic Trick)
		// Jeśli to nowa pozycja (targetAssetId === "new"), a ticker już istnieje w bazie (ale w innej kategorii)
		// lub jeśli to obligacja - dodajemy sufiks czasowy, by zachować unikalność
		let dbTicker = ticker;
		if (isBond && ticker) {
			dbTicker = `${ticker}_${Date.now()}`;
		} else if (targetAssetId === "new" && ticker) {
			// Sprawdzamy czy ten konkretny ticker jest już zajęty przez inną kategorię
			const conflict = await db.asset.findFirst({
				where: { ticker, portfolioId },
			});
			if (conflict) {
				dbTicker = `${ticker}_${category}`; // np. CASH_BOOSTER
			}
		}

		// 3. AKTUALIZACJA LUB TWORZENIE
		if (!isBond && targetAssetId && targetAssetId !== "new") {
			await db.asset.update({
				where: { id: targetAssetId },
				data: {
					quantity: { increment: quantity },
					investedCapital: { increment: investedCapital },
					currentValue: { increment: currentValue },
					conviction: conviction !== null ? conviction : undefined,
					rationale: rationale || undefined,
				},
			});
		} else {
			const newAsset = await db.asset.create({
				data: {
					name,
					ticker: dbTicker,
					quantity,
					investedCapital,
					currentValue,
					category,
					portfolioId,
					purchaseDate,
					conviction,
					rationale,
					interestRate: 0,
					targetPercentage: 0,
				},
			});
			targetAssetId = newAsset.id;
		}

		// 4. ZAPIS DO HISTORII (Używamy dbTicker, aby transakcja była powiązana z właściwym rekordem)
		await db.transactionHistory.create({
			data: {
				portfolioId,
				assetName: name,
				ticker: dbTicker,
				quantity,
				executedValue: investedCapital,
				executedAt,
				category,
				rationale:
					rationale ||
					(existingAssetId !== "new" ? "Dokupienie" : "Pierwszy zakup"),
			},
		});

		revalidatePath("/dashboard");
		revalidatePath("/alpha");

		return {
			success: true,
			message: "Aktywo dodane pomyślnie! 🚀",
		};
	} catch (error) {
		console.error("Database error:", error);
		return { success: false, message: "Błąd bazy danych" };
	}
}
export async function sellAssetAction(formData: FormData) {
	// Extracting data from the modal form
	const assetId = formData.get("assetId") as string;
	const quantityToSell = Number(formData.get("quantity"));
	// const sellPricePerUnit = Number(formData.get("sellPrice"));
	const targetCashPortfolioId = formData.get("targetPortfolioId") as string; // Selected from dropdown
	const executedAt = new Date(formData.get("executedAt") as string);

	// EN: 1. Fetch the note from the form (can be null if not provided)
	const note = formData.get("note") as string | null;

	// const totalSellValue = quantityToSell * sellPricePerUnit;
	// ZMIANA: To co przychodzi z formularza to już CAŁKOWITA kwota (Total Value)
	const totalSellValue = Number(formData.get("sellPrice"));

	return await db.$transaction(async (tx) => {
		// 1. Fetch the current state of the asset
		const asset = await tx.asset.findUnique({ where: { id: assetId } });
		if (!asset) throw new Error("Asset not found");

		const ratio = quantityToSell / asset.quantity;
		const newQuantity = asset.quantity - quantityToSell;

		// 2. Update or Delete the asset record
		if (newQuantity <= 0) {
			await tx.asset.delete({ where: { id: assetId } });
		} else {
			await tx.asset.update({
				where: { id: assetId },
				data: {
					quantity: newQuantity,
					investedCapital: { decrement: asset.investedCapital * ratio },
					currentValue: { decrement: asset.currentValue * ratio },
				},
			});
		}

		// 3. Create the SELL transaction history record (The orange minus)
		await tx.transactionHistory.create({
			data: {
				type: "SELL",
				portfolioId: asset.portfolioId,
				assetName: asset.name,
				ticker: asset.ticker,
				quantity: -quantityToSell,
				executedValue: totalSellValue,
				category: asset.category,
				executedAt,
				rationale: note, // EN: Save the user's note here
			},
		});

		// 4. Handle Cash Flow if a target portfolio was selected AND it is not "none"
		if (targetCashPortfolioId && targetCashPortfolioId !== "none") {
			// EN: 2. Replaced broken upsert with findFirst + update/create logic
			const existingCashAsset = await tx.asset.findFirst({
				where: {
					portfolioId: targetCashPortfolioId,
					ticker: "CASH",
				},
			});

			if (existingCashAsset) {
				// Update existing cash
				await tx.asset.update({
					where: { id: existingCashAsset.id },
					data: {
						quantity: { increment: totalSellValue },
						currentValue: { increment: totalSellValue },
						investedCapital: { increment: totalSellValue },
					},
				});
			} else {
				// Create new cash position
				await tx.asset.create({
					data: {
						portfolioId: targetCashPortfolioId,
						name: "Gotówka",
						ticker: "CASH",
						category: "CASH",
						quantity: totalSellValue,
						currentValue: totalSellValue,
						investedCapital: totalSellValue,
						// 🚀 NAPRAWA: To pole jest wymagane w Twoim modelu Asset
						purchaseDate: new Date(),
						// Opcjonalnie możesz ustawić maturityDate na null, jeśli model na to pozwala
						maturityDate: null,
					},
				});
			}

			// Create the CASH INFLOW history record (The green plus)
			await tx.transactionHistory.create({
				data: {
					type: "BUY", // Cash inflow is treated as a "purchase" of currency
					portfolioId: targetCashPortfolioId,
					assetName: "Gotówka",
					ticker: "CASH",
					quantity: totalSellValue,
					executedValue: totalSellValue,
					category: "CASH",
					executedAt,
					rationale: `Wpływ ze sprzedaży ${asset.name}`,
				},
			});
		}

		return { success: true };
	});
}

export async function adjustAssetAction(formData: FormData) {
	const assetId = formData.get("assetId") as string;
	const newQuantity = Number(formData.get("newQuantity"));
	const newInvestedCapital = Number(formData.get("newInvestedCapital"));
	const newCurrentValue = Number(formData.get("newCurrentValue"));
	const note = formData.get("note") as string | null;

	return await db.$transaction(async (tx) => {
		// 1. Pobieramy obecny stan
		const asset = await tx.asset.findUnique({ where: { id: assetId } });
		if (!asset) throw new Error("Nie znaleziono aktywa");

		// 2. Wyliczamy różnicę (ile sztuk przybyło/ubyło i jaka jest różnica w wartości)
		const quantityDiff = newQuantity - asset.quantity;

		// Zabezpieczenie przed tworzeniem pustych logów
		if (
			quantityDiff === 0 &&
			newInvestedCapital === asset.investedCapital &&
			newCurrentValue === asset.currentValue
		) {
			return { success: true, message: "Brak zmian do zapisania." };
		}

		// 3. Nadpisujemy aktywo "na twardo" nowymi wartościami
		await tx.asset.update({
			where: { id: assetId },
			data: {
				quantity: newQuantity,
				investedCapital: newInvestedCapital,
				currentValue: newCurrentValue,
			},
		});

		// 4. Zapisujemy w historii korektę TYLKO wtedy, gdy zmieniła się fizyczna ilość sztuk
		if (quantityDiff !== 0) {
			await tx.transactionHistory.create({
				data: {
					type: quantityDiff > 0 ? "BUY" : "SELL",
					portfolioId: asset.portfolioId,
					assetName: asset.name,
					ticker: asset.ticker,
					quantity: quantityDiff,
					executedValue: 0,
					category: asset.category,
					executedAt: new Date(),
					rationale: `[KOREKTA STANU] ${note ? note : `Zmieniono z ${asset.quantity} szt. na ${newQuantity} szt.`}`,
				},
			});
		}

		return { success: true };
	});
}

export async function deleteAssetAction(id: string) {
	try {
		await db.asset.delete({ where: { id } });
		revalidatePath("/alpha");
		revalidatePath("/dashboard");
		return { success: true };
	} catch {
		return { success: false, error: "Błąd podczas usuwania" };
	}
}

export async function updateAlphaDetails(
	id: string,
	conviction: number,
	rationale: string,
) {
	try {
		await db.asset.update({
			where: { id },
			data: { conviction, rationale },
		});
		revalidatePath("/alpha");
		return { success: true };
	} catch {
		return { success: false, error: "Błąd podczas aktualizacji" };
	}
}

// lib/actions/asset-actions.ts

export async function syncPortfolioAssets(portfolioId: string) {
	// Natychmiastowe sprawdzenie
	if (!portfolioId || typeof portfolioId !== "string") {
		console.error("❌ syncPortfolioAssets: portfolioId is missing or invalid!");
		return { success: false, error: "Missing portfolio ID" };
	}
	const transactions = await db.transactionHistory.findMany({
		where: { portfolioId },
		orderBy: { executedAt: "asc" },
	});

	const assetMap = new Map();

	// 1. Zawsze na starcie tworzymy kubełek "Gotówka"
	assetMap.set("CASH", {
		ticker: "CASH",
		name: "Wolna Gotówka PLN",
		totalQuantity: 0,
		totalInvested: 0,
		firstPurchase: new Date(),
		category: "CASH",
	});

	for (const tx of transactions) {
		const isCashTx = tx.ticker === "CASH" || tx.category === "CASH";
		const cashAsset = assetMap.get("CASH");

		if (isCashTx) {
			// 1. WPŁATY I PRZEWALUTOWANIA (Twoje realne pieniądze z zewnątrz)
			if (tx.type === "DEPOSIT" || tx.type === "BUY") {
				// EN: Funds from bank account or currency exchange - increases both spendable cash and capital base
				// PL: Środki z konta lub wymiana - zwiększa gotówkę i bazę zainwestowanego kapitału
				cashAsset.totalQuantity += tx.executedValue;
				cashAsset.totalInvested += tx.executedValue;
			}

			// 2. ODSETKI I DYWIDENDY (Pieniądze wypracowane przez rynek)
			else if (tx.type === "INTEREST") {
				// EN: Interest/Dividends increase spendable cash, but are NOT part of user's personal investment base
				// PL: Odsetki zwiększają ilość gotówki, ale NIE są Twoją dopłatą (nie zwiększają bazy inwestycji)
				cashAsset.totalQuantity += tx.executedValue;
				// Nie dotykamy totalInvested, dzięki czemu Twój zysk % będzie liczony od realnie wpłaconych kwot
			}

			// 3. WYPŁATY ŚRODKÓW (Zmniejszenie kapitału)
			else if (tx.type === "SELL") {
				// EN: Withdrawal to bank account - decreases both spendable cash and capital base
				// PL: Wypłata na konto bankowe - zmniejsza gotówkę i bazę kapitałową
				cashAsset.totalQuantity -= tx.executedValue;
				cashAsset.totalInvested -= tx.executedValue;
			}

			// 4. KOREKTY RĘCZNE (Np. wyrównanie salda)
			else if (tx.type === "UPDATE") {
				// EN: Manual corrections usually only adjust the current balance
				// PL: Ręczne korekty zazwyczaj zmieniają tylko aktualny stan konta
				cashAsset.totalQuantity += tx.executedValue;
			}

			continue; // Idziemy do następnej transakcji
		}

		// 2. Inicjalizacja aktywa (jeśli kupujemy coś po raz pierwszy)
		if (tx.ticker && !assetMap.has(tx.ticker)) {
			assetMap.set(tx.ticker, {
				ticker: tx.ticker,
				name: tx.assetName,
				totalQuantity: 0,
				totalInvested: 0,
				firstPurchase: tx.executedAt,
				category: tx.category,
			});
		}

		const asset = tx.ticker ? assetMap.get(tx.ticker) : null;

		if (asset && tx.type === "BUY") {
			// A. Kupujemy akcje: rośnie ilość aktywa...
			asset.totalQuantity += tx.quantity;
			asset.totalInvested += tx.executedValue;

			// ...B. ale PŁACIMY za to naszą gotówką (CASH spada)
			cashAsset.totalQuantity -= tx.executedValue;
			cashAsset.totalInvested -= tx.executedValue;
		} else if (asset && tx.type === "SELL") {
			// A. Sprzedajemy akcje: maleje ilość aktywa...
			const ratio = tx.quantity / (asset.totalQuantity + tx.quantity);
			asset.totalQuantity -= tx.quantity;
			asset.totalInvested -= asset.totalInvested * ratio;

			// ...B. ale gotówka z transakcji wraca na nasze konto (CASH rośnie)
			cashAsset.totalQuantity += tx.executedValue;
			cashAsset.totalInvested += tx.executedValue;
		}
	}

	// 3. Zapis do bazy danych
	for (const [ticker, data] of assetMap) {
		// Jeśli sprzedaliśmy wszystkie sztuki, po prostu wpisujemy 0, żeby mieć czystą historię
		if (data.totalQuantity <= 0 && ticker !== "CASH") {
			data.totalQuantity = 0;
			data.totalInvested = 0;
		}

		await db.asset.upsert({
			where: {
				portfolioId_ticker: {
					portfolioId,
					ticker,
				},
			},
			update: {
				name: data.name,
				quantity: data.totalQuantity,
				investedCapital: data.totalInvested,
				// Aktualizujemy currentValue TYLKO dla gotówki, akcje odświeża Yahoo!
				...(ticker === "CASH" && { currentValue: data.totalInvested }),
				category: data.category,
			},
			create: {
				portfolioId,
				ticker,
				name: data.name,
				quantity: data.totalQuantity,
				investedCapital: data.totalInvested,
				currentValue: data.totalInvested, // Cena startowa
				category: data.category,
				purchaseDate: data.firstPurchase || new Date(),
			},
		});
	}

	return { success: true };
}

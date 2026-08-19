"use server";

import { ActionResponse, Bond } from "../types";
import { syncPortfolioAssets, updateAssetValues } from "./asset-actions";

import { BOND_TEMPLATES } from "../constants";
import { auth } from "@/auth";
import { calculateLiveBondValue } from "../bond-calculations";
import { db } from "@/lib/db"; // EN: Your prisma instance
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { saveXtbTransaction } from "./transactions";

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
				{ ticker: { contains: "DOR" } },
				{ ticker: { contains: "COI" } },
				{ ticker: { contains: "ROD" } },
				{ ticker: { contains: "OTS" } },
				{ ticker: { contains: "ROS" } },
				{ ticker: { contains: "ROR" } },
				{ ticker: { contains: "TOS" } },
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

	// 🚀 ZMIANA: Pobieramy dane portfela, obligacji oraz słowniki z nowych tabel JEDNOCZEŚNIE
	const [portfolio, rawBonds, rawInflation, rawConfigs] = await Promise.all([
		db.portfolio.findUnique({
			where: { id: portfolioId, userId: session.user.id },
			select: { name: true },
		}),
		getBonds(portfolioId),
		db.inflationRate.findMany(), // Pobiera wszystkie odczyty GUS
		db.bondSeriesConfig.findMany(), // Pobiera konfiguracje serii (marże i proc. 1-szy rok)
	]);

	if (!portfolio) notFound();

	// 🚀 ZMIANA: Mapujemy tablice bazy danych na obiekty słownikowe (dla błyskawicznego odczytu O(1) w pętli)
	const inflationMap = rawInflation.reduce(
		(acc, item) => {
			acc[item.yearMonth] = item.value;
			return acc;
		},
		{} as Record<string, number>,
	);

	const configMap = rawConfigs.reduce(
		(acc, item) => {
			acc[item.seriesCode] = {
				firstYearRate: item.firstYearRate,
				margin: item.margin,
			};
			return acc;
		},
		{} as Record<string, { firstYearRate: number; margin: number | null }>,
	);

	const bonds: Bond[] = rawBonds.map((b) => {
		const cleanTicker = b.ticker ? b.ticker.split("_")[0] : "NIEZNANY"; // np. EDO0836

		// 🚀 ZMIANA: Odbieramy obiekt z wyceną i stawką z silnika
		const calculated = calculateLiveBondValue(
			Number(b.investedCapital),
			b.interestRate ?? 0,
			b.purchaseDate,
			cleanTicker,
			inflationMap,
			configMap,
		);

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

			currentValue: calculated.value, // Wycena PLN
			interestRate: configMap[cleanTicker]
				? configMap[cleanTicker].firstYearRate
				: (b.interestRate ?? 0),
			quantity: b.quantity ?? 0,

			// 🚀 NOWOŚĆ: Wstrzykujemy stawkę do wyrenderowania w nowym okienku
			currentPeriodRate: calculated.currentRate,
			// 🚀 NOWOŚĆ: Flaga informująca frontend, że tą obligacją steruje Panel Admina
			hasGlobalConfig: !!configMap[cleanTicker],
		} as Bond & { currentPeriodRate?: number; hasGlobalConfig?: boolean };
	});

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

export async function deleteBond(id: string) {
	try {
		// 1. Fetch asset details before performing deletion
		const bond = await db.asset.findUnique({
			where: { id },
		});

		if (!bond) return { success: false, message: "Nie znaleziono obligacji" };

		await db.$transaction([
			// 2. Add entry to history (balancing transaction logs)
			db.transactionHistory.create({
				data: {
					portfolioId: bond.portfolioId,
					assetName: bond.name || (bond.ticker ?? "NIE PODANO"),
					ticker: bond.ticker,
					type: "SELL", // 🚀 FIX: Explicitly set to SELL so it renders as SPRZEDAŻ instead of KUPNO
					quantity: Math.abs(bond.quantity), // 🚀 FIX: Use absolute positive value to prevent "+-" UI layout bugs
					executedValue: Math.abs(bond.currentValue), // 🚀 FIX: Positive volume since SELL type natively handles negative balance shifts
					executedAt: new Date(),
					category: "BONDS",
					rationale: "[ZAMKNIĘCIE POZYCJI] Usunięcie transzy z portfela",
					comment: "[ZAMKNIĘCIE POZYCJI] Usunięcie transzy z portfela", // 🚀 FIX: Supplied both for legacy table view support
				},
			}),
			// 3. Delete the asset record itself
			db.asset.delete({
				where: { id },
			}),
		]);

		// 4. Revalidate all paths where this data occurs
		revalidatePath("/bond-reports");
		revalidatePath("/dashboard");

		return {
			success: true,
			message: "Obligacja usunięta i zarchiwizowana w historii",
		};
	} catch (error) {
		console.error("Delete error:", error);
		return { success: false, message: "Nie udało się usunąć obligacji" };
	}
}

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

// Logika mapowania tickerów na typ oprocentowania
function getRateTypeByTicker(ticker: string): "VARIABLE" | "FIXED" {
	const cleanTicker = ticker
		.toUpperCase()
		.split("_")[0] as keyof typeof BOND_TEMPLATES;

	const type = BOND_TEMPLATES[cleanTicker]?.rateType as
		| "FIXED"
		| "VARIABLE"
		| undefined;

	return type || "FIXED";
}

function getBondMaturityDate(purchaseDate: Date, ticker: string): Date {
	const cleanTicker = ticker
		.toUpperCase()
		.split("_")[0] as keyof typeof BOND_TEMPLATES;

	const template = BOND_TEMPLATES[cleanTicker];
	const maturity = new Date(purchaseDate);

	if (template) {
		maturity.setMonth(maturity.getMonth() + template.duration * 12);
	}
	return maturity;
}

export async function addBond(formData: FormData, portfolioId: string) {
	try {
		const rawTicker = formData.get("ticker") as string; // np. "EDO"
		const purchaseDate = new Date(formData.get("purchaseDate") as string);
		const quantity = Number(formData.get("quantity")) || 1;
		const investedCapital = Number(formData.get("investedCapital"));
		const interestRate = Number(formData.get("interestRate")) || 0;
		const manualCurrentValueRaw = formData.get("manualCurrentValue");

		const rateType = getRateTypeByTicker(rawTicker);
		const maturityDate = getBondMaturityDate(purchaseDate, rawTicker);

		// ==========================================
		// 1. GENEROWANIE PIĘKNEJ NAZWY (np. EDO0836)
		// ==========================================
		// Bierzemy miesiąc i dwie ostatnie cyfry roku z daty WYKUPU
		const matMonth = String(maturityDate.getMonth() + 1).padStart(2, "0");
		const matYear = String(maturityDate.getFullYear()).slice(-2);
		// Składamy Ticker (np. EDO + 08 + 36 = EDO0836)
		const prettyTicker = `${rawTicker.substring(0, 3)}${matMonth}${matYear}`;

		let name = formData.get("name") as string;
		// Jeśli użytkownik nic nie wpisał albo wpisał gołe "EDO", nadpisujemy ładną nazwą
		if (!name || name === rawTicker) {
			name = `Obligacje ${prettyTicker}`;
		}

		// ==========================================
		// 2. KLUCZE DEDUPLIKACJI (Zgodne z Importerem)
		// ==========================================
		const dateStr = purchaseDate.toISOString().split("T")[0]; // np. 2026-08-10
		const dbTicker = `${prettyTicker}_${dateStr}`; // np. EDO0836_2026-08-10
		// 🚀 POPRAWKA: Usunięto kwotę. Teraz klucz to sztywno: BOND_EDO0836_2026-08-10
		const uniqueExternalId = `BOND_${prettyTicker}_${dateStr}`;
		// POCZĄTKOWA WYCENA
		let startingCurrentValue = investedCapital;

		if (manualCurrentValueRaw) {
			startingCurrentValue = Number(manualCurrentValueRaw);
		} else if (interestRate > 0) {
			const now = new Date();
			const diffYears = Math.max(
				0,
				(now.getTime() - purchaseDate.getTime()) /
					(1000 * 60 * 60 * 24 * 365.25),
			);
			const r = interestRate / 100;

			if (rateType === "FIXED" || rawTicker === "OTS" || rawTicker === "DOR") {
				startingCurrentValue = investedCapital * (1 + r * diffYears);
			} else {
				startingCurrentValue = investedCapital * Math.pow(1 + r, diffYears);
			}
		}

		startingCurrentValue = Number(startingCurrentValue.toFixed(2));

		// TRANSAKCJA BAZY DANYCH
		await db.$transaction(async (tx) => {
			// Zapis Aktywa
			await tx.asset.upsert({
				where: {
					portfolioId_ticker: { portfolioId, ticker: dbTicker },
				},
				update: {
					quantity: { increment: quantity },
					investedCapital: { increment: investedCapital },
					currentValue: { increment: startingCurrentValue },
				},
				create: {
					name,
					ticker: dbTicker,
					portfolioId,
					category: "BONDS",
					quantity,
					rateType,
					investedCapital,
					currentValue: startingCurrentValue,
					interestRate,
					purchaseDate,
					maturityDate,
				},
			});

			// Zapis Historii (Zabezpieczone unikalnym ID zewnętrznym)
			const existingTx = await tx.transactionHistory.findUnique({
				where: {
					portfolioId_externalId: { portfolioId, externalId: uniqueExternalId },
				},
			});

			if (existingTx) {
				await tx.transactionHistory.update({
					where: { id: existingTx.id },
					data: {
						quantity: { increment: quantity },
						executedValue: { increment: investedCapital },
					},
				});
			} else {
				await tx.transactionHistory.create({
					data: {
						portfolioId,
						externalId: uniqueExternalId, // 🚀 To sprawi, że Importer odrzuci to jako duplikat, jeśli wgrasz Excela z tą samą datą!
						assetName: name,
						ticker: dbTicker,
						quantity,
						executedValue: investedCapital,
						executedAt: purchaseDate,
						category: "BONDS",
						type: "BUY",
						rationale: "Zakup nowej serii obligacji (ręczny)",
					},
				});
			}
		});

		revalidatePath(`/bond-reports/${portfolioId}`);
		revalidatePath("/dashboard");
		revalidatePath("/bond-reports");

		return { success: true };
	} catch (error) {
		console.error("Prisma DB Error during addBond:", error);
		return {
			success: false,
			error: "Nie udało się zapisać obligacji w bazie.",
		};
	}
}

export async function updateBondValue(id: string, newValue: number) {
	try {
		const bond = await db.asset.findUnique({ where: { id } });
		if (!bond) throw new Error("Bond not found");

		// RÓŻNICA DO HISTORII TRANSAKCJI
		const valueDelta = newValue - bond.currentValue;

		await db.$transaction([
			db.asset.update({
				where: { id },
				data: { currentValue: newValue },
			}),
			db.transactionHistory.create({
				data: {
					portfolioId: bond.portfolioId,
					type: "UPDATE",
					assetName: bond.name,
					ticker: bond.ticker,
					quantity: 0,
					executedValue: valueDelta, // Różnica
					category: "BONDS",
					rationale: `Ręczna korekta wyceny: ${newValue} PLN`,
				},
			}),
		]);

		revalidatePath("/bond-reports");
		return { success: true };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Błąd aktualizacji kwoty PLN" };
	}
}

export async function updateBondInterestRate(id: string, newRate: number) {
	try {
		const bond = await db.asset.findUnique({ where: { id } });
		if (!bond) throw new Error("Bond not found");

		const purchaseDate = new Date(bond.purchaseDate!);
		const now = new Date();

		const diffYears = Math.max(
			0,
			(now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
		);

		const cleanTicker = bond.ticker?.split("_")[0].toUpperCase() || "";
		const capital = bond.investedCapital ?? 0;

		let simulatedValue = capital;
		const r = newRate / 100;

		if (
			bond.rateType === "FIXED" ||
			cleanTicker === "OTS" ||
			cleanTicker === "DOR"
		) {
			simulatedValue = capital * (1 + r * diffYears);
		} else {
			simulatedValue = capital * Math.pow(1 + r, diffYears);
		}

		const finalValue =
			newRate === 0 ? bond.currentValue : Number(simulatedValue.toFixed(2));

		// 🆕 RÓŻNICA DO HISTORII TRANSAKCJI (Delta zysku/straty)
		const valueDelta = finalValue - bond.currentValue;

		await db.$transaction([
			db.asset.update({
				where: { id },
				data: {
					interestRate: newRate,
					currentValue: finalValue,
				},
			}),
			db.transactionHistory.create({
				data: {
					type: "UPDATE",
					assetName: bond.name,
					ticker: bond.ticker,
					executedValue: valueDelta,
					quantity: 0,
					portfolioId: bond.portfolioId,
					category: bond.category,
					rationale: `Korekta: ${newRate}% (Nowa wycena: ${finalValue} PLN)`,
				},
			}),
		]);

		revalidatePath("/bond-reports");
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("🔥 Błąd TypeScript w updateBondInterestRate:", error);
		return { success: false, error: "Błąd aktualizacji stopy procentowej." };
	}
}

export async function sellBondAction(formData: FormData) {
	// 1. Pobieranie danych (Używamy klucza 'bondId', bo tak wysyła BondLedgerTable)
	const bondId = formData.get("bondId") as string;
	const quantityToSell = Number(formData.get("quantity"));

	// ZMIANA: Pobieramy gotową kwotę całkowitą (np. 300), NIE mnożymy jej ponownie przez ilość
	const totalSellValue = Number(formData.get("sellPrice"));

	const targetPortfolioId = formData.get("targetPortfolioId") as string;
	const note = (formData.get("note") as string) || "";
	const executedAt =
		new Date(formData.get("executedAt") as string) || new Date();

	try {
		const bond = await db.asset.findUnique({ where: { id: bondId } });
		if (!bond || bond.quantity < quantityToSell) {
			return {
				success: false,
				error: "Niewystarczająca ilość jednostek obligacji.",
			};
		}

		const ratio = quantityToSell / bond.quantity;
		const capitalReduction = bond.investedCapital * ratio;
		const realizedProfit = totalSellValue - capitalReduction;

		const isFullSale = bond.quantity === quantityToSell;

		await db.$transaction(async (tx) => {
			// 2. AKTUALIZACJA OBLIGACJI
			if (isFullSale) {
				await tx.asset.delete({ where: { id: bondId } });
			} else {
				await tx.asset.update({
					where: { id: bondId },
					data: {
						quantity: { decrement: quantityToSell },
						investedCapital: { decrement: capitalReduction },
						currentValue: { decrement: bond.currentValue * ratio },
					},
				});
			}

			// 3. HISTORIA SPRZEDAŻY (Zostaje w portfelu OBLIGACJI dla wykresu)
			await tx.transactionHistory.create({
				data: {
					type: "SELL",
					portfolioId: bond.portfolioId, // Historia tam, gdzie było aktywo
					assetName: bond.name,
					ticker: bond.ticker,
					quantity: -quantityToSell,
					executedValue: totalSellValue,
					category: "BONDS",
					executedAt,
					rationale:
						note ||
						`Sprzedaż: ${quantityToSell} szt. Zysk: +${realizedProfit.toFixed(2)} PLN`,
				},
			});

			// 4. KSIĘGOWANIE GOTÓWKI (Jeśli wybrano portfel docelowy)
			if (targetPortfolioId && targetPortfolioId !== "none") {
				const existingCash = await tx.asset.findFirst({
					where: { portfolioId: targetPortfolioId, ticker: "CASH" },
				});

				if (existingCash) {
					await tx.asset.update({
						where: { id: existingCash.id },
						data: {
							quantity: { increment: totalSellValue },
							currentValue: { increment: totalSellValue },
							investedCapital: { increment: totalSellValue },
						},
					});
				} else {
					// Tworzymy nową pozycję CASH
					await tx.asset.create({
						data: {
							portfolioId: targetPortfolioId,
							name: "Gotówka",
							ticker: "CASH",
							category: "CASH",
							quantity: totalSellValue,
							currentValue: totalSellValue,
							investedCapital: totalSellValue,
							purchaseDate: executedAt,
						},
					});
				}

				// Historia wpływu do portfela CASH (Zielony plus)
				await tx.transactionHistory.create({
					data: {
						type: "BUY",
						portfolioId: targetPortfolioId,
						assetName: "Gotówka",
						ticker: "CASH",
						quantity: totalSellValue,
						executedValue: totalSellValue,
						category: "CASH",
						executedAt,
						rationale: `Wpływ ze sprzedaży obligacji ${bond.name}`,
					},
				});
			}
		});

		revalidatePath("/bond-reports");
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Błąd sprzedaży obligacji:", error);
		return { success: false, error: "Błąd serwera podczas sprzedaży." };
	}
}

export async function importBondsAction(
	portfolioId: string,
	aggregatedBonds: any[],
) {
	try {
		for (const key in aggregatedBonds) {
			const bond = aggregatedBonds[key];
			const expiryDate = new Date(bond.expiryDate);

			// Obliczanie daty zakupu (inferred)
			const prefix = bond.ticker.match(/^[A-Z]+/)?.[0] || "EDO";
			const duration = 10; // Możesz tu zaimportować BOND_DURATIONS
			const purchaseDate = new Date(expiryDate);
			purchaseDate.setFullYear(expiryDate.getFullYear() - duration);

			const uniqueTicker = `${bond.ticker}_${expiryDate.toISOString().split("T")[0]}`;

			// 1. Zapisujemy NOMINAŁ do historii transakcji
			await saveXtbTransaction(
				{
					date: purchaseDate,
					ticker: uniqueTicker,
					assetName: bond.assetName,
					amountPLN: bond.investedValue, // Koszt zakupu
					quantity: bond.quantity,
					category: "BONDS",
					type: "UPDATE",
					uniqueKey: `BOND_${uniqueTicker}_${portfolioId}`,
					exchangeRate: 1,
					comment: `Automatyczny import: Nominał ${bond.investedValue}`,
				},
				portfolioId,
			);
		}

		// 2. Synchronizacja (ustawi investedCapital na nominał)
		await syncPortfolioAssets(portfolioId);

		// 3. Aktualizacja WYCENY AKTUALNEJ w tabeli Asset
		for (const key in aggregatedBonds) {
			const bond = aggregatedBonds[key];
			const uniqueTicker = `${bond.ticker}_${new Date(bond.expiryDate).toISOString().split("T")[0]}`;

			const asset = await db.asset.findFirst({
				where: { portfolioId, ticker: uniqueTicker },
			});

			if (asset) {
				// Ustawiamy realną wycenę z raportu
				await updateAssetValues(asset.id, bond.currentValue);
			}
		}

		revalidatePath("/bond-reports");
		return { success: true };
	} catch (error) {
		console.error("Import Error:", error);
		return { success: false, error: "Błąd podczas zapisu w bazie danych" };
	}
}

export async function updateImportedBondSpecs(
	portfolioId: string,
	ticker: string,
	currentValue: number,
	interestRate: number,
) {
	try {
		// EN: Direct update on asset table to supply current live valuation and interest rates
		await db.asset.update({
			where: {
				portfolioId_ticker: {
					portfolioId,
					ticker,
				},
			},
			data: {
				currentValue,
				interestRate,
			},
		});
		return { success: true };
	} catch (error) {
		console.error("Failed to update imported bond specs:", error);
		return { success: false, error };
	}
}

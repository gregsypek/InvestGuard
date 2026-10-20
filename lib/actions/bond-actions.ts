"use server";

import { ActionResponse, Bond } from "../types";
import {
	calculateLiveBondValue,
	getBondDictionaries,
} from "../bond-calculations";
import { syncPortfolioAssets, updateAssetValues } from "./asset-actions";

import { BOND_TEMPLATES } from "../constants";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/format-currency";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { saveXtbTransaction } from "./transactions";

export async function getBonds(portfolioId?: string) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	if (!portfolioId) {
		return [];
	}

	const bonds = await db.asset.findMany({
		where: {
			category: "BONDS",
			portfolioId: portfolioId,
			portfolio: {
				userId: session.user.id,
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

	const [portfolio, rawBonds, rawInflation, rawConfigs] = await Promise.all([
		db.portfolio.findUnique({
			where: { id: portfolioId, userId: session.user.id },
			select: { name: true },
		}),
		getBonds(portfolioId),
		db.inflationRate.findMany(),
		db.bondSeriesConfig.findMany(),
	]);

	if (!portfolio) notFound();

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

	// 🚀 ZAMEK BEZPIECZEŃSTWA NA EKRANIE:
	// Sprawdzamy, czy w ogóle mamy słowniki, żeby kalkulator miał prawo działać
	const hasDictionaries = Object.keys(inflationMap).length > 0;

	const bonds: Bond[] = rawBonds.map((b) => {
		const cleanTicker = b.ticker ? b.ticker.split("_")[0] : "NIEZNANY";

		let effectiveInterestRate = configMap[cleanTicker]
			? configMap[cleanTicker].firstYearRate
			: (b.interestRate ?? 0);

		if (
			effectiveInterestRate === 0 &&
			Number(b.investedCapital) > 0 &&
			Number(b.currentValue) > Number(b.investedCapital)
		) {
			const now = new Date();
			const pDate = b.purchaseDate ? new Date(b.purchaseDate) : null;
			if (pDate) {
				const diffYears = Math.max(
					0.1,
					(now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
				);
				effectiveInterestRate = Number(
					(
						((Number(b.currentValue) - Number(b.investedCapital)) /
							Number(b.investedCapital) /
							diffYears) *
						100
					).toFixed(2),
				);
			}
		}

		const calculated = calculateLiveBondValue(
			Number(b.investedCapital),
			effectiveInterestRate,
			b.purchaseDate,
			cleanTicker,
			inflationMap,
			configMap,
		);

		// 🚀 KLUCZOWA ZMIANA:
		// Jeśli nie mamy słowników, kalkulator kłamie. Sztywno używamy wyceny z raportu!
		let finalValue = Number(b.currentValue);
		if (hasDictionaries && calculated.value > Number(b.investedCapital)) {
			finalValue = calculated.value;
		}

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

			currentValue: finalValue, //
			interestRate: effectiveInterestRate,
			quantity: b.quantity ?? 0,
			currentPeriodRate:
				hasDictionaries && calculated.currentRate
					? calculated.currentRate
					: effectiveInterestRate,
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
			totalInvested: formatCurrency(totals.totalInvested),
			currentValue: formatCurrency(totals.currentValue),
			profit: formatCurrency(totals.currentValue - totals.totalInvested),
			avgYield:
				totals.totalInvested > 0
					? (totals.weightedSum / totals.totalInvested).toFixed(2)
					: "0",
		},
	};
}

export async function deleteBond(id: string) {
	try {
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
					type: "SELL",
					quantity: Math.abs(bond.quantity), // 🚀 FIX: Use absolute positive value to prevent "+-" UI layout bugs
					executedValue: Math.abs(bond.currentValue), // 🚀 FIX: Positive volume since SELL type natively handles negative balance shifts
					executedAt: new Date(),
					category: "BONDS",
					rationale: "[ZAMKNIĘCIE POZYCJI] Usunięcie transzy z portfela",
					comment: "[ZAMKNIĘCIE POZYCJI] Usunięcie transzy z portfela",
				},
			}),
			db.asset.delete({
				where: { id },
			}),
		]);

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

export async function getBondMaturityDate(
	purchaseDate: Date,
	ticker: string,
): Promise<Date> {
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
		const rawTicker = formData.get("ticker") as string;
		const purchaseDate = new Date(formData.get("purchaseDate") as string);
		const quantity = Number(formData.get("quantity")) || 1;
		const investedCapital = Number(formData.get("investedCapital"));
		const interestRate = Number(formData.get("interestRate")) || 0;
		const manualCurrentValueRaw = formData.get("manualCurrentValue");

		const rateType = getRateTypeByTicker(rawTicker);
		const maturityDate = await getBondMaturityDate(purchaseDate, rawTicker);

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
		const dateStr = purchaseDate.toISOString().split("T")[0];
		const dbTicker = `${prettyTicker}_${dateStr}`;
		const uniqueExternalId = `BOND_${prettyTicker}_${dateStr}`;

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

		await db.$transaction(async (tx) => {
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
					executedValue: valueDelta,
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
		console.error("🔥 Błąd w updateBondInterestRate:", error);
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
					portfolioId: bond.portfolioId,
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

			const duration = 10;
			const purchaseDate = new Date(expiryDate);
			purchaseDate.setFullYear(expiryDate.getFullYear() - duration);

			const uniqueTicker = `${bond.ticker}_${expiryDate.toISOString().split("T")[0]}`;

			await saveXtbTransaction(
				{
					date: purchaseDate,
					ticker: uniqueTicker,
					assetName: bond.assetName,
					amountPLN: bond.investedValue,
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

		await syncPortfolioAssets(portfolioId);

		for (const key in aggregatedBonds) {
			const bond = aggregatedBonds[key];
			const uniqueTicker = `${bond.ticker}_${new Date(bond.expiryDate).toISOString().split("T")[0]}`;
			const cleanTicker = bond.ticker ? bond.ticker.split("_")[0] : "";

			const asset = await db.asset.findFirst({
				where: {
					portfolioId,
					OR: [{ ticker: uniqueTicker }, { ticker: { contains: cleanTicker } }],
				},
			});

			if (asset) {
				let rate = Number(bond.interestRate) || 0;
				if (
					!rate &&
					bond.currentValue &&
					bond.investedValue &&
					bond.currentValue > bond.investedValue
				) {
					const now = new Date();
					const pDate = asset.purchaseDate
						? new Date(asset.purchaseDate)
						: new Date();
					const diffYears = Math.max(
						0.1,
						(now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
					);
					rate = Number(
						(
							((bond.currentValue - bond.investedValue) /
								bond.investedValue /
								diffYears) *
							100
						).toFixed(2),
					);
				}

				await db.asset.update({
					where: { id: asset.id },
					data: {
						currentValue: bond.currentValue || asset.currentValue,
						interestRate: rate > 0 ? rate : asset.interestRate,
					},
				});
			}
		}

		revalidatePath("/bond-reports");
		return { success: true };
	} catch (error) {
		console.error("Import Error:", error);
		return { success: false, error: "Błąd podczas zapisu w bazie danych" };
	}
}

// 🚀 ROZWIĄZANIE P2025 ORAZ AUTOMATYCZNEGO PRZELICZANIA PRZY IMPORCIE
export async function updateImportedBondSpecs(
	portfolioId: string,
	ticker: string,
	currentValue: number,
	interestRate: number,
) {
	try {
		const cleanTicker = ticker.split("_")[0];

		const existingAsset = await db.asset.findFirst({
			where: {
				portfolioId,
				OR: [{ ticker: ticker }, { ticker: { startsWith: cleanTicker } }],
			},
		});

		let calculatedRate = interestRate;

		// Jeśli w raporcie nie podano stopy %, obliczamy ją z różnicy wyceny i czasu
		if ((!calculatedRate || calculatedRate === 0) && existingAsset) {
			const capital = Number(existingAsset.investedCapital) || 0;
			const pDate = existingAsset.purchaseDate
				? new Date(existingAsset.purchaseDate)
				: null;
			if (capital > 0 && currentValue > capital && pDate) {
				const now = new Date();
				const diffYears = Math.max(
					0.1,
					(now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
				);
				const totalGainPct = (currentValue - capital) / capital;
				calculatedRate = Number(((totalGainPct / diffYears) * 100).toFixed(2));
			}
		}

		if (existingAsset) {
			await db.asset.update({
				where: { id: existingAsset.id },
				data: {
					currentValue:
						currentValue > 0 ? currentValue : existingAsset.currentValue,
					interestRate:
						calculatedRate > 0 ? calculatedRate : existingAsset.interestRate,
				},
			});
		} else {
			await db.asset.updateMany({
				where: {
					portfolioId,
					ticker: { contains: cleanTicker },
				},
				data: {
					currentValue,
					interestRate: calculatedRate,
				},
			});
		}

		return { success: true };
	} catch (error) {
		console.error("Failed to update imported bond specs:", error);
		return { success: false, error };
	}
}

export async function syncBondsWithMarket(portfolioId: string) {
	try {
		const { inflationMap, configMap } = await getBondDictionaries();

		// 🚀 ZAMEK BEZPIECZEŃSTWA (RAPORT JEST KRÓLEM)
		// Jeśli baza słowników jest pusta, nasza matematyka będzie zgadywanką.
		// Przerywamy synchronizację, aby NIE NADPISAĆ dokładnych danych z importu!
		if (Object.keys(inflationMap).length === 0) {
			console.warn(
				"Brak słowników inflacji GUS. Pomijam sztuczne przeliczanie wycen.",
			);
			return;
		}

		const bonds = await db.asset.findMany({
			where: { portfolioId, category: "BONDS" },
		});

		for (const bond of bonds) {
			const cleanTicker = bond.ticker ? bond.ticker.split("_")[0] : "UNKNOWN";

			const calculated = calculateLiveBondValue(
				Number(bond.investedCapital),
				bond.interestRate ?? 0,
				bond.purchaseDate,
				cleanTicker,
				inflationMap,
				configMap,
			);

			const valueDelta = calculated.value - Number(bond.currentValue);

			if (valueDelta > 0.01 || valueDelta < -0.01) {
				await db.asset.update({
					where: { id: bond.id },
					data: { currentValue: calculated.value },
				});
			}
		}
	} catch (error) {
		console.error("Error syncing bonds:", error);
	}
}

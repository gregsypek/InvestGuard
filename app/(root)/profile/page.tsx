import { CATEGORY_CONFIG } from "@/lib/constants";
import InvestorProfileClient from "@/components/profile/InvestorProfileClient";
import { auth } from "@/auth";
import { calculateXIRR } from "@/lib/utils";
import { db } from "@/lib/db";
// import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default async function InvestorProfilePage() {
	const session = await auth();

	// 1. Zaktualizowane zapytanie - dodano pobieranie transactionHistories
	const userDb = await db.user.findFirst({
		where: session?.user?.id ? { id: session.user.id } : undefined,
		include: {
			portfolios: {
				include: {
					assets: true,
					transactionHistories: true, // Naprawa błędu TS
				},
			},
		},
	});

	if (!userDb) {
		return <div className="p-8 text-center">Brak danych użytkownika</div>;
	}

	// 2. Mapowanie podstawowych danych użytkownika
	const userProfileData = {
		name: userDb.name || "Inwestor",
		email: userDb.email || "Brak email",
		// plan: userDb.role === "ADMIN" ? "Administrator" : "Konto Standardowe",
		plan: userDb.role === "SUBSCRIBER" ? "Premium" : "Podstawowy",
		joinedDate: format(new Date(userDb.createdAt), "d MMMM yyyy", {
			locale: pl,
		}),
		avatarUrl: userDb.image || undefined,
		// 🚀 KRYTYCZNE: Zwracamy true, jeśli pole password istnieje i nie jest puste
		hasPassword: !!userDb.password,
		// 🚀 PRZEKAZUJEMY STAN DO KLIENTA
		alertBonds: userDb.alertBonds,
		alertRebalancing: userDb.alertRebalancing,
		alertPlans: userDb.alertPlans,
	};

	// 3. Agregacja danych (najpierw zliczamy wszystkie kwoty z bazy)
	let totalInvested = 0;
	let globalCurrentValue = 0;
	let totalGoal = 0;
	const categorySums: Record<string, number> = {};

	userDb.portfolios.forEach((portfolio) => {
		totalGoal += portfolio.goal || 0;

		portfolio.assets.forEach((asset) => {
			totalInvested += asset.investedCapital || 0;
			globalCurrentValue += asset.currentValue || 0;

			if (!categorySums[asset.category]) {
				categorySums[asset.category] = 0;
			}
			categorySums[asset.category] += asset.currentValue || 0;
		});
	});

	// 4. Mapowanie portfeli i ich indywidualnego stażu rynkowego
	const mappedPortfolios = userDb.portfolios.map((p) => {
		const oldestTransaction = p.transactionHistories?.reduce(
			(oldest, current) => {
				return oldest.executedAt < current.executedAt ? oldest : current;
			},
			p.transactionHistories[0],
		);

		const tenure = oldestTransaction
			? format(new Date(oldestTransaction.executedAt), "d MMMM yyyy", {
					locale: pl,
				})
			: "Brak transakcji";
		const portfolioCurrentValue = p.assets.reduce(
			(sum, a) => sum + (a.currentValue || 0),
			0,
		);

		return {
			id: p.id,
			name: p.name,
			colorTheme: p.colorTheme || "blue",
			goal: p.goal || null,
			currentValue: portfolioCurrentValue,
			tenure,
		};
	});

	// 5. Globalny staż (wyliczenie absolutnie najstarszej transakcji)
	const allTransactions = userDb.portfolios.flatMap(
		(p) => p.transactionHistories || [],
	);
	const globalOldestTx =
		allTransactions.length > 0
			? allTransactions.reduce((oldest, current) =>
					oldest.executedAt < current.executedAt ? oldest : current,
				)
			: null;

	const globalTenure = globalOldestTx
		? format(new Date(globalOldestTx.executedAt), "d MMMM yyyy", { locale: pl })
		: "Rozpocznij inwestowanie!";

	// 6. Mapowanie alokacji (korzysta z poprawnie wypełnionego categorySums)
	const allocationsData = Object.entries(categorySums)
		.map(([categoryKey, value]) => {
			// Szukamy konfiguracji w nowej tablicy
			const config = CATEGORY_CONFIG.find((c) => c.id === categoryKey);

			return {
				category: categoryKey,
				label: config?.name || "Nieznana", // Zwróci "Akcje", "Obligacje" itp.
				percent:
					globalCurrentValue > 0 ? (value / globalCurrentValue) * 100 : 0,
				colorClass: config?.color || "bg-gray-500", // Zwróci "bg-portfolio-booster"
			};
		})
		.filter((a) => a.percent > 0)
		.sort((a, b) => b.percent - a.percent);
	console.log("🚀 ~ InvestorProfilePage ~ allocationsData:", allocationsData);

	const cashFlows = allTransactions
		.filter((tx) => tx.type !== "UPDATE")
		.map((tx) => {
			const isOutflow = tx.type === "BUY" || tx.type === "DEPOSIT";
			return {
				amount: isOutflow ? -tx.executedValue : tx.executedValue,
				date: new Date(tx.executedAt),
			};
		})
		.flat(Infinity); // 🚀 TO ROZWIĄŻE PROBLEM NaN (spłaszcza tablicę tablic do jednego poziomu)

	// 2. Dodajemy dzisiejszą wycenę na płaskiej tablicy
	if (globalCurrentValue > 0) {
		cashFlows.push({
			amount: globalCurrentValue,
			date: new Date(),
		});
	}
	if (globalCurrentValue > 0) {
		cashFlows.push({
			amount: globalCurrentValue,
			date: new Date(),
		});
	}

	// 9. Odpalamy nasz silnik Newtona-Raphsona (mnożymy * 100 dla procentów)
	// Jeśli masz tylko 1 transakcję z dzisiaj, XIRR może zwrócić 0
	const globalMwr = calculateXIRR(cashFlows) * 100;

	// 10. Konstruowanie spójnego podsumowania dla klienta
	const summary = {
		totalInvested,
		currentValue: globalCurrentValue,
		totalGoal,
		globalTenure,
		globalMwr, // 🚀 DODANE: Przekazujemy gotowy wskaźnik do UI
	};

	return (
		<InvestorProfileClient
			user={userProfileData}
			initialPortfolios={mappedPortfolios}
			allocations={allocationsData}
			summary={summary}
		/>
	);
}

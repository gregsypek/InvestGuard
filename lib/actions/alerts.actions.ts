"use server";

import { Resend } from "resend";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function runSmartAlerts() {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: "Brak autoryzacji." };
		}

		const userId = session.user.id;

		// Pobieramy użytkownika wraz z jego ustawieniami alertów
		const dbUser = await db.user.findUnique({
			where: { id: userId },
			select: {
				name: true,
				email: true,
				alertBonds: true,
				alertRebalancing: true,
				alertPlans: true,
			},
		});

		if (!dbUser || !dbUser.email) {
			return {
				success: false,
				error: "Nie znaleziono użytkownika lub adresu e-mail.",
			};
		}

		const userName = dbUser.name || "Inwestorze";
		let alertsTriggered = 0;
		const today = new Date();

		// ==========================================
		// 1. STRAŻNIK OBLIGACJI (Tylko 30 dni i 7 dni)
		// ==========================================
		if (dbUser.alertBonds) {
			const today = new Date();

			// Definiujemy dokładnie 30 dzień od dzisiaj
			const target30Start = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate() + 30,
			);
			const target30End = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate() + 31,
			);

			// Definiujemy dokładnie 7 dzień od dzisiaj
			const target7Start = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate() + 7,
			);
			const target7End = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate() + 8,
			);

			const maturingBonds = await db.asset.findMany({
				where: {
					portfolio: { userId },
					category: "BONDS",
					OR: [
						{ maturityDate: { gte: target30Start, lt: target30End } },
						{ maturityDate: { gte: target7Start, lt: target7End } },
					],
				},
				include: { portfolio: { select: { name: true } } },
			});

			if (maturingBonds.length > 0) {
				const bondsListHtml = maturingBonds
					.map(
						(bond) => `
						<li style="margin-bottom: 12px; line-height: 1.5;">
							<strong>${bond.name} ${bond.ticker ? `(${bond.ticker})` : ""}</strong><br/>
							Szacowana wartość: <strong style="color: #10b981;">${bond.currentValue.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} PLN</strong><br/>
							Data wykupu: <strong style="color: #ef4444;">${bond.maturityDate?.toLocaleDateString("pl-PL")}</strong>
						</li>
					`,
					)
					.join("");

				await resend.emails.send({
					from: "InvestGuard <onboarding@resend.dev>",
					to: [dbUser.email],
					subject: "⚠️ InvestGuard: Zbliża się termin wykupu obligacji!",
					html: `
						<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px;">
							<h2 style="color: #3b82f6; margin-top: 0;">Wykup Obligacji</h2>
							<p>Witaj <strong>${userName}</strong>,</p>
							<p>System wykrył, że w ciągu najbliższych 30 dni zapadają poniższe obligacje:</p>
							<ul style="background: #f8fafc; padding: 20px 20px 20px 40px; border-radius: 8px; border: 1px solid #e2e8f0;">
								${bondsListHtml}
							</ul>
						</div>
					`,
				});
				alertsTriggered++;
			}
		}

		// ==========================================
		// 2. STRAŻNIK ALOKACJI (Uniwersalny Rebalancing)
		// ==========================================
		if (dbUser.alertRebalancing) {
			const portfolios = await db.portfolio.findMany({
				where: { userId },
				include: { assets: true },
			});

			for (const portfolio of portfolios) {
				const totalValue = portfolio.assets.reduce(
					(sum, a) => sum + (a.currentValue || 0),
					0,
				);
				if (totalValue === 0) continue;

				// Mapujemy kategorie z aktywów na pola docelowe w modelu Portfolio
				const targetMap: Record<string, number> = {
					BONDS: portfolio.targetBonds,
					DEVELOPED: portfolio.targetDeveloped,
					EMERGING: portfolio.targetEmerging,
					GOLD: portfolio.targetGold,
					BOOSTER: portfolio.targetBooster,
					CASH: portfolio.targetCash,
					CRYPTO: portfolio.targetCrypto,
					COMMODITIES: portfolio.targetCommodities,
					REAL_ESTATE: portfolio.targetRealEstate,
					CUSTOM: portfolio.targetCustom,
				};

				const deviations: {
					category: string;
					current: number;
					target: number;
				}[] = [];
				const DEVIATION_THRESHOLD = 3.0; // Próg błędu (np. alert gdy odjedzie o +/- 3 punkty procentowe)

				Object.entries(targetMap).forEach(([category, target]) => {
					// Sprawdzamy tylko te kategorie, dla których ustawiłeś cel > 0 w portfelu
					if (target > 0) {
						const categoryAssets = portfolio.assets.filter(
							(a) => a.category === category,
						);
						const categoryValue = categoryAssets.reduce(
							(sum, a) => sum + (a.currentValue || 0),
							0,
						);
						const currentPercentage = (categoryValue / totalValue) * 100;

						// Jeśli różnica absolutna jest większa niż nasz próg
						if (Math.abs(currentPercentage - target) >= DEVIATION_THRESHOLD) {
							deviations.push({
								category,
								current: currentPercentage,
								target,
							});
						}
					}
				});

				// Jeśli wystąpiły jakiekolwiek odchylenia, generujemy zbiorczy raport dla tego portfela
				if (deviations.length > 0) {
					const deviationsHtml = deviations
						.map((dev) => {
							const isOver = dev.current > dev.target;
							const color = isOver ? "#d97706" : "#2563eb"; // Pomarańczowy dla przeważenia, Niebieski dla niedoważenia
							return `
							<div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid ${color};">
								<p style="margin: 0; font-weight: bold;">Kategoria: ${dev.category}</p>
								<p style="margin: 4px 0 0 0; font-size: 14px;">
									Udział: <strong style="color: ${color};">${dev.current.toFixed(2)}%</strong> 
									(Cel: ${dev.target}%)
								</p>
							</div>
						`;
						})
						.join("");

					// By nie spamować codziennie w przypadku długotrwałego odchylenia,
					// ten raport możemy warunkować do wysyłki np. tylko raz w tygodniu (w piątki) w zautomatyzowanym Cronie:
					// if (today.getDay() === 5) { ... wysyłka ... }

					await resend.emails.send({
						from: "InvestGuard <onboarding@resend.dev>",
						to: [dbUser.email],
						subject: `⚖️ InvestGuard: Wymagany Rebalancing (${portfolio.name})`,
						html: `
							<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px;">
								<h2 style="color: #334155; margin-top: 0;">Raport Alokacji Portfela</h2>
								<p>Witaj <strong>${userName}</strong>,</p>
								<p>W portfelu <strong>${portfolio.name}</strong> wykryto kategorie, które odchyliły się od docelowej wagi o ponad ${DEVIATION_THRESHOLD}%:</p>
								
								<div style="margin: 20px 0;">
									${deviationsHtml}
								</div>
								
								<p style="font-size: 14px; color: #475569;">Rozważ sprzedaż części aktywów przeważonych i dokupienie niedoważonych, aby przywrócić zaplanowany profil ryzyka.</p>
							</div>
						`,
					});
					alertsTriggered++;
				}
			}
		}
		// ==========================================
		// 3. STRAŻNIK DYSCYPLINY (Plany Inwestycyjne)
		// ==========================================
		// Uruchamia się tylko, jeśli mamy końcówkę miesiąca (np. po 20. dniu)
		if (dbUser.alertPlans && today.getDate() === 25) {
			// Tworzymy string w formacie "YYYY-MM", np. "2026-09", żeby pasował do Twojej bazy
			const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

			const unexecutedPlans = await db.investmentPlan.findMany({
				where: {
					portfolio: { userId },
					isExecuted: false,
					plannedDate: currentYearMonth, // Używamy Twojego pola typu String
				},
			});

			if (unexecutedPlans.length > 0) {
				const plansHtml = unexecutedPlans
					.map(
						(plan) =>
							`<li style="margin-bottom: 8px;"><strong>${plan.name}</strong> - szacowana kwota: <strong style="color: #10b981;">${plan.value} PLN</strong></li>`,
					) // Używamy pola plan.value
					.join("");

				await resend.emails.send({
					from: "InvestGuard <onboarding@resend.dev>",
					to: [dbUser.email],
					subject: "🎯 InvestGuard: Przypomnienie o Planie Inwestycyjnym",
					html: `
						<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px;">
							<h2 style="color: #8b5cf6; margin-top: 0;">Dyscyplina Inwestycyjna</h2>
							<p>Witaj <strong>${userName}</strong>,</p>
							<p>Mamy końcówkę miesiąca, a w Twoim portfelu wciąż widnieją niezrealizowane cele na bieżący miesiąc (${currentYearMonth}):</p>
							<ul style="background: #f8fafc; padding: 20px 20px 20px 40px; border-radius: 8px; border: 1px solid #e2e8f0;">
								${plansHtml}
							</ul>
							<p style="margin-top: 20px;">Nie zapomnij wykonać transferów przed końcem miesiąca, aby utrzymać tempo wzrostu kapitału!</p>
						</div>
					`,
				});
				alertsTriggered++;
			}
		}

		if (alertsTriggered > 0) {
			return {
				success: true,
				message: `Skrypt zakończony. Wysłano ${alertsTriggered} powiadomień e-mail.`,
			};
		}

		return {
			success: true,
			message:
				"Strażnik sprawdził portfel. Wszystko pod kontrolą, brak akcji do wykonania.",
		};
	} catch (error) {
		console.error("Błąd systemu alertów:", error);
		return {
			success: false,
			error: "Nie udało się uruchomić strażnika alertów.",
		};
	}
}

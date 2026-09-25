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
		// 1. STRAŻNIK OBLIGACJI (Bonds Maturity)
		// ==========================================
		if (dbUser.alertBonds) {
			const nextMonth = new Date();
			nextMonth.setDate(today.getDate() + 30);

			const maturingBonds = await db.asset.findMany({
				where: {
					portfolio: { userId },
					category: "BONDS",
					maturityDate: { gte: today, lte: nextMonth },
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
		// 2. STRAŻNIK ALOKACJI (Rebalancing)
		// ==========================================
		if (dbUser.alertRebalancing) {
			const allAssets = await db.asset.findMany({
				where: { portfolio: { userId } },
			});

			const totalPortfolioValue = allAssets.reduce(
				(sum, asset) => sum + (asset.currentValue || 0),
				0,
			);
			const boosterAssets = allAssets.filter(
				(a) => a.category === "CRYPTO" || a.category === "COMMODITIES",
			);
			const boosterValue = boosterAssets.reduce(
				(sum, a) => sum + (a.currentValue || 0),
				0,
			);

			if (totalPortfolioValue > 0) {
				const boosterPercentage = (boosterValue / totalPortfolioValue) * 100;
				const TARGET_PERCENTAGE = 5;
				const ALERT_THRESHOLD = 7.5;

				if (boosterPercentage >= ALERT_THRESHOLD) {
					await resend.emails.send({
						from: "InvestGuard <onboarding@resend.dev>",
						to: [dbUser.email],
						subject: "⚖️ InvestGuard: Wymagany Rebalancing (Booster)",
						html: `
							<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px;">
								<h2 style="color: #f59e0b; margin-top: 0;">Odchylenie Alokacji</h2>
								<p>Witaj <strong>${userName}</strong>,</p>
								<p>Twoja kategoria <strong>Booster</strong> przekroczyła bezpieczny próg alarmowy (${ALERT_THRESHOLD}%).</p>
								<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
									<p style="margin: 0;">Obecny udział: <strong style="color: #d97706; font-size: 18px;">${boosterPercentage.toFixed(2)}%</strong></p>
									<p style="margin: 5px 0 0 0; font-size: 13px; color: #b45309;">Cel docelowy: <strong>${TARGET_PERCENTAGE}%</strong></p>
								</div>
								<p>Rozważ realizację zysków i transfer kapitału do bezpiecznej części portfela.</p>
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
		if (dbUser.alertPlans && today.getDate() >= 20) {
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

"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { db } from "@/lib/db";

interface InflationPoint {
	yearMonth: string; // Format: "YYYY-MM"
	value: number; // YoY inflation in % (e.g., 3.5)
}

// Primary source: Stooq monthly Polish GUS CPI YoY series (cpiypl.m)
async function fetchFromStooqCpi(): Promise<InflationPoint[]> {
	const urls = [
		"https://stooq.pl/q/d/l/?s=cpiypl.m&i=m",
		"https://stooq.com/q/d/l/?s=cpiypl.m&i=m",
	];

	for (const url of urls) {
		try {
			const res = await fetch(url, {
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
					Accept: "text/csv,text/plain,*/*",
					Referer: "https://stooq.pl/",
				},
				cache: "no-store",
			});

			if (!res.ok) {
				console.warn(`[INFLATION] Stooq HTTP ${res.status} (${url})`);
				continue;
			}

			const csv = await res.text();
			const lines = csv.trim().split("\n");

			if (
				lines.length <= 2 ||
				(!lines[0].toLowerCase().includes("data") &&
					!lines[0].toLowerCase().includes("date"))
			) {
				console.warn(
					`[INFLATION] Stooq nieoczekiwana odpowiedź (${url}): ${lines[0]?.slice(0, 80)}`,
				);
				continue;
			}

			const pointsMap = new Map<string, number>();
			for (let i = 1; i < lines.length; i++) {
				const cols = lines[i].split(",");
				if (cols.length < 5) continue;
				const dateStr = cols[0].trim(); // YYYY-MM-DD
				const close = parseFloat(cols[4]);
				if (dateStr.length >= 7 && !isNaN(close)) {
					pointsMap.set(dateStr.substring(0, 7), Number(close.toFixed(2)));
				}
			}

			if (pointsMap.size > 0) {
				return Array.from(pointsMap.entries()).map(([yearMonth, value]) => ({
					yearMonth,
					value,
				}));
			}
		} catch (err) {
			console.warn(`[INFLATION] Błąd połączenia ze Stooq (${url}):`, err);
		}
	}

	return [];
}

// Fallback source: FRED OECD/GUS Polish national CPI YoY (CPALTT01PLM659N)
async function fetchFromFredCpi(): Promise<InflationPoint[]> {
	try {
		const res = await fetch(
			"https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPALTT01PLM659N",
			{
				headers: { Accept: "text/csv,text/plain,*/*" },
				cache: "no-store",
			},
		);

		if (!res.ok) {
			console.warn(`[INFLATION] FRED HTTP ${res.status}`);
			return [];
		}

		const csv = await res.text();
		const lines = csv.trim().split("\n");
		if (lines.length <= 2) return [];

		const points: InflationPoint[] = [];
		for (let i = 1; i < lines.length; i++) {
			const cols = lines[i].split(",");
			if (cols.length < 2) continue;
			const dateStr = cols[0].trim(); // YYYY-MM-DD
			const val = parseFloat(cols[1]);
			if (dateStr.length >= 7 && !isNaN(val)) {
				points.push({
					yearMonth: dateStr.substring(0, 7),
					value: Number(val.toFixed(2)),
				});
			}
		}

		return points;
	} catch (err) {
		console.warn("[INFLATION] Błąd połączenia z FRED:", err);
		return [];
	}
}

export async function syncGusInflation(monthsBack: number = 24) {
	try {
		let points = await fetchFromStooqCpi();
		let source = "GUS / Stooq (cpiypl.m)";

		if (points.length === 0) {
			points = await fetchFromFredCpi();
			source = "FRED / GUS CPI";
		}

		if (points.length === 0) {
			return {
				success: false,
				error:
					"Nie udało się pobrać odczytów inflacji. Sprawdź logi w terminalu.",
			};
		}

		// Keep only the most recent N months
		const recentPoints = points
			.sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
			.slice(0, monthsBack);

		await db.$transaction(
			recentPoints.map((pt) =>
				db.inflationRate.upsert({
					where: { yearMonth: pt.yearMonth },
					update: { value: pt.value },
					create: { yearMonth: pt.yearMonth, value: pt.value },
				}),
			),
		);

		revalidateTag("inflation", "max");
		revalidatePath("/bond-reports");
		revalidatePath("/dashboard");

		return {
			success: true,
			count: recentPoints.length,
			latest: recentPoints[0],
			source,
		};
	} catch (error) {
		console.error("[INFLATION] Błąd zapisu inflacji do bazy:", error);
		return { success: false, error: "Błąd zapisu inflacji do bazy." };
	}
}

// Guarded helper for daily cron: only hits external API if previous month's CPI is missing
export async function syncInflationIfNeeded() {
	const prevMonthDate = new Date();
	prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
	const targetYearMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

	const existing = await db.inflationRate.findUnique({
		where: { yearMonth: targetYearMonth },
		select: { id: true },
	});

	if (existing) {
		return { skipped: true, targetYearMonth };
	}

	return syncGusInflation(6);
}

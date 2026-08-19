"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. INFLACJA GUS
// ==========================================
export async function getInflationRates() {
	return await db.inflationRate.findMany({
		orderBy: { yearMonth: "desc" },
	});
}

export async function addInflationRate(formData: FormData) {
	try {
		const yearMonth = formData.get("yearMonth") as string;
		const value = Number(formData.get("value"));

		await db.inflationRate.upsert({
			where: { yearMonth },
			update: { value },
			create: { yearMonth, value },
		});

		revalidatePath("/settings");
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Błąd podczas zapisu inflacji." };
	}
}

export async function deleteInflationRate(id: string) {
	try {
		await db.inflationRate.delete({ where: { id } });
		revalidatePath("/settings");
		return { success: true };
	} catch (error) {
		return { success: false, error: "Błąd usuwania." };
	}
}

// ==========================================
// 2. KONFIGURACJE SERII OBLIGACJI
// ==========================================
export async function getBondConfigs() {
	return await db.bondSeriesConfig.findMany({
		orderBy: { seriesCode: "desc" },
	});
}

export async function addBondConfig(formData: FormData) {
	try {
		const rawSeries = formData.get("seriesCode") as string;
		const seriesCode = rawSeries.toUpperCase();
		const firstYearRate = Number(formData.get("firstYearRate"));

		const marginRaw = formData.get("margin") as string;
		// Jeśli wpisano marżę, zamieniamy na Number. Jeśli puste - null (dla stałoprocentowych)
		const margin = marginRaw ? Number(marginRaw) : null;

		await db.bondSeriesConfig.upsert({
			where: { seriesCode },
			update: { firstYearRate, margin },
			create: { seriesCode, firstYearRate, margin },
		});

		revalidatePath("/settings");
		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Błąd podczas zapisu konfiguracji serii." };
	}
}

export async function deleteBondConfig(id: string) {
	try {
		await db.bondSeriesConfig.delete({ where: { id } });
		revalidatePath("/settings");
		return { success: true };
	} catch {
		return { success: false, error: "Błąd usuwania." };
	}
}

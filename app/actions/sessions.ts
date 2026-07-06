"use server";

import { UAParser } from "ua-parser-js";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// 1. POBIERANIE WSZYSTKICH AKTYWNYCH SESJI UŻYTKOWNIKA
export async function getActiveSessions() {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Brak autoryzacji");

	// @ts-ignore - dodamy sessionId do typów NextAuth za chwilę
	const currentSessionId = session.user.sessionId;

	// Pobieramy tylko ważne (żyjące) sesje
	const dbSessions = await db.deviceSession.findMany({
		where: {
			userId: session.user.id,
			isValid: true,
		},
		orderBy: { lastActive: "desc" },
	});

	return dbSessions.map((s) => {
		// Magia parsera: zamienia "Mozilla/5.0..." na ładne obiekty
		const parser = new UAParser(s.userAgent);
		const browser = parser.getBrowser();
		const os = parser.getOS();
		const device = parser.getDevice();

		const deviceType =
			device.type === "mobile" || device.type === "tablet"
				? "mobile"
				: "desktop";
		const deviceName =
			device.vendor && device.model
				? `${device.vendor} ${device.model}`
				: os.name
					? `Komputer ${os.name}`
					: "Nieznane urządzenie";

		return {
			id: s.id,
			device: deviceName,
			browser: `${browser.name || "Nieznana przeglądarka"} na ${os.name || "systemie"}`,
			location: "Zgodnie z Twoim IP", // Zastępcze (prawdziwa geolokalizacja to osobny temat)
			ip: s.ipAddress,
			lastActive: s.lastActive.toLocaleString("pl-PL"),
			isCurrent: s.id === currentSessionId,
			type: deviceType,
		};
	});
}

// 2. WYLOGOWANIE ZE WSZYSTKICH INNYCH URZĄDZEŃ
export async function revokeOtherSessions() {
	const session = await auth();
	// @ts-ignore
	if (!session?.user?.id || !session.user.sessionId) return { success: false };

	await db.deviceSession.updateMany({
		where: {
			userId: session.user.id,
			// @ts-ignore - Wyłączamy wszystkie POZA obecną
			id: { not: session.user.sessionId },
		},
		data: { isValid: false },
	});

	return { success: true };
}

// 3. WYLOGOWANIE Z POJEDYNCZEGO (KONKRETNEGO) URZĄDZENIA
export async function revokeSingleSession(sessionId: string) {
	const session = await auth();
	if (!session?.user?.id) return { success: false };

	await db.deviceSession.update({
		where: { id: sessionId, userId: session.user.id },
		data: { isValid: false },
	});

	return { success: true };
}

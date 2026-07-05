"use server";

import * as OTPAuth from "otpauth";

import { APP_NAME } from "@/lib/constants";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// 1. GENEROWANIE KODU QR I SEKRETU
export async function setupTwoFactor() {
	const session = await auth();
	if (!session?.user?.id || !session.user.email)
		throw new Error("Brak autoryzacji");

	// Tworzymy nową instancję TOTP
	const totp = new OTPAuth.TOTP({
		issuer: APP_NAME || "Invest Guard",
		label: session.user.email,
		algorithm: "SHA1",
		digits: 6,
		period: 30,
		secret: new OTPAuth.Secret({ size: 20 }), // Magia! Automatycznie tworzy silny sekret Base32
	});

	const secret = totp.secret.base32;

	await db.user.update({
		where: { id: session.user.id },
		data: {
			twoFactorSecret: secret,
			isTwoFactorEnabled: false,
		},
	});

	// Generuje idealny link dla Google Authenticatora
	const otpauthUrl = totp.toString();

	const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
	return { qrCodeDataUrl };
}

// 2. WERYFIKACJA KODU PIN Z TELEFONU I WŁĄCZENIE 2FA
export async function verifyAndEnableTwoFactor(token: string) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Brak autoryzacji");

	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: { twoFactorSecret: true },
	});

	if (!user?.twoFactorSecret) throw new Error("Brak wygenerowanego sekretu.");

	const totp = new OTPAuth.TOTP({
		algorithm: "SHA1",
		digits: 6,
		period: 30,
		secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
	});

	// Weryfikacja (window: 1 pozwala na 30 sekund spóźnienia w wpisywaniu kodu)
	const delta = totp.validate({ token, window: 1 });

	if (delta === null) throw new Error("Nieprawidłowy kod weryfikacyjny.");

	await db.user.update({
		where: { id: session.user.id },
		data: { isTwoFactorEnabled: true },
	});

	return { success: true };
}

// 3. WYŁĄCZENIE 2FA
export async function disableTwoFactor() {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Brak autoryzacji");

	await db.user.update({
		where: { id: session.user.id },
		data: {
			isTwoFactorEnabled: false,
			twoFactorSecret: null,
		},
	});

	return { success: true };
}

"use server";

import * as OTPAuth from "otpauth";

import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// ============================================================================
// 1. USUWANIE KONTA (Kaskadowe, zabezpieczone 2FA lub hasłem)
// ============================================================================
export async function deleteMyAccount(confirmValue: string) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Brak autoryzacji");

	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: {
			password: true,
			isTwoFactorEnabled: true,
			twoFactorSecret: true,
		},
	});

	if (!user) throw new Error("Nie znaleziono użytkownika");

	// PRIORYTET 1: 2FA
	if (user.isTwoFactorEnabled && user.twoFactorSecret) {
		if (!confirmValue)
			throw new Error("Musisz podać kod 2FA, aby usunąć konto.");

		const totp = new OTPAuth.TOTP({
			algorithm: "SHA1",
			digits: 6,
			period: 30,
			secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
		});

		const delta = totp.validate({ token: confirmValue, window: 1 });
		if (delta === null) throw new Error("Podany kod 2FA jest nieprawidłowy.");
	}
	// PRIORYTET 2: HASŁO
	else if (user.password) {
		if (!confirmValue) throw new Error("Musisz podać hasło, aby usunąć konto.");

		const isPasswordValid = await bcrypt.compare(confirmValue, user.password);
		if (!isPasswordValid)
			throw new Error("Wprowadzone hasło jest nieprawidłowe.");
	}

	await db.user.delete({
		where: { id: session.user.id },
	});

	return { success: true };
}

// ============================================================================
// 2. ZMIANA HASŁA (Dla kont e-mail)
// ============================================================================
export async function changeUserPassword(
	oldPassword: string,
	newPassword: string,
) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Brak autoryzacji");

	const user = await db.user.findUnique({
		where: { id: session.user.id },
	});

	if (!user) throw new Error("Nie znaleziono użytkownika");

	if (!user.password) {
		throw new Error(
			"Twoje konto jest połączone z Google. Nie możesz zmienić hasła.",
		);
	}

	const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
	if (!isOldPasswordValid) {
		throw new Error("Obecne hasło jest nieprawidłowe.");
	}

	const hashedNewPassword = await bcrypt.hash(newPassword, 10);
	await db.user.update({
		where: { id: user.id },
		data: { password: hashedNewPassword },
	});

	return { success: true };
}

// ============================================================================
// 3. EKSPORT DANYCH (RODO / GDPR)
// ============================================================================
export async function exportUserData() {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Brak autoryzacji");

	const userData = await db.user.findUnique({
		where: { id: session.user.id },
		include: {
			portfolios: {
				include: {
					assets: true,
				},
			},
		},
	});

	if (!userData) throw new Error("Nie znaleziono użytkownika");

	// Usuwamy zahashowane hasło i sekret 2FA przed wysłaniem pliku do użytkownika!
	const { password, twoFactorSecret, ...safeUserData } = userData;

	return safeUserData;
}

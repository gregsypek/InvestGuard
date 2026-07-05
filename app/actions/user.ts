"use server";

import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function deleteMyAccount() {
	const session = await auth();

	// EN: Ensure only authenticated users can delete their own accounts
	if (!session?.user?.id) {
		throw new Error("Brak autoryzacji");
	}

	// EN: Delete the user from the database. Prisma will cascade and delete their portfolios/assets if relations are set up correctly.
	await db.user.delete({
		where: { id: session.user.id },
	});

	return { success: true };
}

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

	// Jeśli użytkownik ma konto tylko przez Google
	if (!user.password) {
		throw new Error(
			"Twoje konto jest połączone z Google. Nie możesz zmienić hasła.",
		);
	}

	// Weryfikacja starego hasła
	const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
	if (!isOldPasswordValid) {
		throw new Error("Obecne hasło jest nieprawidłowe.");
	}
	// Hashowanie i zapis nowego hasła
	const hashedNewPassword = await bcrypt.hash(newPassword, 10);
	await db.user.update({
		where: { id: user.id },
		data: { password: hashedNewPassword },
	});

	return { success: true };
}

export async function exportUserData() {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Brak autoryzacji");

	// Pobieramy użytkownika wraz z jego portfelami, aktywami i historią
	const userData = await db.user.findUnique({
		where: { id: session.user.id },
		include: {
			portfolios: {
				include: {
					assets: true,
					// Jeśli masz inne powiązane tabele (np. transakcje), możesz je tu dodać
				},
			},
		},
	});

	if (!userData) throw new Error("Nie znaleziono użytkownika");

	// Usuwamy poufne dane (zahashowane hasło) przed wysłaniem do użytkownika
	const { password, ...safeUserData } = userData;

	return safeUserData;
}

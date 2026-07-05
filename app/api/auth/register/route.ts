import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
	try {
		const { email, password, termsAccepted } = await req.json();

		if (!termsAccepted) {
			return new NextResponse("Musisz zaakceptować regulamin", { status: 400 });
		}
		if (!email || !password || password.length < 6) {
			return new NextResponse("Nieprawidłowe dane (hasło min. 6 znaków)", {
				status: 400,
			});
		}

		const existingUser = await db.user.findUnique({ where: { email } });
		if (existingUser) {
			return new NextResponse("Email jest już zajęty", { status: 400 });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		await db.user.create({
			data: {
				email,
				password: hashedPassword,
				name: email.split("@")[0], // Domyślne imię z części adresu email
			},
		});

		return NextResponse.json({ message: "Konto utworzone pomyślnie" });
	} catch (error) {
		// 🛑 DODAJEMY TO, ABY WIDZIEĆ BŁĄD W KONSOLI:
		console.error("🚨 BŁĄD PODCZAS REJESTRACJI:", error);
		return new NextResponse("Błąd serwera", { status: 500 });
	}
}

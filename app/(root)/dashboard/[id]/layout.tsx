import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function PortfolioLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ id: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	const { id } = await params;

	// ZABEZPIECZENIE: Upewniamy się, że portfel należy do TEGO użytkownika
	const portfolio = await db.portfolio.findUnique({
		where: { id, userId: session.user.id },
	});

	if (!portfolio) notFound();

	// Layout jest teraz czystym opakowaniem (zero problemów z mrożeniem nagłówków!)
	return <>{children}</>;
}

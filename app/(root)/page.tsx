import GuestOnboarding from "@/components/GuestOnboarding";
import { UserDashboard } from "@/components/UserDashboard";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function HomePage() {
	const session = await auth();

	if (!session?.user?.id) {
		return <GuestOnboarding />;
	}

	//1. Pobieramy portfele z aktywami
	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true, transactionHistories: true },
	});
	// 2. Pobieramy snapshoty dla tych portfeli z ostatnich 30 dni
	const snapshots = await db.portfolioSnapshot.findMany({
		where: {
			portfolioId: { in: portfolios.map((p) => p.id) },
			date: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
		},
		orderBy: { date: "asc" },
	});

	// 3. Przekazujemy to wszystko do komponentu UserDashboard
	return <UserDashboard portfolios={portfolios} snapshots={snapshots} />;
}

import GuestOnboarding from "@/components/GuestOnboarding";
import { UserDashboard } from "@/components/UserDashboard";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function HomePage() {
	const session = await auth();

	if (!session?.user?.id) {
		return <GuestOnboarding />;
	}

	// Pobieramy portfele z aktywami
	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true },
	});

	// Przekazujemy surowe dane do komponentu klienckiego
	return <UserDashboard portfolios={portfolios} />;
}

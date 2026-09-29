import SettingsClient from "./SettingsClient";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const ROLE_LIMITS = {
	REGULAR: 5,
	SUBSCRIBER: 15,
	ADMIN: 99,
};

interface Props {
	searchParams: Promise<{ from?: string }>;
}

export default async function SettingsPage({ searchParams }: Props) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/");
	}

	const resolvedSearchParams = await searchParams;
	const fromDashboard = resolvedSearchParams?.from === "dashboard";

	const cookieStore = await cookies();
	const hideBulbTip = cookieStore.get("hide_bulbtip")?.value === "true";
	const hideMarketTicker =
		cookieStore.get("hide_market_ticker")?.value === "true";

	const userRole = session.user.role || "REGULAR";
	const dbUser = await db.user.findUnique({
		where: { id: session.user.id },
		select: { observedIndices: true, password: true, isTwoFactorEnabled: true },
	});

	const hasPassword = !!dbUser?.password;
	const isTwoFactorEnabled = !!dbUser?.isTwoFactorEnabled;
	const userIndices = dbUser?.observedIndices || [];
	const maxLimit = ROLE_LIMITS[userRole as keyof typeof ROLE_LIMITS] || 5;

	// Pobieramy portfele (tylko aktywa, bo nie potrzebujemy już statystyk)
	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true },
	});

	const allAssets = portfolios.flatMap((p) => p.assets);

	const uniqueAssetsMap = new Map();
	allAssets.forEach((a) => {
		if (
			!uniqueAssetsMap.has(a.name) &&
			a.category !== "BONDS" &&
			a.category !== "CASH"
		) {
			uniqueAssetsMap.set(a.name, {
				name: a.name,
				category: a.category,
				isObserved: a.isObserved,
			});
		}
	});

	const uniqueAssets = Array.from(uniqueAssetsMap.values());

	return (
		<SettingsClient
			assets={uniqueAssets}
			maxLimit={maxLimit}
			userIndices={userIndices}
			initialShowBulbTip={!hideBulbTip}
			initialShowMarketTicker={!hideMarketTicker}
			hasPassword={hasPassword}
			isTwoFactorEnabled={isTwoFactorEnabled}
			userRole={userRole}
			fromDashboard={fromDashboard}
			email={session.user.email}
		/>
	);
}

import SettingsClient from "./SettingsClient";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

// EN: Define limits centrally
const ROLE_LIMITS = {
	REGULAR: 5,
	SUBSCRIBER: 15,
	ADMIN: 99,
};

export default async function SettingsPage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/");
	}

	const cookieStore = await cookies();
	const hideBulbTip = cookieStore.get("hide_bulbtip")?.value === "true";
	const hideMarketTicker =
		cookieStore.get("hide_market_ticker")?.value === "true";

	// EN: Get user role and calculate max limit
	const userRole = session.user.role || "REGULAR";
	const dbUser = await db.user.findUnique({
		where: { id: session.user.id },
		select: { observedIndices: true, password: true }, // Wyciągamy tylko hasło, żeby było szybko
	});

	const hasPassword = !!dbUser?.password; // Zamieniamy to na boolean (true jeśli ma hasło, false jeśli null)

	const userIndices = dbUser?.observedIndices || [];
	const maxLimit = ROLE_LIMITS[userRole as keyof typeof ROLE_LIMITS] || 5;

	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true },
	});

	const allAssets = portfolios.flatMap((p) => p.assets);

	const uniqueAssetsMap = new Map();
	console.log("🚀 ~ SettingsPage ~ uniqueAssetsMap:", uniqueAssetsMap);
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

	// EN: Pass maxLimit down to the client component
	return (
		<SettingsClient
			assets={uniqueAssets}
			maxLimit={maxLimit}
			userIndices={userIndices}
			initialShowBulbTip={!hideBulbTip}
			initialShowMarketTicker={!hideMarketTicker}
			hasPassword={hasPassword}
		/>
	);
}

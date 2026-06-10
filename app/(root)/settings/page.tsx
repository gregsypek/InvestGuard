import SettingsClient from "./SettingsClient";
import { auth } from "@/auth";
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

	// EN: Get user role and calculate max limit
	const userRole = session.user.role || "REGULAR";
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
	return <SettingsClient assets={uniqueAssets} maxLimit={maxLimit} />;
}

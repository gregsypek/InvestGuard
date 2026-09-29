import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { PortfoliosHeader } from "@/components/PortfoliosHeader";
import SettingsClient from "./SettingsClient";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getGlobalStats } from "@/lib/calculations";
import { redirect } from "next/navigation";

const ROLE_LIMITS = {
	REGULAR: 5,
	SUBSCRIBER: 15,
	ADMIN: 99,
};

// 🚀 DODANE: Interfejs odbierający parametry URL
interface Props {
	searchParams: Promise<{ from?: string }>;
}

export default async function SettingsPage({ searchParams }: Props) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/");
	}

	// 🚀 DODANE: Oczekujemy na parametry
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

	const portfolios = await db.portfolio.findMany({
		where: { userId: session.user.id },
		include: { assets: true, transactionHistories: true },
	});

	const { totalValue, portfoliosCount, assetsCount } =
		getGlobalStats(portfolios);
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
		<div>
			<PortfoliosHeader
				title="Ustawienia Konta"
				totalValue={totalValue}
				portfoliosCount={portfoliosCount}
				assetsCount={assetsCount}
				// 🚀 ZMIANA: Warunkowy render breadcrumbsów w zależności od parametru z URL
				customBreadcrumbs={
					fromDashboard ? (
						<nav className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
							<Link
								href="/"
								className={cn(
									"inline-flex items-center transition-all h-5 text-amber-600 underline decoration-amber-600/40 underline-offset-4 cursor-pointer font-medium",
								)}
							>
								<ChevronLeft
									className="w-4 h-4 mr-0.5 no-underline"
									strokeWidth={2.5}
								/>
								<span>Przegląd inwestycji</span>
							</Link>
							<span className="text-muted-foreground/40">/</span>
							<span className="text-primary font-medium lowercase">
								Ustawienia
							</span>
						</nav>
					) : undefined
				}
			/>

			<SettingsClient
				assets={uniqueAssets}
				maxLimit={maxLimit}
				userIndices={userIndices}
				initialShowBulbTip={!hideBulbTip}
				initialShowMarketTicker={!hideMarketTicker}
				hasPassword={hasPassword}
				isTwoFactorEnabled={isTwoFactorEnabled}
			/>
		</div>
	);
}

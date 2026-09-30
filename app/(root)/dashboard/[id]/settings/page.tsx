import { Category } from "@prisma/client";
import PortfolioSettingsClient from "./PortfolioSettingsClient";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function PortfolioSettingsPage(props: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ from?: string }>; // 🚀 Odbieramy parametry
}) {
	const params = await props.params;
	const portfolioId = params.id;
	const session = await auth();

	if (!session?.user?.id) redirect("/sign-in");

	// 🚀 Zczytujemy flagę z paska adresu
	const searchParams = await props.searchParams;
	const fromDashboard = searchParams?.from === "dashboard";

	const portfolio = await db.portfolio.findFirst({
		where: {
			id: portfolioId,
			userId: session.user.id,
		},
		select: {
			id: true,
			name: true,
			assets: {
				select: {
					id: true,
					name: true,
					category: true,
					ticker: true,
					createdAt: true,
				},
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!portfolio) redirect("/");

	const allCategories = Object.values(Category);
	const assetsForMigration = portfolio.assets.filter(
		(a) => a.category !== "BONDS",
	);

	return (
		<PortfolioSettingsClient
			portfolioId={portfolioId}
			portfolioName={portfolio.name}
			allCategories={allCategories}
			portfolioAssets={portfolio.assets}
			assetsForMigration={assetsForMigration}
			userRole={session.user.role || "REGULAR"}
			email={session.user.email}
			fromDashboard={fromDashboard} // 🚀 Przekazujemy do klienta
		/>
	);
}

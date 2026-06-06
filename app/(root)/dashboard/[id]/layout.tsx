import { notFound, redirect } from "next/navigation";

import { DashboardBreadcrumbs } from "@/components/DashboardBreadcrumbs";
import DashboardGoal from "@/components/DashboardGoal";
import { DashboardHeader } from "@/components/DashboardHeader";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPortfolioStats } from "@/lib/calculations";

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

	// 1. ZABEZPIECZENIE: Upewniamy się, że portfel należy do TEGO użytkownika
	const portfolio = await db.portfolio.findUnique({
		where: {
			id,
			userId: session.user.id,
		},
		include: {
			assets: true,
			transactionHistories: true,
		},
	});

	// 2. Jeśli nie istnieje (lub to nie jego portfel) -> wyrzucamy 404
	if (!portfolio) {
		notFound();
	}

	// 3. Obliczenia statystyk
	const { name, totalValue, progress, remaining, goal } =
		getPortfolioStats(portfolio);

	return (
		<div className="space-y-10">
			<DashboardHeader
				key={id} // Ensure the header resets its internal state when the portfolio changes
				portfolio={portfolio}
				name={name}
				totalValue={totalValue}
				// Fix: Added a unique key to the JSX element passed as a prop to avoid reconciliation warnings
				customBreadcrumbs={
					<DashboardBreadcrumbs key={`bread-${id}`} name={name} id={id} />
				}
			/>
			{goal > 0 && (
				<DashboardGoal progress={progress} remaining={remaining} goal={goal} />
			)}

			{/* Main content of the subpages */}
			<main>{children}</main>
		</div>
	);
}

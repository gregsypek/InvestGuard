import { DashboardBreadcrumbs } from "@/components/DashboardBreadcrumbs";
import DashboardGoal from "@/components/DashboardGoal";
import { DashboardHeader } from "@/components/DashboardHeader";
import { db } from "@/lib/db";
import { getPortfolioStats } from "@/lib/calculations";
import { notFound } from "next/navigation";

export default async function PortfolioLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ id: string }>;
}) {
	const { id } = await params; // To ID zawsze będzie poprawne dla ścieżki /dashboard/[id]

	// 1. Pobieramy portfel z bazy
	const portfolio = await db.portfolio.findUnique({
		where: { id },
		include: {
			assets: true,
			transactionHistories: true,
		},
	});

	// 2. Jeśli nie ma portfela, zwracamy notFound
	if (!portfolio) {
		notFound();
	}

	// 3. Obliczamy statystyki za pomocą naszej nowej funkcji
	const { name, totalValue, progress, remaining, goal } =
		getPortfolioStats(portfolio);

	return (
		<div className="space-y-10 p-6">
			<DashboardHeader
				key={id}
				portfolio={portfolio}
				name={name}
				totalValue={totalValue}
				// Tutaj wstrzykujemy dynamiczne breadcrumbs z przyciskiem powrotu
				customBreadcrumbs={<DashboardBreadcrumbs name={name} id={id} />}
			/>
			{goal > 0 && (
				<DashboardGoal progress={progress} remaining={remaining} goal={goal} />
			)}

			{/* Tutaj wskoczy zawartość podstron */}
			<main>{children}</main>
		</div>
	);
}

// app/dashboard/[id]/layout.tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getPortfolioStats } from "@/lib/calculations";
import { DashboardHeader } from "@/components/DashboardHeader";
import DashboardGoal from "@/components/DashboardGoal";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function PortfolioLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	// 1. Pobieramy portfel z bazy
	const portfolio = await db.portfolio.findUnique({
		where: { id },
		include: { assets: true },
	});

	// 2. Jeśli nie ma portfela, zwracamy notFound
	if (!portfolio) {
		notFound();
	}

	// 3. Obliczamy statystyki za pomocą naszej nowej funkcji
	const { name, totalValue, progress, remaining, goal } =
		getPortfolioStats(portfolio);

	return (
		<div className="space-y-10 pb-20">
			<DashboardHeader
				name={name}
				totalValue={totalValue}
				customBreadcrumbs={
					<div className="flex items-center gap-2 mb-2">
						<Link href={`/dashboard?portfolioId=${id}`}>
							<ChevronLeft className="h-4 w-4" />
						</Link>
						<nav className="text-sm text-muted-foreground">
							Dashboard / {name} / Add Asset
						</nav>
					</div>
				}
			/>
			{goal > 0 && (
				<DashboardGoal progress={progress} remaining={remaining} goal={goal} />
			)}

			{/* Tutaj wskoczy zawartość podstron */}
			<main>{children}</main>
		</div>
	);
}

import { ShieldCheck, Target, TrendingUp } from "lucide-react";

import { Bond } from "@/lib/types";
import { BondHeader } from "@/components/BondHeader";
import { BondStatCard } from "@/components/shared/BondStatCard";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBonds } from "@/lib/actions/bond-actions";
import { notFound } from "next/navigation";

export default async function BondsLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = await auth();

	// EN: Fetch portfolio and bonds in parallel
	const [portfolio, rawBonds] = await Promise.all([
		db.portfolio.findUnique({
			where: { id, userId: session?.user?.id },
			select: { name: true },
		}),
		getBonds(id),
	]);

	// Jeśli portfel nie istnieje lub nie należy do usera -> błąd 404
	if (!portfolio) notFound();

	// Formatowanie danych
	const bonds: Bond[] = rawBonds.map((b) => {
		const cleanTicker = b.ticker ? b.ticker.split("_")[0] : "NIEZNANY";
		return {
			id: b.id,
			ticker: cleanTicker,
			name: b.name,
			purchaseDate:
				b.purchaseDate instanceof Date
					? b.purchaseDate.toISOString()
					: String(b.purchaseDate),
			maturityDate: b.maturityDate
				? b.maturityDate instanceof Date
					? b.maturityDate.toISOString()
					: String(b.maturityDate)
				: null,
			investedCapital: Number(b.investedCapital) ?? 0,
			currentValue: Number(b.currentValue) ?? 0,
			interestRate: b.interestRate ?? 0,
		};
	});

	// EN: Calculate statistics for the cards directly in the layout
	const totals = bonds.reduce(
		(acc, bond) => {
			acc.totalInvested += bond.investedCapital;
			acc.currentValue += bond.currentValue;
			acc.weightedSum += (bond.interestRate ?? 0) * bond.investedCapital;
			return acc;
		},
		{ totalInvested: 0, currentValue: 0, weightedSum: 0 },
	);

	const bondStats = {
		totalInvested: totals.totalInvested,
		currentValue: totals.currentValue,
		avgYield:
			totals.totalInvested > 0
				? (totals.weightedSum / totals.totalInvested).toFixed(2)
				: "0",
	};
	return (
		<main className="space-y-10 pb-20">
			{/* NAGŁÓWEK JEST TUTAJ - RAZ NA ZAWSZE */}
			<BondHeader
				title="Moje Obligacje"
				totalBonds={rawBonds.length}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground mb-2">
						Obligacje /{" "}
						<span className="text-primary font-medium">{portfolio.name}</span>
					</nav>
				}
			/>
			{/* EN: Statistics cards available across all subpages */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<BondStatCard
					title="Zainwestowany Kapitał"
					value={`${Number(bondStats.totalInvested).toLocaleString()} PLN`}
					icon={ShieldCheck}
					variant="neutral"
					description="Łączny nominał jednostek"
				/>
				<BondStatCard
					title="Aktualna Wycena"
					value={`${Number(bondStats.currentValue).toLocaleString()} PLN`}
					description={`+${(Number(bondStats.currentValue) - Number(bondStats.totalInvested)).toLocaleString()} PLN odsetek`}
					icon={TrendingUp}
					variant="green"
				/>
				<BondStatCard
					title="Średnie Oprocentowanie"
					value={`${bondStats.avgYield}%`}
					icon={Target}
					description="Ważone oprocentowanie (YTM)"
					variant="blue"
				/>
			</div>
			{/* Tu Next.js wstrzyknie page.tsx (Raport) albo add-asset/page.tsx (Formularz) */}
			<section>{children}</section>
		</main>
	);
}

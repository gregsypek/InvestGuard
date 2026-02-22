"use client";

import { AlphaHeader } from "@/components/AlphaHeader";
import { BondStatCard } from "@/components/shared/BondStatCard";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
	Target,
	TrendingUp,
	Plus,
	MoreHorizontal,
	Lightbulb,
	ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AddButton from "@/components/ui/AddButton";
import Link from "next/link";
import BulbTip from "@/components/shared/BulbTip";

export default function BondAnalysisPage() {
	// EN: Mock data for Bond Overview (Summary)
	const bondStats = {
		totalInvested: 15500,
		currentValue: 16120,
		avgYield: 6.2,
	};

	// EN: Mock data - tabular representation of active bond series
	const activeBonds = [
		{
			id: "edo1",
			series: "EDO",
			type: "10-letnie",
			name: "Emerytalne Indeksowane Oszczędnościowe",
			purchaseDate: "15.03.2023",
			maturityDate: "15.03.2033",
			nominalValue: 10000,
			currentValue: 10725,
			interestRate: "7.25%",
			rateType: "Zmienne (Inflacja + 1.25%)",
			progress: 25, // EN: Percentage of time passed
			colorClass: "bg-orange-500", // Visual identifier for EDO
		},
		{
			id: "dos1",
			series: "DOS",
			type: "2-letnie",
			name: "Dwuletnie Oszczędnościowe Stałoprocentowe",
			purchaseDate: "15.03.2024",
			maturityDate: "15.03.2026",
			nominalValue: 5500,
			currentValue: 5843,
			interestRate: "6.25%",
			rateType: "Stałe",
			progress: 75,
			colorClass: "bg-blue-500", // Visual identifier for DOS
		},
	];

	return (
		<div className="space-y-10 pb-20">
			{/* EN: Using AlphaHeader pattern but with customized text/props */}
			<AlphaHeader
				// EN: We don't have pagination for bonds usually, so we hide it or pass custom props if your header requires it
				totalTransactions={activeBonds.length}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground mb-2 italic">
						Narzędzia /{" "}
						<span className="text-primary font-medium">Obligacje</span>
					</nav>
				}
			/>

			{/* EN: KPI Section */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<BondStatCard
					title="Zainwestowany Kapitał"
					value={`${bondStats.totalInvested.toLocaleString()} PLN`}
					description="Łączny nominał jednostek"
					variant="neutral"
					icon={ShieldCheck}
				/>
				<BondStatCard
					title="Aktualna Wycena"
					value={`${bondStats.currentValue.toLocaleString()} PLN`}
					description={`+${bondStats.currentValue - bondStats.totalInvested} PLN odsetek`}
					variant="green"
					icon={TrendingUp}
				/>
				<BondStatCard
					title="Średnie Oprocentowanie"
					value={`${bondStats.avgYield}%`}
					description="Ważone oprocentowanie (YTM)"
					variant="blue"
					icon={Target}
				/>
			</div>

			{/* EN: Main Table Section */}
			<div className="flex flex-col min-h-[calc(100vh-350px)] space-y-6 justify-between pt-4">
				{/* EN: Toolbar with integrated inline BulbTip */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
					<div className="space-y-1">
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<ShieldCheck className="h-5 w-5 text-primary" /> Portfel Obligacji
						</h2>
						<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
							<BulbTip
								title="Pamiętaj: "
								content="Wcześniejszy wykup (EDO/DOS) to koszt ok. 0.70-3.00"
							/>
						</div>
					</div>

					<AddButton className="gap-2 shadow-sm h-9">
						<Link href={"/bonds/new"} className="gap-2 flex items-center">
							<Plus className="h-4 w-4" />
							Dodaj Serię
						</Link>
					</AddButton>
				</div>

				{/* EN: Table Container */}
				<div className="w-full">
					<Table>
						<TableHeader className="bg-muted/30">
							<TableRow className="border-border hover:bg-transparent">
								<TableHead className="font-bold">Seria</TableHead>
								<TableHead className="font-bold">Typ Kuponu</TableHead>
								<TableHead className="font-bold w-[180px]">
									Oprocentowanie
								</TableHead>
								<TableHead className="font-bold w-[250px]">
									Czas do Wykupu
								</TableHead>
								<TableHead className="text-right font-bold">Wycena</TableHead>
								<TableHead className="w-12 text-right"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{activeBonds.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-12 text-muted-foreground"
									>
										Brak aktywnych serii obligacji w portfelu.
									</TableCell>
								</TableRow>
							) : (
								activeBonds.map((bond) => (
									<TableRow
										key={bond.id}
										className="border-border hover:bg-muted/20 transition-colors group"
									>
										{/* Series & Type */}
										<TableCell>
											<div className="font-bold text-sm flex items-center gap-2">
												<div
													className={cn(
														"w-2 h-2 rounded-full",
														bond.colorClass,
													)}
												/>
												{bond.series}
											</div>
											<div className="text-[10px] text-muted-foreground font-mono bg-muted inline-block px-1.5 py-0.5 rounded mt-0.5">
												{bond.type}
											</div>
										</TableCell>

										{/* Rate Type */}
										<TableCell>
											<span className="text-xs text-muted-foreground font-medium">
												{bond.rateType}
											</span>
										</TableCell>

										{/* Interest Rate */}
										<TableCell>
											<div className="font-bold text-sm text-foreground">
												{bond.interestRate}
											</div>
											<div className="text-[10px] uppercase text-muted-foreground mt-0.5">
												Bieżący Okres
											</div>
										</TableCell>

										{/* Maturity Progress Bar */}
										<TableCell>
											<div className="space-y-1.5 pr-4">
												<div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
													<span>{bond.purchaseDate}</span>
													<span>{bond.maturityDate}</span>
												</div>
												<Progress
													value={bond.progress}
													className="h-1.5 bg-muted"
													indicatorColor={bond.colorClass}
												/>
											</div>
										</TableCell>

										{/* Current Value */}
										<TableCell className="text-right">
											<div className="font-mono font-bold text-sm">
												{bond.currentValue.toLocaleString()}{" "}
												<span className="text-xs text-muted-foreground">
													PLN
												</span>
											</div>
											<div className="text-[10px] font-mono text-green-600 mt-0.5">
												+{bond.currentValue - bond.nominalValue} PLN
											</div>
										</TableCell>

										{/* Actions */}
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-muted-foreground hover:text-primary transition-opacity cursor-pointer opacity-0 group-hover:opacity-100"
											>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{/* EN: Empty div to push the table up if the list is short, acting like mt-auto */}
				<div className="flex-1"></div>
			</div>
		</div>
	);
}

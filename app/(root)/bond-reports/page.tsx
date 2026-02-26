"use client";

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
	Landmark,
	Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AddButton from "@/components/ui/AddButton";
import Link from "next/link";
import BulbTip from "@/components/shared/BulbTip";
import { BondHeader } from "@/components/BondHeader";
import { calculateBondProgress } from "@/lib/calculations";

// --- HELPERS OUTSIDE COMPONENT (For React Compiler) ---
const parseDate = (dateStr: string) => {
	const [day, month, year] = dateStr.split(".").map(Number);
	return new Date(year, month - 1, day);
};

const activeBondsRaw = [
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
		colorClass: "bg-orange-500", // EDO Theme
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
		colorClass: "bg-blue-500", // DOS Theme
	},
];

export default function BondAnalysisPage() {
	const bondStats = {
		totalInvested: 15500,
		currentValue: 16120,
		avgYield: 6.2,
	};

	// Pre-calculate progress for each bond
	const activeBonds = activeBondsRaw.map((bond) => {
		const pDate = parseDate(bond.purchaseDate);
		const mDate = parseDate(bond.maturityDate);
		return {
			...bond,
			progress: calculateBondProgress(pDate, mDate),
		};
	});

	return (
		<div className="space-y-10 pb-20">
			<BondHeader
				totalBonds={activeBonds.length}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground mb-2 italic">
						Narzędzia /{" "}
						<span className="text-primary font-medium">Obligacje</span>
					</nav>
				}
			/>

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

			<div className="flex flex-col min-h-[calc(100vh-350px)] space-y-6 justify-between pt-4">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
					<div className="space-y-1">
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 uppercase italic">
							<Landmark className="h-5 w-5 text-primary" /> Portfel Obligacji
						</h2>
						<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
							<BulbTip
								title="Pamiętaj: "
								content="Wcześniejszy wykup to koszt ok. 0.70-3.00 PLN za sztukę."
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

				<div className="w-full">
					<Table>
						<TableHeader className="bg-muted/30">
							<TableRow className="border-border hover:bg-transparent">
								<TableHead className="font-bold uppercase text-[11px]">
									Seria
								</TableHead>
								<TableHead className="font-bold uppercase text-[11px]">
									Typ Kuponu
								</TableHead>
								<TableHead className="font-bold w-[180px] uppercase text-[11px]">
									Oprocentowanie
								</TableHead>
								<TableHead className="font-bold w-[250px] uppercase text-[11px]">
									Czas do Wykupu
								</TableHead>
								<TableHead className="text-right font-bold uppercase text-[11px]">
									Wycena
								</TableHead>
								<TableHead className="w-12 text-right"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{activeBonds.map((bond) => (
								<TableRow
									key={bond.id}
									className="border-border hover:bg-muted/20 transition-colors group"
								>
									<TableCell>
										<div className="font-bold text-sm flex items-center gap-2">
											<div
												className={cn("w-2 h-2 rounded-full", bond.colorClass)}
											/>
											{bond.series}
										</div>
										<div className="text-[10px] text-muted-foreground font-mono bg-muted inline-block px-1.5 py-0.5 rounded mt-0.5 italic">
											{bond.type}
										</div>
									</TableCell>

									<TableCell>
										<span className="text-xs text-muted-foreground font-medium">
											{bond.rateType}
										</span>
									</TableCell>

									<TableCell>
										<div className="font-bold text-sm text-foreground">
											{bond.interestRate}
										</div>
										<div className="text-[10px] uppercase text-muted-foreground mt-0.5 font-bold">
											Bieżący Okres
										</div>
									</TableCell>

									<TableCell>
										<div className="space-y-1.5 pr-4">
											<div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tabular-nums">
												<span>{bond.purchaseDate}</span>
												<span>{bond.maturityDate}</span>
											</div>
											<Progress
												value={bond.progress}
												className="h-1.5 bg-muted border border-border"
												indicatorColor={bond.colorClass} // Matches the dot color
											/>
										</div>
									</TableCell>

									<TableCell className="text-right">
										<div className="font-mono font-bold text-sm tabular-nums">
											{bond.currentValue.toLocaleString()}{" "}
											<span className="text-xs text-muted-foreground font-sans">
												PLN
											</span>
										</div>
										<div className="text-[10px] font-mono text-green-600 mt-0.5 font-bold tabular-nums">
											+
											{(bond.currentValue - bond.nominalValue).toLocaleString()}{" "}
											PLN
										</div>
									</TableCell>

									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{/* --- NOWA UNIWERSALNA LEGENDA --- */}
				<div className="mt-8 flex flex-col gap-4 px-6 py-5 bg-muted/10 rounded-2xl border border-border/40">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Info className="h-4 w-4 text-primary" />
							<span className="text-xs font-medium text-muted-foreground  tracking-[0.1em]">
								Legenda Oznaczeń Serii
							</span>
						</div>
						<div className="flex items-center gap-1.5 italic opacity-60">
							<Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
							<span className="text-xs text-muted-foreground font-medium">
								Pasek postępu = czas do zapadalności
							</span>
						</div>
					</div>

					<div className="flex flex-wrap gap-8">
						<div className="flex items-center gap-3">
							<div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
							<div className="flex flex-col leading-tight">
								<span className="text-[11px] font-bold text-foreground">
									EDO
								</span>
								<span className="text-[9px] text-muted-foreground uppercase">
									Emerytalne 10L
								</span>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
							<div className="flex flex-col leading-tight">
								<span className="text-[11px] font-bold text-foreground">
									DOS
								</span>
								<span className="text-[9px] text-muted-foreground uppercase">
									Dwuletnie Stałe
								</span>
							</div>
						</div>

						<div className="flex items-center gap-3 opacity-50 grayscale">
							<div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
							<div className="flex flex-col leading-tight">
								<span className="text-[11px] font-bold text-foreground">
									COI
								</span>
								<span className="text-[9px] text-muted-foreground uppercase">
									Czteroletnie
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="flex-1"></div>
			</div>
		</div>
	);
}

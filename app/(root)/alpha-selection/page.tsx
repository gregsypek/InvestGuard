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
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
	Target,
	TrendingUp,
	Plus,
	MoreHorizontal,
	Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AddButton from "@/components/ui/AddButton";
import Link from "next/link";
import BulbTip from "@/components/shared/BulbTip";

export default function AlphaSelectionPage() {
	// EN: Mock variables for pagination
	const currentPage = 1;
	const totalPages = 5;

	// EN: Mock data - simplified colors for the tabular layout
	const alphaBets = [
		{
			id: "1",
			ticker: "META",
			name: "Meta Platforms",
			thesis: "Monetyzacja AI w ekosystemie reklamowym i dominacja VR/AR.",
			conviction: 85,
			roi: 18.4,
			risk: "Średnie",
			riskColor: "bg-blue-500",
			progressColor: "bg-blue-600",
		},
		{
			id: "2",
			ticker: "PBR",
			name: "Petrobras",
			thesis:
				"Niedowartościowany sektor surowców w Ameryce Łacińskiej i wysoka dywidenda.",
			conviction: 60,
			roi: -2.1,
			risk: "Wysokie",
			riskColor: "bg-red-500",
			progressColor: "bg-emerald-600",
		},

		{
			id: "2",
			ticker: "PBR",
			name: "Petrobras",
			thesis:
				"Niedowartościowany sektor surowców w Ameryce Łacińskiej i wysoka dywidenda.",
			conviction: 60,
			roi: -2.1,
			risk: "Wysokie",
			riskColor: "bg-red-500",
			progressColor: "bg-emerald-600",
		},

		{
			id: "2",
			ticker: "PBR",
			name: "Petrobras",
			thesis:
				"Niedowartościowany sektor surowców w Ameryce Łacińskiej i wysoka dywidenda.",
			conviction: 60,
			roi: -2.1,
			risk: "Wysokie",
			riskColor: "bg-red-500",
			progressColor: "bg-emerald-600",
		},
	];

	return (
		<div className="space-y-10 ">
			<AlphaHeader
				totalTransactions={2}
				currentPage={currentPage}
				totalPages={totalPages}
				customBreadcrumbs={
					<nav className="text-sm text-muted-foreground mb-2 italic">
						Narzędzia / <span className="text-primary font-medium">Alpha</span>
					</nav>
				}
			/>

			{/* EN: KPI Section */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<BondStatCard
					title="Udział w Portfelu"
					value="7.5%"
					description="Sugerowany limit: 10%"
					variant="orange"
					iconColor="text-orange-600"
				/>
				<BondStatCard
					title="Wynik Selekcji"
					value="+4.2 pp"
					description="Wynik ponad benchmark"
					variant="green"
					icon={TrendingUp}
				/>
				<BondStatCard
					title="Termin Weryfikacji"
					value="lipiec 2026"
					description="Kwartalny przegląd tez"
					variant="neutral"
					icon={Target}
				/>
			</div>

			{/* EN: Main Table Section */}
			<div className="flex flex-col min-h-[calc(100vh-350px)] space-y-6 justify-between pt-4">
				{/* EN: Toolbar with integrated inline BulbTip */}
				{/* UI: Toolbar ze zintegrowaną wskazówką zamiast wielkiego komponentu */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
					<div className="space-y-1">
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<Target className="h-5 w-5 text-primary" /> Aktywne Pozycje
						</h2>
						<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
							<BulbTip
								title="Zasada:"
								content="Weryfikuj kwartalnie. Brak aktualności = wyjście."
							/>
						</div>
					</div>

					<AddButton className="gap-2 shadow-sm h-9">
						<Link href={"/aplha/new"} className="gap-2 flex items-center">
							<Plus className="h-4 w-4" />
							Nowa Teza
						</Link>
					</AddButton>
				</div>

				{/* EN: Table Container */}
				<div className="w-full ">
					<Table>
						<TableHeader className="bg-muted/30">
							<TableRow className="border-border hover:bg-transparent">
								<TableHead className="font-bold">Aktywo</TableHead>
								<TableHead className="font-bold">Ryzyko</TableHead>
								<TableHead className="font-bold w-50">Przekonanie</TableHead>
								<TableHead className="font-bold">Teza (Skrót)</TableHead>
								<TableHead className="text-right font-bold">
									Wynik (ROI)
								</TableHead>
								<TableHead className="w-12 text-right"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{alphaBets.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-12 text-muted-foreground"
									>
										Brak aktywnych pozycji w selekcji Alpha.
									</TableCell>
								</TableRow>
							) : (
								alphaBets.map((bet) => (
									<TableRow
										key={bet.id}
										className="border-border hover:bg-muted/20 transition-colors group"
									>
										{/* Ticker & Name */}
										<TableCell>
											<div className="font-bold text-sm">{bet.name}</div>
											<div className="text-[10px] text-muted-foreground font-mono bg-muted inline-block px-1.5 py-0.5 rounded mt-0.5">
												{bet.ticker}
											</div>
										</TableCell>

										{/* Risk Indicator */}
										<TableCell>
											<div className="flex items-center gap-1.5">
												<div
													className={cn(
														"w-2 h-2 rounded-full border border-border shadow-xs",
														bet.riskColor,
													)}
												/>
												<span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
													{bet.risk}
												</span>
											</div>
										</TableCell>

										{/* Conviction Bar */}
										<TableCell>
											<div className="space-y-1.5 pr-4">
												<div className="flex justify-between text-[10px] font-bold text-muted-foreground">
													<span>POZIOM</span>
													<span>{bet.conviction}%</span>
												</div>
												<Progress
													value={bet.conviction}
													className="h-1.5 bg-muted"
													indicatorColor={bet.progressColor}
												/>
											</div>
										</TableCell>

										{/* Thesis Rationale */}
										<TableCell className="max-w-40 xl:max-w-64 truncate text-xs text-muted-foreground italic">
											&quot;{bet.thesis}&quot;
										</TableCell>

										{/* ROI Value */}
										<TableCell
											className={cn(
												"text-right font-mono font-bold text-sm",
												bet.roi >= 0 ? "text-green-600" : "text-red-500",
											)}
										>
											{bet.roi > 0 && "+"}
											{bet.roi.toFixed(1)}%
										</TableCell>

										{/* Actions */}
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-muted-foreground hover:text-primary  transition-opacity cursor-pointer"
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

				{/* EN: Pagination - pushed to bottom via mt-auto */}
				{/* UI: Paginacja - spychana na dół za pomocą mt-auto */}
				{totalPages > 1 && (
					<div className="mt-auto pt-8 flex justify-center">
						<Pagination>
							<PaginationContent className="bg-card/50 border border-border rounded-full px-2 shadow-sm">
								<PaginationItem>
									<PaginationPrevious
										// FIX: Zmieniono linki z /activity na /alpha i dodano zmienne
										href={`/alpha?page=${Math.max(1, currentPage - 1)}`}
										aria-disabled={currentPage <= 1}
										className={
											currentPage <= 1 ? "pointer-events-none opacity-50" : ""
										}
									/>
								</PaginationItem>

								<div className="text-xs font-bold uppercase tracking-widest px-6 text-muted-foreground">
									Strona {currentPage} z {totalPages}
								</div>

								<PaginationItem>
									<PaginationNext
										href={`/alpha?page=${Math.min(totalPages, currentPage + 1)}`}
										aria-disabled={currentPage >= totalPages}
										className={
											currentPage >= totalPages
												? "pointer-events-none opacity-50"
												: ""
										}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</div>
		</div>
	);
}

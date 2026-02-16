"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	Lightbulb,
	Target,
	AlertTriangle,
	MessageSquare,
	ArrowUpRight,
	TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BondStatCard } from "@/components/shared/BondStatCard";
import BulbTip from "@/components/shared/BulbTip";
import { cn } from "@/lib/utils";

export default function AlphaSelectionPage() {
	// Mock data - colors adjusted for the "Header" style
	const alphaBets = [
		{
			ticker: "META",
			name: "Meta Platforms",
			thesis:
				"Monetyzacja AI w ekosystemie reklamowym i dominacja w segmencie VR/AR.",
			conviction: 85,
			roi: 18.4,
			risk: "Średnie",
			// UI: Colors for the new card style
			borderColor: "border-blue-200 dark:border-blue-800", // Outer card border
			headerBg: "bg-blue-50 dark:bg-blue-900/20", // Header background
			textColor: "text-blue-700 dark:text-blue-300", // Header text
			progressColor: "bg-blue-600",
		},
		{
			ticker: "PBR",
			name: "Petrobras",
			thesis:
				"Niedowartościowany sektor surowców w Ameryce Łacińskiej i wysoka dywidenda.",
			conviction: 60,
			roi: -2.1,
			risk: "Wysokie",
			borderColor: "border-emerald-200 dark:border-emerald-800",
			headerBg: "bg-emerald-50 dark:bg-emerald-900/20",
			textColor: "text-emerald-700 dark:text-emerald-300",
			progressColor: "bg-emerald-600",
		},
	];

	return (
		<div className="p-4 space-y-8 max-w-7xl mx-auto">
			{/* HEADER & KPI SECTION ... (bez zmian) */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
						Selekcja Alpha
					</h1>
					<p className="text-muted-foreground mt-1">
						Aktywne zarządzanie i selekcja aktywów.
					</p>
				</div>
				<Button className="gap-2 shadow-sm">
					<ArrowUpRight className="h-4 w-4" /> Nowa Teza
				</Button>
			</div>

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
					title="Termin Wykupu"
					value="lipiec 2026"
					description="Cel ROI: +20%"
					variant="neutral"
					icon={Target}
				/>
			</div>
			<hr className="my-8 border-transparent" />

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{alphaBets.map((bet) => (
					<Card
						key={bet.ticker}
						// EN: Cleaner outer border, removed left-border-width
						className={cn(
							"shadow-sm overflow-hidden pt-0 rounded-xl",
							bet.borderColor,
						)}
					>
						{/* HEADER: Colored background section */}
						<CardHeader className={cn("py-3 rounded-xl", bet.headerBg)}>
							<div className="flex justify-between items-start">
								<div>
									<div className="flex items-center gap-2 mb-1">
										<Badge
											variant="outline"
											className={cn(
												"bg-background/80 backdrop-blur-sm border-transparent font-bold shadow-sm",
												bet.textColor,
											)}
										>
											{bet.ticker}
										</Badge>
										<span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
											<AlertTriangle className="h-3 w-3" />
											{bet.risk}
										</span>
									</div>
									<CardTitle className={cn("text-lg", bet.textColor)}>
										{bet.name}
									</CardTitle>
								</div>

								{/* ROI Badge inside header */}
								<div
									className={cn(
										"text-xl font-bold tabular-nums px-3 py-1 rounded-md bg-background/50",
										bet.roi >= 0 ? "text-green-600" : "text-red-600",
									)}
								>
									{bet.roi > 0 && "+"}
									{bet.roi}%
								</div>
							</div>
						</CardHeader>

						{/* CONTENT: Clean white background, no extra borders */}
						<CardContent className="pt-6 space-y-6">
							{/* Thesis - No border box, just clean text */}
							<div className="flex gap-3">
								<MessageSquare className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
								<p className="text-sm text-muted-foreground italic leading-relaxed">
									&quot;{bet.thesis}&quot;
								</p>
							</div>

							{/* Conviction Bar */}
							<div className="space-y-2">
								<div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
									<span>Przekonanie</span>
									<span className={bet.textColor}>{bet.conviction}%</span>
								</div>
								<Progress
									value={bet.conviction}
									className="h-2 bg-slate-100 dark:bg-slate-800"
									indicatorColor={bet.progressColor}
								/>
							</div>

							{/* Data Grid - Clean, no borders */}
							<div className="grid grid-cols-2 gap-4 pt-2">
								<div
									className={cn(
										"space-y-1 border rounded-lg p-2",
										bet.borderColor,
									)}
								>
									<span className="text-[10px] uppercase text-muted-foreground ">
										Cena Wejścia
									</span>
									<div className="font-semibold text-sm flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-green-500" />
										Sygnał OK
									</div>
								</div>
								<div
									className={cn(
										"space-y-1 border rounded-lg p-2",
										bet.borderColor,
									)}
								>
									<span className="text-[10px] uppercase text-muted-foreground">
										Cel (Target)
									</span>
									<div className="font-semibold text-sm text-purple-700 dark:text-purple-400 flex items-center gap-1">
										<Target className="h-3 w-3" /> +50% zysku
									</div>
								</div>
							</div>
						</CardContent>

						{/* FOOTER: Minimalist separator */}
						<CardFooter className="bg-muted/10 py-3 mt-3 flex justify-between">
							<Button
								variant="ghost"
								size="sm"
								className="text-xs text-muted-foreground hover:text-foreground"
							>
								Edytuj
							</Button>
							<Button variant="outline" size="sm" className="text-xs h-8 gap-2">
								<Lightbulb className="h-3 w-3" />
								Notatka
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>

			<BulbTip
				title="Zasada Selekcji:"
				content="Weryfikuj tezę kwartalnie. Brak aktualności tezy = wyjście z pozycji."
			/>
		</div>
	);
}

"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	TrendingUp,
	ShieldCheck,
	ArrowUpRight,
	Calendar,
	Info,
	LineChart as LineChartIcon,
	ChevronUp,
	Lightbulb,
	ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Bond Analysis Page - Module 2.5
 * Focuses on protecting capital and analyzing various bond types (EDO, DOS, etc.)
 * UI: Polish | Comments: English
 */
export default function BondAnalysisPage() {
	// Mock data for Bond Overview (Summary)
	// EN: Summary of total bond holdings
	const bondStats = {
		totalInvested: 15500,
		currentValue: 16120,
		avgYield: 6.2, // EN: Average yield across all bonds
	};
	const [showTip, setShowTip] = useState(false); // EN: State to toggle visibility
	return (
		<div className="p-8 space-y-8 max-w-7xl mx-auto">
			{/* HEADER SECTION */}
			{/* EN: Page title and primary action */}
			<div className="flex justify-between items-end">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Analiza Obligacji
					</h1>
					<p className="text-muted-foreground mt-1">
						Zarządzanie bezpieczeństwem i ochrona kapitału przed inflacją.
						{/* EN: Managing safety and protecting capital from inflation. */}
					</p>
				</div>
				<Button className="gap-2">
					<ArrowUpRight className="h-4 w-4" />
					Dodaj nową serię
					{/* EN: Add new series */}
				</Button>
			</div>
			{/* KPI CARDS */}
			{/* EN: Financial metrics cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Kapitał w Obligacjach
						</CardTitle>
						<ShieldCheck className="h-4 w-4 text-orange-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{bondStats.totalInvested.toLocaleString()} PLN
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Łączny nominał zakupionych jednostek
						</p>
						{/* EN: Total nominal value of purchased units */}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Aktualna Wycena
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{bondStats.currentValue.toLocaleString()} PLN
						</div>
						<p className="text-xs text-green-600 mt-1">
							+{bondStats.currentValue - bondStats.totalInvested} PLN
							skumulowanych odsetek
						</p>
						{/* EN: Accumulated interest in PLN */}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Średnie Oprocentowanie
						</CardTitle>
						<LineChartIcon className="h-4 w-4 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{bondStats.avgYield}%</div>
						<p className="text-xs text-muted-foreground mt-1">
							Ważone średnie oprocentowanie portfela
						</p>
						{/* EN: Weighted average portfolio interest rate */}
					</CardContent>
				</Card>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* MODULE: EDO (Inflation-linked Bonds) */}
				{/* EN: Detailed view for EDO series (Inflation-indexed) */}
				<Card className="border-orange-200  shadow-sm pt-0 pb-3">
					<CardHeader className="bg-bond-orange py-3 rounded-xl">
						<div className="flex justify-between items-center">
							<CardTitle className="text-orange-800">
								Seria EDO (10-letnie)
							</CardTitle>
							<Badge
								variant="outline"
								className="border-orange-300 text-orange-800"
							>
								Indeksowane inflacją
							</Badge>
						</div>
						<CardDescription>
							Ochrona długoterminowa. Oprocentowanie: Inflacja + marża.
						</CardDescription>
						{/* EN: Long-term protection. Rate: Inflation + margin. */}
					</CardHeader>
					<CardContent className="pt-6 space-y-4">
						<div className="h-48 border border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm italic px-3 bg-background">
							Miejsce na wykres &quot;Schody Inflacyjne&quot; (Wzrost wartości
							nominału)
							{/* EN: Placeholder for the "Inflation Stairs" growth chart */}
						</div>
						<div className="flex justify-between text-sm p-3  bg-background border rounded-md">
							<span className="text-muted-foreground">
								Aktualny okres odsetkowy:
							</span>
							<span className="font-bold">
								7.25% (Marża 1.25% + Inflacja 6.0%)
							</span>
							{/* EN: Current interest period details */}
						</div>
					</CardContent>
				</Card>

				{/* MODULE: DOS (Fixed-rate Bonds) */}
				{/* EN: Detailed view for DOS series (Fixed interest) */}
				<Card className="border-blue-200 shadow-sm pt-0 pb-3">
					<CardHeader className="bg-bond-blue py-3 rounded-xl ">
						<div className="flex justify-between items-center">
							<CardTitle className="text-blue-900">
								Seria DOS (2-letnie)
							</CardTitle>
							<Badge
								variant="outline"
								className="border-blue-300 text-blue-800"
							>
								Stały procent
							</Badge>
						</div>
						<CardDescription>
							Krótki horyzont. Stały zysk niezależnie od rynku.
						</CardDescription>
						{/* EN: Short horizon. Fixed profit regardless of the market. */}
					</CardHeader>
					<CardContent className="pt-6 space-y-6">
						<div className="space-y-2">
							<div className="flex justify-between text-sm font-medium">
								<span>Czas do wykupu (Maturity)</span>
								<span>75% czasu za nami</span>
							</div>
							<div className="w-full bg-blue-100 rounded-full h-2.5">
								<div className="bg-blue-600 h-2.5 rounded-full w-[75%]"></div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="p-3 bg-background border rounded-md text-center">
								<Calendar className="w-4 h-4 mx-auto mb-1 text-blue-500" />
								<p className="text-xs text-muted-foreground">Data wykupu</p>
								<p className="text-sm font-bold text-blue-900">15.03.2026</p>
								{/* EN: Maturity date */}
							</div>
							<div className="p-3 bg-background border rounded-md text-center">
								<Info className="w-4 h-4 mx-auto mb-1 text-blue-500" />
								<p className="text-xs text-muted-foreground">Stały kupon</p>
								<p className="text-sm font-bold text-blue-900">6.25%</p>
								{/* EN: Fixed coupon rate */}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
			{/* EDUCATIONAL FOOTER */}
			<footer className="rounded-xl overflow-hidden transition-all duration-300">
				<button
					onClick={() => setShowTip(!showTip)}
					className="w-full p-4 flex items-center justify-between transition-colors cursor-pointer group"
				>
					<div className="flex items-center gap-2 font-bold text-lg">
						{/* EN: Wrapper for the icon to handle the glow effect consistently */}
						{/* UI: Kontener dla ikony, aby obsłużyć efekt poświaty */}
						<div className="relative flex items-center justify-center">
							{/* EN: The glow effect (hidden by default, appears on group-hover) */}
							{/* UI: Efekt poświaty (ukryty, pojawia się po najechaniu na grupę) */}
							<div
								className={cn(
									"absolute inset-0 bg-yellow-400 blur-md opacity-0",
									showTip && "opacity-50 transition-opacity",
								)}
							/>

							<Lightbulb
								className={cn(
									"relative h-6 w-6  transition-all duration-300",
									showTip ? "text-yellow-400" : "text-yellow-600",
								)}
							/>
						</div>

						<span className="transition-colors duration-300 ">
							Wskazówka Inwestora
						</span>
					</div>

					<div className="text-muted-foreground  transition-colors">
						{showTip ? (
							<ChevronUp className="h-5 w-5" />
						) : (
							<ChevronDown className="h-5 w-5" />
						)}
					</div>
				</button>

				{/* EN: Animating the visibility of the content */}
				{/* UI: Animacja widoczności treści */}
				<div
					className={cn(
						"px-6 overflow-hidden transition-all duration-300 ease-in-out",
						showTip ? "max-h-40 pb-6 opacity-100" : "max-h-0 opacity-0",
					)}
				>
					<p className="text-muted-foreground text-sm border-t border-bond-blue-border pt-4">
						Pamiętaj, że w przypadku obligacji skarbowych (EDO/DOS) wcześniejszy
						wykup wiąże się z opłatą (zazwyczaj 0.70 zł - 2.00 zł za sztukę).
						Dla portfela o wartości{" "}
						<span className="font-bold text-foreground">
							{bondStats.totalInvested.toLocaleString()} PLN
						</span>{" "}
						koszt wyjścia przed czasem to około 110 PLN.
						{/* EN: Early redemption fee disclaimer. */}
					</p>
				</div>
			</footer>
		</div>
	);
}

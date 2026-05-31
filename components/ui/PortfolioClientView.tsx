"use client";

import { Briefcase, Globe, PieChart, Plus } from "lucide-react";

import { CategoryTable } from "@/components/CategoryTable";
import PortfolioCard from "@/components/PortfolioCard";
import { PortfolioWithAssets } from "@/lib/types";
import { SafeActionButton } from "./SafeActionButton";
import { SectionLayout } from "../shared/SectionLayout";
import { cn } from "@/lib/utils";

interface Props {
	portfolios: PortfolioWithAssets[];
	isDemo?: boolean;
	portfolioId?: string;
	categoryTotals: Record<string, number>;
}

export default function PortfoliosClientView({
	portfolios,
	portfolioId,
	categoryTotals,
	isDemo = false,
}: Props) {
	// Logic for global allocation stays here to be shared
	const totalValue = portfolios.reduce(
		(sum, p) => sum + p.assets.reduce((aSum, a) => aSum + a.currentValue, 0),
		0,
	);

	return (
		<>
			{/* SEKCJA 1: Twoje Portfele */}
			<SectionLayout
				title="Zarządzanie Portfelami"
				titleIcon={Briefcase}
				subtitle="Lista Portfeli"
				description="Przeglądaj, edytuj i dodawaj nowe portfele do swojego konta."
				action={
					<SafeActionButton
						label="Dodaj Nowy Portfel"
						icon={Plus}
						isDemo={isDemo}
						variant="outline"
						href="/portfolios/new"
					/>
				}
			>
				{/* UI: Oczyszczony kontener na karty portfeli z automatycznym gridem */}
				<div className="w-full min-w-0">
					<div
						className={cn(
							// MOBILKA: Flexbox z horyzontalnym scrollem, snappowaniem i ukrytym suwakiem
							"flex overflow-x-auto pb-6 justify-start gap-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4",

							// DESKTOP (od md/lg): Przełączenie na Grid, wyłączenie scrolla i reset marginesów
							"md:grid md:grid-cols-2 xl:grid-cols-3 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0 md:gap-6",
						)}
					>
						{portfolios.map((p) => (
							<div
								key={p.id}
								className={cn(
									// MOBILKA: Sztywne wymiary karty
									"min-w-[290px] sm:min-w-[320px] flex snap-start shrink-0",

									// DESKTOP: Reset sztywnej szerokości
									"md:min-w-0 md:w-full md:shrink",
								)}
							>
								<PortfolioCard portfolio={p} isDemo={isDemo} />
							</div>
						))}
					</div>
				</div>
			</SectionLayout>

			{/* SEKCJA 2: Alokacja Globalna */}
			<SectionLayout
				title="Alokacja Globalna"
				titleIcon={Globe}
				subtitle="Skład i Zdrowie Portfela"
				description="Rozkład aktywów ze wszystkich Twoich portfeli (łącznie)."
				subtitleIcon={PieChart}
				action={
					portfolioId ? (
						<SafeActionButton
							label="Dodaj Aktywo"
							icon={Plus}
							isDemo={isDemo}
							variant="outline"
							href={`/dashboard/${portfolioId}/add-asset`}
						/>
					) : undefined
				}
			>
				<CategoryTable data={categoryTotals} totalValue={totalValue} />
			</SectionLayout>
		</>
	);
}

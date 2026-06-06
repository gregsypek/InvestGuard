import {
	CalendarDays,
	LayoutDashboard,
	ListOrdered,
	PlusCircle,
	SearchX,
	Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

// EN: Added PLANNER to variants
// UI: Dodaliśmy PLANNER do dostępnych wariantów
type EmptyStateVariant =
	| "NOT_SELECTED"
	| "NOT_FOUND"
	| "PLANNER"
	| "PORTFOLIOS"
	| "ACTIVITY"
	| "BONDS";

interface Props {
	variant: EmptyStateVariant;
	title?: string;
	description?: string;
	userName?: string | null;
	portfolioId?: string;
}

const AddButton = () => (
	<Button
		asChild
		variant="outline"
		className="gap-2 border-dashed border-2 hover:bg-primary/5 transition-colors"
	>
		<Link href="/portfolios/new">
			<PlusCircle className="h-4 w-4" />
			Dodaj swój pierwszy portfel
		</Link>
	</Button>
);
const AddBondButton = ({ portfolioId }: { portfolioId: string }) => (
	<Button
		asChild
		variant="outline"
		className="gap-2 border-dashed border-2 hover:bg-primary/5 transition-colors"
	>
		<Link href={`/bond-reports/${portfolioId}/add-asset`}>
			<PlusCircle className="h-4 w-4" />
			Dodaj swóją pierwszą obligację
		</Link>
	</Button>
);

export default function PortfolioEmptyState({
	variant,
	title,
	description,
	userName,
	portfolioId,
}: Props) {
	const contentConfig = {
		NOT_SELECTED: {
			icon: <Wallet className="h-12 w-12 text-blue-500" />,
			defaultTitle: "Wybierz portfel",
			defaultDescription:
				"Aby zobaczyć analizę i aktywa, musisz najpierw wybrać jeden ze swoich portfeli.",
			// showButton: <AddButton />,
			showButton: null,
		},
		NOT_FOUND: {
			icon: <SearchX className="h-12 w-12 text-destructive" />,
			defaultTitle: "Nie znaleziono portfela",
			defaultDescription:
				"Wygląda na to, że portfel o tym identyfikatorze nie istnieje lub został usunięty.",
			showButton: null,
		},
		PLANNER: {
			icon: <CalendarDays className="h-12 w-12 text-emerald-500" />,
			defaultTitle: "Zaprojektuj swój kolejny ruch",
			defaultDescription: "Twój portfel czeka na nowe aktywa...",
			showButton: null,
		},
		PORTFOLIOS: {
			icon: <LayoutDashboard className="h-12 w-12 text-indigo-500" />,
			defaultTitle: "Twoja lista portfeli jest pusta",
			defaultDescription:
				"Nie stworzyłeś jeszcze żadnego portfela inwestycyjnego...",
			showButton: <AddButton />,
		},
		BONDS: {
			icon: <LayoutDashboard className="h-12 w-12 text-indigo-500" />,
			defaultTitle: "Twoja lista obligacji jest pusta",
			defaultDescription: "Nie dodałeś jeszcze żadnej obligacji...",
			// Renderuj przycisk tylko gdy portfolioId istnieje
			showButton: portfolioId ? (
				<AddBondButton portfolioId={portfolioId} />
			) : null,
		},
		ACTIVITY: {
			icon: <ListOrdered className="h-12 w-12 text-orange-500" />,
			defaultTitle: "Historia jest pusta",
			defaultDescription: "Nie zarejestrowałeś jeszcze żadnych transakcji...",
			showButton: null,
		},
	};

	const config = contentConfig[variant];
	const displayTitle = title ?? config.defaultTitle;
	const displayDescription = description ?? config.defaultDescription;

	// Link do portfeli — bezpieczny bez portfolioId
	const portfoliosHref = portfolioId
		? `/portfolios?portfolioId=${portfolioId}`
		: "/portfolios";

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4 animate-in fade-in zoom-in duration-700">
			{/* 1. Subtelna sekcja powitalna */}
			{userName && variant !== "NOT_FOUND" && (
				<div className="mb-8 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
					<p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
						Witaj, {userName}
					</p>
				</div>
			)}

			{/* 2. Ikona w nowoczesnym kontenerze */}
			<div className="mb-8 p-6 bg-t-bg-panel border border-t-border-subtle rounded-3xl shadow-xl shadow-black/5">
				<div className="text-t-text-secondary">
					{React.isValidElement(config.icon)
						? React.cloneElement(
								config.icon as React.ReactElement<
									React.SVGProps<SVGSVGElement>
								>,
								{
									className: "h-12 w-12 stroke-[1.5]",
								},
							)
						: config.icon}
				</div>
			</div>

			{/* 3. Tekst z nowoczesną typografią */}
			<div className="max-w-sm text-center mb-10 space-y-3">
				<h2 className="text-4xl font-black tracking-tighter text-t-text-primary">
					{displayTitle}
				</h2>
				<p className="text-sm font-medium text-t-text-tertiary leading-relaxed">
					{displayDescription}
				</p>
			</div>

			{/* 4. Przycisk w stylu Premium */}
			<div className="flex flex-col sm:flex-row gap-3">
				{(variant === "NOT_SELECTED" ||
					variant === "NOT_FOUND" ||
					variant === "PLANNER") && (
					<Button
						asChild
						className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
					>
						<Link href={portfoliosHref}>Zarządzaj Portfelami</Link>
					</Button>
				)}

				{variant === "PORTFOLIOS" && <AddButton />}
				{variant === "BONDS" && portfolioId && (
					<AddBondButton portfolioId={portfolioId} />
				)}
			</div>
		</div>
	);
}

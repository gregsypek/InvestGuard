// components/ui/PortfolioEmptyState.tsx
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

// EN: Added PLANNER to variants
// UI: Dodaliśmy PLANNER do dostępnych wariantów
type EmptyStateVariant =
	| "NOT_SELECTED"
	| "NOT_FOUND"
	| "PLANNER"
	| "PORTFOLIOS"
	| "ACTIVITY";

interface Props {
	variant: EmptyStateVariant;
	title?: string;
	description?: string;
	userName?: string | null;
}

export default function PortfolioEmptyState({
	variant,
	title,
	description,
	userName,
}: Props) {
	// EN: Configuration map for different application areas
	// UI: Mapa konfiguracji dla różnych obszarów aplikacji
	const contentConfig = {
		NOT_SELECTED: {
			icon: <Wallet className="h-12 w-12 text-blue-500" />,
			defaultTitle: "Wybierz portfel",
			defaultDescription:
				"Aby zobaczyć analizę i aktywa, musisz najpierw wybrać jeden ze swoich portfeli.",
			showAddButton: true,
		},
		NOT_FOUND: {
			icon: <SearchX className="h-12 w-12 text-destructive" />,
			defaultTitle: "Nie znaleziono portfela",
			defaultDescription:
				"Wygląda na to, że portfel o tym identyfikatorze nie istnieje lub został usunięty.",
			showAddButton: false,
		},
		PLANNER: {
			icon: <CalendarDays className="h-12 w-12 text-emerald-500" />,
			defaultTitle: "Zaprojektuj swój kolejny ruch",
			defaultDescription:
				"Twój portfel czeka na nowe aktywa. Zaplanuj zakupy lub uzupełnij bazę, aby utrzymać strategię.",
			showAddButton: false,
		},
		PORTFOLIOS: {
			icon: <LayoutDashboard className="h-12 w-12 text-indigo-500" />,
			defaultTitle: "Twoja lista portfeli jest pusta",
			defaultDescription:
				"Nie stworzyłeś jeszcze żadnego portfela inwestycyjnego. Dodaj go teraz, aby zacząć grupować swoje aktywa.",
			showAddButton: true,
		},
		ACTIVITY: {
			icon: <ListOrdered className="h-12 w-12 text-orange-500" />,
			defaultTitle: "Historia jest pusta",
			defaultDescription:
				"Nie zarejestrowałeś jeszcze żadnych transakcji. Twoja aktywność pojawi się tutaj po zrealizowaniu planów lub dodaniu aktywów.",
			showAddButton: false,
		},
	};

	const config = contentConfig[variant];
	const displayTitle = title ?? config.defaultTitle;
	const displayDescription = description ?? config.defaultDescription;

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto p-6">
			{/* EN: Personal greeting / UI: Personalizowane powitanie */}
			{userName && variant !== "NOT_FOUND" && (
				<div className="animate-in fade-in slide-in-from-top-4 duration-700">
					<p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">
						Witaj, {userName} 👋
					</p>
				</div>
			)}

			{/* EN: Icon container / UI: Kontener ikony */}
			<div className="p-5 bg-muted/50 rounded-full animate-in fade-in zoom-in duration-500 shadow-inner">
				{config.icon}
			</div>

			<div className="space-y-2">
				<h2 className="text-3xl font-black tracking-tighter">{displayTitle}</h2>
				<p className="text-muted-foreground text-sm leading-relaxed">
					{displayDescription}
				</p>
			</div>

			<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-4">
				{/* EN: Only show the "Manage" button if we are NOT already on the Portfolios page */}
				{/* UI: Pokaż przycisk "Zarządzaj", tylko jeśli NIE jesteśmy na stronie listującej portfele */}
				{variant !== "PORTFOLIOS" && (
					<Button
						asChild
						variant={variant === "NOT_FOUND" ? "outline" : "default"}
						className="gap-2 shadow-lg hover:shadow-xl transition-all"
					>
						<Link href="/portfolios">
							<Wallet className="h-4 w-4" />
							Zarządzaj portfelami
						</Link>
					</Button>
				)}

				{config.showAddButton && (
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
				)}
			</div>
		</div>
	);
}

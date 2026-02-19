// components/ui/PortfolioEmptyState.tsx
import { Wallet, SearchX, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// EN: Define possible states for the empty view
// UI: Definiujemy możliwe stany dla widoku pustego
type EmptyStateVariant = "NOT_SELECTED" | "NOT_FOUND";

interface Props {
	variant: EmptyStateVariant;
}

export default function PortfolioEmptyState({ variant }: Props) {
	const isNotSelected = variant === "NOT_SELECTED";

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto p-6">
			{/* EN: Visual icon based on the error type */}
			<div className="p-5 bg-blue-500/10 rounded-full animate-in fade-in zoom-in duration-500">
				{isNotSelected ? (
					<Wallet className="h-12 w-12 text-blue-500" />
				) : (
					<SearchX className="h-12 w-12 text-destructive" />
				)}
			</div>

			<div className="space-y-2">
				<h2 className="text-2xl font-bold tracking-tight">
					{isNotSelected ? "Wybierz portfel" : "Nie znaleziono portfela"}
				</h2>

				<p className="text-muted-foreground text-sm">
					{isNotSelected
						? "Aby zobaczyć analizę i aktywa, musisz najpierw wybrać jeden ze swoich portfeli z listy powyżej."
						: "Wygląda na to, że portfel o tym identyfikatorze nie istnieje lub został usunięty."}
				</p>
			</div>

			<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
				{/* EN: Primary action - always good to have a way out */}
				<Button
					asChild
					variant={isNotSelected ? "default" : "outline"}
					className="gap-2"
				>
					<Link href="/portfolios">
						<Wallet className="h-4 w-4" />
						Zarządzaj portfelami
					</Link>
				</Button>

				{isNotSelected && (
					<Button
						asChild
						variant="outline"
						className="gap-2 border-dashed hadow-lg cursor-pointer hover:bg-primary/40"
					>
						<Link href="/portfolios/new">
							<PlusCircle className="h-4 w-4" />
							Dodaj nowy
						</Link>
					</Button>
				)}
			</div>
		</div>
	);
}

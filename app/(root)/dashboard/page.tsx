import { db } from "@/lib/db";
import { calculateGapAnalysis } from "@/lib/calculations";
import DashboardClientView from "@/components/ui/DashboardClientView";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Wallet } from "lucide-react";

interface Props {
	searchParams: Promise<{ portfolioId?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
	// EN: Resolve searchParams from the URL
	const { portfolioId: urlPortfolioId } = await searchParams;

	// EN: Get fallback portfolio ID from cookies
	const cookieStore = await cookies();
	const cookiePortfolioId = cookieStore.get("selectedPortfolioId")?.value;

	const portfolioId = urlPortfolioId || cookiePortfolioId;

	// EN: 1. Check if any portfolios exist in the database at all
	const totalPortfoliosCount = await db.portfolio.count();

	// EN: 2. Try to fetch the specific portfolio if an ID is available
	const portfolio = portfolioId
		? await db.portfolio.findUnique({
				where: { id: portfolioId },
				include: { assets: true },
			})
		: null;

	// EN: SCENARIO A: User has zero portfolios (Fresh onboarding)
	if (totalPortfoliosCount === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 max-w-md mx-auto">
				<div className="p-4 bg-blue-500/10 rounded-full">
					<Wallet className="h-12 w-12 text-blue-500" />
				</div>
				<div className="space-y-2">
					<h2 className="text-3xl font-bold tracking-tight">Zacznij tutaj</h2>
					<p className="text-muted-foreground">
						Nie masz jeszcze żadnego portfela inwestycyjnego. Stwórz swój
						pierwszy portfel, aby zacząć zarządzać aktywami.
					</p>
				</div>
				<Button
					asChild
					size="lg"
					className="gap-2 shadow-lg cursor-pointer hover:bg-primary/40"
					variant="outline"
				>
					<Link href="/portfolios/new">
						<PlusCircle className="h-5 w-5" />
						Stwórz pierwszy portfel
					</Link>
				</Button>
			</div>
		);
	}

	// EN: SCENARIO B: Portfolios exist, but none is currently selected
	if (!portfolio) {
		return (
			<div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 max-w-md mx-auto p-6">
				<div className="text-6xl animate-bounce">☝️</div>
				<div className="space-y-2">
					<h2 className="text-2xl font-bold">Wybierz portfel</h2>
					<p className="text-muted-foreground">
						Masz już stworzone portfele, ale żaden nie jest obecnie aktywny.
						Wybierz jeden z listy powyżej lub dodaj nowy.
					</p>
				</div>
				<div className="flex gap-3">
					<Button
						variant="outline"
						asChild
						className="gap-2 shadow-lg cursor-pointer hover:bg-primary/40"
					>
						<Link href="/portfolios">Zarządzaj portfelami</Link>
					</Button>
				</div>
			</div>
		);
	}

	// EN: SCENARIO C: Portfolio selected and found, performing gap analysis
	const portfolioStatus = calculateGapAnalysis(portfolio);

	return (
		<DashboardClientView
			portfolio={portfolio}
			portfolioStatus={portfolioStatus}
		/>
	);
}

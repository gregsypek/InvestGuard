import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardClientView from "@/components/ui/DashboardClientView";
import { DashboardHeader } from "@/components/DashboardHeader";
import Header from "@/components/HeaderDemo";
import Link from "next/link";
import { STRATEGIES } from "@/lib/constants";
import { calculateGapAnalysis } from "@/lib/calculations";

export default async function DemoPage({
	searchParams,
}: {
	searchParams: Promise<{ s?: string }>;
}) {
	const params = await searchParams;
	const s = params.s;

	// 1. Najpierw sprawdzamy czy strategia istnieje
	const selectedStrategy = s ? STRATEGIES[s as keyof typeof STRATEGIES] : null;
	console.log("🚀 ~ DemoPage ~ selectedStrategy:", selectedStrategy);

	// 2. Jeśli wybrano strategię, renderujemy Dashboard
	if (selectedStrategy) {
		//@ts-expect-error - Tymczasowe obejście dla demo, bo DashboardClientView wymaga portfolio z bazy, a my mamy tylko obiekt
		const portfolioStatus = calculateGapAnalysis(selectedStrategy.data);
		const totalValue = selectedStrategy.data.assets.reduce(
			(sum, a) => sum + (a.currentValue || 0),
			0,
		);

		return (
			<div className="flex flex-col  ">
				{/* 1. Ręczne wywołanie Headera (Nawigacji) tylko dla Demo */}
				<Header
					portfolios={[]} // Tu możesz pobrać portfele użytkownika, jeśli chcesz
					// userButton={<div className="w-8 h-8 rounded-full bg-muted" />}
					selectedPortfolioId={selectedStrategy.data.id}
				/>

				<main className=" p-4 md:p-8 ">
					{/* 2. Statystyki (DashboardHeader) - Wywołujemy je tutaj, 
          bo layout z [id] tu nie sięga! */}
					<div className="bg-secondary/10 pb-2 border-b border-border  transition-colors">
						<DashboardHeader
							portfolio={selectedStrategy.data}
							name={selectedStrategy.title}
							totalValue={totalValue}
						/>
					</div>

					{/* 3. Główny widok dashboardu */}
					<div className="p-4 md:p-8 container mx-auto">
						<DashboardClientView
							portfolio={selectedStrategy.data}
							isDemo={true}
							portfolioStatus={portfolioStatus}
							allPortfoliosWithCash={[
								{ id: "demo-cash", name: "Gotówka Demo" },
							]}
						/>
					</div>
				</main>
			</div>
		);
	}

	// 3. Widok wyboru (jeśli nie wybrano strategii)
	return (
		<div className="min-h-screen bg-linear-to-b from-background to-secondary/20 py-20 px-6">
			<div className="max-w-6xl mx-auto text-center mb-16">
				<h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
					Wybierz swoją <span className="text-primary">strategię</span>
				</h1>
				<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
					Zobacz, jak MyWallet pomaga zarządzać różnymi podejściami do
					inwestowania. Wybierz model, aby przetestować aplikację.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mt-8">
				{Object.entries(STRATEGIES).map(([key, strategy]) => (
					<Card
						key={key}
						className="relative overflow-hidden border-2 transition-all group flex flex-col shadow-lg hover:shadow-primary/5 py-4"
					>
						<CardHeader>
							<div
								className={`w-12 h-12 rounded-lg ${strategy.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
							>
								<strategy.icon className={`w-6 h-6 ${strategy.color}`} />
							</div>
							<CardTitle className="text-2xl font-bold">
								{strategy.title}
							</CardTitle>
							<CardDescription className="text-primary font-medium">
								{strategy.slogan}
							</CardDescription>
						</CardHeader>

						<CardContent className="grow space-y-4 text-sm text-muted-foreground">
							<p>{strategy.description}</p>
							<div className="space-y-2 pt-4">
								<div className="flex justify-between items-center border-b pb-1">
									<span>Ryzyko:</span>
									<Badge variant="outline" className="font-mono">
										{strategy.risk}
									</Badge>
								</div>
								<div className="flex justify-between items-center border-b pb-1">
									<span>Atut:</span>
									<span className="text-foreground font-medium">
										{strategy.advantage}
									</span>
								</div>
							</div>
						</CardContent>

						<CardFooter className="pt-6">
							<Button asChild className="w-full font-bold group" size="lg">
								<Link href={`/demo?s=${key}`}>
									Zobacz Demo{" "}
									<ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
								</Link>
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}

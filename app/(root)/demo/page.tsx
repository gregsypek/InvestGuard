import { APP_NAME, STRATEGIES } from "@/lib/constants";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardClientView from "@/components/ui/DashboardClientView";
import { DashboardHeader } from "@/components/DashboardHeader";
import Header from "@/components/HeaderDemo";
import Link from "next/link";
import { calculateGapAnalysis } from "@/lib/calculations";

export default async function DemoPage({
	searchParams,
}: {
	searchParams: Promise<{ s?: string }>;
}) {
	const params = await searchParams;
	const s = params.s;

	// 1. Sprawdzamy czy strategia istnieje
	const selectedStrategy = s ? STRATEGIES[s as keyof typeof STRATEGIES] : null;

	// ==========================================
	// WIDOK 1: WYBRANA STRATEGIA (DASHBOARD)
	// ==========================================
	if (selectedStrategy) {
		const portfolioStatus = calculateGapAnalysis(selectedStrategy.data);
		const totalValue = selectedStrategy.data.assets.reduce(
			(sum, a) => sum + (a.currentValue || 0),
			0,
		);

		return (
			<div className="flex flex-col min-h-screen bg-t-bg-base text-t-text-primary font-sans transition-colors duration-300">
				{/* Nawigacja Demo */}
				<Header
					portfolios={[]}
					selectedPortfolioId={selectedStrategy.data.id}
				/>

				<main className="py-2 px-4 md:px-8">
					{/* Statystyki / Nagłówek Dashboardu */}
					<div className="bg-t-bg-base pb-4 border-b border-t-border-subtle transition-colors mb-4">
						<DashboardHeader
							portfolio={selectedStrategy.data}
							name={selectedStrategy.title}
							totalValue={totalValue}
						/>
					</div>

					{/* Główny widok dashboardu */}
					<div className="p-0 container mx-auto">
						<DashboardClientView
							portfolio={selectedStrategy.data}
							isDemo={true}
							portfolioStatus={portfolioStatus}
							allPortfoliosWithCash={[
								{ id: "demo-cash", name: "Gotówka Demo" },
							]}
							transactions={selectedStrategy.data.transactionHistories}
						/>
					</div>
				</main>
			</div>
		);
	}

	// ==========================================
	// WIDOK 2: WYBÓR STRATEGII (ONBOARDING DEMO)
	// ==========================================
	return (
		<div className="flex flex-col min-h-screen bg-t-bg-base text-t-text-primary overflow-hidden font-sans selection:bg-blue-500/30 transition-colors duration-300">
			{/* --- TŁO: ABSTRAKCYJNY WYKRES --- */}
			<div className="fixed inset-0 z-0 pointer-events-none flex justify-center overflow-hidden">
				<svg
					className="absolute inset-0 w-full h-full text-t-text-tertiary opacity-[0.04] dark:opacity-[0.03]"
					xmlns="http://www.w3.org/2000/svg"
				>
					<defs>
						<pattern
							id="dot-grid-demo"
							width="32"
							height="32"
							patternUnits="userSpaceOnUse"
						>
							<circle cx="2" cy="2" r="1" fill="currentColor" />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#dot-grid-demo)" />
				</svg>

				<svg
					className="absolute inset-0 w-full h-full"
					viewBox="0 0 1200 800"
					preserveAspectRatio="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<polyline
						points="-100,750 150,700 250,550 320,600 500,450 580,480 850,200 950,250 1300,50"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeDasharray="4 6"
						className="text-t-text-tertiary opacity-30 dark:opacity-20"
						vectorEffect="non-scaling-stroke"
					/>
					<path
						d="M -100 780 C 200 750, 300 450, 550 500 C 800 550, 900 250, 1300 100"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						className="text-blue-500/30 dark:text-blue-400/20"
						vectorEffect="non-scaling-stroke"
					/>
					<path
						d="M -100 800 C 350 800, 450 550, 700 600 C 950 650, 1000 350, 1300 200"
						fill="none"
						stroke="currentColor"
						strokeWidth="6"
						className="hidden lg:block text-cyan-500/15 dark:text-cyan-400/10"
						vectorEffect="non-scaling-stroke"
					/>
				</svg>

				<div className="absolute inset-0 bg-gradient-to-b from-t-bg-base/30 via-transparent to-t-bg-base" />
				<div className="absolute top-[20%] right-[20%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/15 blur-[120px] rounded-full" />
				<div className="absolute bottom-[40%] left-[30%] w-[300px] h-[300px] bg-cyan-500/10 dark:bg-cyan-500/10 blur-[100px] rounded-full" />
			</div>

			{/* --- GŁÓWNA ZAWARTOŚĆ --- */}
			<div className="relative z-10 flex flex-col items-center pt-8 pb-24 px-4 w-full max-w-7xl mx-auto">
				{/* Nagłówek */}
				<div className="text-center mb-16 animate-in slide-in-from-bottom-8 fade-in duration-1000">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-500 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
						Środowisko Testowe
					</div>
					<h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-t-text-primary">
						Wybierz swoją <br className="md:hidden" />
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
							strategię
						</span>
					</h1>
					<p className="text-lg text-t-text-secondary max-w-2xl mx-auto font-medium">
						Zobacz, jak {APP_NAME} pomaga zarządzać różnymi podejściami do
						inwestowania. Wybierz model, aby przetestować aplikację na żywych
						danych.
					</p>
				</div>

				{/* Grid z Kartami Strategii (Bento Style) */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-200">
					{Object.entries(STRATEGIES).map(([key, strategy]) => (
						<div
							key={key}
							className="relative overflow-hidden bg-t-bg-panel/95 backdrop-blur-md p-8 rounded-3xl border border-t-border hover:border-blue-500/30 transition-all duration-300 group flex flex-col shadow-lg z-10"
						>
							{/* Poświata karty (Glow na hover) */}
							<div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-colors pointer-events-none" />

							{/* Ikona */}
							<div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-t-border-subtle bg-black/5 dark:bg-white/5 group-hover:scale-110 group-hover:border-blue-500/30 transition-all duration-500">
								<strategy.icon className="w-6 h-6 text-t-text-secondary group-hover:text-blue-500 transition-colors" />
							</div>

							{/* Tytuł i Slogan */}
							<h3 className="text-2xl font-black text-t-text-primary mb-2 tracking-tight">
								{strategy.title}
							</h3>
							<p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-6">
								{strategy.slogan}
							</p>

							{/* Opis */}
							<p className="text-sm text-t-text-secondary mb-8 grow leading-relaxed">
								{strategy.description}
							</p>

							{/* Statystyki / Atrybuty */}
							<div className="space-y-3 mb-8">
								<div className="flex justify-between items-center border-b border-t-border-subtle pb-2">
									<span className="text-[10px] uppercase font-bold text-t-text-tertiary tracking-widest">
										Ryzyko
									</span>
									<span className="text-xs font-mono font-bold text-t-text-primary bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md border border-t-border-subtle shadow-sm">
										{strategy.risk}
									</span>
								</div>
								<div className="flex justify-between items-center border-b border-t-border-subtle pb-2">
									<span className="text-[10px] uppercase font-bold text-t-text-tertiary tracking-widest">
										Atut
									</span>
									<span className="text-xs font-bold text-t-text-primary text-right pl-4">
										{strategy.advantage}
									</span>
								</div>
							</div>

							{/* Przycisk */}
							<Button
								asChild
								className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-[10px] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] border-0"
							>
								<Link href={`/demo?s=${key}`}>
									Zobacz Demo{" "}
									<ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
								</Link>
							</Button>
						</div>
					))}
				</div>

				{/* Opcjonalny przycisk powrotu w stopce ekranu Demo */}
				<div className="mt-16 text-center">
					<Link
						href="/"
						className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary hover:text-t-text-primary transition-colors flex items-center justify-center gap-2"
					>
						<ArrowRight className="w-3 h-3 rotate-180" /> Powrót do strony
						głównej
					</Link>
				</div>
			</div>
		</div>
	);
}

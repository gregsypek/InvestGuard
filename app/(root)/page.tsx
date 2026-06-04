import {
	ArrowRight,
	BarChart3,
	BookOpen,
	ShieldCheck,
	TrendingUp,
	Wallet,
} from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
	// TYMCZASOWY PRZEŁĄCZNIK WIDOKU
	// Zmień na false, aby zobaczyć widok dla zalogowanego inwestora
	const isUserLoggedIn = false;

	if (isUserLoggedIn) {
		return <UserDashboard />;
	}

	return <GuestOnboarding />;
}

// ============================================================================
// WIDOK 1: DLA NOWYCH UŻYTKOWNIKÓW (Onboarding)
// ============================================================================
function GuestOnboarding() {
	return (
		<div className="flex flex-col min-h-[calc(100vh-4rem)] animate-in fade-in duration-700">
			{/* Hero Section (Sekcja Główna) */}
			<section className="relative flex-1 flex flex-col items-center justify-center py-20 px-4 text-center overflow-hidden">
				{/* Subtelny glow w tle dla efektu premium */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full -z-10 pointer-events-none" />

				<h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-t-text-primary">
					Witaj w{" "}
					<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
						{APP_NAME}
					</span>
				</h1>

				<p className="text-lg md:text-xl text-t-text-tertiary max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
					Twoja podróż do wolności finansowej zaczyna się tutaj. Zbuduj,
					monitoruj i rozwijaj swój portfel z niespotykaną precyzją.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
					<Button
						asChild
						className="h-14 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-bold uppercase tracking-widest text-[11px] transition-all hover:scale-105"
					>
						<Link href="/sign-in">
							Rozpocznij Inwestowanie <ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
					<Button
						asChild
						variant="outline"
						className="h-14 px-8 rounded-xl border-t-border-subtle bg-t-bg-panel hover:bg-t-hover text-t-text-secondary font-bold uppercase tracking-widest text-[11px] transition-all"
					>
						<Link href="/demo">Wypróbuj Demo</Link>
					</Button>
				</div>
			</section>

			{/* Features Section (Karty Funkcjonalności) */}
			<section className="py-20 container mx-auto px-4 max-w-6xl">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<FeatureCard
						icon={BarChart3}
						title="Śledzenie w czasie rzeczywistym"
						desc="Monitoruj akcje, ETF-y i obligacje w jednym, krystalicznie czystym panelu."
					/>
					<FeatureCard
						icon={ShieldCheck}
						title="Prywatność i Bezpieczeństwo"
						desc="Twoje dane są w pełni szyfrowane. Ty rządzisz swoim portfelem."
					/>
					<FeatureCard
						icon={BookOpen}
						title="Wiedza i Edukacja"
						desc="Zapisuj własne tezy inwestycyjne i śledź swoje decyzje z perspektywy czasu."
					/>
				</div>
			</section>
		</div>
	);
}

function FeatureCard({
	icon: Icon,
	title,
	desc,
}: {
	icon: any;
	title: string;
	desc: string;
}) {
	return (
		<div className="bg-t-bg-panel border border-t-border-subtle p-8 rounded-3xl shadow-sm hover:border-blue-500/30 transition-colors group flex flex-col items-center sm:items-start text-center sm:text-left">
			<div className="bg-black/5 dark:bg-white/5 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/10 transition-colors shrink-0">
				<Icon className="h-6 w-6 text-t-text-secondary group-hover:text-blue-500 transition-colors" />
			</div>
			<h3 className="text-lg font-black tracking-tight text-t-text-primary mb-3">
				{title}
			</h3>
			<p className="text-sm font-medium text-t-text-tertiary leading-relaxed">
				{desc}
			</p>
		</div>
	);
}

// ============================================================================
// WIDOK 2: DLA ZALOGOWANYCH (Dashboard Placeholder)
// ============================================================================
function UserDashboard() {
	return (
		<div className="p-6 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
			<div>
				<h1 className="text-3xl font-black tracking-tighter text-t-text-primary mb-1">
					Twój Przegląd
				</h1>
				<p className="text-sm font-medium text-t-text-tertiary">
					Krótkie podsumowanie Twojej dzisiejszej sytuacji na rynku.
				</p>
			</div>

			{/* Statystyki */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<DashboardStatCard
					title="Wartość Portfela"
					value="124 500,00"
					unit="PLN"
					subtext="+2.4% w tym miesiącu"
					subtextPositive={true}
					icon={Wallet}
				/>
				<DashboardStatCard
					title="Zysk / Strata (All Time)"
					value="+14 200,50"
					unit="PLN"
					subtext="+12.8% całkowitego zwrotu"
					subtextPositive={true}
					icon={TrendingUp}
				/>
				<DashboardStatCard
					title="Najlepsze Aktywo"
					value="S&P 500 ETF"
					unit=""
					subtext="+18% zysku"
					subtextPositive={true}
					icon={BarChart3}
				/>
			</div>

			{/* Dolna sekcja układu */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 min-h-[300px] flex items-center justify-center">
					<p className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
						Miejsce na główny wykres portfela
					</p>
				</div>

				<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 flex flex-col">
					<h3 className="text-sm font-black uppercase tracking-widest text-t-text-primary mb-6">
						Obserwowane Rynki
					</h3>
					<div className="space-y-4 flex-1">
						<MarketRow name="WIG20" value="-0.45%" isPositive={false} />
						<MarketRow name="S&P 500" value="+1.20%" isPositive={true} />
						<MarketRow name="Złoto (PLN)" value="+0.15%" isPositive={true} />
					</div>
				</div>
			</div>
		</div>
	);
}

function DashboardStatCard({
	title,
	value,
	unit,
	subtext,
	subtextPositive,
	icon: Icon,
}: any) {
	return (
		<div className="bg-t-bg-panel border border-t-border-subtle rounded-3xl p-6 shadow-sm">
			<div className="flex items-center gap-3 mb-4">
				<div className="p-2.5 bg-black/5 dark:bg-white/5 rounded-xl">
					<Icon className="h-4 w-4 text-t-text-secondary" />
				</div>
				<h3 className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
					{title}
				</h3>
			</div>
			<div className="flex items-baseline gap-2 mb-2">
				<span className="text-3xl font-black text-t-text-primary">{value}</span>
				{unit && (
					<span className="text-sm font-bold text-t-text-tertiary">{unit}</span>
				)}
			</div>
			<p
				className={`text-xs font-bold tracking-wide ${subtextPositive ? "text-emerald-500" : "text-rose-500"}`}
			>
				{subtext}
			</p>
		</div>
	);
}

function MarketRow({
	name,
	value,
	isPositive,
}: {
	name: string;
	value: string;
	isPositive: boolean;
}) {
	return (
		<div className="flex justify-between items-center border-b border-t-border-subtle pb-3 last:border-0">
			<span className="text-sm font-bold text-t-text-secondary">{name}</span>
			<span
				className={`font-mono text-sm font-bold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
			>
				{value}
			</span>
		</div>
	);
}

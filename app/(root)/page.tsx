import {
	ArrowRight,
	BarChart3,
	BookOpen,
	ShieldCheck,
	TrendingUp,
	Wallet,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

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

// --- WIDOK 1: DLA NOWYCH UŻYTKOWNIKÓW (Onboarding) ---
function GuestOnboarding() {
	return (
		<div className="flex flex-col min-h-screen">
			{/* Hero Section */}
			<section className="py-20 px-6 text-center bg-linear-to-b from-background to-secondary/20">
				<h1 className="text-4xl md:text-6xl font-black tracking-tighter  mb-6">
					Witaj w <span className="text-primary">{APP_NAME}</span>
				</h1>
				<p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
					Twoja podróż do wolności finansowej zaczyna się tutaj. Zarządzaj
					portfelem, ucz się strategii i kontroluj ryzyko w jednym miejscu.
				</p>
				<div className="flex justify-center gap-4">
					<Button size="lg" className="gap-2">
						<Link href="/portfolios/new" className="gap-2 flex items-center">
							Stwórz pierwszy portfel <ArrowRight className="w-4 h-4" />
						</Link>
					</Button>
					<Button variant="outline" size="lg" asChild>
						<Link href="/demo" className="gap-2 flex items-center px-4">
							Zobacz demo
						</Link>
					</Button>
				</div>
			</section>

			{/* Features / Education Grid */}
			<section className=" px-6 container mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<Card>
						<CardHeader>
							<ShieldCheck className="w-10 h-10 text-primary mb-2" />
							<CardTitle>Poznaj swoje ryzyko</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground mb-4">
								Nie wiesz, czy wolisz bezpieczne obligacje czy dynamiczne akcje?
								Nasz test profilu inwestora pomoże Ci to ustalić.
							</p>
							<Button variant="link" className="px-0 text-primary">
								Rozwiąż test ryzyka &rarr;
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<Wallet className="w-10 h-10 text-primary mb-2" />
							<CardTitle>Proste zarządzanie</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground mb-4">
								W naszej aplikacji w łatwy sposób dodasz aktywa, sprawdzisz
								dywersyfikację i zaplanujesz rebalancing portfela.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<BookOpen className="w-10 h-10 text-primary mb-2" />
							<CardTitle>Baza wiedzy</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground mb-4">
								W inwestowaniu najważniejsza jest wiedza. Przeczytaj nasze
								poradniki dla początkujących.
							</p>
							<Button variant="link" className="px-0 text-primary">
								Przejdź do bazy wiedzy &rarr;
							</Button>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Footer CTA */}
			<section className="py-20 text-center">
				<h2 className="text-3xl font-bold mb-6">Gotowy na start?</h2>
				<Button size="lg" className="px-8" asChild>
					<Link href="/dashboard" className="gap-2 flex items-center px-4">
						Zaczynamy
					</Link>
				</Button>
			</section>
		</div>
	);
}

// --- WIDOK 2: DLA ZALOGOWANYCH (Dashboard Preview) ---
function UserDashboard() {
	return (
		<div className="p-8 space-y-8">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Cześć, Inwestorze! 👋</h1>
					<p className="text-muted-foreground">
						Oto podsumowanie Twoich wyników.
					</p>
				</div>
				<Button>Dodaj transakcję</Button>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Całkowita wartość
						</CardTitle>
						<Wallet className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">124,500.00 PLN</div>
						<p className="text-xs text-muted-foreground">
							+2,500 PLN w tym miesiącu
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Stopa zwrotu (YTD)
						</CardTitle>
						<TrendingUp className="w-4 h-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">+12.4%</div>
						<p className="text-xs text-muted-foreground">Powyżej inflacji</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Najlepsze aktywo
						</CardTitle>
						<BarChart3 className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">S&P 500 ETF</div>
						<p className="text-xs text-green-600">+18% zysku</p>
					</CardContent>
				</Card>
			</div>

			{/* Sekcja Wykresów i Rynku (Placeholdery) */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card className="h-75 flex items-center justify-center bg-secondary/10 border-dashed">
					<p className="text-muted-foreground">
						Miejsce na wykres historyczny portfela
					</p>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Obserwowane rynki</CardTitle>
						<CardDescription>Aktualne notowania (Live)</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex justify-between items-center border-b pb-2">
							<span className="font-medium">WIG20</span>
							<span className="text-red-500 font-mono">-0.45%</span>
						</div>
						<div className="flex justify-between items-center border-b pb-2">
							<span className="font-medium">S&P 500</span>
							<span className="text-green-500 font-mono">+1.20%</span>
						</div>
						<div className="flex justify-between items-center border-b pb-2">
							<span className="font-medium">Złoto (USD)</span>
							<span className="text-green-500 font-mono">+0.80%</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="font-medium">USD/PLN</span>
							<span className="text-gray-500 font-mono">4.02 PLN</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

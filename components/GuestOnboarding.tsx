import {
	ArrowRight,
	BarChart3,
	BookOpen,
	LucideIcon,
	ShieldCheck,
} from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { Button } from "./ui/button";
import Link from "next/link";

interface FeatureCardProps {
	icon: LucideIcon;
	title: string;
	desc: string;
}

export default function GuestOnboarding() {
	return (
		<div className="flex flex-col min-h-[calc(100vh-4rem)] animate-in fade-in duration-700">
			<section className="relative flex-1 flex flex-col items-center justify-center py-20 px-4 text-center overflow-hidden">
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

			<section className="py-20 container mx-auto px-4 max-w-6xl">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<FeatureCard
						icon={BarChart3}
						title="Śledzenie w czasie rzeczywistym"
						desc="Monitoruj akcje, ETF-y i obligacje w jednym panelu."
					/>
					<FeatureCard
						icon={ShieldCheck}
						title="Prywatność i Bezpieczeństwo"
						desc="Twoje dane są chronione."
					/>
					<FeatureCard
						icon={BookOpen}
						title="Wiedza i Edukacja"
						desc="Zapisuj własne tezy i śledź swoje decyzje z perspektywy czasu."
					/>
				</div>
			</section>
		</div>
	);
}

function FeatureCard({ icon: Icon, title, desc }: FeatureCardProps) {
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

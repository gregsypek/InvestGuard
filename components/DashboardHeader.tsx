import { Container, Wallet2 } from "lucide-react";

import { PortfolioWithAssets } from "@/lib/types";
import { calculateAssetPL } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

type Props = {
	portfolio: PortfolioWithAssets;
	name: string;
	totalValue: number;
	customBreadcrumbs?: React.ReactNode; // Tu wstrzykniemy Twój kod
	userName?: string | null; // EN: New prop for the user's name
};
export const DashboardHeader = ({
	portfolio,
	name,
	customBreadcrumbs,
}: Props) => {
	// 1. Hooki (zawsze na górze)
	const assets = useMemo(() => portfolio?.assets || [], [portfolio?.assets]);
	const assetsWithPL = useMemo(() => {
		return assets.map((asset) => {
			const { profitAmount, profitPercent } = calculateAssetPL(asset);
			return { ...asset, profitAmount, profitPercent };
		});
	}, [assets]);

	const totalPortfolioValue = useMemo(
		() => assets.reduce((sum, asset) => sum + asset.currentValue, 0),
		[assets],
	);

	const totalInvestedCapital = useMemo(
		() => assetsWithPL.reduce((sum, asset) => sum + asset.investedCapital, 0),
		[assetsWithPL],
	);

	const totalProfitAmount = useMemo(
		() => assetsWithPL.reduce((sum, asset) => sum + asset.profitAmount, 0),
		[assetsWithPL],
	);

	const totalProfitPercent = useMemo(() => {
		if (totalInvestedCapital === 0) return 0;
		return (totalProfitAmount / totalInvestedCapital) * 100;
	}, [totalProfitAmount, totalInvestedCapital]);

	// --- LOGIKA RENDEROWANIA ---

	// Zmienna pomocnicza, by sprawdzić czy mamy już dane do statystyk
	const isLoading = !portfolio || !portfolio.assets;

	return (
		<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
			{/* LEWA STRONA: Zawsze widoczna (Breadcrumbs i Tytuł) */}
			<div>
				{customBreadcrumbs ? (
					customBreadcrumbs
				) : (
					<nav className="text-sm text-muted-foreground mb-2 italic">
						Panel Główny /{" "}
						<span className="text-primary font-medium">{name}</span>
					</nav>
				)}
				<div>
					{/* Dynamiczne {name} zamiast sztywnego tekstu */}
					<h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
						{name}
					</h1>
					<p className="text-muted-foreground font-medium mt-1">
						Zarządzaj portfelem i kontroluj strategie
					</p>
				</div>
			</div>

			{/* PRAWA STRONA: Statystyki (Pulsują, gdy isLoading jest true) */}
			<div className="flex items-center justify-end flex-wrap gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
				{isLoading ? (
					// SZKIELET STATYSTYK
					<>
						<div className="h-12 w-32 bg-muted animate-pulse rounded-xl" />
						<div className="h-12 w-32 bg-muted animate-pulse rounded-xl" />
						<div className="h-12 w-32 bg-muted animate-pulse rounded-xl" />
					</>
				) : (
					// REALNE DANE
					<>
						{/* Całkowita Wartość */}
						<div className="flex items-center flex-col text-primary px-4 py-2 rounded-xl border border-primary/20 shrink-0">
							<p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">
								Całkowita Wartość
							</p>
							<div className="flex items-center gap-2">
								<Wallet2 className="h-4 w-4" />
								<span className="font-mono font-black">
									{totalPortfolioValue.toLocaleString()}
								</span>
							</div>
						</div>

						{/* Kapitał */}
						<div className="flex items-center flex-col text-primary px-4 py-2 rounded-xl border border-primary/20 shrink-0">
							<p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">
								Zainwestowany kapitał
							</p>
							<div className="flex items-center font-mono font-black gap-2">
								<Container className="h-4 w-4" />
								<span className="font-mono font-black">
									{totalInvestedCapital.toLocaleString()}
								</span>
							</div>
						</div>

						{/* P&L */}
						<div className="flex items-center flex-col text-primary px-4 py-2 rounded-xl border border-primary/20 shrink-0">
							<p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">
								Całkowity Wynik (P&L)
							</p>
							<div
								className={cn(
									"flex items-baseline gap-2 font-mono font-black",
									totalProfitAmount > 0
										? "text-emerald-500"
										: totalProfitAmount < 0
											? "text-red-500"
											: "text-muted-foreground",
								)}
							>
								<span className="text-md tabular-nums">
									{totalProfitAmount > 0 ? "+" : ""}
									{totalProfitAmount.toLocaleString()}
								</span>
								<span className="text-[10px] font-bold">
									({totalProfitPercent > 0 ? "+" : ""}
									{totalProfitPercent.toFixed(2)}%)
								</span>
							</div>
						</div>
					</>
				)}
			</div>
		</header>
	);
};

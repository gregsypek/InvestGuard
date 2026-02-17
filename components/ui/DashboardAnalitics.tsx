import PortfolioTableBeauty from "@/app/portfel/components/PortfolioTableBeauty";
import { ArrowRightCircle, ChartArea, Circle, Plus, Star } from "lucide-react";
import PortfolioCharts from "../PortfolioCharts";
import { Button } from "./button";
import Link from "next/link";
import { DeleteButton } from "../DeleteButton";
import { COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CategoryStatus, PortfolioWithAssets } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { deleteAsset } from "@/lib/actions/portfolio.actions";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
}
const DashboardAnalitics = ({ portfolio, portfolioStatus }: Props) => {
	const { assets } = portfolio;
	const searchParams = useSearchParams();
	const highlightedId = searchParams.get("newAssetId");

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<div className="lg:col-span-2 space-y-8">
				<section>
					<div className="flex justify-between items-center mb-4">
						<h2 className="h2-bold flex items-center gap-2">
							<ArrowRightCircle className="h-5 w-5 text-primary" /> Rebalancing
							Guide
						</h2>
					</div>
					<PortfolioTableBeauty data={portfolioStatus} />
				</section>

				<section>
					<h2 className="h2-bold mb-4 flex items-center gap-2">
						<ChartArea className="h-5 w-5 text-primary" /> Allocation Strategy
					</h2>
					<PortfolioCharts data={portfolioStatus} />
				</section>
			</div>

			{/* 4. ASSET LIST (Boczna lista z zarządzaniem) */}
			<aside className="space-y-6">
				<div className="flex justify-between items-center">
					<h2 className="text-xl font-bold">Twoje aktywa</h2>
					<Button
						size="sm"
						variant="outline"
						className={cn(
							"h-8 gap-1.5 px-3 font-semibold text-xs uppercase tracking-wide",
							"transition-all duration-200",
							"border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400",
							"hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-800",
							"shadow-sm active:scale-95",
						)}
						asChild
					>
						<Link href={`/dashboard/${portfolio.id}/add-asset`}>
							<Plus className="h-3.5 w-3.5 stroke-[3px]" />
							Dodaj
						</Link>
					</Button>
				</div>

				<div className="space-y-3">
					{/* EN: Check if there are any assets to display */}
					{/* UI: Sprawdzenie, czy lista aktywów nie jest pusta */}
					{assets.length === 0 ? (
						<div className="flex flex-col items-center justify-center p-8 border border-dashed border-border2 rounded-xl bg-card/30 text-center space-y-3">
							<div className="space-y-4">
								<p className="text-sm font-medium">Brak aktywów</p>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Twój portfel jest pusty. Dodaj pierwsze aktywo, aby zacząć
									śledzić alokację.
								</p>
							</div>
						</div>
					) : (
						assets.map((asset) => {
							const isHighlighted = asset.id === highlightedId;
							return (
								<div
									key={asset.id}
									className={cn(
										"bg-card border p-3 rounded-lg flex justify-between items-center transition-all duration-500 relative group",
										isHighlighted
											? "border-blue-500 bg-blue-500/5 shadow-[0_0_15px_rgba(37,99,235,0.15)]"
											: "border-border2",
									)}
								>
									{/* LEWA STRONA: Gwiazdka + Nazwa/Kategoria */}
									<div className="flex items-center gap-3">
										{isHighlighted && (
											<Star className="h-4 w-4 fill-blue-500 text-blue-500 animate-pulse absolute left-0 top-0 -translate-y-1/2 -translate-x-1/2" />
										)}
										<div>
											{/* FIX: text-portfolio-${asset.name} may break if asset.name has spaces or isn't a Tailwind class.
                   Consider using text-foreground or a mapping if colors are specific to asset types.
                */}
											<p className="font-bold text-sm flex items-center gap-2">
												{asset.name}
											</p>
											<div className="flex items-center gap-2">
												<Circle
													className="w-2.5 h-2.5"
													fill={
														COLORS[asset.category as keyof typeof COLORS] ||
														"#ccc"
													}
												/>
												<p className="text-[10px] uppercase tracking-wider text-muted-foreground">
													{asset.category}
												</p>
											</div>
										</div>
									</div>

									{/* PRAWA STRONA: Kwota + Przycisk usuwania */}
									<div className="flex items-center gap-3">
										<p className="font-semibold text-sm tabular-nums">
											{asset.value.toLocaleString()} PLN
										</p>
										<DeleteButton
											id={asset.id}
											onDelete={deleteAsset}
											confirmMsg={`Delete ${asset.name}?`}
										/>
									</div>
								</div>
							);
						})
					)}
				</div>
			</aside>
		</div>
	);
};

export default DashboardAnalitics;

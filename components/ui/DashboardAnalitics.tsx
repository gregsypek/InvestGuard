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
					<h2 className="text-xl font-bold ">Your Assets</h2>
					<Button
						size="sm"
						variant="outline"
						className="h-8 gap-1 font-medium hover:text-blue-600 cursor-pointer"
						asChild
					>
						<Link href={`/dashboard/${portfolio.id}/add-asset`}>
							<Plus className="h-4 w-4 " />
							Add
						</Link>
					</Button>
				</div>

				<div className="space-y-3 ">
					{assets.map((asset) => {
						console.log("🚀 ~ DashboardClientView ~ asset:", asset);
						const isHighlighted = asset.id === highlightedId;
						return (
							<div
								key={asset.id}
								className={cn(
									"bg-card border p-3 rounded-lg flex justify-between items-center transition-all duration-500 relative",
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
										<p
											className={`font-bold text-sm flex items-center gap-2 text-portfolio-${asset.name}`}
										>
											{asset.name}
										</p>
										<div className="flex items-center gap-2 ">
											<Circle
												className="w-3 h-3 "
												fill={COLORS[asset.category as keyof typeof COLORS]}
											/>
											<p className="text-xs text-muted-foreground">
												{asset.category}
											</p>
										</div>
									</div>
								</div>
								{/* PRAWA STRONA: Kwota + Przycisk usuwania */}
								<div className="flex items-center gap-3">
									<p className="font-semibold text-sm">
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
					})}
				</div>
			</aside>
		</div>
	);
};

export default DashboardAnalitics;

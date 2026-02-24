"use client";

import { useState, useMemo } from "react";
import PortfolioTableBeauty from "@/app/portfel/components/PortfolioTableBeauty";
import {
	ArrowRightCircle,
	ChartArea,
	Plus,
	Star,
	ListOrdered,
	Circle,
} from "lucide-react";
import PortfolioCharts from "../PortfolioCharts";
import Link from "next/link";
import { DeleteButton } from "../DeleteButton";
import { COLORS, CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CategoryStatus, PortfolioWithAssets } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { deleteAsset } from "@/lib/actions/portfolio.actions";
import AddButton from "./AddButton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import BulbTip from "../shared/BulbTip";
import { Progress } from "@/components/ui/progress";
import QuickAdjustCell from "../QuickAdjustCell";
import { updateAssetValues } from "@/lib/actions/asset.actions";

interface Props {
	portfolio: PortfolioWithAssets;
	portfolioStatus: CategoryStatus[];
}

const DashboardAnalitics = ({ portfolio, portfolioStatus }: Props) => {
	const { assets } = portfolio;
	const searchParams = useSearchParams();
	const highlightedId = searchParams.get("newAssetId");

	// EN: Calculate total value for share percentage
	// UI: Obliczanie całkowitej wartości dla procentowego udziału
	const totalPortfolioValue = useMemo(
		() => assets.reduce((sum, asset) => sum + asset.currentValue, 0),
		[assets],
	);

	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	const totalPages = Math.ceil(assets.length / itemsPerPage);

	const paginatedAssets = assets.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);
	// EN:  Reverse to get latest, then slice
	// UI:  Odwracamy, by dostać najnowsze, potem tniemy
	const recentAssets = useMemo(
		() => [...assets].reverse().slice(0, 5),
		[assets],
	);

	return (
		<div className="space-y-12 pb-20">
			{/* --- TOP SECTION: CHARTS & SIDEBAR --- */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
				<div className="lg:col-span-2 space-y-10">
					<section>
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-xl font-bold tracking-tight uppercase italic flex items-center gap-2">
								<ArrowRightCircle className="h-5 w-5 text-primary" />{" "}
								Rebalancing Guide
							</h2>
						</div>
						<PortfolioTableBeauty data={portfolioStatus} />
					</section>

					<section>
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-xl font-bold tracking-tight uppercase italic flex items-center gap-2">
								<ChartArea className="h-5 w-5 text-primary" /> Allocation
								Strategy
							</h2>
						</div>
						<PortfolioCharts data={portfolioStatus} />
					</section>
				</div>

				{/* SIDEBAR: Recent Assets (Minimalist style) */}
				<aside className="space-y-6 ">
					<div className="flex justify-between items-center px-1">
						<h2 className="text-lg font-bold flex items-center gap-2">
							Ostatnie aktywa
						</h2>
						<AddButton className="h-8 px-3 text-xs">
							<Link
								href={`/dashboard/${portfolio.id}/add-asset`}
								className="flex items-center gap-1"
							>
								<Plus className="h-3.5 w-3.5" /> Dodaj
							</Link>
						</AddButton>
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
							recentAssets.map((asset) => {
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
												{asset.currentValue.toLocaleString()} PLN
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

			{/* --- BOTTOM SECTION: RICH ASSET TABLE --- */}
			<section className="pt-8 border-t border-border">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1 mb-8">
					<div className="space-y-1">
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<ListOrdered className="h-6 w-6 text-primary" /> Szczegółowy
							Rejestr Aktywów
						</h2>
						{/* <BulbTip
							title="Zasada:"
							content="Utrzymuj odchylenia poniżej 5%. Rebalansuj tylko gdy strategia tego wymaga, by unikać zbędnych kosztów."
						/> */}
						<div className="hidden sm:block">
							<BulbTip
								title="Zasada:"
								content="Utrzymuj odchylenia poniżej 5%. Rebalansuj tylko gdy strategia tego wymaga."
							/>
						</div>
						<div className="sm:hidden">
							{/* Wersja mobilna: tylko ikona lub krótszy tekst */}
							<p className="text-[10px] text-muted-foreground italic">
								💡 Cel: odchylenie &lt; 5%
							</p>
						</div>
					</div>

					<AddButton>
						<Link
							href={`/dashboard/${portfolio.id}/add-asset`}
							className="flex items-center gap-2"
						>
							<Plus className="h-4 w-4" /> Nowe Aktywo
						</Link>
					</AddButton>
				</div>

				<div className="w-full">
					{/* EN: Table with Alpha-inspired visual density */}
					{/* UI: Tabela inspirowana stylem Alpha z większą gęstością wizualną */}
					<Table>
						<TableHeader className="bg-muted/30">
							<TableRow className="border-border">
								<TableHead className="w-50 font-bold py-4">Aktywo</TableHead>
								<TableHead className="w-37.5 font-bold">Kategoria</TableHead>
								<TableHead className="w-50 font-bold text-center">
									Alokacja (%)
								</TableHead>
								<TableHead className="w-45 font-bold text-center">
									Korekta
								</TableHead>
								<TableHead className="text-right font-bold">
									Wartość Rynkowa
								</TableHead>
								<TableHead className="w-12"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{paginatedAssets.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-12 text-muted-foreground "
									>
										Portfel jest pusty. Zacznij dodawać aktywa.
									</TableCell>
								</TableRow>
							) : (
								paginatedAssets.map((asset) => {
									const isHighlighted = asset.id === highlightedId;
									const share = Number(
										((asset.currentValue / totalPortfolioValue) * 100).toFixed(
											1,
										),
									);
									const categoryColor =
										COLORS[asset.category as keyof typeof COLORS] || "#ccc";

									return (
										<TableRow
											key={asset.id}
											className={cn(
												"border-border hover:bg-muted/20 transition-colors group",
												isHighlighted && "bg-primary/5 ",
											)}
										>
											{/* EN: Name & Ticker - Alpha Style */}
											<TableCell className="relative py-2">
												<div className={"font-bold text-sm transition-all"}>
													{asset.name}
												</div>
												<div className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded mt-1 inline-block uppercase">
													{asset.ticker || "ASSET"}
												</div>
											</TableCell>

											{/* EN: Category Indicator */}
											<TableCell>
												<div className="flex items-center gap-1.5">
													<div
														className="w-2 h-2 rounded-full border border-border shadow-sm"
														style={{ backgroundColor: categoryColor }}
													/>
													<span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
														{CATEGORY_LABELS[asset.category]}
													</span>
												</div>
											</TableCell>

											{/* EN: Allocation Bar - Mirrors the "Conviction Bar" from Alpha */}
											<TableCell>
												<div className="space-y-1.5 pr-4">
													<div className="flex justify-between text-[10px] font-bold text-muted-foreground">
														<span>UDZIAŁ</span>
														<span className="text-primary">{share}%</span>
													</div>
													{/* EN: Using style for dynamic colors to bypass Tailwind JIT issues */}
													<Progress
														value={share}
														indicatorColor={categoryColor}
														className="h-1.5"
													/>
												</div>
											</TableCell>

											<TableCell className="w-40">
												<QuickAdjustCell
													assetId={asset.id}
													currentValue={asset.currentValue}
													onUpdate={updateAssetValues}
												/>
											</TableCell>
											{/* EN: Value - Mono font for financial clarity */}
											<TableCell className={cn("text-right relative")}>
												{isHighlighted && (
													<Star className="h-4 w-4 fill-yellow-500 text-yellow-500 animate-pulse absolute top-2 right-0  z-10" />
												)}
												<div
													className={"font-mono font-bold text-sm tabular-nums"}
												>
													{asset.currentValue.toLocaleString(undefined, {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
													<span className="text-[10px] text-muted-foreground ml-1.5 font-sans">
														PLN
													</span>
												</div>
											</TableCell>

											{/* EN: Actions on Hover */}
											<TableCell className="text-right">
												{/* EN: New Action Menu Idea: Dropdown instead of bare buttons */}
												{/* <DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 cursor-pointer group-hover:bg-muted"
														>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-32">
														<DropdownMenuItem className="cursor-pointer gap-2 hover:bg-blue-200">
															<Edit2 className="h-4 w-4" /> Edytuj
														</DropdownMenuItem>
														<DropdownMenuItem
															asChild
															className="cursor-pointer gap-2 text-destructive focus:text-destructive"
														>
															<DeleteButton
																id={asset.id}
																onDelete={deleteAsset}
																confirmMsg={`Czy na pewno chcesz usunąć ${asset.name}?`}
																label="Usuń" // EN: We'll pass the text as a new prop / UI: Przekażemy tekst jako nowy prop
															/>
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu> */}
												<DeleteButton
													id={asset.id}
													onDelete={deleteAsset}
													confirmMsg={`Czy na pewno chcesz usunąć ${asset.name}?`}
												/>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="pt-10 flex justify-center">
						<Pagination>
							<PaginationContent className="bg-muted/20 rounded-full px-2">
								<PaginationItem>
									<PaginationPrevious
										href="#"
										onClick={(e) => {
											e.preventDefault();
											setCurrentPage((p) => Math.max(1, p - 1));
										}}
										className={cn(
											"cursor-pointer",
											currentPage === 1 && "pointer-events-none opacity-30",
										)}
									/>
								</PaginationItem>
								<div className="text-[10px] font-black uppercase tracking-[0.2em] px-6 text-muted-foreground">
									Strona {currentPage} / {totalPages}
								</div>
								<PaginationItem>
									<PaginationNext
										href="#"
										onClick={(e) => {
											e.preventDefault();
											setCurrentPage((p) => Math.min(totalPages, p + 1));
										}}
										className={cn(
											"cursor-pointer",
											currentPage === totalPages &&
												"pointer-events-none opacity-30",
										)}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</section>
		</div>
	);
};

export default DashboardAnalitics;

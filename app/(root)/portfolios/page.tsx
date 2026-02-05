import { db } from "@/lib/db";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

/* Main portfolios page fetching data and showing overview cards */
export default async function PortfoliosPage() {
	const portfolios = await db.portfolio.findMany({
		include: {
			assets: true,
		},
		orderBy: { createdAt: "desc" },
	});

	if (portfolios.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
				<div className="bg-muted p-6 rounded-full">
					<Plus className="h-12 w-12 text-muted-foreground" />
				</div>
				<div className="max-w-md">
					<h2 className="text-2xl font-bold">Create your first portfolio</h2>
					<p className="text-muted-foreground mt-2">
						You need at least one portfolio to start managing your assets and
						boosters.
					</p>
				</div>
				<Button asChild size="lg">
					<Link href="/portfolios/new">Add Portfolio</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="h1-bold">My Portfolios</h1>
					<p className="text-muted-foreground">
						Manage your different investment buckets
					</p>
				</div>
				<Button asChild>
					<Link href="/portfolios/new">
						<Plus className="mr-2 h-4 w-4" /> New Portfolio
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{portfolios.map((p) => {
					const totalValue = p.assets.reduce(
						(sum, asset) => sum + asset.value,
						0,
					);
					const progress = p.goal ? (totalValue / p.goal) * 100 : 0;

					return (
						<Link key={p.id} href={`/dashboard?portfolioId=${p.id}`}>
							<Card
								key={p.id}
								className="hover:bg-foreground/10 transition-colors cursor-pointer border-border2"
							>
								<CardHeader>
									<CardTitle className="flex justify-between items-start">
										<span className="truncate">{p.name}</span>
										<span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
											{p.assets.length} Assets
										</span>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4 flex flex-col flex-1">
									<div>
										<p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
											Total Value
										</p>
										<p className="text-2xl font-bold text-primary">
											{totalValue.toLocaleString()} PLN
										</p>
									</div>

									{p.goal ? (
										<div className="space-y-2">
											<div className="flex justify-between text-xs">
												<span className="text-muted-foreground">
													Progress to goal ({p.goal.toLocaleString()} PLN)
												</span>
												<span className="font-bold">
													{progress.toFixed(1)}%
												</span>
											</div>
											<Progress
												value={Math.min(progress, 100)}
												className="h-2"
											/>
											{progress > 100 && (
												<p className="text-[10px] text-green-500 font-bold uppercase">
													Goal Exceeded! 🚀
												</p>
											)}
										</div>
									) : (
										<div className="text-xs flex grow ">
											<span className="text-muted-foreground ">
												No progress goal set.
											</span>
										</div>
									)}

									{p.description && (
										<p className="text-sm text-muted-foreground italic line-clamp-2 pt-2 border-t border-border2">
											{p.description}
										</p>
									)}
								</CardContent>
							</Card>
						</Link>
					);
				})}
			</div>
		</div>
	);
}

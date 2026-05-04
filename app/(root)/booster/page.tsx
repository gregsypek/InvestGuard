import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import BoosterForm from "./BoosterForm";
import { DeleteButton } from "@/components/DeleteButton";
import { db } from "@/lib/db";
import { deleteBoosterAsset } from "@/lib/actions/booster.actions";

/* Configuration for Time Horizons with colors and English descriptions */
const HORIZON_MAP = {
	SHORT: {
		label: "Short Term",
		description: "Investment horizon less than 1 year",
		color: "#3b82f6", // Blue
	},
	MEDIUM: {
		label: "Medium Term",
		description: "Investment horizon between 1 and 3 years",
		color: "#694f00", // Yellow
	},
	LONG: {
		label: "Long Term",
		description: "Investment horizon over 3 years",
		color: "#09682c", // Green
	},
};

export default async function BoosterPage() {
	/* Fetch booster assets from database */
	const boosterAssets = await db.asset.findMany({
		where: { category: "BOOSTER" },
		orderBy: { createdAt: "desc" },
	});
	// console.log("🚀 ~ BoosterPage ~ boosterAssets:", boosterAssets);

	return (
		<div className="space-y-8">
			<header>
				<h1 className="h1-bold text-foreground">Investment Booster 🚀</h1>
				<p className="text-muted-foreground italic">
					Manage your high-growth investment opportunities.
				</p>
			</header>

			<BoosterForm />

			<Card className="border-border2 bg-card">
				<CardHeader>
					<CardTitle className="text-xl font-bold text-foreground">
						Opportunity Tracker
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader className="bg-muted/50">
							<TableRow>
								<TableHead className="font-bold">Ticker</TableHead>
								<TableHead className="font-bold">Name</TableHead>
								<TableHead className="font-bold">Time Horizon</TableHead>
								<TableHead className="hidden md:table-cell font-bold">
									Rationale
								</TableHead>
								<TableHead className="text-right font-bold">Value</TableHead>
								<TableHead className="text-right font-bold">
									{/* For delete button */}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{boosterAssets.map((asset) => {
								const horizon =
									HORIZON_MAP[asset.timeHorizon as keyof typeof HORIZON_MAP] ||
									HORIZON_MAP.MEDIUM;

								return (
									<TableRow
										key={asset.id}
										className="hover:bg-muted/30 transition-colors"
									>
										<TableCell className="font-bold uppercase">
											{asset.ticker || "—"}
										</TableCell>
										<TableCell>{asset.name}</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												style={{
													borderColor: horizon.color,
													color: horizon.color,
												}}
												className="font-medium bg-transparent"
											>
												{horizon.label}
											</Badge>
										</TableCell>
										<TableCell className="py-4">
											{/* Text wrapping enabled by removing 'truncate' and setting leading-relaxed */}
											<p className="text-sm text-muted-foreground leading-relaxed wrap-break-words whitespace-normal min-w-50">
												{asset.rationale}
											</p>
										</TableCell>
										<TableCell className="text-right font-mono font-semibold text-primary">
											{asset.currentValue.toLocaleString("pl-PL", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}{" "}
											PLN
										</TableCell>
										<TableCell className="py-4 text-right">
											<DeleteButton
												id={asset.id}
												confirmMsg="Czy na pewno chcesz usunąć to aktywo?"
												// confirmMsg="Are you sure you want to remove this opportunity?"
												onDelete={deleteBoosterAsset}
											/>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>

					{/* Legend Section */}
					<div className="mt-8 pt-6">
						<h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
							Time Horizon Legend
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{Object.entries(HORIZON_MAP).map(([key, info]) => (
								<div key={key} className="flex items-start gap-3">
									<div
										className="w-3 h-3 rounded-full mt-1 shrink-0"
										style={{ backgroundColor: info.color }}
									/>
									<div>
										<p className="text-sm font-medium text-foreground">
											{info.label}
										</p>
										<p className="text-xs text-muted-foreground">
											{info.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

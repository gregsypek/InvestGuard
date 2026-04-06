// This table shows individual instruments and their weight within the category

import { Asset } from "@/lib/types";
import { calculateRebalance } from "@/lib/rebalance";
// Define a mapping object for category colors
const categoryStyles: Record<string, string> = {
	GOLD: "bg-portfolio-gold",
	BONDS: "bg-portfolio-bonds",
	DEVELOPED: "bg-portfolio-developed", // Added text color for contrast
	EMERGING: "bg-portfolio-emerging",
	BOOSTER: "bg-portfolio-booster",
};
export default function AssetsTable({ assets }: { assets: Asset[] }) {
	const rebalanceData = calculateRebalance(assets);
	const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
	return (
		<div className="overflow-x-auto rounded-lg border border-border shadow-sm">
			<table className="w-full text-left text-sm text-foreground">
				<thead className="bg-background text-foreground uppercase text-xs">
					<tr>
						<th className="px-6 py-3">Assets (Ticker)</th>
						<th className="px-6 py-3">Category</th>
						<th className="px-6 py-3 text-right">Current Value</th>
						<th className="px-6 py-3 text-right">Weight in Portfolio</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-200 bg-background">
					{assets.map((asset, index) => {
						const status = rebalanceData[index];
						// Calculate the exact amount needed to reach target
						const targetAmount = (asset.targetPercentage / 100) * totalValue;
						return (
							<tr key={asset.id} className="hover:bg-slate-50">
								<td className="px-6 py-4 font-medium text-foreground">
									{asset.name}{" "}
									<span className="text-foreground ml-1">({asset.ticker})</span>
								</td>
								<td className="px-6 py-4">
									<span
										className={`inline-block px-3 py-1 rounded-full text-xs text-sidebar ${categoryStyles[asset.category] || "bg-foreground"}`}
									>
										{asset.category}
									</span>
								</td>
								<td className="px-6 py-4 text-right">
									{asset.currentValue.toLocaleString("pl-PL")} PLN
								</td>
								<td className="px-6 py-4 text-right">
									{/* Calculation here */}
									<span
										className={
											Math.abs(status.deviation) > targetAmount
												? "text-green-500 font-bold"
												: "text-red-500 font-bold"
										}
									>
										{status.currentPercentage}%
									</span>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

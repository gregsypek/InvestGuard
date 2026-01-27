// components/CategoryHealthTable.tsx
import { Asset, MODEL_ALLOCATION } from "@/lib/types";

interface Props {
	assets: Asset[];
}

export default function CategoryHealthTable({ assets }: Props) {
	const totalValue = assets.reduce((sum, a) => sum + a.value, 0);

	return (
		<div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
			<table className="w-full text-left text-sm text-slate-600">
				<thead className="bg-slate-50 text-slate-700 uppercase text-xs tracking-wider">
					<tr>
						<th className="px-6 py-4 font-bold">Investment Class</th>
						<th className="px-6 py-4 text-right">Model %</th>
						<th className="px-6 py-4 text-right">Actual %</th>
						<th className="px-6 py-4 text-right">Deviation</th>
						<th className="px-6 py-4 text-right">Actual Amount</th>
						<th className="px-6 py-4 text-center">Action</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-200 bg-white">
					{MODEL_ALLOCATION.map((modelItem) => {
						// 1. Filter all assets belonging to this specific category
						// We map "Developed" from model to "EQUITY_DEV" from assets
						const categoryAssets = assets.filter((a) => {
							if (modelItem.name === "Bonds") return a.category === "BONDS";
							if (modelItem.name === "Developed")
								return a.category === "EQUITY_DEV";
							if (modelItem.name === "Emerging")
								return a.category === "EQUITY_EM";
							if (modelItem.name === "Gold") return a.category === "GOLD";
							if (modelItem.name === "Booster") return a.category === "BOOSTER";
							return false;
						});
						console.log(
							"🚀 ~ CategoryHealthTable ~ categoryAssets:",
							categoryAssets,
						);

						// 2. Sum the values for the whole category (e.g., 2050 + 480)
						const categoryAmount = categoryAssets.reduce(
							(sum, a) => sum + a.value,
							0,
						);

						// 3. Calculate percentages and deviation
						const currentPercentage =
							totalValue > 0 ? (categoryAmount / totalValue) * 100 : 0;
						const deviation = currentPercentage - modelItem.weight;

						// 4. Determine action
						let action: "BUY" | "SELL" | "HOLD" = "HOLD";
						if (deviation < -1) action = "BUY";
						if (deviation > 1) action = "SELL";

						return (
							<tr
								key={modelItem.name}
								className="hover:bg-slate-50 transition-colors"
							>
								<td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
									<span className={`w-2 h-2 rounded-full ${modelItem.color}`} />
									<span className="font-semibold text-slate-900">
										{modelItem.name}
									</span>
								</td>
								<td className="px-6 py-4 text-right font-medium text-slate-500">
									{modelItem.weight}%
								</td>
								<td className="px-6 py-4 text-right font-mono text-slate-700">
									{currentPercentage.toFixed(2)}%
								</td>
								<td
									className={`px-6 py-4 text-right font-bold ${deviation > 0 ? "text-green-600" : "text-rose-600"}`}
								>
									{deviation > 0 ? "+" : ""}
									{deviation.toFixed(2)}%
								</td>
								<td className="px-6 py-4 text-right text-slate-900 font-mono">
									{categoryAmount.toLocaleString()} PLN
								</td>
								<td className="px-6 py-4 text-center">
									<span
										className={`inline-block px-3 py-1 rounded-full text-xs font-bold
                    ${
											action === "BUY"
												? "bg-green-100 text-green-700"
												: action === "SELL"
													? "bg-rose-100 text-rose-700"
													: "bg-slate-100 text-slate-400"
										}`}
									>
										{action}
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

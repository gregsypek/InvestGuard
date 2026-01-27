// components/ComparisonBars.tsx
// Visualizing the gap between target model and current state

import ActualAllocationSummary from "@/components/ui/ActualAllocationSummary";
import ModelAllocationSummary from "@/components/ui/ModelAllocationSummary";

import { CATEGORY_ASSETS } from "@/lib/constants";
import { Asset } from "@/lib/types";

export default function ComparisonBars({ assets }: { assets: Asset[] }) {
	// Logic to calculate actual category percentages
	const total = assets.reduce((sum, a) => sum + a.value, 0);

	const actual = CATEGORY_ASSETS.map((cat) => ({
		name: cat,
		weight:
			(assets
				.filter((a) => a.category === cat)
				.reduce((s, a) => s + a.value, 0) /
				total) *
			100,
	}));

	return (
		<div className="space-y-6 p-6 bg-white rounded-2xl border border-slate-200">
			<div>
				<p className="text-xs text-slate-500 mb-2 uppercase font-bold">
					Model Portfolio (Target)
				</p>
				<ModelAllocationSummary />
			</div>

			<div>
				<p className="text-xs text-slate-500 mb-2 uppercase font-bold">
					Actual Portfolio (Current)
				</p>
				<ActualAllocationSummary assets={actual} />
			</div>
		</div>
	);
}

// components/AllocationSummary.tsx

import { MODEL_ALLOCATION } from "@/lib/types";

export default function ModelAllocationSummary() {
	return (
		<div className="p-6 bg-white rounded-xl shadow-md border border-slate-200">
			<h2 className="text-xl font-bold mb-4 text-slate-800">
				Model Allocation
			</h2>

			{/* Progress bar container */}
			<div className="flex h-8 w-full rounded-full overflow-hidden border border-slate-300">
				{MODEL_ALLOCATION.map((item) => (
					<div
						key={item.name}
						// Inline style is used for dynamic widths as Tailwind doesn't generate arbitrary percentage widths by default
						style={{ width: `${item.weight}%` }}
						className={`${item.color.toLowerCase()} h-full transition-all hover:opacity-80`}
						title={`${item.name}: ${item.weight}%`}
					/>
				))}
			</div>

			{/* Legend section */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
				{MODEL_ALLOCATION.map((item) => (
					<div key={item.name} className="flex items-center gap-2">
						<span
							className={`w-3 h-3 rounded-full ${item.color.toLowerCase()}`}
						/>
						<span className="text-xs font-medium text-slate-600">
							{item.name} ({item.weight}%)
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

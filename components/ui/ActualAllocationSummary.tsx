// components/ActualAllocationSummary.tsx

export default function ActualAllocationSummary({
	assets,
}: {
	assets: { name: string; weight: number }[];
}) {
	return (
		<div className="p-6 bg-white rounded-xl shadow-md border border-slate-200">
			<h2 className="text-xl font-bold mb-4 text-slate-800">
				Current Allocation
			</h2>

			{/* Progress bar container */}
			<div className="flex h-8 w-full rounded-full overflow-hidden border border-slate-300">
				{assets.map((item) => (
					<div
						key={item.name}
						// Inline style is used for dynamic widths as Tailwind doesn't generate arbitrary percentage widths by default
						style={{ width: `${item.weight}%` }}
						className={`bg-portfolio-${item.name.toLowerCase()} h-full transition-all hover:opacity-80`}
						title={`${item.name}: ${item.weight}%`}
					/>
				))}
			</div>

			{/* Legend section */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
				{assets.map((item) => (
					<div key={item.name} className="flex items-center gap-2">
						<span
							className={`w-3 h-3 rounded-full bg-portfolio-${item.name.toLowerCase()}`}
						/>
						<span className="text-xs font-medium text-slate-600 capitalize">
							{item.name.toLowerCase()} ({item.weight.toFixed(0)}%)
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

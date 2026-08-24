// components/shared/AssetFilterPanel.tsx
import { FilterBadge } from "./FilterBadge"; // Upewnij się, że ścieżka jest poprawna

interface AssetFilterPanelProps {
	hideClosed: boolean;
	onToggleHideClosed: () => void;
	sortBy: string;
	onSortChange: (sortId: string) => void;
	sortOptions?: { id: string; label: string }[];
}

export function AssetFilterPanel({
	hideClosed,
	onToggleHideClosed,
	sortBy,
	onSortChange,
	sortOptions = [
		{ id: "DEFAULT", label: "Ostatnia aktywność" },
		{ id: "ALPHA", label: "A-Z" },
		{ id: "VALUE", label: "Wartość" },
	],
}: AssetFilterPanelProps) {
	return (
		<div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4">
			<div className="flex items-center gap-2">
				<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">
					Widok:
				</span>
				<FilterBadge
					id="HIDE_CLOSED"
					label="Ukryj zamknięte"
					isSelected={hideClosed}
					onToggle={onToggleHideClosed}
				/>
			</div>

			<div className="hidden md:block w-px h-6 bg-slate-700/50 mx-1" />

			<div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
				<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">
					Sortuj:
				</span>
				{sortOptions.map((opt) => (
					<FilterBadge
						key={opt.id}
						id={opt.id}
						label={opt.label}
						isSelected={sortBy === opt.id}
						onToggle={() => onSortChange(opt.id)}
					/>
				))}
			</div>
		</div>
	);
}

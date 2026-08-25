import { FilterBadge } from "./FilterBadge";

interface AssetFilterPanelProps {
	hideClosed: boolean;
	onToggleHideClosed: () => void;
	sortBy: string;
	onSortChange: (sortId: string) => void;
	sortOptions?: { id: string; label: string }[];
	filterCategory?: string;
	onCategoryChange?: (catId: string) => void;
	availableCategories?: { id: string; label: string }[];
}

export function AssetFilterPanel({
	hideClosed,
	onToggleHideClosed,
	sortBy,
	onSortChange,
	sortOptions = [],
	filterCategory,
	onCategoryChange,
	availableCategories = [],
}: AssetFilterPanelProps) {
	return (
		// Główny kontener: układa się w kolumnę na małych ekranach, a w rzędzie od XL
		<div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 mb-6">
			{/* GRUPA 1: Widok i Kategoria */}
			<div className="flex flex-row flex-wrap items-center gap-3 sm:gap-4">
				{/* Widok */}
				<div className="flex items-center gap-2">
					<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
						Widok:
					</span>
					<FilterBadge
						id="HIDE_CLOSED"
						label="Ukryj zamknięte"
						isSelected={hideClosed}
						onToggle={onToggleHideClosed}
					/>
				</div>

				{/* Separator między Widokiem a Kategorią (ukryty na najmniejszych telefonach, jeśli by się zawinęło) */}
				{availableCategories.length > 0 && onCategoryChange && (
					<div className="hidden sm:block xl:hidden w-px h-5 bg-black/10 dark:bg-white/10" />
				)}

				{/* Kategoria */}
				{availableCategories.length > 0 && onCategoryChange && (
					<div className="flex items-center gap-2">
						<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
							Kategoria:
						</span>
						<select
							value={filterCategory}
							onChange={(e) => onCategoryChange(e.target.value)}
							className="bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border text-t-text-secondary text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
						>
							<option value="ALL">Wszystkie</option>
							{availableCategories.map((cat) => (
								<option key={cat.id} value={cat.id}>
									{cat.label}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			{/* Główny separator między lewą stroną a prawą (Sortowanie) widoczny tylko na dużych ekranach */}
			{/* <div className="hidden xl:block w-px h-5 bg-black/10 dark:bg-white/10 mx-1" /> */}

			{/* GRUPA 2: Sortowanie */}
			<div className="flex items-center gap-2 flex-wrap w-full xl:w-auto">
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

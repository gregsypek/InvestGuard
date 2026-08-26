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

	// 🚀 NOWE: Props dla selektora portfela (opcjonalne, bo używasz panelu też w innych miejscach)
	selectedPortfolioId?: string;
	onPortfolioChange?: (id: string) => void;
	portfolioOptions?: { id: string; label: string }[];
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
	selectedPortfolioId,
	onPortfolioChange,
	portfolioOptions = [],
}: AssetFilterPanelProps) {
	return (
		<div className="flex flex-col gap-3 mb-6">
			{/* RZĄD 1: Zakres i Widok (Płasko, bez otoczki) */}
			<div className="flex items-center justify-between gap-4">
				{/* Selektor Portfela */}
				{portfolioOptions.length > 0 && onPortfolioChange && (
					<div className="flex items-center gap-2">
						<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
							Zakres:
						</span>
						<select
							value={selectedPortfolioId}
							onChange={(e) => onPortfolioChange(e.target.value)}
							className="bg-transparent text-t-text-primary text-[11px] font-bold uppercase tracking-widest outline-none cursor-pointer border-b border-dashed border-slate-400 pb-0.5"
						>
							{portfolioOptions.map((opt) => (
								<option key={opt.id} value={opt.id} className="bg-t-bg-panel">
									{opt.label}
								</option>
							))}
						</select>
					</div>
				)}

				{/* Widok (Ukryj zamknięte) dosunięty do prawej */}
				<div className="flex items-center gap-2">
					<span className="hidden sm:inline text-[10px] font-bold text-slate-500 uppercase tracking-widest">
						Widok:
					</span>
					<FilterBadge
						id="HIDE_CLOSED"
						label="Ukryj zamknięte"
						isSelected={hideClosed}
						onToggle={onToggleHideClosed}
					/>
				</div>
			</div>

			{/* RZĄD 2: Kategoria i Sortowanie (ZAWSZE w jednej linii: flex-row zamiast flex-col) */}
			<div className="flex flex-row items-center gap-2 sm:gap-3">
				{/* Kategoria */}
				{availableCategories.length > 0 && onCategoryChange && (
					<div className="flex flex-1 xl:flex-none xl:w-56 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors overflow-hidden">
						<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
							Kategoria:
						</span>
						<select
							value={filterCategory}
							onChange={(e) => onCategoryChange(e.target.value)}
							className="w-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
						>
							<option value="ALL">Wszystkie</option>
							{availableCategories.map((cat) => (
								<option key={cat.id} value={cat.id} className="bg-t-bg-panel">
									{cat.label}
								</option>
							))}
						</select>
					</div>
				)}

				{/* Sortowanie */}
				<div className="flex flex-1 xl:flex-none xl:w-56 items-center gap-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg px-2 py-1.5 focus-within:border-t-border transition-colors overflow-hidden">
					<span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
						Sortuj:
					</span>
					<select
						value={sortBy}
						onChange={(e) => onSortChange(e.target.value)}
						className="w-full bg-transparent text-t-text-secondary text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer truncate"
					>
						{sortOptions.map((opt) => (
							<option key={opt.id} value={opt.id} className="bg-t-bg-panel">
								{opt.label}
							</option>
						))}
					</select>
				</div>
			</div>
		</div>
	);
}

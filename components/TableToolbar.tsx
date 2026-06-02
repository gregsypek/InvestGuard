import { ArrowUpDown, Briefcase, Filter, Search } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TableToolbarProps {
	// Wyszukiwarka
	searchQuery: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder?: string;

	// Sortowanie
	sortValue?: string;
	onSortChange?: (value: string) => void;
	sortOptions?: { label: string; value: string }[];

	// Filtrowanie (Opcjonalne, np. Kategoria)
	filterValue?: string;
	onFilterChange?: (value: string) => void;
	filterOptions?: { label: string; value: string }[];
	filterPlaceholder?: string;

	// ZMIANA: Nowe propsy dla filtra portfeli
	filterPortfolioValue?: string;
	onFilterPortfolioChange?: (value: string) => void;
	filterPortfolioOptions?: { label: string; value: string }[];
}

export function TableToolbar({
	searchQuery,
	onSearchChange,
	searchPlaceholder = "Szukaj...",
	sortValue,
	onSortChange,
	sortOptions,
	filterValue,
	onFilterChange,
	filterOptions,
	filterPlaceholder = "Wszystkie",
	filterPortfolioOptions,
	filterPortfolioValue,
	onFilterPortfolioChange,
}: TableToolbarProps) {
	return (
		<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
			{/* LEWA STRONA: Wyszukiwarka */}
			<div className="relative w-full sm:max-w-xs  ">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-t-text-tertiary" />
				<Input
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder={searchPlaceholder}
					className="pl-9 bg-t-bg-base border-t-border text-t-text-primary rounded-xl h-10 transition-colors focus:border-blue-500/50"
				/>
			</div>

			{/* PRAWA STRONA: Filtry i Sortowanie */}
			<div className="flex items-center justify-end flex-wrap gap-3 md:w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
				{/* NOWY FILTR: Portfele */}
				{filterPortfolioOptions && onFilterPortfolioChange && (
					<Select
						value={filterPortfolioValue}
						onValueChange={onFilterPortfolioChange}
					>
						<SelectTrigger className="w-full sm:w-[180px] h-10 bg-t-bg-base border-t-border rounded-xl shrink-0">
							<div className="flex items-center gap-2 text-t-text-secondary">
								<Briefcase className="h-3.5 w-3.5" />
								<SelectValue placeholder="Wszystkie Portfele" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Wszystkie Portfele</SelectItem>
							{filterPortfolioOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
				{/* Filtr (np. Kategoria) */}
				{filterOptions && onFilterChange && (
					<Select value={filterValue} onValueChange={onFilterChange}>
						<SelectTrigger className="w-full sm:w-[160px] h-10 bg-t-bg-base border-t-border rounded-xl">
							<div className="flex items-center gap-2 text-t-text-secondary">
								<Filter className="h-3.5 w-3.5" />
								<SelectValue placeholder={filterPlaceholder} />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Wszystkie</SelectItem>
							{filterOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				{/* Sortowanie */}
				{sortOptions && onSortChange && (
					<Select value={sortValue} onValueChange={onSortChange}>
						<SelectTrigger className="w-full sm:w-[180px] h-10 bg-t-bg-base border-t-border rounded-xl">
							<div className="flex items-center gap-2 text-t-text-secondary">
								<ArrowUpDown className="h-3.5 w-3.5" />
								<SelectValue placeholder="Sortuj według" />
							</div>
						</SelectTrigger>
						<SelectContent>
							{sortOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>
		</div>
	);
}

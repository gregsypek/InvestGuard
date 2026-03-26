import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

import { PAGE_ITEMS } from "@/lib/constants";
import React from "react";
import { cn } from "@/lib/utils";

// EN: Define correct type for state dispatcher
// UI: Zdefiniuj poprawny typ dla dyspacza stanu
interface PaginatedBarProps<T> {
	items: T[]; // EN: Generic items array
	currentPage: number;
	onClick: React.Dispatch<React.SetStateAction<number>>; // EN: Correct React state type
}

// 2. Dodajemy <T,> przy definicji funkcji (przecinek jest ważny w plikach .tsx)
const PaginatedBar = <T,>({
	items,
	currentPage,
	onClick,
}: PaginatedBarProps<T>) => {
	const totalPages = Math.ceil(items.length / PAGE_ITEMS);

	return (
		totalPages > 1 && (
			<div className="pt-10 flex justify-center">
				<Pagination>
					<PaginationContent className="bg-muted/20 rounded-full px-2">
						<PaginationItem>
							<PaginationPrevious
								href="#"
								onClick={(e) => {
									e.preventDefault();
									onClick((p) => Math.max(1, p - 1));
								}}
								className={cn(
									"cursor-pointer",
									currentPage === 1 && "pointer-events-none opacity-30",
								)}
							/>
						</PaginationItem>
						<div className="text-[10px] font-black uppercase tracking-[0.2em] px-6 text-muted-foreground">
							Strona {currentPage} / {totalPages}
						</div>
						<PaginationItem>
							<PaginationNext
								href="#"
								onClick={(e) => {
									e.preventDefault();
									onClick((p) => Math.min(totalPages, p + 1));
								}}
								className={cn(
									"cursor-pointer",
									currentPage === totalPages &&
										"pointer-events-none opacity-30",
								)}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		)
	);
};

export default PaginatedBar;

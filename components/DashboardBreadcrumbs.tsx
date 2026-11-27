"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface DashboardBreadcrumbsProps {
	name: string;
	id: string;
	fromOverview?: boolean;
}

export const DashboardBreadcrumbs = ({
	name,
	id,
	fromOverview = false,
}: DashboardBreadcrumbsProps) => {
	const pathname = usePathname();

	// Check if the current page is the "add-asset" subpage
	const isAddAssetPage = pathname.includes("/add-asset");

	return (
		<div className="mb-2">
			<nav className="text-[10px] sm:text-xs md:text-sm text-slate-400 flex items-center gap-1.5 flex-wrap italic">
				{fromOverview && !isAddAssetPage && (
					<>
						<Link
							href="/"
							className="inline-flex items-center transition-opacity text-theme-primary hover:opacity-80 cursor-pointer font-medium mr-0.5"
						>
							<ChevronLeft className="h-4 w-4" />
							<span>Przegląd inwestycji</span>
						</Link>
						<span className="text-slate-500">/</span>
					</>
				)}

				<Link
					href={`/dashboard/${id}`}
					className={cn(
						"inline-flex items-center transition-all h-5 italic",
						isAddAssetPage
							? "text-amber-600 decoration-amber-600/40 cursor-pointer font-medium"
							: "text-slate-400 no-underline cursor-default pointer-events-none",
					)}
				>
					{isAddAssetPage && (
						<ChevronLeft
							className="w-4 h-4 mr-0.5 no-underline"
							strokeWidth={2.5}
						/>
					)}
					<span>Aktywny Portfel</span>
				</Link>

				<span className="text-slate-500">/</span>

				<span
					className={cn(
						"transition-colors italic",
						isAddAssetPage ? "" : "text-theme-primary font-medium lowercase",
					)}
				>
					{name.toLocaleLowerCase()}
				</span>

				{isAddAssetPage && (
					<>
						<span className="text-slate-500">/</span>
						<span className="text-primary font-medium lowercase">
							dodaj aktywo
						</span>
					</>
				)}
			</nav>
		</div>
	);
};

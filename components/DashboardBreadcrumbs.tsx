"use client";

import { ChevronLeft } from "lucide-react"; // Assuming you use lucide-react (standard in shadcn)
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export const DashboardBreadcrumbs = ({
	name,
	id,
}: {
	name: string;
	id: string;
}) => {
	const pathname = usePathname();

	// Check if the current page is the "add-asset" subpage
	const isAddAssetPage = pathname.includes("/add-asset");

	return (
		<div className="flex flex-col gap-1 mb-2">
			<nav className="text-sm text-muted-foreground flex items-center gap-2">
				<Link
					href={`/dashboard/${id}`}
					className={cn(
						"inline-flex items-center transition-all h-5", // Fixed height helps vertical alignment
						isAddAssetPage
							? "text-amber-600  decoration-amber-600/40  cursor-pointer font-medium"
							: "text-muted-foreground no-underline cursor-default pointer-events-none",
					)}
				>
					{isAddAssetPage && (
						<ChevronLeft
							className="w-4 h-4 mr-0.5 no-underline"
							strokeWidth={2.5}
						/>
					)}
					<span>Panel Główny</span>
				</Link>

				<span className="text-muted-foreground/40">/</span>

				<span
					className={cn(
						"transition-colors",
						isAddAssetPage ? "" : "text-primary font-medium lowercase",
					)}
				>
					{name.toLocaleLowerCase()}
				</span>

				{isAddAssetPage && (
					<>
						<span className="text-muted-foreground/40">/</span>
						<span className="text-primary font-medium lowercase">
							dodaj aktywo
						</span>
					</>
				)}
			</nav>
		</div>
	);
};

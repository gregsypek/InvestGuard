"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const DashboardBreadcrumbs = ({
	name,
	id,
}: {
	name: string;
	id: string;
}) => {
	const pathname = usePathname();

	// Sprawdzamy czy jesteśmy na podstronie dodawania aktywów
	const isAddAssetPage = pathname.includes("/add-asset");
	const linkStyle = isAddAssetPage
		? {
				textDecoration: "underline",
				textUnderlineOffset: "4px",
				WebkitTextDecoration: "underline",
				textDecorationColor: "rgba(217, 119, 6, 0.4)", // Delikatniejsza linia pod linkiem
			}
		: { textDecoration: "none" };
	return (
		<div className="flex flex-col gap-1 mb-2">
			<nav className="text-sm text-muted-foreground">
				<Link
					href={`/dashboard/${id}`}
					className=" text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors mb-1 underline"
				>
					<span className="underline" style={linkStyle}>
						Panel Główny
					</span>{" "}
					/{" "}
				</Link>
				<span
					className={isAddAssetPage ? "" : "text-primary font-medium lowercase"}
				>
					{name.toLocaleLowerCase()}
				</span>
				{isAddAssetPage && (
					<>
						{" / "}
						<span className="text-primary font-medium lowercase">
							dodaj aktywo
						</span>
					</>
				)}
			</nav>
		</div>
	);
};

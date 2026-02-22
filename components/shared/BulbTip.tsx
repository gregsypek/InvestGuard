"use client";

import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { useState } from "react";

interface BulbTipProps {
	title: string;
	content: string;
	// EN: Optional prop to start expanded (e.g., for desktop views)
	// UI: Opcjonalny prop, aby zacząć w stanie rozwiniętym
	defaultExpanded?: boolean;
}

const BulbTip = ({ title, content, defaultExpanded = false }: BulbTipProps) => {
	const [showTip, setShowTip] = useState(defaultExpanded);

	return (
		<button
			onClick={() => setShowTip(!showTip)}
			// EN: Inline flex keeps everything on one line. Text matches terminal style.
			// UI: Inline flex trzyma wszystko w jednej linii. Styl dopasowany do terminala.
			className="inline-flex items-center text-[11px] font-medium uppercase tracking-wider cursor-pointer group text-left"
			title="Kliknij, aby rozwinąć/zwinąć wskazówkę"
		>
			{/* EN: Icon Wrapper with subtle hover glow */}
			{/* UI: Kontener ikony z subtelną poświatą przy najechaniu */}
			<div className="relative flex items-center justify-center mr-1.5">
				<div
					className={cn(
						"absolute inset-0 bg-yellow-400 blur-sm transition-opacity duration-300",
						showTip ? "opacity-30" : "opacity-0 group-hover:opacity-20",
					)}
				/>
				<Lightbulb
					className={cn(
						"relative h-3.5 w-3.5 transition-colors duration-300",
						showTip
							? "text-yellow-500"
							: "text-yellow-600 group-hover:text-yellow-500",
					)}
				/>
			</div>

			{/* EN: The Title (e.g. "Zasada:") */}
			<span
				className={cn(
					"transition-colors duration-300 whitespace-nowrap",
					showTip
						? "text-foreground font-bold"
						: "text-muted-foreground group-hover:text-foreground",
				)}
			>
				{title}
			</span>

			{/* EN: Horizontal expand container. We animate max-width for the sliding effect. */}
			{/* UI: Kontener rozwijany w poziomie. Animujemy max-width dla efektu wysuwania. */}
			<div
				className={cn(
					"overflow-hidden transition-all duration-500 ease-in-out flex items-center",
					showTip ? "max-w-200 opacity-100" : "max-w-0 opacity-0",
				)}
			>
				{/* EN: whitespace-nowrap prevents the text from wrapping onto multiple lines during animation */}
				{/* UI: whitespace-nowrap zapobiega zawijaniu tekstu w trakcie animacji */}
				<span className="pl-1 text-muted-foreground whitespace-nowrap">
					{content}
				</span>
			</div>
		</button>
	);
};

export default BulbTip;

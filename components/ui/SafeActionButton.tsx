"use client";

import { Lock, LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Używamy Sonner

interface SafeActionButtonProps {
	href?: string;
	onClick?: () => void;
	label: string;
	icon: LucideIcon;
	isDemo?: boolean;
	className?: string;
	variant?: "outline" | "default" | "ghost" | "secondary";
}

export const SafeActionButton = ({
	href,
	onClick,
	label,
	icon: Icon,
	isDemo,
	className,
	variant = "outline",
}: SafeActionButtonProps) => {
	const handleInteraction = (e: React.MouseEvent) => {
		if (isDemo) {
			e.preventDefault();
			e.stopPropagation();

			// Wywołanie Sonner
			toast.message("Tryb Edukacyjny", {
				description:
					"Ta funkcja jest dostępna tylko w Twoich prywatnych portfelach.",
				icon: <Lock className="h-4 w-4 text-emerald-500" />,
				// Możesz dodać przycisk akcji w Sonner:
				action: {
					label: "Zaloguj się",
					onClick: () => (window.location.href = "/sign-in"),
				},
			});
			return;
		}

		if (onClick) onClick();
	};

	const content = (
		<div className="flex items-center gap-2">
			{isDemo ? (
				<Lock className="h-3.5 w-3.5 shrink-0 text-emerald-600 transition-transform group-hover:scale-110" />
			) : (
				<Icon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110" />
			)}
			<span>{label}</span>
		</div>
	);

	return (
		<Button
			asChild={!!href && !isDemo} // Linkujemy tylko gdy nie ma dema
			variant={variant}
			onClick={handleInteraction}
			className={cn(
				"h-10 px-6 text-xs font-bold uppercase tracking-wide transition-all group rounded-2xl",
				// STYL NORMALNY (Niebieski)
				!isDemo &&
					"     border-slate-800 bg-slate-700 text-blue-300 hover:text-blue-400 border ",
				isDemo &&
					"border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 cursor-help",
				className,
			)}
		>
			{href && !isDemo ? (
				<Link href={href}>{content}</Link>
			) : (
				<div>{content}</div>
			)}
		</Button>
	);
};

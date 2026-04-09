import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Info,
	LineChart,
	LucideIcon,
	ShieldCheck,
	TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";

// EN: Define available variants
// UI: Dostępne warianty kart
type CardVariant = "orange" | "green" | "blue" | "purple" | "neutral";

interface BondStatCardProps {
	title: string;
	value: string;
	description: string;
	variant?: CardVariant; // EN: Optional, defaults to neutral
	icon?: LucideIcon; // EN: Manual icon override
	iconColor?: string; // EN: Manual icon color (Tailwind class)
	descColor?: string; // EN: Manual description color (Tailwind class)
	titleColor?: string; // EN: Manual title color (Tailwind class)
	valueColor?: string;
	hideIcon?: boolean; // EN: Option to completely remove the icon space
}

// EN: Configuration for each variant
// UI: Konfiguracja stylów dla każdego wariantu
const VARIANT_MAP = {
	orange: {
		icon: ShieldCheck,
		iconColor: "text-orange-500",
		descColor: "text-orange-600 dark:text-orange-400",
	},
	green: {
		icon: TrendingUp,
		iconColor: "text-green-500",
		descColor: "text-green-600 dark:text-green-400",
	},
	blue: {
		icon: LineChart,
		iconColor: "text-blue-500",
		descColor: "text-blue-600 dark:text-blue-400",
	},
	purple: {
		icon: LineChart,
		iconColor: "text-purple-500",
		descColor: "text-purple-600 dark:text-purple-400",
	},
	neutral: {
		icon: Info,
		iconColor: "text-muted-foreground",
		descColor: "text-muted-foreground",
	},
};

export function BondStatCard({
	title,
	value,
	description,
	variant = "neutral", // EN: Neutral is the fallback | UI: Neutralny jako domyślny
	icon: CustomIcon,
	iconColor,
	descColor,
	titleColor,
	valueColor,
	hideIcon,
}: BondStatCardProps) {
	// EN: Resolve which styles to use: manual props or variant map
	// UI: Rozstrzygnięcie stylów: ręczne propsy lub mapa wariantów
	const config = VARIANT_MAP[variant];

	// EN: If hideIcon is true, Icon will be null.
	// Otherwise, it takes CustomIcon or the variant default.
	// UI: Jeśli hideIcon jest true, ikona będzie null. W innym razie bierze CustomIcon lub domyślną.
	const Icon = hideIcon ? null : CustomIcon || config.icon;
	const finalIconColor = iconColor || config.iconColor;
	const finalDescColor = descColor || config.descColor;

	return (
		<Card className=" shadow-sm bg-background border-border2 flex flex-col  justify-between gap-2 min-w-62 flex-wrap">
			<CardHeader className="flex flex-row items-center justify-between  ">
				<CardTitle className={cn("text-sm font-medium", titleColor)}>
					{title}
				</CardTitle>
				{/* EN: Only renders if Icon exists and hideIcon is false */}
				{Icon && (
					<Icon className={cn("h-4 w-4 transition-colors", finalIconColor)} />
				)}
			</CardHeader>
			<CardContent>
				<div
					className={cn(
						"text-xl md:text-2xl font-bold tracking-tight px-4",
						valueColor,
					)}
				>
					{value}
				</div>
				<p className={cn("text-xs transition-colors", finalDescColor)}>
					{description}
				</p>
			</CardContent>
		</Card>
	);
}

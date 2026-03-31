import { Circle, Star } from "lucide-react";

import { Asset } from "@/lib/types";
import { COLORS } from "@/lib/constants";
import { DeleteButton } from "@/components/DeleteButton";
import React from "react";
import { cn } from "@/lib/utils";
import { deleteAsset } from "@/lib/actions/portfolio.actions";

interface Props {
	asset: Asset;
	isHighlighted: boolean;
	isDemo?: boolean;
}

export default function AssetCard({ asset, isHighlighted, isDemo }: Props) {
	return (
		<div
			key={asset.id}
			className={cn(
				"bg-background border border-blue-100 shadow-sm p-3 rounded-lg flex justify-between items-center transition-all duration-500 relative group",
				isHighlighted ? "border-blue-500 bg-blue-500/5 " : "border-blue-300",
			)}
		>
			{/* LEWA STRONA: Gwiazdka + Nazwa/Kategoria */}
			<div className="flex items-center gap-3">
				{isHighlighted && (
					<Star className="h-4 w-4 fill-blue-500 text-blue-500 animate-pulse absolute left-0 top-0 -translate-y-1/2 -translate-x-1/2" />
				)}
				<div>
					{/* FIX: text-portfolio-${asset.name} may break if asset.name has spaces or isn't a Tailwind class.
            Consider using text-foreground or a mapping if colors are specific to asset types. */}
					<p className="font-bold text-sm flex items-center gap-2">
						{asset.name}
					</p>
					<div className="flex items-center gap-2">
						<Circle
							className="w-2.5 h-2.5"
							fill={COLORS[asset.category as keyof typeof COLORS] || "#ccc"}
						/>
						<p className="text-[10px] uppercase tracking-wider text-muted-foreground">
							{asset.category}
						</p>
					</div>
				</div>
			</div>

			{/* PRAWA STRONA: Kwota + Przycisk usuwania */}
			<div className="flex items-center gap-3">
				<p className="font-semibold text-sm tabular-nums">
					{asset.currentValue.toLocaleString()} PLN
				</p>
				<DeleteButton
					id={asset.id}
					onDelete={deleteAsset}
					confirmMsg={`Usunąć ${asset.name}?`}
					isDemo={isDemo}
				/>
			</div>
		</div>
	);
}

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BoosterCardProps {
	// We use a combination of Prisma type and our Schema for safety
	asset: {
		id: string;
		name: string;
		ticker: string | null;
		currentValue: number;
		rationale: string | null; // Database can return null
		timeHorizon: "SHORT" | "MEDIUM" | "LONG" | string | null;
	};
}

const horizonConfig = {
	SHORT: {
		label: "Short",
		color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
	},
	MEDIUM: {
		label: "Medium",
		color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
	},
	LONG: {
		label: "Long",
		color: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
	},
};

export default function BoosterCard({ asset }: BoosterCardProps) {
	// Provide a fallback for null values to avoid crashes
	const safeHorizon =
		(asset.timeHorizon as keyof typeof horizonConfig) || "MEDIUM";
	const horizon = horizonConfig[safeHorizon];

	return (
		<Card className="h-full flex flex-col border-border2 shadow-md hover:shadow-lg transition-shadow">
			<CardHeader className="pb-2">
				<div className="flex justify-between items-start">
					<div>
						<CardTitle className="text-xl font-bold">{asset.name}</CardTitle>
						<p className="text-sm text-muted-foreground uppercase tracking-wider">
							{asset.ticker || "No Ticker"}
						</p>
					</div>
					<Badge className={`${horizon.color} border-none font-medium`}>
						{horizon.label}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="grow">
				<p className="text-sm text-foreground/80 leading-relaxed italic">
					{/* Fallback text if rationale is missing */}
					{asset.rationale || "No rationale provided."}
				</p>
			</CardContent>

			<CardFooter className="pt-4 border-t flex justify-between items-center">
				<span className="text-sm font-medium text-muted-foreground">
					Value:
				</span>
				<span className="text-lg font-bold text-primary">
					{new Intl.NumberFormat("en-US", {
						style: "currency",
						currency: "PLN",
					}).format(asset.currentValue)}
				</span>
			</CardFooter>
		</Card>
	);
}

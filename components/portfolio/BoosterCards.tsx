import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Target } from "lucide-react";

export default function BoosterCards() {
	// Dane "na sztywno" - Twoje pomysły
	const bets = [
		{
			ticker: "META",
			name: "Meta Platforms",
			thesis:
				"Sztuczna inteligencja zmonetyzuje się szybciej w social media niż w hardware. Metaverse to tylko dodatek.",
			conviction: 85, // Pewność w %
			entryPrice: 300,
			currentPrice: 480,
			targetPrice: 600,
			status: "WINNING",
		},
		{
			ticker: "PBR",
			name: "Petrobras / Kolumbia Oil",
			thesis:
				"Popyt na ropę w rynkach wschodzących nie spadnie przez 10 lat. Dywidenda pokrywa ryzyko polityczne.",
			conviction: 60,
			entryPrice: 15,
			currentPrice: 14.5,
			targetPrice: 22,
			status: "WAITING",
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-3 bg-purple-100 rounded-lg">
					<Lightbulb className="w-8 h-8 text-purple-600" />
				</div>
				<div>
					<h2 className="text-2xl font-bold">Booster & Speculacje</h2>
					<p className="text-muted-foreground">
						Portfel satelitarny. Wysokie ryzyko, wysoka nagroda.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{bets.map((bet) => (
					<Card
						key={bet.ticker}
						className="border-t-4 border-t-purple-500 hover:shadow-lg transition-shadow"
					>
						<CardHeader className="flex flex-row items-start justify-between pb-2">
							<div>
								<CardTitle className="text-xl flex items-center gap-2">
									{bet.ticker}
									{bet.status === "WINNING" && (
										<Badge className="bg-green-500">Zyskowny</Badge>
									)}
									{bet.status === "WAITING" && (
										<Badge variant="outline">Czekamy</Badge>
									)}
								</CardTitle>
								<span className="text-sm text-muted-foreground">
									{bet.name}
								</span>
							</div>
							<div className="text-right">
								<div className="text-2xl font-bold text-purple-700">
									{(
										((bet.currentPrice - bet.entryPrice) / bet.entryPrice) *
										100
									).toFixed(1)}
									%
								</div>
								<span className="text-xs text-muted-foreground">
									Zwrot (ROI)
								</span>
							</div>
						</CardHeader>

						<CardContent className="space-y-4">
							<div className="bg-slate-50 p-3 rounded-md italic text-sm text-slate-700 border border-slate-100">
								"{bet.thesis}"
							</div>

							<div className="space-y-1">
								<div className="flex justify-between text-xs font-medium">
									<span>Poziom Przekonania (Conviction)</span>
									<span>{bet.conviction}/100</span>
								</div>
								<Progress value={bet.conviction} className="h-2" />
							</div>

							<div className="grid grid-cols-3 gap-2 text-center text-sm pt-2">
								<div>
									<span className="block text-muted-foreground text-xs">
										Kupiono
									</span>
									<span className="font-mono">${bet.entryPrice}</span>
								</div>
								<div>
									<span className="block text-muted-foreground text-xs">
										Aktualnie
									</span>
									<span className="font-bold">${bet.currentPrice}</span>
								</div>
								<div>
									<span className="block text-muted-foreground text-xs">
										Cel (Target)
									</span>
									<span className="font-mono flex items-center justify-center gap-1 text-purple-600">
										<Target className="w-3 h-3" /> ${bet.targetPrice}
									</span>
								</div>
							</div>
						</CardContent>

						<CardFooter>
							{/* Tu kiedyś będą przyciski: "Zaktualizuj tezę" lub "Zamknij pozycję" */}
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}

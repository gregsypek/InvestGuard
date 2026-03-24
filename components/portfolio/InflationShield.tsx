import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { TrendingUp, ShieldCheck } from "lucide-react";

export default function InflationShield() {
	// Dane "na sztywno" symulujące wzrost EDO (Kapitalizacja odsetek)
	const mockGrowth = [
		{ year: "Rok 1", value: 100, height: "h-16" },
		{ year: "Rok 2", value: 107, height: "h-20" }, // +7%
		{ year: "Rok 3", value: 115, height: "h-24" }, // +8%
		{ year: "Rok 4", value: 125, height: "h-32" }, // Procent składany zaczyna działać
		{ year: "Rok 10", value: 170, height: "h-48" }, // Finał
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-3 bg-orange-100 rounded-lg">
					<ShieldCheck className="w-8 h-8 text-orange-600" />
				</div>
				<div>
					<h2 className="text-2xl font-bold">Tarcza Antyinflacyjna (EDO)</h2>
					<p className="text-muted-foreground">
						Twoje bezpieczne aktywa rosnące o inflację + 1.25%
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* KARTA 1: WYNIKI */}
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Symulacja Wzrostu Wartości</CardTitle>
						<CardDescription>
							Jak 100 zł zmienia się w czasie (przy inflacji 5%)
						</CardDescription>
					</CardHeader>
					<CardContent>
						{/* Prosty wykres słupkowy w CSS */}
						<div className="flex items-end gap-4 mt-8 h-64 border-b pb-2 px-4">
							{mockGrowth.map((bar, i) => (
								<div
									key={i}
									className="flex flex-col items-center gap-2 flex-1"
								>
									<span className="text-xs font-bold text-orange-600">
										{bar.value} zł
									</span>
									<div
										className={`w-full ${bar.height} bg-orange-200 rounded-t-md hover:bg-orange-300 transition-all relative group`}
									>
										{/* Tooltip on hover */}
										<div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-1 rounded">
											Zysk: {bar.value - 100} zł
										</div>
									</div>
									<span className="text-xs text-muted-foreground">
										{bar.year}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* KARTA 2: KALKULATOR PRZYSZŁOŚCI (Statyczny) */}
				<Card className="bg-slate-50 border-orange-200">
					<CardHeader>
						<CardTitle className="text-orange-700">Prognoza Zysku</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm text-muted-foreground">Twoje Obligacje:</p>
							<p className="text-2xl font-bold">12 500 PLN</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Aktualna Inflacja (GUS):
							</p>
							<p className="text-xl font-bold text-red-500">5.4%</p>
						</div>
						<div className="pt-4 border-t border-slate-200">
							<p className="text-sm font-medium">
								Przewidywana wartość za rok:
							</p>
							<div className="flex items-center gap-2 text-green-600 text-lg font-bold">
								<TrendingUp className="w-5 h-5" /> 13 331 PLN
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

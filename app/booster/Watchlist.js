// app/booster/Watchlist.js
import { getStockPrice } from "@/lib/getQuote";

export default async function Watchlist() {
	const symbols = ["CVX", "META", "LTAM.L"];

	// Pobieramy dane równolegle
	const prices = await Promise.all(
		symbols.map((symbol) => getStockPrice(symbol)),
	);

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
			{prices.map((data, index) => (
				<div
					key={symbols[index]}
					className="p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-lg"
				>
					<div className="flex justify-between items-start mb-4">
						<h3 className="text-xl font-bold text-white">{symbols[index]}</h3>
						<span
							className={`text-sm font-bold ${parseFloat(data.change) >= 0 ? "text-green-400" : "text-red-400"}`}
						>
							{data.change}%
						</span>
					</div>
					<p className="text-3xl font-mono text-blue-400">${data.price}</p>
					<p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">
						Live Quote
					</p>
				</div>
			))}
		</div>
	);
}

// (root)/page.tsx

import AssetsTable from "../portfel/components/AssetsTable";
import { mockAssets } from "@/lib/constants";
import ComparisonBars from "../portfel/components/ComparisonBars";
import PortfolioTableBeauty from "../portfel/components/PortfolioTableBeauty";
import { calculateGapAnalysis } from "@/lib/calculations";
import { db } from "@/lib/db";

export default async function DashboardLayout() {
	// const getData = await getStockPrice("EUNL.DE");
	// console.log("🚀 ~ DashboardLayout ~ getData:", getData);
	//   Odpowiedź z API dla EUNL.DE: {
	//   'Global Quote': {
	//     '01. symbol': 'EUNL.DE',
	//     '02. open': '113.1450',
	//     '03. high': '113.4950',
	//     '04. low': '112.7700',
	//     '05. price': '113.0050',
	//     '06. volume': '518741',
	//     '07. latest trading day': '2026-01-22',
	//     '08. previous close': '112.2450',
	//     '09. change': '0.7600',
	//     '10. change percent': '0.6771%'
	//   }
	// }
	// Fetch real data from your Vercel Postgres
	const assets = await db.asset.findMany();
	const portfolioStatus = calculateGapAnalysis(assets);
	return (
		<div className="min-h-screen bg-background flex">
			{/* Main Content */}
			<main className="flex-1 p-8">
				<header className="flex justify-between items-center mb-10">
					<h1 className="text-3xl font-extrabold text-foreground">
						Przegląd Aktywów
					</h1>
					<div className="flex gap-4">
						<span className="p-2 bg-green-100 text-green-700 rounded-full text-sm font-bold">
							+2.4% Today
						</span>
					</div>
				</header>
				{/* Tutaj wskoczyłyby Twoje karty z wykresami */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<div className="h-64 bg-background rounded-xl shadow-sm border border-border p-4">
						{/* Tu byłby wykres kołowy alokacji */}
					</div>
					<div className="h-64 bg-background rounded-xl shadow-sm border border-border p-4">
						{/* Tu byłyby kursy Chevron/Meta */}
					</div>
				</div>
				<div className="mt-5 text-foreground">
					<AssetsTable assets={mockAssets} />
				</div>
				<div className="mt-5 text-foreground"></div>
				<div className="mt-5 text-foreground">
					<PortfolioTableBeauty data={portfolioStatus} />
				</div>

				<div className="mt-5">
					<ComparisonBars assets={mockAssets} />
				</div>
			</main>
		</div>
	);
}

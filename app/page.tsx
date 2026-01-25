// Przykład layoutu z "czystym" Tailwindem
import { getStockPrice } from "@/lib/getQuote";
import { obliczProcentoweOdchylenie } from "./actions";

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
	const howmuch = await obliczProcentoweOdchylenie(4680, 6000);
	console.log("🚀 ~ DashboardLayout ~ howmuch:", howmuch);
	return (
		<div className="min-h-screen bg-slate-50 flex">
			{/* Sidebar - Twoje nawigacje */}
			<aside className="w-64 bg-slate-900 text-white p-6 shadow-xl">
				<h2 className="text-xl font-bold mb-8 text-blue-400">
					InvestNext v1.0
				</h2>
				<nav className="space-y-4">
					<div className="p-2 bg-slate-800 rounded">Dashboard</div>
					<div className="p-2 hover:bg-slate-800 rounded">Booster 5%</div>
					<div className="p-2 hover:bg-slate-800 rounded">Raporty EDO</div>
				</nav>
			</aside>

			{/* Main Content */}
			<main className="flex-1 p-8">
				<header className="flex justify-between items-center mb-10">
					<h1 className="text-3xl font-extrabold text-slate-800">
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
					<div className="h-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
						{/* Tu byłby wykres kołowy alokacji */}
					</div>
					<div className="h-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
						{/* Tu byłyby kursy Chevron/Meta */}
					</div>
				</div>
			</main>
		</div>
	);
}

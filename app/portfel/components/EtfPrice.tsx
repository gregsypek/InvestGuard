interface EtfData {
	symbol: string;
	price: number;
}

async function getEtfPrice(symbol: string): Promise<EtfData> {
	// W realnym świecie tutaj byłby fetch do API finansowego
	// Revalidate ustawiamy na 1 godzinę (3600 sekund)
	const res = await fetch(`https://api.example.com/etf/${symbol}`, {
		next: { revalidate: 3600 },
	});

	if (!res.ok) throw new Error("Błąd pobierania danych");

	return res.json();
}

export default async function EtfPrice() {
	const data = await getEtfPrice("IWDA"); // iShares World

	return (
		<div className="p-4 border rounded-lg shadow-sm bg-white">
			<h2 className="text-xl font-bold">{data.symbol}</h2>
			<p className="text-2xl text-green-600">{data.price} USD</p>
			<p className="text-sm text-gray-400">Dane odświeżane co godzinę</p>
		</div>
	);
}

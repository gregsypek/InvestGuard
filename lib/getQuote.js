export async function getStockPrice(symbol) {
	const apikey = process.env.ALPHA_VANTAGE_KEY;
	const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apikey}`;

	const res = await fetch(url, { next: { revalidate: 60 } });
	const data = await res.json();

	// NOTE: Check response in terminal
	console.log("Odpowiedź z API dla " + symbol + ":", data);

	// Chceck if API returned rate limit notice
	if (data["Note"]) {
		console.warn("Limit API przekroczony!");
		return { price: "Limit", change: "0" };
	}

	// Safely extract price and change
	const quote = data["Global Quote"];

	if (!quote || !quote["05. price"]) {
		return { price: "N/A", change: "0" };
	}

	return {
		price: parseFloat(quote["05. price"]).toFixed(2),
		change: quote["09. change"],
	};
}

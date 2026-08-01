import { calculateGapAnalysis } from "@/lib/calculations";

describe("Analiza Luki Portfela (calculateGapAnalysis)", () => {
	it("poprawnie wylicza wagi procentowe i brakujące kwoty w PLN", () => {
		// 1. Definiujemy portfel o łącznej wartości 10 000 PLN
		const mockPortfolio = {
			targetDeveloped: 50, // Cel: 50%
			targetCrypto: 50, // Cel: 50%
			assets: [
				{ category: "DEVELOPED", currentValue: 7000 }, // Rzeczywistość: 70%
				{ category: "CRYPTO", currentValue: 3000 }, // Rzeczywistość: 30%
			],
		};

		// 2. Odpalamy Twoją funkcję
		const result = calculateGapAnalysis(mockPortfolio as any);

		// 3. Sprawdzamy Rynki Rozwinięte (Mamy 70%, Cel to 50%)
		const developed = result.find((r) => r.category === "DEVELOPED");
		expect(developed?.actualAmount).toBe(7000);
		expect(developed?.actualPercentage).toBe(70);
		expect(developed?.differenceWeight).toBe(20); // Nadwyżka 20%
		expect(developed?.differencePLN).toBe(-2000); // Żeby zrównać do 50% (5000 PLN), musimy sprzedać 2000 PLN (-2000)

		// 4. Sprawdzamy Krypto (Mamy 30%, Cel to 50%)
		const crypto = result.find((r) => r.category === "CRYPTO");
		expect(crypto?.actualAmount).toBe(3000);
		expect(crypto?.actualPercentage).toBe(30);
		expect(crypto?.differenceWeight).toBe(-20); // Brakuje 20%
		expect(crypto?.differencePLN).toBe(2000); // Musimy kupić za 2000 PLN (dodatnie 2000)
	});

	it("bezpiecznie obsługuje pusty portfel (chroni przed dzieleniem przez zero)", () => {
		const emptyPortfolio = {
			targetGold: 100, // Chcemy 100% w złocie
			assets: [], // Ale nie mamy żadnych aktywów
		};

		const result = calculateGapAnalysis(emptyPortfolio as any);
		const gold = result.find((r) => r.category === "GOLD");

		// Przy pustym portfelu wszystko powinno grzecznie wynosić 0 (nie chcemy błędów NaN)
		expect(gold?.actualAmount).toBe(0);
		expect(gold?.actualPercentage).toBe(0);
		expect(gold?.differencePLN).toBe(0);
	});
});

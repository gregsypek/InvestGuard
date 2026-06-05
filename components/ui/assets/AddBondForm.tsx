"use client";

import { BOND_CONFIG, BOND_TEMPLATES } from "@/lib/constants";
import { Calculator, Calendar, Info, Landmark, Percent } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SubmitButton } from "../SubmitButton";
import { addBond } from "@/lib/actions/bond-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// 1. Define the type based on the config object
export default function AddBondForm({ portfolioId }: { portfolioId: string }) {
	// console.log("🚀 ~ AddBondForm ~ portfolioId:", portfolioId);

	const router = useRouter();
	const [specificName, setSpecificName] = useState(""); // EN: State for specific series code like EDO1035
	const [isPending, setIsPending] = useState(false);
	const [series, setSeries] = useState<keyof typeof BOND_TEMPLATES | "">("EDO");
	const [quantity, setQuantity] = useState<number>(0);
	const [purchaseDate, setPurchaseDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	);
	const [interestRate, setInterestRate] = useState<number | "">("");
	const [manualCurrentValue, setManualCurrentValue] = useState<number | "">("");

	// 1. Calculate time passed in years
	const timePassedInYears = useMemo(() => {
		const start = new Date(purchaseDate);
		const now = new Date();
		const diff = now.getTime() - start.getTime();
		const msInYear = 365.25 * 24 * 60 * 60 * 1000;
		return Math.max(diff / msInYear, 0);
	}, [purchaseDate]);

	// 2. Logic for automatic rate calculation
	const handleManualValueChange = (value: number | "") => {
		setManualCurrentValue(value);

		// EN: Only calculate if more than 0.01 year passed and we have invested capital
		if (value !== "" && investedCapital > 0 && timePassedInYears > 0.1) {
			// Formula: r = ((Kt / K0)^(1/t) - 1) * 100
			const calculatedRate =
				(Math.pow(value / investedCapital, 1 / timePassedInYears) - 1) * 100;
			setInterestRate(Number(calculatedRate.toFixed(2)));
		}
	};

	// 3. UI logic: Disable interest rate ONLY if manual value is provided
	const isRateDisabled = manualCurrentValue !== "";

	// Automatyczne wyliczanie wartości
	const investedCapital = quantity * 100;
	const maturityDate = useMemo(() => {
		if (!series || !purchaseDate) return "";
		const date = new Date(purchaseDate);
		const duration = BOND_TEMPLATES[series].duration;
		if (duration < 1) {
			date.setMonth(date.getMonth() + 3); // Dla OTS
		} else {
			date.setFullYear(date.getFullYear() + duration);
		}
		return date.toISOString().split("T")[0];
	}, [series, purchaseDate]);

	if (!portfolioId) {
		return (
			<main className="container mx-auto py-10">
				<div className="mt-12">
					<PortfolioEmptyState variant="NOT_SELECTED" />
				</div>
			</main>
		);
	}

	async function handleSubmit(formData: FormData) {
		setIsPending(true);

		// 1. Podstawowe dane, których serwer nie "zgadnie"
		formData.append("category", "BONDS");
		formData.append("portfolioId", portfolioId);
		formData.append("name", specificName || series);
		formData.append("ticker", series);

		// 2. Wartości finansowe i data zakupu
		formData.append("investedCapital", investedCapital.toString());
		formData.append("purchaseDate", purchaseDate);

		if (manualCurrentValue !== "") {
			formData.append("manualCurrentValue", manualCurrentValue.toString());
		}

		// Zamiast wysyłać cokolwiek, wyślijmy tylko to co sensowne
		if (interestRate !== "") {
			formData.append("interestRate", interestRate.toString());
		} else {
			formData.append("interestRate", "0"); // Fallback
		}

		try {
			const result = await addBond(formData, portfolioId);

			if (result?.success) {
				toast.success("Obligacja dodana do portfela! 🏛️");
				router.push(`/bond-reports/${portfolioId}`);
			} else {
				toast.error(result?.error || "Błąd zapisu w bazie danych");
			}
		} catch {
			toast.error("Wystąpił nieoczekiwany błąd sieci");
		} finally {
			setIsPending(false);
		}
	}

	// Wspólne style dla inputów w Twoim komponencie:
	const inputStyles =
		"h-12 bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-blue-500 rounded-xl px-4 text-sm font-medium text-t-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

	return (
		<>
			<form
				action={handleSubmit}
				className="w-full space-y-8 animate-in fade-in duration-300"
			>
				{/* ========================================= */}
				{/* 1. SEKCJA WYBORU SERII Z KOLORAMI */}
				{/* ========================================= */}
				<div className="space-y-4 bg-t-bg-base/30 dark:bg-black/20 p-6 rounded-2xl border border-t-border-subtle">
					<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary mb-2 block">
						Wybierz Serię Obligacji
					</Label>
					<div className="flex flex-wrap justify-start gap-4">
						{Object.entries(BOND_CONFIG).map(([key, config]) => (
							<button
								key={key}
								type="button"
								onClick={() => setSeries(key as keyof typeof BOND_CONFIG)}
								className={cn(
									"h-12 px-6 rounded-xl border transition-all flex items-center justify-center gap-2 group whitespace-nowrap min-w-[120px]",
									series === key
										? `${config.color} border-transparent text-white shadow-md scale-105`
										: "bg-black/5 dark:bg-white/5 border-t-border-subtle hover:border-t-border text-t-text-secondary hover:text-t-text-primary",
								)}
							>
								<div
									className={cn(
										"w-2 h-2 rounded-full",
										series === key ? "bg-white" : config.color,
									)}
								/>
								<span className="font-bold text-xs uppercase tracking-wider">
									{config.label}
								</span>
							</button>
						))}
					</div>
				</div>

				{/* ========================================= */}
				{/* 2. DANE SZCZEGÓŁOWE ZAKUPU */}
				{/* ========================================= */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Lewa kolumna: Inputy */}
					<div className="space-y-6">
						{/* Nazwa / Symbol */}
						<div className="space-y-2 relative">
							<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
								Symbol Serii (opcjonalnie)
							</Label>
							<Input type="hidden" name="portfolioId" value={portfolioId} />
							<div className="relative">
								<Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-t-text-tertiary" />
								<Input
									placeholder="np. EDO1035"
									value={specificName}
									onChange={(e) =>
										setSpecificName(e.target.value.toUpperCase())
									}
									className={cn(inputStyles, "pl-11 font-mono uppercase")}
								/>
							</div>
							<p className="text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary">
								Wpisz kod dla łatwiejszej identyfikacji.
							</p>
						</div>

						{/* Liczba Sztuk */}
						<div className="space-y-2">
							<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
								Liczba Sztuk
							</Label>
							<div className="relative">
								<Calculator className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-t-text-tertiary" />
								<Input
									type="number"
									name="quantity"
									placeholder="np. 50"
									onChange={(e) => setQuantity(Number(e.target.value))}
									required
									className={cn(inputStyles, "pl-11 pr-12 font-mono")}
								/>
								<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
									SZT
								</span>
							</div>
						</div>

						{/* Data Zakupu */}
						<div className="space-y-2">
							<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
								Data Zakupu
							</Label>
							<div className="relative">
								<Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-t-text-tertiary" />
								<Input
									type="date"
									name="purchaseDate"
									value={purchaseDate}
									onChange={(e) => setPurchaseDate(e.target.value)}
									required
									className={cn(inputStyles, "pl-11")}
								/>
							</div>
						</div>

						{/* Wycena Manualna */}
						<div className="space-y-2">
							<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
								Aktualna Wycena
							</Label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-t-text-tertiary">
									💰
								</span>
								<Input
									type="number"
									step="0.01"
									placeholder={`Domyślnie: ${investedCapital}`}
									value={manualCurrentValue}
									onChange={(e) =>
										handleManualValueChange(
											e.target.value === "" ? "" : Number(e.target.value),
										)
									}
									className={cn(inputStyles, "pl-11 pr-12 font-mono")}
								/>
								<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
									PLN
								</span>
							</div>
							<p className="text-[9px] font-bold uppercase tracking-widest text-t-text-tertiary">
								Wpisz historyczną wycenę, jeśli to nie jest nowy zakup.
							</p>
						</div>

						{/* Oprocentowanie */}
						<div className="space-y-2">
							<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
								Startowe Oprocentowanie
							</Label>
							<div className="relative">
								<Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-t-text-tertiary" />
								<Input
									type="number"
									step="0.01"
									value={interestRate}
									disabled={isRateDisabled}
									onChange={(e) =>
										setInterestRate(
											e.target.value === "" ? "" : Number(e.target.value),
										)
									}
									className={cn(inputStyles, "pl-11 pr-12 font-mono")}
								/>
								<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
									%
								</span>
							</div>
							{isRateDisabled && (
								<p className="text-[9px] font-bold uppercase tracking-widest text-blue-500">
									Wyliczono automatycznie z aktualnej wyceny.
								</p>
							)}
						</div>
					</div>

					{/* Prawa kolumna: Podsumowanie systemowe */}
					<div className="bg-blue-500/5 rounded-2xl p-6 md:p-8 border border-blue-500/20 shadow-inner h-fit sticky top-6">
						<div className="flex items-center gap-2 mb-6 border-b border-blue-500/20 pb-4">
							<Calculator className="h-5 w-5 text-blue-500" />
							<h3 className="text-sm font-black uppercase tracking-widest text-blue-500">
								Podsumowanie Transakcji
							</h3>
						</div>

						<div className="space-y-4">
							<div className="flex justify-between items-center pb-2">
								<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
									Data Wykupu:
								</span>
								<span className="font-mono font-bold text-sm text-t-text-primary">
									{maturityDate || "---"}
								</span>
							</div>

							<div className="flex justify-between items-center pb-2">
								<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
									Oprocentowanie:
								</span>
								<span className="text-xs font-bold uppercase tracking-widest text-t-text-secondary">
									{series ? BOND_TEMPLATES[series].rateType : "---"}
								</span>
							</div>

							<div className="flex flex-col justify-between items-start pt-4 border-t border-blue-500/20">
								<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary mb-1">
									Łączny koszt zakupu:
								</span>
								<span className="font-mono text-3xl font-black text-blue-600 dark:text-blue-400">
									{investedCapital.toLocaleString("pl-PL")}
									<span className="text-sm font-bold ml-2">PLN</span>
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Przycisk zapisu */}
				<div className="flex justify-end pt-6 border-t border-t-border-subtle">
					<SubmitButton
						disabled={isPending || !series || quantity <= 0}
						label={isPending ? "Zapisywanie..." : "Dodaj do portfela"}
						className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all"
					/>
				</div>
			</form>

			{/* ========================================= */}
			{/* 3. LEGENDA (Teraz jako elegancki panel informacji) */}
			{/* ========================================= */}
			<div className="mt-8 bg-t-bg-base/30 dark:bg-black/20 rounded-2xl border border-t-border-subtle p-6 md:p-8">
				<div className="flex items-center gap-3 mb-6 border-b border-t-border-subtle pb-4">
					<Info className="h-5 w-5 text-blue-500" />
					<span className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
						Legenda Oznaczeń Serii
					</span>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{Object.entries(BOND_CONFIG).map(([key, config]) => (
						<div
							key={key}
							className="flex gap-3 items-center group bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-transparent hover:border-t-border transition-colors"
						>
							<div
								className={cn(
									"w-3 h-3 rounded-full shrink-0 shadow-sm",
									config.color,
								)}
							/>
							<div className="flex flex-col leading-tight">
								<span className="text-xs font-bold text-t-text-primary">
									{BOND_TEMPLATES[key as keyof typeof BOND_TEMPLATES]?.label}
								</span>
								<span className="text-[10px] font-medium text-t-text-tertiary">
									{config.desc}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}

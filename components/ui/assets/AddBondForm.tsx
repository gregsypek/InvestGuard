"use client";

import { BOND_CONFIG, BOND_TEMPLATES } from "@/lib/constants";
import {
	Calculator,
	Calendar,
	Info,
	Landmark,
	Lightbulb,
	Percent,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PortfolioEmptyState from "@/components/PortfolioEmptyState";
import { SubmitButton } from "../SubmitButton";
import { addBond } from "@/lib/actions/bond-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AddBondForm({ portfolioId }: { portfolioId: string }) {
	console.log("🚀 ~ AddBondForm ~ portfolioId:", portfolioId);

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
	// AddBondForm.tsx

	async function handleSubmit(formData: FormData) {
		setIsPending(true);

		// 1. Podstawowe dane, których serwer nie "zgadnie"
		formData.append("category", "BONDS");
		formData.append("portfolioId", portfolioId);
		formData.append("name", specificName || series);
		formData.append("ticker", series);

		// 2. Wartości finansowe i data zakupu
		formData.append("investedCapital", investedCapital.toString());
		formData.append("purchaseDate", purchaseDate); // ISO String z Twojego state'u
		formData.append("interestRate", interestRate.toString());
		if (manualCurrentValue !== "") {
			formData.append("manualCurrentValue", manualCurrentValue.toString());
		}
		// NOTE: rateType, interestRate i maturityDate zostawiamy dla addBond na serwerze!
		// Serwer pobierze je sobie z BOND_TEMPLATES na podstawie "series".

		try {
			// Wywołujemy Twoją nową, modułową akcję
			const result = await addBond(formData, portfolioId);

			if (result?.success) {
				toast.success("Obligacja dodana do portfela! 🏛️");
				// Używamy portfolioId w ścieżce, żeby wrócić dokładnie tam, skąd przyszliśmy
				router.push(`/bond-reports/${portfolioId}`);
			} else {
				// Wyświetlamy błąd zwrócony z serwera (np. błąd bazy)
				toast.error(result?.error || "Błąd zapisu w bazie danych");
			}
		} catch {
			toast.error("Wystąpił nieoczekiwany błąd sieci");
		} finally {
			setIsPending(false);
		}
	}

	return (
		<>
			<form action={handleSubmit} className="w-full border-border2 space-y-6">
				{/* SEKCJA WYBORU SERII Z KOLORAMI */}
				<div className="space-y-4">
					<Label className="font-bold text-foreground pt-2">
						Wybierz Serię
					</Label>
					<div className="flex flex-wrap justify-between gap-4">
						{Object.entries(BOND_CONFIG).map(([key, config]) => (
							<button
								key={key}
								type="button"
								onClick={() => setSeries(key as any)}
								className={cn(
									"p-4 rounded-xl border border-dashed transition-all flex items-center justify-center gap-2 group w-40 h-8",
									series === key
										? `${config.color} border-transparent text-white shadow-sm scale-105`
										: ` hover:border-primary/50`,
								)}
							>
								<div
									className={cn(
										"w-3 h-3 rounded-full",
										series === key ? "bg-white" : config.color,
									)}
								/>
								<span className="font-bold text-sm">{key}</span>
							</button>
						))}
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Dane Zakupu */}
					<div className="space-y-4">
						{/* EN: Input for specific series identifier */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
								<Landmark className="h-3.5 w-3.5" /> Symbol Serii (opcjonalnie)
							</Label>
							<Input type="hidden" name="portfolioId" value={portfolioId} />
							<Input
								placeholder="np. EDO1035"
								value={specificName}
								onChange={(e) => setSpecificName(e.target.value.toUpperCase())}
								className="font-mono uppercase"
							/>
							<p className="text-[9px] text-muted-foreground">
								Wpisz konkretny kod, aby łatwiej identyfikować tę transzę.
							</p>
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
								<Calculator className="h-3.5 w-3.5" /> Liczba Sztuk
							</Label>
							<Input
								type="number"
								name="quantity"
								placeholder="np. 50"
								onChange={(e) => setQuantity(Number(e.target.value))}
								required
							/>
							<p className="text-[10px] text-muted-foreground italic">
								Koszt zakupu:{" "}
								<span className="font-mono font-bold text-foreground">
									{investedCapital.toLocaleString()} PLN
								</span>
							</p>
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
								<Calendar className="h-3.5 w-3.5" /> Data Zakupu
							</Label>
							<Input
								type="date"
								name="purchaseDate"
								value={purchaseDate}
								onChange={(e) => setPurchaseDate(e.target.value)}
								required
							/>
						</div>
						{/* Wewnątrz formularza (np. pod Data Zakupu): */}
						<div className="space-y-2">
							<Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
								💰 Aktualna Wycena (dla starych obligacji)
							</Label>
							<Input
								type="number"
								step="0.01"
								placeholder={`Opcjonalnie (domyślnie: ${investedCapital} PLN)`}
								value={manualCurrentValue}
								onChange={(e) =>
									setManualCurrentValue(
										e.target.value === "" ? "" : Number(e.target.value),
									)
								}
							/>
							<p className="text-[9px] text-muted-foreground">
								Wpisz kwotę z konta maklerskiego, jeśli dodajesz historyczną
								transzę.
							</p>
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
								<Percent className="h-3.5 w-3.5" /> Aktualne Oprocentowanie (%)
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									name="interestRate"
									placeholder="np. 6.80"
									value={interestRate}
									// EN: Handle empty string properly so it doesn't force a '0'
									onChange={(e) =>
										setInterestRate(
											e.target.value === "" ? "" : Number(e.target.value),
										)
									}
									className="pr-8"
								/>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
									%
								</span>
							</div>
						</div>
					</div>

					{/* Podsumowanie Automatyczne */}
					<div className="bg-muted/30 rounded-2xl p-6 border border-border/50 space-y-4">
						<h3 className="text-[10px] font-black uppercase tracking-widest opacity-60">
							Podsumowanie Systemowe
						</h3>
						<div className="space-y-3">
							<div className="flex justify-between items-center border-b border-border/40 pb-2">
								<span className="text-xs text-muted-foreground">
									Data Wykupu:
								</span>
								<span className="font-mono font-bold text-sm">
									{maturityDate || "---"}
								</span>
							</div>
							<div className="flex justify-between items-center border-b border-border/40 pb-2">
								<span className="text-xs text-muted-foreground">
									Typ Oprocentowania:
								</span>
								<span className="text-xs font-bold uppercase tracking-tighter ">
									{series ? BOND_TEMPLATES[series].rateType : "---"}
								</span>
							</div>
							<div className="flex justify-between items-center pt-2">
								<span className="text-xs text-muted-foreground">
									Wkład własny:
								</span>
								<span className="font-mono font-black text-primary">
									{investedCapital.toLocaleString()} PLN
								</span>
							</div>
						</div>
					</div>
				</div>
				<div className="flex justify-end">
					<SubmitButton
						disabled={isPending || !series || quantity <= 0}
						label={isPending ? "Zapisywanie..." : "Dodaj do portfela 🏛️"}
						// isLoading={isPending || !series || quantity <= 0}
					/>
				</div>
			</form>
			{/* --- NOWA UNIWERSALNA LEGENDA (DYNAMICZNA) --- */}
			<div className="mt-8 flex flex-col gap-6 px-6 py-6 bg-muted/10 rounded-2xl border border-border/40">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Info className="h-4 w-4 text-primary" />
						<span className="text-xs  text-muted-foreground  tracking-[0.2em]">
							Legenda Oznaczeń Serii i Zapadalności
						</span>
					</div>
					<div className="flex items-center gap-1.5 italic opacity-60 bg-yellow-500/10 px-3 py-1 rounded-full">
						<Lightbulb className="h-3.5 w-3.5 text-yellow-600" />
						<span className="text-[10px] text-muted-foreground font-bold uppercase">
							Pasek postępu = czas do wykupu transzy
						</span>
					</div>
				</div>

				{/* EN: Grid layout for 6 items - responsive (2 columns on mobile, 3 on tablet, 6 on desktop) */}
				<div className="flex flex-nowrap gap-6">
					{Object.entries(BOND_CONFIG).map(([key, config]) => {
						// Pobieramy czas trwania z drugiego obiektu dla pełnej informacji
						const duration =
							BOND_TEMPLATES[key as keyof typeof BOND_TEMPLATES]?.duration;
						const isYears = duration >= 1;

						return (
							<div key={key} className="flex gap-2 group">
								{/* EN: Using the exact background color from your config */}
								<div
									className={cn(
										"w-2 h-2 rounded-full shadow-sm shrink-0",
										config.color,
									)}
								/>
								<div className="flex leading-tight items-center gap-2">
									<span className="text-[12px] text-foreground tracking-tight">
										{BOND_TEMPLATES[key as keyof typeof BOND_TEMPLATES]?.label}
									</span>
									<span className="text-[9px] text-muted-foreground font-medium uppercase truncate">
										{isYears ? `${duration} Lat` : "3 Mies."}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</>
	);
}

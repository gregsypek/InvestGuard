"use client";

import { Calculator, Calendar, Landmark } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Button } from "../button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAssetAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const BOND_TEMPLATES = {
	EDO: { label: "EDO (10-letnie)", duration: 10, rateType: "VARIABLE" },
	COI: { label: "COI (4-letnie)", duration: 4, rateType: "VARIABLE" },
	DOS: { label: "DOS (2-letnie)", duration: 2, rateType: "FIXED" },
	OTS: { label: "OTS (3-miesięczne)", duration: 0.25, rateType: "FIXED" },
};
const BOND_CONFIG = {
	EDO: {
		label: "EDO (10-letnie)",
		color: "bg-orange-300",
		border: "border-orange-200",
	},
	DOS: {
		label: "DOS (2-letnie)",
		color: "bg-blue-300",
		border: "border-blue-200",
	},
	COI: {
		label: "COI (4-letnie)",
		color: "bg-emerald-300",
		border: "border-emerald-200",
	},
	OTS: {
		label: "OTS (3-miesięczne)",
		color: "bg-slate-300",
		border: "border-slate-200",
	},
};

export default function AddBondForm({ portfolioId }: { portfolioId: string }) {
	console.log("🚀 ~ AddBondForm ~ portfolioId:", portfolioId);
	const router = useRouter();
	const [specificName, setSpecificName] = useState(""); // EN: State for specific series code like EDO1035
	const [isPending, setIsPending] = useState(false);
	const [series, setSeries] = useState<keyof typeof BOND_TEMPLATES | "">("");
	const [quantity, setQuantity] = useState<number>(0);
	const [purchaseDate, setPurchaseDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	);

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

	// AddBondForm.tsx

	async function handleSubmit(formData: FormData) {
		setIsPending(true);

		// 1. NAPRAWA KATEGORII: Prisma oczekuje wartości z Enuma (BONDS), a nie polskiego słowa
		formData.append("category", "BONDS");
		formData.append("portfolioId", portfolioId);

		// EN: Now we distinguish between the general ticker (EDO) and specific name (EDO1035)
		formData.append("name", specificName || series); // Jeśli puste, użyj "EDO" jako fallback
		formData.append("ticker", series);

		// 3. MAPOWANIE WARTOŚCI: Upewniamy się, że kwoty są poprawnie przekazane
		formData.append("investedCapital", investedCapital.toString());
		formData.append("currentValue", investedCapital.toString());

		// 4. DATA: addAssetAction oczekuje pola "executedAt" dla historii transakcji
		formData.append("executedAt", purchaseDate);

		// Opcjonalnie: jeśli  akcja addAssetAction obsługuje te pola, możesz je też wysłać
		// formData.append("maturityDate", maturityDate);
		// formData.append("rateType", BOND_TEMPLATES[series].rateType);

		try {
			const result = await addAssetAction(formData);

			if (result?.success) {
				toast.success("Obligacja dodana do skarbca! 🏛️");
				router.push(`/bond-reports`);
			} else {
				toast.error(result?.message || "Błąd zapisu w bazie danych");
			}
		} catch {
			toast.error("Wystąpił nieoczekiwany błąd");
		} finally {
			setIsPending(false);
		}
	}

	return (
		<form
			action={handleSubmit}
			className="w-full bg-card border-border2 space-y-6"
		>
			{/* SEKCJA WYBORU SERII Z KOLORAMI */}
			<div className="space-y-3">
				<Label className="text-xs uppercase font-black text-muted-foreground">
					Wybierz Serię
				</Label>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					{Object.entries(BOND_CONFIG).map(([key, config]) => (
						<button
							key={key}
							type="button"
							onClick={() => setSeries(key as any)}
							className={cn(
								"p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 group",
								series === key
									? `${config.color} border-transparent text-white shadow-lg scale-105`
									: `bg-card ${config.border} hover:border-primary/50`,
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
							<span className="text-xs font-bold uppercase tracking-tighter italic">
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

			<Button
				type="submit"
				disabled={isPending || !series || quantity <= 0}
				className={cn(
					"w-full h-12 font-black uppercase tracking-widest transition-all",
					series
						? BOND_CONFIG[series as keyof typeof BOND_CONFIG].color
						: "bg-muted",
				)}
			>
				{isPending ? "Zapisywanie..." : "Dodaj do portfela 🏛️"}
			</Button>
		</form>
	);
}

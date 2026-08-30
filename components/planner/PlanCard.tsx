"use client";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";
import { CATEGORY_LABELS, COLORS, inputStyles } from "@/lib/constants";
import {
	CalendarIcon,
	CheckSquare,
	Clock,
	Loader2,
	RefreshCw,
	Trash2,
	Wand2,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { InvestmentPlan, Portfolio } from "@prisma/client";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import {
	closePlanWithoutExecution,
	deleteInvestmentPlan,
	executePlan,
} from "@/lib/actions/planner.actions";
import { cn, generateBondName } from "@/lib/utils";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlannerSchema } from "@/lib/validations/planner";
import PremiumDeleteModal from "../shared/PremiumDeleteModal";
import { SimpleSwitch } from "../ui/SimpleSwitchProps";
import { Slider } from "../ui/slider";
import { fetchMagicFillData } from "@/lib/actions/magic-actions";
import { syncPortfolioAssets } from "@/lib/actions/asset-actions";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

// EN: Extend the Plan type to include the related Portfolio name
type PlanWithPortfolio = InvestmentPlan & {
	portfolio?: Portfolio | null;
};

interface PlanCardProps {
	plan: PlanWithPortfolio;
	isLocked: boolean;
	hasCashInPortfolio: boolean;
	allPortfoliosWithCash: { id: string; name: string }[];
	isDemo?: boolean;
}

export function PlanCard({
	plan,
	isLocked,
	allPortfoliosWithCash,
	isDemo,
}: PlanCardProps) {
	console.log("🚀 ~ PlanCard ~ plan:", plan);
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

	const [finalTicker, setFinalTicker] = useState(plan.ticker || "");

	// 1. Dodaj nowe stany pod istniejącymi
	const [originalCurrency, setOriginalCurrency] = useState("PLN");
	const [exchangeRate, setExchangeRate] = useState(1);
	const [conviction, setConviction] = useState(plan.conviction || 50);
	const [rationale, setRationale] = useState(plan.rationale || "");

	// --- STANY DLA PÓL EDYCYJNYCH ---
	const [finalName, setFinalName] = useState(
		plan.name ||
			`Zakup: ${CATEGORY_LABELS[plan.targetCategory as keyof typeof CATEGORY_LABELS] || plan.targetCategory}`,
	);
	const [finalValue, setFinalValue] = useState(plan.value);
	const [purchasePrice, setPurchasePrice] = useState<number>(
		plan.targetCategory === "BONDS" ? 100 : 0,
	);
	// --- NOWE STANY ---
	const [purchaseDate, setPurchaseDate] = useState(
		new Date().toISOString().split("T")[0],
	);

	// 🚀 NOWY STAN DLA MAGII
	const [isMagicLoading, setIsMagicLoading] = useState(false);

	// // NOWE: Musimy trzymać ticker, który user wybrał w modalu
	// const [finalTicker, setFinalTicker] = useState(plan.ticker || "");

	// // Aktualizacja przy wyborze szablonu
	// const handleTemplateSelect = (ticker: string) => {
	// 	const config = BOND_CONFIG[ticker as keyof typeof BOND_CONFIG];
	// 	if (config) {
	// 		setFinalTicker(ticker); // Zapisujemy ticker (np. ROD)
	// 		// Generujemy nazwę serii (np. ROD0438)
	// 		const autoName = generateBondName(ticker, purchaseDate);
	// 		setFinalName(autoName);
	// 		// Opcjonalnie: możemy tu ustawić domyślny procent, jeśli go masz w configu
	// 	}
	// };

	// console.log("🚀 ~ PlanCard ~ purchaseDate:", purchaseDate);
	// const [interestRate, setInterestRate] = useState(0);
	// EN: Initialize as string to support "typing" dots and commas
	// UI: Inicjujemy jako string, aby wspierać wpisywanie kropek i przecinków
	const [interestRate, setInterestRate] = useState<string>("0");
	// // EN: Initialize date as YYYY-MM-DD for the date input
	// const [finalDate, setFinalDate] = useState(() => {
	// 	if (plan.plannedDate.length === 10) return plan.plannedDate;
	// 	return `${plan.plannedDate}-01`;
	// });
	const [executionNote, setExecutionNote] = useState("");
	const [isBooked, setIsBooked] = useState(false);
	const [sourcePortfolioId, setSourcePortfolioId] = useState("");

	const isCash = plan.targetCategory === "CASH";
	const isBond = plan.targetCategory === "BONDS";

	const handleExecute = async () => {
		// 🚀 ZMIANA: Jeśli purchasePrice jest puste lub 0, domyślnie ustawiamy 1
		const effectivePrice = isCash ? 1 : Number(purchasePrice) || 1;
		const rateAsFloat = parseFloat(String(interestRate).replace(",", "."));

		// 🚀 ZMIANA: Blokujemy tylko wartości ujemne
		if (effectivePrice < 0) {
			toast.error("Kurs zakupu nie może być ujemny.");
			return;
		}

		if (isDemo) {
			toast.info("Tryb Edukacyjny", {
				description:
					"W wersji demo nie można realizować planów. Funkcja ta automatycznie księguje zakup i odejmuje gotówkę z wybranego portfela.",
			});
			return;
		}
		setIsPending(true);
		try {
			// EN: Passing all 8 arguments to the server action
			const result = await executePlan(
				plan.id,
				Number(finalValue),
				purchasePrice,
				isBooked,
				sourcePortfolioId,
				executionNote,
				finalName,
				purchaseDate,
				rateAsFloat,
				finalTicker,
				originalCurrency, // <--- Nowy argument
				exchangeRate, // <--- Nowy argument
			);

			if (result.success) {
				toast.success("Plan zrealizowany pomyślnie! 🚀");
				setIsOpen(false);
				router.refresh();
			} else {
				toast.error("Błąd: " + result?.error);
			}
		} catch {
			toast.error("Błąd połączenia. Spróbuj ponownie.");
		} finally {
			setIsPending(false);
		}
	};

	const handleDelete = async () => {
		if (confirm("Usunąć plan?")) {
			const res = await deleteInvestmentPlan(plan.id);
			if (res.success) toast.success("Usunięto");
		}
		if (isDemo) {
			toast.error("Akcja zablokowana", {
				description: "Usuwanie planów jest wyłączone w trybie podglądu.",
			});
			return;
		}
	};

	// 🚀 NOWA FUNKCJA
	const handleMagicFill = async () => {
		const currentTicker = finalTicker || plan.ticker;
		if (!currentTicker || isCash || isBond) {
			toast.error("Podaj ticker (np. AAPL.US), aby pobrać kurs.");
			return;
		}

		setIsMagicLoading(true);
		try {
			const result = await fetchMagicFillData(currentTicker, purchaseDate, 1);

			if (result.success && result.data) {
				setPurchasePrice(Number(result.data.originalPrice));
				setOriginalCurrency(result.data.originalCurrency);
				setExchangeRate(Number(result.data.exchangeRate));
				// 🚀 USUNIĘTO: setFinalValue(result.data.investedCapitalPln);

				toast.success(
					`Pobrano kurs: ${result.data.originalPrice.toFixed(2)} ${result.data.originalCurrency} (NBP: ${result.data.exchangeRate.toFixed(4)})`,
				);
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error("Wystąpił błąd komunikacji z API.");
		} finally {
			setIsMagicLoading(false);
		}
	};

	// Handler wewnątrz PlanCard:
	const handleCloseWithoutExecution = async () => {
		const res = await closePlanWithoutExecution(plan.id);
		if (res.success) {
			toast.success("Plan oznaczony jako zrealizowany! 🎯");
			setIsOpen(false);
			setIsCloseModalOpen(false);
			router.refresh();
		} else {
			// 🚀 ZMIANA: Bezpieczne odczytywanie błędu dla TypeScripta
			toast.error(
				"Błąd: " + ("error" in res ? String(res.error) : "Nieznany błąd"),
			);
		}
	};

	// 3. LOGIKA AUTOMATYCZNEJ NAZWY (tylko dla obligacji)
	useEffect(() => {
		if (plan.targetCategory === "BONDS" && plan.ticker) {
			const autoName = generateBondName(plan.ticker, purchaseDate);
			console.log("🚀 ~ PlanCard ~ generateBondName:", generateBondName);
			setFinalName(autoName);
		}
	}, [purchaseDate, plan.ticker, plan.targetCategory]);

	return (
		<div
			className={cn(
				"group relative rounded-2xl p-4 transition-all duration-300   flex-1",
				// ZMIANA: Przejście na zmienne systemowe
				"bg-t-bg-base border border-t-border hover:border-t-border-subtle",
				isLocked && "backdrop-blur-[1px] opacity-90",
			)}
		>
			<div className="flex flex-col gap-4">
				{/* NAGŁÓWEK KARTY */}
				<div className="flex justify-between items-start">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							{plan.isRecurring && (
								<div
									className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20"
									title="Plan cykliczny"
								>
									<RefreshCw className="h-3 w-3 text-blue-500" />
								</div>
							)}
							<span
								className="h-2.5 w-2.5 rounded-full"
								style={{
									backgroundColor:
										COLORS[plan.targetCategory as keyof typeof COLORS] ||
										"#ccc",
								}}
							/>
							<h3 className="text-sm font-bold truncate text-t-text-primary">
								{plan.name ||
									`Zakup: ${CATEGORY_LABELS[plan.targetCategory as keyof typeof CATEGORY_LABELS] || plan.targetCategory}`}
							</h3>
							{plan.conviction && (
								<span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 tabular-nums">
									{plan.conviction}%
								</span>
							)}

							{isLocked && (
								<div className="flex items-center justify-end">
									{/* ZMIANA: Złoty status blokady z nowym layoutem */}
									<div className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-500/5 px-3 py-1 rounded-lg border border-amber-500/20">
										<Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
										<div className="flex flex-col line-height-1">
											<span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
												Oczekiwanie
											</span>
											<span className="text-[10px] font-bold text-t-text-secondary whitespace-nowrap">
												Dostępny od ({plan.plannedDate})
											</span>
										</div>
									</div>
								</div>
							)}
						</div>
						<p className="text-[10px] text-t-text-tertiary font-bold uppercase tracking-widest">
							{
								CATEGORY_LABELS[
									plan.targetCategory as keyof typeof CATEGORY_LABELS
								]
							}{" "}
							• {plan.portfolio?.name}
						</p>
					</div>

					{/* PRZYCISKI AKCJI */}
					<div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
						<button
							onClick={() => setIsOpen(true)}
							className="p-2.5 rounded-xl bg-t-hover text-t-text-secondary hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
						>
							<CheckSquare size={16} />
						</button>

						<Button
							variant="ghost"
							size="icon"
							onClick={handleDelete}
							className="h-9 w-9 text-t-text-tertiary hover:bg-rose-500/10 hover:text-rose-600"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* WARTOŚCI I TERMIN */}
				<div className="grid grid-cols-2 gap-4 pt-2 border-t border-t-border-subtle">
					<div className="flex flex-wrap gap-2 items-center">
						<p className="font-mono text-xs text-t-text-secondary">
							Planowana kwota:
						</p>
						<p className="text-sm font-black tracking-tight text-t-text-primary">
							{plan.value.toLocaleString("pl-PL")}
							<span className="text-[10px] font-bold text-t-text-tertiary tracking-normal ml-1">
								PLN
							</span>
						</p>
					</div>
					<div className="flex flex-wrap gap-2 items-center">
						<p className="font-mono text-xs text-t-text-secondary">Termin:</p>
						<p className="text-xs font-bold flex items-center gap-1.5 text-t-text-primary bg-t-bg-base px-2 py-0.5 rounded border border-t-border">
							<CalendarIcon size={12} className="text-blue-500" />
							{plan.plannedDate}
						</p>
					</div>
				</div>

				{/* NOTATKA */}
				{plan.rationale && (
					<div className="mt-2 text-[11px] text-t-text-secondary leading-relaxed italic border-l-2 border-blue-500/40 pl-3 py-1 bg-t-bg-base/50 rounded-r-lg">
						&quot;{plan.rationale}&quot;
					</div>
				)}
			</div>

			{/* ======================= MODAL REALIZACJI ======================= */}
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-4xl w-[95vw] bg-t-bg-panel/95 backdrop-blur-xl border-t-border shadow-2xl rounded-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto overflow-x-hidden">
					<DialogHeader className="space-y-3">
						<div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
							<RefreshCw className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
						</div>
						<DialogTitle className="text-2xl font-black tracking-tight text-t-text-primary">
							Potwierdź realizację
						</DialogTitle>
						<DialogDescription className="text-sm font-medium text-t-text-secondary">
							Uzupełnij ostateczne parametry transakcji rynkowej.
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
						{/* DATA ZAKUPU */}
						<div className={cn(!isBond && "col-span-2", "space-y-2")}>
							<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								Data zakupu
							</Label>
							<Input
								type="date"
								value={purchaseDate}
								onChange={(e) => setPurchaseDate(e.target.value)}
								className={cn(inputStyles, "bg-t-bg-base border-t-border")}
							/>
						</div>

						{/* OPROCENTOWANIE */}
						{isBond && (
							<div className="space-y-2">
								<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
									Oprocentowanie (%)
								</Label>
								<Input
									type="text"
									inputMode="decimal"
									value={interestRate}
									onChange={(e) =>
										setInterestRate(e.target.value.replace(",", "."))
									}
									className={cn(
										inputStyles,
										"bg-t-bg-base border-t-border",
										plan.targetCategory !== "BONDS" &&
											"opacity-50 cursor-not-allowed",
									)}
									disabled={plan.targetCategory !== "BONDS"}
								/>
							</div>
						)}

						{/* SEKCJA: NAZWA */}
						<div className="col-span-2 space-y-2">
							<div className="flex items-center justify-between">
								<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
									Nazwa aktywa (seria)
								</Label>
							</div>
							<div className="md:col-span-2 space-y-2">
								<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
									Ostateczny Ticker (Wymagany do transakcji)
								</Label>
								<Input
									value={finalTicker}
									onChange={(e) => setFinalTicker(e.target.value.toUpperCase())}
									className={cn(
										inputStyles,
										"bg-t-bg-base border-t-border font-mono",
									)}
									placeholder="Np. CDR.PL, IGLN.L"
								/>
							</div>
							<Input
								value={finalName}
								onChange={(e) => setFinalName(e.target.value)}
								className={cn(
									inputStyles,
									"bg-t-bg-base border-t-border font-black text-amber-600 dark:text-amber-500 uppercase",
								)}
								placeholder="Np. ROD0438"
							/>
							{plan.targetCategory === "BONDS" && (
								<p className="text-[10px] text-t-text-tertiary italic">
									* Nazwa wygenerowana automatycznie
								</p>
							)}
						</div>
						{/* here */}
						{/* OSTATECZNA KWOTA */}
						<div className="space-y-2">
							<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								Kwota ostateczna (PLN)
							</Label>
							<Input
								type="number"
								inputMode="decimal"
								value={finalValue}
								onChange={(e) =>
									setFinalValue(e.target.value.replace(",", "."))
								}
								className={cn(
									inputStyles,
									"bg-t-bg-base border-t-border font-mono",
								)}
							/>
						</div>

						{/* KURS ZAKUPU Z MAGIĄ */}
						<div className="space-y-2">
							<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								{isCash ? "Kurs wymiany" : "Kurs zakupu (Cena za 1 szt.)"}
							</Label>

							<Input
								type="number"
								step="any"
								value={isCash ? "1" : purchasePrice || ""}
								onChange={(e) => setPurchasePrice(e.target.valueAsNumber || 0)}
								disabled={isCash}
								placeholder="Domyślnie: 1 PLN"
								className={cn(
									inputStyles,
									"bg-t-bg-base border-t-border font-mono",
									isCash &&
										"bg-black/5 dark:bg-white/5 opacity-50 cursor-not-allowed",
								)}
							/>

							{/* 🚀 PRZYCISK MAGII W NOWEJ LINII */}
							{!isCash && !isBond && (
								<button
									type="button"
									onClick={handleMagicFill}
									disabled={isMagicLoading}
									className="flex items-center justify-center w-full gap-2 py-2 mt-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-colors disabled:opacity-50"
								>
									{isMagicLoading ? (
										<Loader2 className="w-3 h-3 animate-spin" />
									) : (
										<Wand2 className="w-3 h-3" />
									)}
									Pobierz kurs z rynku
								</button>
							)}
						</div>
						{/* SEKCJA KSIĘGOWANIA */}
						<div className="col-span-2 space-y-4 rounded-xl border border-t-border p-5 bg-black/5 dark:bg-white/5">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<Label className="text-sm font-bold text-t-text-primary">
										Księgowanie automatyczne
									</Label>
									<p className="text-[10px] text-t-text-secondary uppercase tracking-widest font-bold">
										Odejmij kwotę od zasobów CASH
									</p>
								</div>
								<SimpleSwitch checked={isBooked} onChange={setIsBooked} />
							</div>

							{isBooked && (
								<div className="animate-in fade-in slide-in-from-top-2 duration-300">
									<Label className="text-[10px] font-black uppercase tracking-widest text-t-text-tertiary ml-1 mb-2 block">
										Wybierz portfel źródłowy
									</Label>
									<Select
										value={sourcePortfolioId}
										onValueChange={setSourcePortfolioId}
									>
										<SelectTrigger
											className={cn(
												inputStyles,
												"bg-t-bg-panel border-t-border h-[42px]",
											)}
										>
											<SelectValue placeholder="Wybierz źródło środków" />
										</SelectTrigger>
										<SelectContent>
											{allPortfoliosWithCash.map((p) => (
												<SelectItem key={p.id} value={p.id}>
													{p.name} (CASH)
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</div>

						{/* NOTATKA */}
						<div className="col-span-2 space-y-2">
							<Label className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
								Notatka z transakcji
							</Label>
							<Input
								placeholder="Np. prowizja 5 PLN, kurs bankowy..."
								value={executionNote}
								onChange={(e) => setExecutionNote(e.target.value)}
								className={cn(inputStyles, "bg-t-bg-base border-t-border")}
							/>
						</div>

						{/* EN: CONVICTION SLIDER (Oparty o useState) */}
						<div className="space-y-4 col-span-2">
							<div className=" flex justify-between items-center ">
								<Label className="text-sm font-bold text-t-text-primary">
									Poziom przekonania
								</Label>
								<span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 tabular-nums">
									{conviction}%
								</span>
							</div>
							<Slider
								min={1}
								max={100}
								step={1}
								value={[conviction]}
								onValueChange={(vals) => setConviction(vals[0])}
								className="py-4"
							/>
							<p className="text-[10px] text-t-text-tertiary">
								Jak bardzo wierzysz w sukces tej tezy? (Skala 1-100%)
							</p>
						</div>
					</div>
					{/* STOPKA Z PRZYCISKIEM */}
					<DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsCloseModalOpen(true)} // 🚀 Otwiera nowy modal
							disabled={isPending}
							className="w-full sm:w-auto h-12 text-[10px] font-bold uppercase tracking-widest text-t-text-secondary border-t-border hover:bg-t-hover rounded-xl"
						>
							Zamknij bez księgowania (XTB)
						</Button>
						<Button
							onClick={handleExecute}
							disabled={
								isPending || (isBooked && !sourcePortfolioId) || isLocked
							}
							className={cn(
								"w-full sm:flex-1 h-12 font-black uppercase tracking-widest text-xs rounded-xl transition-all duration-300",
								isLocked
									? "bg-t-bg-base text-t-text-tertiary border border-t-border shadow-none cursor-not-allowed"
									: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-500/50",
							)}
						>
							{isPending ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								"Zatwierdź z księgowaniem"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<AlertDialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
				<AlertDialogContent className="bg-t-bg-panel border-t-border shadow-2xl rounded-2xl p-6 sm:p-8 max-w-md">
					<AlertDialogHeader className="space-y-3 text-left">
						<div className="p-3 bg-blue-500/10 rounded-2xl w-fit border border-blue-500/20">
							<CheckSquare className="h-6 w-6 text-blue-500" />
						</div>
						<AlertDialogTitle className="text-xl font-black tracking-tight text-t-text-primary">
							Zamknij bez księgowania
						</AlertDialogTitle>
						<AlertDialogDescription className="text-sm font-medium text-t-text-tertiary">
							Czy na pewno chcesz zamknąć ten plan? Aktywa i gotówka w portfelu
							pozostaną bez zmian. Opcja idealna, gdy transakcja została już
							zaimportowana z zewnętrznego pliku (np. XTB).
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="pt-4 border-t border-t-border-subtle mt-4">
						<Button
							type="button"
							variant="ghost"
							disabled={isPending}
							onClick={() => setIsCloseModalOpen(false)}
							className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary hover:bg-black/5 rounded-xl h-11"
						>
							Anuluj
						</Button>
						<Button
							onClick={handleCloseWithoutExecution}
							disabled={isPending}
							className="bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest uppercase text-[10px] rounded-xl shadow-md px-6 h-11"
						>
							{isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								"Oznacz jako zrobione"
							)}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

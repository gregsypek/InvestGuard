"use client";

import { CATEGORY_LABELS, COLORS, inputStyles } from "@/lib/constants";
import {
	CalendarIcon,
	CheckSquare,
	Clock,
	Loader2,
	RefreshCw,
	Trash2,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { InvestmentPlan, Portfolio } from "@prisma/client";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { cn, generateBondName } from "@/lib/utils";
import {
	deleteInvestmentPlan,
	executePlan,
} from "@/lib/actions/planner.actions";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSwitch } from "../ui/SimpleSwitchProps";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

	// --- STANY DLA PÓL EDYCYJNYCH ---
	const [finalName, setFinalName] = useState(plan.name);
	const [finalValue, setFinalValue] = useState(plan.value);
	const [purchasePrice, setPurchasePrice] = useState<number>(
		plan.targetCategory === "BONDS" ? 100 : 0,
	);
	// --- NOWE STANY ---
	const [purchaseDate, setPurchaseDate] = useState(
		new Date().toISOString().split("T")[0],
	);

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

	console.log("🚀 ~ PlanCard ~ purchaseDate:", purchaseDate);
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
		const effectivePrice = isCash ? 1 : Number(purchasePrice);
		const rateAsFloat = parseFloat(String(interestRate).replace(",", "."));
		if (effectivePrice <= 0) {
			toast.error("Kurs zakupu musi być większy niż 0");
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
				plan.id, // 1
				finalValue, // 2
				purchasePrice, // 3
				isBooked, // 4
				sourcePortfolioId, // 5
				executionNote, // 6
				finalName, // 7
				purchaseDate, // 8: purchaseDate (String)
				rateAsFloat, // 9: interestRate (Number)
				// finalTicker, // <--- DODAJEMY TEN ARGUMENT (np. "ROD")
			);

			if (result.success) {
				toast.success("Plan zrealizowany pomyślnie! 🚀");
				setIsOpen(false);
				router.refresh();
			} else {
				// Sprawdzamy, czy pole 'error' faktycznie istnieje w obiekcie
				const errorMessage =
					"error" in result ? result.error : "Wystąpił nieznany błąd";
				toast.error("Błąd: " + errorMessage);
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
				"group relative bg-card border  border-primary/50 rounded-2xl p-3 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden",
				isLocked && " backdrop-blur-[1px]",
			)}
		>
			<div className="flex flex-col gap-4 ">
				<div className="flex justify-between items-start">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							{plan.isRecurring && (
								<div
									className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10"
									title="Plan cykliczny"
								>
									<RefreshCw className="h-3 w-3 text-blue-500" />
								</div>
							)}
							<span
								className="h-2 w-2 rounded-full"
								style={{
									backgroundColor:
										COLORS[plan.targetCategory as keyof typeof COLORS] ||
										"#ccc",
								}}
							/>
							<h3 className="text-sm  font-bold truncate">{plan.name}</h3>
							{plan.conviction && (
								<span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
									{plan.conviction}% - pewność
								</span>
							)}
							{/* {isLocked && (
								<div className=" flex items-center text-white gap-2 px-3 py-1 rounded-md bg-slate-800">
									<Clock className="w-3 h-3  animate-pulse" />
									<span className="text-[10px]    uppercase tracking-widest">
										{`Dostępny od (${plan.plannedDate})`}
									</span>
								</div>
							)} */}
							{isLocked && (
								<div className=" flex items-center justify-end bg-background/10 text-center ">
									<div className="flex items-center gap-3 bg-slate-700 text-white px-3 py-1 rounded-xl shadow-2xl border border-white/10 scale-90 transition-transform duration-500">
										<div className="flex flex-col">
											<span className="text-[10px] font-black uppercase  tracking-[0.2em] text-amber-500">
												Oczekiwanie
											</span>
											<span className="text-xs font-bold whitespace-nowrap">
												{`Dostępny od (${plan.plannedDate})`}
											</span>
										</div>
									</div>
								</div>
							)}
						</div>
						<p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
							{
								CATEGORY_LABELS[
									plan.targetCategory as keyof typeof CATEGORY_LABELS
								]
							}{" "}
							• {plan.portfolio?.name}
						</p>
					</div>

					<div className="flex items-center gap-1">
						<button
							onClick={() => setIsOpen(true)}
							className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
						>
							<CheckSquare size={16} />
						</button>
						{/* <DeleteButton
							id={plan.id}
							onDelete={async (id) => {
								const res = await deleteInvestmentPlan(id);
								if (res.success) router.refresh();
							}}
						/> */}
						<Button
							variant="ghost"
							size="icon"
							onClick={handleDelete}
							className="h-6 w-6 text-muted-foreground hover:text-red-600"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="flex flex-wrap gap-3 items-center">
						<p className="font-mono text-xs tabular-nums text-muted-foreground ">
							Planowana kwota
						</p>
						<p className="text-xs font-mono tracking-tighter">
							{plan.value.toLocaleString("pl-PL")}
							<span className="text-[10px]">PLN</span>
						</p>
					</div>
					<div className="flex flex-wrap gap-3 items-center">
						<p className="font-mono text-xs  text-muted-foreground">Termin</p>
						<p className="text-xs font-mono tracking-tighter flex items-center gap-1">
							<CalendarIcon size={12} className="text-primary" />
							{plan.plannedDate}
						</p>
					</div>
					{/* OVERLAY DLA ZABLOKOWANYCH
					{isLocked && (
						<div className="absolute inset-0 z-20 flex items-center justify-center bg-background/10 backdrop-blur-[0.6px]">
							<div className="flex items-center gap-3 bg-sidebar text-white px-3 py-2 rounded-2xl shadow-2xl border border-white/10">
								<Clock className="w-4 h-4 text-amber-500 animate-pulse" />
								<div className="flex flex-col">
									<span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
										Oczekiwanie
									</span>
									<span className="text-xs font-bold whitespace-nowrap">
										Dostępne od {plan.plannedDate}
									</span>
								</div>
							</div>
						</div>
					)} */}
				</div>

				{plan.rationale && (
					<div className="text-[11px] text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3 py-1">
						&quot;{plan.rationale}&quot;
					</div>
				)}
			</div>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="  max-w-2xl bg-card border-border shadow-2xl rounded-3xl p-8">
					<DialogHeader className="space-y-3">
						<div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-2">
							<RefreshCw className="h-6 w-6 text-green-600" />
						</div>
						<DialogTitle className="text-2xl font-black tracking-tight">
							Potwierdź realizację
						</DialogTitle>
						<DialogDescription className="text-sm font-medium">
							Uzupełnij ostateczne parametry transakcji rynkowej.
						</DialogDescription>
					</DialogHeader>

					<div className=" grid grid-cols-1 md:grid-cols-2 gap-6 py-6 ">
						{/* DATA ZAKUPU */}
						<div className={cn(!isBond && "col-span-2", "space-y-2 ")}>
							<Label className="text-[10px] font-bold uppercase opacity-60">
								Data zakupu
							</Label>
							<Input
								type="date"
								value={purchaseDate}
								onChange={(e) => setPurchaseDate(e.target.value)}
								className={inputStyles}
							/>
						</div>
						{/* OPROCENTOWANIE */}
						{isBond && (
							<div className="space-y-2">
								<Label className="text-[10px] font-bold uppercase opacity-60">
									Oprocentowanie (%)
								</Label>
								{/* <Input
								type="number"
								step="0.01"
								value={interestRate}
								onChange={(e) => setInterestRate(Number(e.target.value))}
								className={inputStyles}
							/> */}

								{/* <Input
									type="text" // EN: Change to text for better float handling on Safari/Chrome
									inputMode="decimal" // EN: Mobile-friendly decimal keyboard
									value={interestRate}
									// disabled={plan.targetCategory !== "BONDS"}
									onChange={(e) => {
										// EN: Allow only numbers and one decimal separator (dot or comma)
										const val = e.target.value.replace(",", ".");
										if (/^-?\d*\.?\d*$/.test(val)) {
											setInterestRate(val);
										}
									}}
									placeholder="0.00"
									className={inputStyles}
								/> */}
								<Input
									type="text"
									inputMode="decimal"
									value={interestRate}
									onChange={(e) =>
										setInterestRate(e.target.value.replace(",", "."))
									}
									className={cn(
										inputStyles,
										plan.targetCategory !== "BONDS" &&
											"opacity-50 cursor-not-allowed",
									)}
									disabled={plan.targetCategory !== "BONDS"}
								/>
							</div>
						)}
						{/* SEKCJA: NAZWA (Domyślnie wyliczona, ale edytowalna) */}
						<div className="md:col-span-2 space-y-2">
							<div className="flex items-center justify-between">
								<Label className="text-[10px] font-bold uppercase tracking-wider opacity-70">
									Nazwa aktywa (seria)
								</Label>

								{/* EN: Template picker visible only for Bonds category */}
								{/* UI: Wybór szablonu widoczny tylko dla kategorii obligacji */}
								{/* {plan.targetCategory === "BONDS" && (
									<Select onValueChange={handleTemplateSelect}>
										<SelectTrigger className="h-7 w-auto border-none bg-amber-500/10 text-amber-700 text-[10px] font-bold px-2 hover:bg-amber-500/20 transition-colors">
											<SelectValue placeholder="⚡ SZABLONY OBLIGACJI" />
										</SelectTrigger>
										<SelectContent>
											{Object.entries(BOND_CONFIG).map(([key, config]) => (
												<SelectItem
													key={key}
													value={key}
													className="text-xs cursor-pointer"
												>
													<div className="flex items-center gap-2">
														<div
															className={cn(
																"w-2 h-2 rounded-full",
																config.color,
															)}
														/>
														{config.label}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)} */}
							</div>
							<Input
								value={finalName}
								onChange={(e) => setFinalName(e.target.value)}
								className={cn(
									inputStyles,
									"font-black text-amber-600 uppercase",
								)}
								placeholder="Np. ROD0438"
							/>
							{plan.targetCategory === "BONDS" && (
								<p className="text-[10px] text-muted-foreground italic">
									* Nazwa wygenerowana automatycznie (Ticker + Miesiąc + Rok
									Zapadalności)
								</p>
							)}
						</div>
						{/* <div className="space-y-2">
							<Label className="text-xs font-bold uppercase tracking-wider opacity-70">
								Nazwa aktywa
							</Label>
							<Input
								value={finalName}
								onChange={(e) => setFinalName(e.target.value)}
								className={inputStyles}
							/>
						</div> */}

						{/* <div className="space-y-2">
							<Label className="text-xs font-bold uppercase tracking-wider opacity-70">
								Dokładna data zakupu
							</Label>
							<Input
								type="date"
								value={finalDate}
								onChange={(e) => setFinalDate(e.target.value)}
								className={inputStyles}
							/>
						</div> */}

						{/* OSTATECZNA KWOTA */}
						<div className="space-y-2">
							<Label className="text-xs font-bold uppercase tracking-wider opacity-70">
								Kwota ostateczna (PLN)
							</Label>
							<Input
								type="number"
								value={finalValue}
								onChange={(e) => setFinalValue(Number(e.target.value))}
								className={inputStyles}
							/>
						</div>

						{/* KURS ZAKUPU */}
						<div className="space-y-2">
							<Label className="text-xs font-bold uppercase tracking-wider opacity-70">
								{isCash ? "Kurs wymiany" : "Kurs zakupu (Cena za 1 szt.)"}
							</Label>
							<Input
								type="number"
								step="any"
								value={isCash ? "1" : purchasePrice || ""}
								onChange={(e) => setPurchasePrice(e.target.valueAsNumber || 0)}
								disabled={isCash}
								className={cn(inputStyles, isCash && "bg-muted opacity-50")}
							/>
						</div>
						{/* DODATEK: Nakładka informacyjna dla zablokowanego planu */}

						{/* SEKCJA KSIĘGOWANIA */}
						<div className="md:col-span-2 space-y-4 rounded-2xl border border-border p-5 bg-muted/20">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label className="text-sm font-bold">
										Księgowanie automatyczne
									</Label>
									<p className="text-[10px] text-muted-foreground uppercase font-medium">
										Odejmij kwotę od zasobów CASH
									</p>
								</div>
								<SimpleSwitch checked={isBooked} onChange={setIsBooked} />
							</div>

							{isBooked && (
								<div className="animate-in fade-in slide-in-from-top-2 duration-300">
									<Label className="text-[10px] font-black uppercase opacity-60 ml-1">
										Wybierz portfel źródłowy
									</Label>
									<Select
										value={sourcePortfolioId}
										onValueChange={setSourcePortfolioId}
									>
										<SelectTrigger className="bg-background mt-1 h-11 rounded-xl">
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

						<div className="md:col-span-2 space-y-2">
							<Label className="text-xs font-bold uppercase tracking-wider opacity-70">
								Notatka z transakcji
							</Label>
							<Input
								placeholder="Np. prowizja 5 PLN, kurs bankowy..."
								value={executionNote}
								onChange={(e) => setExecutionNote(e.target.value)}
								className={inputStyles}
							/>
						</div>
					</div>
					{/* {isLocked && (
						<div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-xl">
							<Clock className="w-3 h-3 text-amber-400 animate-pulse" />
							<span className="text-[10px] font-black text-white uppercase tracking-widest">
								Dostępne wkrótce (patrz miesiąc realizacji)
							</span>
						</div>
					)} */}
					{/* DODATEK: Nakładka informacyjna dla zablokowanego planu */}

					<DialogFooter>
						<Button
							onClick={handleExecute}
							// Zablokowanie przycisku, jeśli plan jest na przyszłość
							disabled={
								isPending || (isBooked && !sourcePortfolioId) || isLocked
							}
							className={cn(
								"w-full h-14 font-black uppercase tracking-widest text-xs rounded-2xl transition-all",
								isLocked
									? "bg-slate-900 text-white px-3 py-2 rounded-2xl shadow-2xl border  cursor-not-allowed"
									: "bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/20",
							)}
						>
							{isPending ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : isLocked ? (
								<div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center gap-4 justify-center cursor-not-allowed">
									<Clock className="w-4 h-4 text-amber-500 animate-pulse" />
									{`Dostępny wkrótce (${plan.plannedDate})`}
								</div>
							) : (
								"Zatwierdź realizację"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

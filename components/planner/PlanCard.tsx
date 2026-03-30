"use client";

import { CATEGORY_LABELS, COLORS, inputStyles } from "@/lib/constants";
import {
	CalendarIcon,
	CheckSquare,
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
import {
	deleteInvestmentPlan,
	executePlan,
} from "@/lib/actions/planner.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSwitch } from "../ui/SimpleSwitchProps";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

// EN: Extend the Plan type to include the related Portfolio name
type PlanWithPortfolio = InvestmentPlan & {
	portfolio?: Portfolio | null;
};

interface PlanCardProps {
	plan: PlanWithPortfolio;
	hasCashInPortfolio: boolean;
	allPortfoliosWithCash: { id: string; name: string }[];
	isDemo?: boolean;
}

export function PlanCard({
	plan,
	hasCashInPortfolio,
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

	// EN: Initialize date as YYYY-MM-DD for the date input
	const [finalDate, setFinalDate] = useState(() => {
		if (plan.plannedDate.length === 10) return plan.plannedDate;
		return `${plan.plannedDate}-01`;
	});

	const [executionNote, setExecutionNote] = useState("");
	const [isBooked, setIsBooked] = useState(hasCashInPortfolio);
	const [sourcePortfolioId, setSourcePortfolioId] = useState("");

	const isCash = plan.targetCategory === "CASH";

	const handleExecute = async () => {
		const effectivePrice = isCash ? 1 : Number(purchasePrice);

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
				plan.id,
				Number(finalValue),
				effectivePrice,
				isBooked,
				sourcePortfolioId,
				executionNote,
				finalName, // Parametr 7: Nazwa
				finalDate, // Parametr 8: Precyzyjna data
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

	return (
		<div className="group relative bg-card border  border-primary/50 rounded-2xl p-3 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden">
			<div className="flex flex-col gap-4">
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
							{plan.value.toLocaleString()}{" "}
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
				</div>

				{plan.rationale && (
					<div className="text-[11px] text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3 py-1">
						&quot;{plan.rationale}&quot;
					</div>
				)}
			</div>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-2xl bg-card border-border shadow-2xl rounded-3xl p-8">
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

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
						{/* EDYCJA NAZWY I DATY */}
						<div className="space-y-2">
							<Label className="text-xs font-bold uppercase tracking-wider opacity-70">
								Nazwa aktywa
							</Label>
							<Input
								value={finalName}
								onChange={(e) => setFinalName(e.target.value)}
								className={inputStyles}
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-xs font-bold uppercase tracking-wider opacity-70">
								Dokładna data zakupu
							</Label>
							<Input
								type="date"
								value={finalDate}
								onChange={(e) => setFinalDate(e.target.value)}
								className={inputStyles}
							/>
						</div>

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

					<DialogFooter>
						<Button
							onClick={handleExecute}
							disabled={isPending || (isBooked && !sourcePortfolioId)}
							className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-green-500/20 transition-all active:scale-95"
						>
							{isPending ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								"Zatwierdź i Kupuję"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

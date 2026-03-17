"use client";

import { CATEGORY_LABELS, COLORS, inputStyles } from "@/lib/constants";
import { CalendarIcon, CheckSquare, Loader2, RefreshCw } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import { DeleteButton } from "../DeleteButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSwitch } from "../ui/SimpleSwitchProps";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

// EN: Extend the Plan type to include the related Portfolio name
type PlanWithPortfolio = InvestmentPlan & {
	portfolio?: Portfolio | null;
};

interface PlanCardProps {
	plan: PlanWithPortfolio;
	// EN: New prop to tell us if the portfolio has a cash asset to draw from
	hasCashInPortfolio: boolean;
	allPortfoliosWithCash: { id: string; name: string }[];
}

export function PlanCard({
	plan,
	hasCashInPortfolio,
	allPortfoliosWithCash,
}: PlanCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [finalValue, setFinalValue] = useState(plan.value);
	const [executionNote, setExecutionNote] = useState("");
	const [isBooked, setIsBooked] = useState(hasCashInPortfolio); // EN: Default to true only if cash exists
	const router = useRouter();
	// 1. DODAJEMY STAN DLA KURSU (Domyślnie 100 dla obligacji lub 0)
	const [purchasePrice, setPurchasePrice] = useState(
		plan.targetCategory === "BONDS" ? 100 : 0,
	);
	const [sourcePortfolioId, setSourcePortfolioId] = useState<string>("");

	const handleExecute = async () => {
		// Dla gotówki kurs to zawsze 1, dla reszty to co w input
		const effectivePrice =
			plan.targetCategory === "CASH" ? 1 : Number(purchasePrice);

		if (effectivePrice <= 0) {
			toast.error("Kurs zakupu musi być większy niż 0");
			return;
		}

		setIsPending(true);
		try {
			const result = await executePlan(
				plan.id,
				Number(finalValue),
				effectivePrice,
				isBooked,
				sourcePortfolioId, // ✅ TO JEST KLUCZOWE: Piąty parametr
				executionNote,
			);

			if (result.success) {
				toast.success("Zrealizowano pomyślnie");
				setIsOpen(false);
				router.refresh();
			} else {
				toast.error("Błąd: " + (result as any).error);
			}
		} catch {
			toast.error("Błąd połączenia");
		} finally {
			setIsPending(false);
		}
	};

	// EN: Category color logic matching the asset list
	const categoryColor =
		COLORS[plan.targetCategory as keyof typeof COLORS] || "var(--primary)";
	const categoryLabel =
		CATEGORY_LABELS[plan.targetCategory] || plan.targetCategory;

	return (
		<div className="bg-card border border-border2 p-3 lg:p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-300  hover:bg-blue-500/5 group relative">
			{/* EN: LEFT SIDE: Name, Category, Portfolio */}
			{/* UI: LEWA STRONA: Nazwa, Kategoria, Portfel */}
			<div className="flex items-start gap-3">
				{/* EN: Recurring indicator if applicable */}
				{plan.isRecurring && (
					<div
						className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10"
						title="Plan cykliczny"
					>
						<RefreshCw className="h-3 w-3 text-blue-500" />
					</div>
				)}

				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<h4 className="font-bold text-sm leading-none">{plan.name}</h4>
						{plan.ticker && (
							<span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
								{plan.ticker}
							</span>
						)}
					</div>

					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
						{/* Category indicator */}
						<div className="flex items-center gap-1.5">
							<div
								className="w-2 h-2 rounded-full border border-border2 shadow-xs"
								style={{ backgroundColor: categoryColor }}
							/>
							<p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
								{categoryLabel}
							</p>
						</div>

						{/* Portfolio Name */}
						<div className="flex items-center gap-1.5 border-l border-border2 pl-3">
							<span className="text-[10px] font-mono text-muted-foreground uppercase">
								{plan.portfolio?.name || "Brak portfela"}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* EN: RIGHT SIDE: Value, Date, Actions */}
			{/* UI: PRAWA STRONA: Kwota, Data, Akcje */}
			<div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border2 pt-3 sm:pt-0 mt-1 sm:mt-0">
				<div className="flex flex-col items-start sm:items-end">
					<p className="font-semibold text-sm tabular-nums text-foreground">
						{plan.value.toLocaleString(undefined, {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}{" "}
						PLN
					</p>
					<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
						<CalendarIcon className="h-3 w-3" />
						{plan.plannedDate}
					</div>
				</div>

				<div className="flex items-center gap-2">
					{/* EN: Execution Dialog */}
					<Dialog open={isOpen} onOpenChange={setIsOpen}>
						<DialogTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="p-2 text-muted-foreground hover:text-blue-600  transition-colors disabled:opacity-50 group cursor-pointer"
								title="Realizuj plan"
							>
								<CheckSquare className="h-4 w-4 transition-colors group-hover:scale-110 " />
							</Button>
						</DialogTrigger>

						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Potwierdź realizację</DialogTitle>
								<DialogDescription>
									Rejestrujesz zakup <strong>{plan.name}</strong>. System
									automatycznie wyliczy liczbę jednostek i uśredni cenę.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 rounded-xl border p-4 bg-muted/20">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label className="text-sm font-bold">
											Księgowanie automatyczne
										</Label>
										<p className="text-[10px] text-muted-foreground uppercase">
											Pobierz środki z istniejącej gotówki
										</p>
									</div>
									<SimpleSwitch
										checked={isBooked}
										onChange={(val) => {
											setIsBooked(val);
											if (!val) setSourcePortfolioId("");
										}}
									/>
								</div>

								{isBooked && (
									<div className="animate-in slide-in-from-top-2 duration-200">
										<Label className="text-[10px] font-black uppercase opacity-60 ml-1">
											Wybierz portfel źródłowy
										</Label>
										<Select
											value={sourcePortfolioId}
											onValueChange={setSourcePortfolioId}
										>
											<SelectTrigger className="bg-background mt-1">
												<SelectValue placeholder="Wybierz źródło środków" />
											</SelectTrigger>
											<SelectContent>
												{/* allPortfoliosWithCash przekazane z rodzica */}
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

							<div className="grid gap-4 py-4">
								{/* EN: Conditional rendering for the booking option */}
								{/* {hasCashInPortfolio ? (
									<div className="flex items-center justify-between space-x-2 rounded-lg border p-3 shadow-sm bg-muted/30">
										<div className="space-y-0.5">
											<Label className="text-sm font-bold">
												Księgowanie automatyczne
											</Label>
											<p className="text-[10px] text-muted-foreground uppercase font-medium">
												Odejmij kwotę od CASH w portfelu:{" "}
												<span className="text-primary">
													{plan.portfolio?.name}
												</span>
											</p>
										</div>
										<input
											type="checkbox"
											checked={isBooked}
											onChange={(e) => setIsBooked(e.target.checked)}
											className="h-5 w-5 accent-green-600 cursor-pointer"
										/>
									</div>
								) : (
									<div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
										<p className="text-[10px] text-amber-600 font-bold uppercase">
											Brak gotówki (CASH) w tym portfelu.
										</p>
										<p className="text-[10px] text-muted-foreground">
											Realizacja zostanie zaksięgowana jako nowa wpłata
											zewnętrzna.
										</p>
									</div>
								)} */}
								<div className="space-y-2">
									<Label
										htmlFor="finalValue"
										className="text-xs font-bold uppercase tracking-wider opacity-70"
									>
										Ostateczna Kwota (PLN)
									</Label>
									<Input
										id="finalValue"
										type="number"
										step="0.01"
										value={finalValue}
										onChange={(e) => setFinalValue(e.target.valueAsNumber || 0)}
										className={inputStyles}
									/>
								</div>
								{/* 2. NOWE POLE: KURS ZAKUPU */}
								<div className="space-y-2">
									<Label
										htmlFor="purchasePrice"
										className="text-xs font-bold uppercase tracking-wider opacity-70"
									>
										Kurs zakupu (Cena za 1 szt.)
									</Label>
									<Input
										id="purchasePrice"
										type="number"
										step="0.0001"
										// Jeśli gotówka, pokazujemy 1, jeśli nie - wpisaną cenę
										value={
											plan.targetCategory === "CASH" ? "1" : purchasePrice || ""
										}
										onChange={(e) =>
											setPurchasePrice(e.target.valueAsNumber || 0)
										}
										className={inputStyles}
										disabled={plan.targetCategory === "CASH"}
									/>
									{/* PODGLĄD ILE SZTUK WYJDZIE */}
									{purchasePrice > 0 && (
										<p className="text-[10px] text-blue-500 font-medium italic">
											Wyliczona ilość: {(finalValue / purchasePrice).toFixed(4)}{" "}
											szt.
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label
										htmlFor="note"
										className="text-xs font-bold uppercase tracking-wider opacity-70"
									>
										Notatka z transakcji (Opcjonalnie)
									</Label>
									<Input
										id="note"
										placeholder="Np. kurs USD 4.02, prowizja 5 PLN"
										value={executionNote}
										onChange={(e) => setExecutionNote(e.target.value)}
										className={inputStyles}
									/>
								</div>
							</div>

							<DialogFooter className="flex gap-2 sm:justify-end">
								<Button
									variant="outline"
									onClick={() => setIsOpen(false)}
									className="w-full sm:w-auto h-10"
								>
									Anuluj
								</Button>
								<Button
									onClick={handleExecute}
									disabled={isPending}
									className="w-full sm:w-auto h-10 bg-green-600 hover:bg-green-700 font-bold uppercase tracking-wider text-xs"
								>
									{isPending ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										"Kupuję Aktywo"
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{/* EN: Reusing the same DeleteButton from assets list */}
					<DeleteButton
						id={plan.id}
						onDelete={deleteInvestmentPlan}
						confirmMsg={`Usunąć plan: ${plan.name}?`}
					/>
				</div>
			</div>
		</div>
	);
}

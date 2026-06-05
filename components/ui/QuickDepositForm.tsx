"use client";

import {
	AlertTriangle,
	Banknote,
	CheckCircle,
	PlusCircle,
	Wallet,
} from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addManualDeposit } from "@/lib/actions/transactions";
import { cn } from "@/lib/utils";

export function QuickDepositForm({ portfolioId }: { portfolioId: string }) {
	const [isPending, startTransition] = useTransition();
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const val = parseFloat(amount);
		if (isNaN(val) || val <= 0) return;

		// EN: Execute the deposit and refresh the state
		startTransition(async () => {
			const result = await addManualDeposit({
				portfolioId,
				amount: val,
				date: new Date(),
				description: "Ręczne zasilenie portfela na zakupy",
			});

			if (result.success) {
				setAmount("");
				setSuccess("Wpłata została dodana!");
				// EN: Optional: You can add a toast notification here
			} else {
				setError("Coś poszło nie tak. Spróbuj ponownie.");
			}
		});
	};

	const inputStyles =
		"h-12 bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-emerald-500 rounded-xl px-4 text-sm font-medium text-t-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

	return (
		<div className="flex flex-col gap-4 p-6 md:p-8 bg-t-bg-base/30 dark:bg-black/20 rounded-2xl border border-t-border-subtle animate-in fade-in duration-300">
			{/* GŁÓWNY PASEK AKCJI (Poziomy) */}
			<div className="flex flex-col md:flex-row items-center gap-6">
				{/* Ikona Portfela */}
				<div className="flex shrink-0 items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
					<Wallet className="w-8 h-8 text-emerald-500" />
				</div>

				{/* Tekst zachęcający */}
				<div className="flex flex-col flex-1 w-full gap-1 text-center md:text-left">
					<h3 className="text-sm font-bold uppercase tracking-widest text-t-text-primary">
						Wpłata Gotówkowa
					</h3>
					<p className="text-[10px] font-bold text-t-text-tertiary uppercase tracking-widest">
						Zasil portfel wolnymi środkami
					</p>
				</div>

				{/* Formularz wpłaty (Tylko pełne kwoty) */}
				<form
					onSubmit={handleSubmit}
					className="flex flex-col sm:flex-row items-center w-full md:w-auto gap-3"
				>
					<div className="relative w-full sm:w-56 shrink-0">
						<span className="absolute left-4 top-1/2 -translate-y-1/2 text-t-text-tertiary">
							<Banknote className="w-4 h-4" />
						</span>
						<Input
							type="number"
							step="1" // Wymusza pełne liczby całkowite
							min="1" // Blokuje zera i wartości ujemne
							placeholder="Pełne PLN"
							value={amount}
							onChange={(e) => {
								// Dodatkowe zabezpieczenie: usuwamy kropki, przecinki i znaki inne niż cyfry
								const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
								setAmount(onlyNumbers);
							}}
							className={cn(inputStyles, "pl-11 pr-14 font-mono")}
						/>
						<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
							PLN
						</span>
					</div>

					<Button
						type="submit"
						disabled={isPending || !amount || Number(amount) <= 0}
						className="w-full sm:w-auto h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
					>
						{isPending ? (
							<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						) : (
							<PlusCircle className="w-4 h-4" />
						)}
						{isPending ? "Przetwarzanie..." : "Zasil"}
					</Button>
				</form>
			</div>

			{/* KOMUNIKATY ZWROTNE (Pokazują się tylko gdy jest błąd lub sukces) */}
			{(error || success) && (
				<div className="w-full pt-4 mt-2 border-t border-t-border-subtle animate-in slide-in-from-top-2">
					{error && (
						<div className="flex items-center justify-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-500 text-[10px] font-bold uppercase tracking-widest text-center">
							<AlertTriangle className="h-4 w-4 shrink-0" />
							{error}
						</div>
					)}
					{success && (
						<div className="flex items-center justify-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest text-center">
							<CheckCircle className="h-4 w-4 shrink-0" />
							{success}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// components/ui/assets/QuickDepositForm.tsx
"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
import { addManualDeposit } from "@/lib/actions/transactions";

export function QuickDepositForm({ portfolioId }: { portfolioId: string }) {
	const [isPending, startTransition] = useTransition();
	const [amount, setAmount] = useState("");

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
				// EN: Optional: You can add a toast notification here
			}
		});
	};

	return (
		<div className="bg-card/40 p-6 rounded-3xl border border-border/50 shadow-sm">
			<div className="flex items-center justify-center gap-3 mb-4">
				<div className=" mb-3 ">
					{/* <BanknoteX className="h-12 w-12 text-primary" /> */}
					<Image
						src={"/cash.png"}
						alt={"Gotówka"}
						width={90}
						height={60}
						className="object-cover"
					/>
				</div>
			</div>

			<form
				onSubmit={handleSubmit}
				className="flex items-center justify-center gap-3"
			>
				<div className="relative ">
					<Input
						type="number"
						placeholder="Kwota PLN"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						className="bg-background/50 border-border/50 focus:ring-primary pl-4 py-5"
					/>
				</div>
				<Button
					type="submit"
					disabled={isPending || !amount}
					className="rounded-xl px-6 py-5 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
				>
					{isPending ? (
						<span className="animate-spin mr-2">/</span>
					) : (
						<PlusCircle className="h-4 w-4 mr-2" />
					)}
					ZASIL
				</Button>
			</form>
		</div>
	);
}

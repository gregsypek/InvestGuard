"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { addAssetAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "../SubmitButton";
import { CATEGORY_ASSETS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
	BONDS: "Obligacje",
	DEVELOPED: "Rynki Rozwinięte",
	EMERGING: "Rynki Wschodzące",
	GOLD: "Złoto",
	BOOSTER: "Booster (Alpha)",
	CASH: "Gotówka",
	CRYPTO: "Kryptowaluty",
	COMMODITIES: "Surowce",
};

export default function AddAssetForm({ portfolioId }: { portfolioId: string }) {
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const [isPending, setIsPending] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string>("");

	async function clientAction(formData: FormData) {
		setIsPending(true);
		const result = await addAssetAction(formData);
		setIsPending(false);

		if (result?.success) {
			toast.success("Aktywo zostało dodane! 📈");
			formRef.current?.reset();
			setSelectedCategory("");
			router.push(
				`/dashboard?portfolioId=${result.portfolioId}&newAssetId=${result.newAssetId}`,
			);
		} else {
			toast.error(result?.message || "Wystąpił błąd podczas zapisywania");
		}
	}

	// EN: Shared focus styles to remove thick ring and use subtle border instead
	// UI: Wspólne style dla focusa, aby usunąć gruby ring i użyć subtelnego borderu
	const inputStyles =
		"h-10 w-full bg-background/50 border-border2 focus:bg-background transition-all focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500 shadow-none";

	return (
		<Card className="w-full bg-card shadow-lg border-border2 py-8">
			<CardHeader className="pb-4">
				<CardTitle className="text-xl font-bold flex items-center gap-2">
					Dodaj nową inwestycję
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form
					ref={formRef}
					action={clientAction}
					className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-end"
				>
					<input type="hidden" name="portfolioId" value={portfolioId} />
					<input type="hidden" name="category" value={selectedCategory} />

					<div className="space-y-2">
						<Label
							htmlFor="name"
							className="text-xs font-semibold uppercase tracking-wider opacity-70"
						>
							Nazwa
						</Label>
						<Input
							id="name"
							name="name"
							placeholder="np. iShares MSCI EM"
							required
							disabled={isPending}
							className={inputStyles}
						/>
					</div>

					<div className="space-y-2">
						<Label
							htmlFor="ticker"
							className="text-xs font-semibold uppercase tracking-wider opacity-70"
						>
							Symbol (Ticker)
						</Label>
						<Input
							id="ticker"
							name="ticker"
							placeholder="EIMI.L"
							disabled={isPending}
							className={inputStyles}
						/>
					</div>

					<div className="space-y-2">
						<Label
							htmlFor="value"
							className="text-xs font-semibold uppercase tracking-wider opacity-70"
						>
							Wartość (PLN)
						</Label>
						<Input
							id="value"
							name="value"
							type="number"
							step="0.01"
							placeholder="5000"
							required
							disabled={isPending}
							className={inputStyles}
						/>
					</div>

					{/* EN: Fixing alignment by ensuring the container and trigger match Input heights exactly */}
					{/* UI: Naprawa wyrównania poprzez wymuszenie identycznej wysokości SelectTrigger */}
					<div>
						<Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 ml-1 mb-2">
							Kategoria
						</Label>
						<Select
							value={selectedCategory}
							onValueChange={setSelectedCategory}
							disabled={isPending}
							required
						>
							<SelectTrigger
								className={cn(
									inputStyles,
									"flex items-center opacity-100 text-foreground",
								)}
							>
								<SelectValue placeholder="Wybierz..." />
							</SelectTrigger>

							<SelectContent>
								{CATEGORY_ASSETS.map((category) => (
									<SelectItem key={category} value={category}>
										<div className="flex items-center gap-2">
											<div
												className="h-2 w-2 rounded-full border border-border2"
												style={{
													backgroundColor: `var(--portfolio-${category.toLowerCase()})`,
												}}
											/>
											{CATEGORY_LABELS[category] || category}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="md:pb-0 flex justify-end">
						<SubmitButton
							label={isPending ? "Zapisywanie..." : "Zapisz aktywo"}
							className="w-full uppercase  text-xs h-10"
						/>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}

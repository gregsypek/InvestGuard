"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { CATEGORY_LABELS, COLORS, inputStyles } from "@/lib/constants";
import Link from "next/link";
import { Button } from "../button";
import { cn } from "@/lib/utils";
interface AddAssetFormProps {
	portfolioId: string;
	allowedCategories?: string[]; // Opcjonalna lista kategorii z bazy
}
export default function AddAssetForm({
	portfolioId,
	allowedCategories = [],
}: AddAssetFormProps) {
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const [isPending, setIsPending] = useState(false);
	// EN: Initialize state with the only category if available to avoid React 19 cascading warnings
	// UI: Inicjalizacja stanu jedyną dostępną kategorią, by uniknąć ostrzeżeń React 19
	const [selectedCategory, setSelectedCategory] = useState<string>(() =>
		allowedCategories.length === 1 ? allowedCategories[0] : "",
	);

	// EN: Filter categories or return empty array / UI: Filtrujemy kategorie lub zwracamy pustą tablicę
	// const categoriesToDisplay = allowedCategories || [];
	const hasNoCategories = allowedCategories.length === 0;
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
					<div className={cn(hasNoCategories && "-mt-3")}>
						<Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 ml-1 mb-2">
							Kategoria
						</Label>
						<Select
							value={selectedCategory}
							onValueChange={setSelectedCategory}
							// EN: Critical: Physical 'disabled' prevents useFormStatus from triggering loader incorrectly
							// UI: Kluczowe: Fizyczny 'disabled' zapobiega błędnemu uruchamianiu loadera przez useFormStatus
							disabled={isPending || hasNoCategories}
							required
						>
							<SelectTrigger className={inputStyles}>
								<SelectValue
									placeholder={
										hasNoCategories ? "Brak kategorii..." : "Wybierz..."
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{hasNoCategories ? (
									<div className="p-4 text-center text-xs text-destructive font-bold uppercase">
										Brak zdefiniowanych kategorii w tym portfelu
									</div>
								) : (
									allowedCategories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											<div className="flex items-center gap-2">
												{/* EN: Dot is back / UI: Kropka wraca */}
												<div
													className="h-2.5 w-2.5 rounded-full border border-border2"
													style={{
														backgroundColor:
															COLORS[cat as keyof typeof COLORS] || "#ccc",
													}}
												/>
												<span className="font-medium text-xs">
													{CATEGORY_LABELS[
														cat as keyof typeof CATEGORY_LABELS
													] || cat}
												</span>
											</div>
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
						{/* EN: Link to configuration if categories are missing */}
						{/* UI: Link do konfiguracji, jeśli brakuje kategorii */}
						{hasNoCategories && (
							<Link
								href={`/portfolios/edit/${portfolioId}`}
								className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1 font-bold"
							>
								<Plus className="h-3 w-3" /> Skonfiguruj kategorie portfela
							</Link>
						)}
					</div>

					<div className="md:pb-0 flex justify-end">
						{/* <SubmitButton
							label={isPending ? "Zapisywanie..." : "Zapisz aktywo"}
							// EN: Pass disabled prop to prevent 'Processing...' state on empty categories
							// UI: Przekaż disabled, aby uniknąć stanu 'Processing...' przy braku kategorii
							disabled={hasNoCategories || !selectedCategory}
							className="w-full uppercase text-xs h-10"
						/> */}
						<Button
							type="submit"
							disabled={hasNoCategories || !selectedCategory}
							className={cn(
								"w-full md:w-auto font-semibold transition-all border duration-200 active:scale-95 cursor-pointer hover:border-border2 bg-blue-400",
								(hasNoCategories || !selectedCategory) &&
									"cursor-not-allowed opacity-50",
							)}
						>
							<>{isPending ? "Zapisywanie..." : "Zapisz aktywo"}</>
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}

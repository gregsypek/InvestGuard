"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SubmitButton } from "./ui/SubmitButton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
	createPortfolio,
	updatePortfolio,
} from "@/lib/actions/portfolio.actions";
import {
	PortfolioFormValues,
	PortfolioSchema,
} from "@/lib/validations/portfolio";
import { ActionResponse, Portfolio } from "@/lib/types";
import z from "zod";
import { inputStyles } from "@/lib/constants";

interface PortfolioFormProps {
	portfolioId?: string;
	initialData?: Omit<Portfolio, "assets">;
}

export default function PortfolioForm({
	initialData,
	portfolioId: initialPortfolioId,
}: PortfolioFormProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const isEditMode = !!initialData?.id;

	console.log("Dane wejściowe:", initialData);

	const effectivePortfolioId =
		initialPortfolioId || Cookies.get("selectedPortfolioId");

	// 1. Initialize form with explicit type for validation values
	const form = useForm<z.input<typeof PortfolioSchema>>({
		resolver: zodResolver(PortfolioSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			goal: initialData?.goal ?? 0,
			targetDeveloped: initialData?.targetDeveloped ?? 0,
			targetEmerging: initialData?.targetEmerging ?? 0,
			targetBonds: initialData?.targetBonds ?? 0,
			targetGold: initialData?.targetGold ?? 0,
			targetBooster: initialData?.targetBooster ?? 0,
			targetCash: initialData?.targetCash ?? 0,
			targetCrypto: initialData?.targetCrypto ?? 0,
			targetCommodities: initialData?.targetCommodities ?? 0,
		},
	});

	// 2. Watch all target fields for live calculation
	const targets = useWatch({
		control: form.control,
		name: [
			"targetDeveloped",
			"targetEmerging",
			"targetBonds",
			"targetGold",
			"targetBooster",
			"targetCash",
			"targetCrypto",
			"targetCommodities",
		],
	});

	// EN: Shared focus styles to remove thick ring and use subtle border instead
	// UI: Wspólne style dla focusa, aby usunąć gruby ring i użyć subtelnego borderu

	// 3. Calculate total % (casting to number avoids the 'unknown' error)
	const totalAllocation = (targets as number[]).reduce(
		(acc: number, val) => acc + (Number(val) || 0),
		0,
	);

	useEffect(() => {
		if (effectivePortfolioId && !searchParams.get("portfolioId")) {
			const params = new URLSearchParams(searchParams.toString());
			params.set("portfolioId", effectivePortfolioId);
			router.replace(`${pathname}?${params.toString()}`);
		}
	}, [effectivePortfolioId, pathname, router, searchParams]);

	// ✅ W onSubmit musimy sparsować dane, aby zamienić je na typy wynikowe (infer)
	async function onSubmit(data: z.input<typeof PortfolioSchema>) {
		// Przekształcamy surowe dane z formularza na czyste dane dla bazy
		const validatedValues = PortfolioSchema.parse(data);

		const result = (
			initialData?.id
				? await updatePortfolio(initialData.id, validatedValues)
				: await createPortfolio(validatedValues)
		) as ActionResponse;

		if (result.success) {
			toast.success(isEditMode ? "Updated! ✏️" : "Created! 🚀");
			// Kluczowe: Pobieramy ID (z wyniku lub z initialData)
			const targetId = result?.id || initialData?.id;

			if (targetId) {
				// 1. Przekierowanie na listę z parametrem aktywnego portfela
				router.push(`/portfolios?portfolioId=${targetId}`);

				// 2. Wymuszenie odświeżenia komponentów klienta, by "zaciągnęły" nowe dane
				router.refresh();
			}
		} else {
			toast.error(result.error || "Błąd zapisu ❌");
		}
	}

	// 4. Helper to avoid code repetition and fix type errors in Inputs
	const renderTargetField = (
		name: keyof PortfolioFormValues,
		label: string,
	) => (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel className="text-xs">{label}</FormLabel>
					<FormControl>
						<Input
							type="number"
							{...field}
							// Casting field.value fixes the 'unknown' TypeScript error
							value={(field.value as number) ?? 0}
							className={inputStyles}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);

	return (
		<Card className="bg-card border-border2 shadow-sm rounded-xl py-6 mb-8">
			<CardHeader className="px-6 py-0 mb-2">
				<CardTitle className="leading-none font-bold text-xl">
					{isEditMode ? `Edytuj ${initialData?.name}` : "Dodaj nowy Portfel"}
				</CardTitle>
			</CardHeader>
			<CardContent className="px-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nazwa Portfela</FormLabel>
										<FormControl>
											<Input
												placeholder="np. Emerytalny"
												{...field}
												className={inputStyles}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="goal"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Cel finansowy (PLN)</FormLabel>
										<FormControl>
											<Input
												type="number"
												{...field}
												value={(field.value as number) ?? 0}
												className={inputStyles}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Opis strategii</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Twoje założenia inwestycyjne..."
											{...field}
											// Override the value to ensure it's never null
											value={field.value ?? ""}
											className={inputStyles}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Strategy Section */}
						<div className="mt-8 space-y-4 border-t pt-6">
							<div className="flex justify-between items-center">
								<div>
									<h3 className="text-lg font-semibold">
										Alokacja Celowa (Target Allocation)
									</h3>
									<p className="text-sm text-muted-foreground">
										Zdefiniuj strategię w %
									</p>
								</div>
								<div
									className={`px-3 py-1 rounded-full text-sm font-bold ${totalAllocation === 100 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
								>
									Suma: {totalAllocation}% / 100%
								</div>
							</div>

							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{renderTargetField("targetDeveloped", "Developed %")}
								{renderTargetField("targetEmerging", "Emerging %")}
								{renderTargetField("targetBonds", "Bonds %")}
								{renderTargetField("targetGold", "Gold %")}
								{renderTargetField("targetBooster", "Booster %")}
								{renderTargetField("targetCash", "Cash %")}
								{renderTargetField("targetCrypto", "Crypto %")}
								{renderTargetField("targetCommodities", "Commodities %")}
							</div>

							{totalAllocation !== 100 && (
								<p className="text-xs text-amber-600 font-medium italic">
									⚠️ Uwaga: Suma alokacji nie wynosi 100%. Sprawdź swoje
									założenia.
								</p>
							)}
						</div>

						<div className="flex justify-end pt-4">
							<SubmitButton
								label={isEditMode ? "Aktualizuj Portfel" : "Stwórz Portfel"}
								isLoading={form.formState.isSubmitting}
							/>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

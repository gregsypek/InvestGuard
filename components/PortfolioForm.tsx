"use client";

import { ActionResponse, Portfolio } from "@/lib/types";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	PortfolioFormValues,
	PortfolioSchema,
} from "@/lib/validations/portfolio";
import {
	createPortfolio,
	updatePortfolio,
} from "@/lib/actions/portfolio.actions";
import { useForm, useWatch } from "react-hook-form";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Cookies from "js-cookie";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "./ui/SubmitButton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

	// console.log("Dane wejściowe:", initialData);

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
			// 🚀 NOWE W DOMYŚLNYCH:
			targetRealEstate: initialData?.targetRealEstate ?? 0,
			targetCustom: initialData?.targetCustom ?? 0,
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
			// 🚀 NOWE NASŁUCHIWANE:
			"targetRealEstate",
			"targetCustom",
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
		// Jeśli jesteśmy w edycji, NIE dopisujemy parametru do URL.
		// Header i tak go teraz znajdzie dzięki poprawce powyżej.
		if (isEditMode) return;

		if (effectivePortfolioId && !searchParams.get("portfolioId")) {
			const params = new URLSearchParams(searchParams.toString());
			params.set("portfolioId", effectivePortfolioId);
			router.replace(`${pathname}?${params.toString()}`);
		}
	}, [effectivePortfolioId, pathname, router, searchParams, isEditMode]);

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

	const inputStyles =
		"h-12 bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-blue-500 rounded-xl px-4 text-sm font-medium text-t-text-primary transition-colors";

	// 4. Helper z ulepszonym designem dla pól docelowych (%)
	const renderTargetField = (
		name: keyof PortfolioFormValues,
		label: string,
	) => (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
						{label}
					</FormLabel>
					<FormControl>
						<div className="relative">
							<Input
								type="number"
								{...field}
								value={(field.value as number) ?? 0}
								className={cn(inputStyles, "pr-8 font-mono")} // font-mono dla lepszej czytelności cyfr
							/>
							<span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-t-text-tertiary pointer-events-none">
								%
							</span>
						</div>
					</FormControl>
					<FormMessage className="text-xs text-rose-500" />
				</FormItem>
			)}
		/>
	);

	return (
		<div className="w-full bg-t-bg-panel border border-t-border rounded-2xl p-6 sm:p-8 shadow-sm">
			{/* Zamiast starego CustomCardHeader używamy zintegrowanego, eleganckiego nagłówka */}
			{/* <div className="mb-8 border-b border-t-border-subtle pb-6">
				<h2 className="text-2xl font-black tracking-tight text-t-text-primary flex items-center gap-3">
					<Pencil className="h-6 w-6 text-blue-500" />
					{isEditMode ? `Edycja: ${initialData?.name}` : "Nowy Portfel"}
				</h2>
				<p className="text-sm font-medium text-t-text-tertiary mt-1">
					{isEditMode
						? "Zaktualizuj założenia i alokację dla swojego portfela."
						: "Zdefiniuj podstawowe parametry i docelową alokację dla nowego portfela inwestycyjnego."}
				</p>
			</div> */}

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{/* GŁÓWNE DANE */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
										Nazwa Portfela
									</FormLabel>
									<FormControl>
										<Input
											placeholder="np. Emerytalny"
											{...field}
											className={inputStyles}
										/>
									</FormControl>
									<FormMessage className="text-xs text-rose-500" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="goal"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
										Cel finansowy
									</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												type="number"
												{...field}
												value={(field.value as number) ?? 0}
												className={cn(inputStyles, "pr-12 font-mono")}
											/>
											<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary pointer-events-none">
												PLN
											</span>
										</div>
									</FormControl>
									<FormMessage className="text-xs text-rose-500" />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
									Opis strategii
								</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Jakie są Twoje główne założenia inwestycyjne?"
										{...field}
										value={field.value ?? ""}
										className={cn(
											inputStyles,
											"min-h-[120px] resize-none py-3",
										)}
									/>
								</FormControl>
								<FormMessage className="text-xs text-rose-500" />
							</FormItem>
						)}
					/>

					{/* SEKCJA ALOKACJI CELOWEJ */}
					<div className="mt-8 pt-8 border-t border-t-border-subtle space-y-6">
						<div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
							<div>
								<h3 className="text-lg font-bold text-t-text-primary">
									Alokacja Celowa (Target Allocation)
								</h3>
								<p className="text-xs font-medium text-t-text-tertiary mt-1">
									Zdefiniuj idealny podział procentowy dla Twojego kapitału.
								</p>
							</div>

							{/* Badzik z sumą (Zgodny z kolorami Systemu) */}
							<div
								className={cn(
									"px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black border flex items-center justify-center whitespace-nowrap",
									totalAllocation === 100
										? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
										: "bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-500/20",
								)}
							>
								Suma: {totalAllocation}% / 100%
							</div>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-t-bg-base/30 dark:bg-black/20 p-4 rounded-xl border border-t-border-subtle">
							{renderTargetField("targetDeveloped", "Rynki rozwinięte")}
							{renderTargetField("targetEmerging", "Rynki wschodzące")}
							{renderTargetField("targetBonds", "Obligacje")}
							{renderTargetField("targetGold", "Złoto")}
							{renderTargetField("targetBooster", "Akcje")}
							{renderTargetField("targetCash", "Gotówka")}
							{renderTargetField("targetCrypto", "Krypto")}
							{renderTargetField("targetCommodities", "Surowce")}
							{/* 🚀 NOWE WYŚWIETLANE POLA: */}
							{renderTargetField("targetRealEstate", "Nieruchomości")}
							{renderTargetField("targetCustom", "Alternatywne")}
						</div>

						{totalAllocation !== 100 && (
							<p className="text-[11px] text-rose-500 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
								<span className="text-lg">⚠️</span> Suma alokacji musi wynosić
								dokładnie 100%. Sprawdź swoje założenia.
							</p>
						)}
					</div>

					<div className="flex justify-end pt-6 border-t border-t-border-subtle">
						{/* Upewnij się, że Twój SubmitButton przyjmuje className lub jest ostylowany tak jak reszta (np. niebieski bg-blue-600) */}
						<SubmitButton
							label={isEditMode ? "Aktualizuj Portfel" : "Stwórz Portfel"}
							isLoading={form.formState.isSubmitting}
						/>
					</div>
				</form>
			</Form>
		</div>
	);
}

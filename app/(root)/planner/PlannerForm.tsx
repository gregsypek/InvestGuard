"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Category, Portfolio } from "@prisma/client"; // Upewnij się, że masz te typy
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card"; // Opcjonalne, dla estetyki

// Zakładam, że PlannerSchema jest poprawnie zaimportowany z pliku walidacji
import { PlannerSchema } from "@/lib/validations/planner";
import { createInvestmentPlan } from "@/lib/actions/planner.actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { SimpleSwitch } from "@/components/ui/SimpleSwitchProps";
import { CATEGORY_LABELS, inputStyles } from "@/lib/constants";

// Typ wywnioskowany ze schematu
type PlannerFormValues = z.infer<typeof PlannerSchema>;

const CATEGORY_MAP = {
	targetDeveloped: "DEVELOPED",
	targetEmerging: "EMERGING",
	targetBonds: "BONDS",
	targetGold: "GOLD",
	targetBooster: "BOOSTER",
	targetCash: "CASH",
	targetCrypto: "CRYPTO",
	targetCommodities: "COMMODITIES",
} as const;

interface PlannerFormProps {
	portfolios: Portfolio[];
	// EN: Ensure we handle both undefined and null from parent components
	// UI: Obsługujemy zarówno undefined jak i null z komponentów nadrzędnych
	defaultPortfolioId: string | null;
}

export default function PlannerForm({
	portfolios,
	defaultPortfolioId,
}: PlannerFormProps) {
	const router = useRouter();

	// 1. USUNIĘCIE GENERYKA <z.infer...> Z useForm
	// To tutaj był główny problem TypeScripta. Pozwalamy RHF samemu wywnioskować typy z resolvera.
	const form = useForm({
		resolver: zodResolver(PlannerSchema),
		defaultValues: {
			name: "",
			ticker: "",
			value: 0,
			plannedDate: new Date().toISOString().substring(0, 7), // Format YYYY-MM
			portfolioId: defaultPortfolioId ?? "", // EN: Convert null/undefined to string
			// Ważne: undefined wymusza wybór (placeholder w Select zadziała)
			category: undefined,
			rationale: "",
			isRecurring: false,
		},
	});

	const selectedPortfolioId = useWatch({
		control: form.control,
		name: "portfolioId",
	});

	const availableCategories = useMemo(() => {
		if (!selectedPortfolioId) return [];
		const portfolio = portfolios.find((p) => p.id === selectedPortfolioId);
		if (!portfolio) return [];

		const active: string[] = [];
		for (const [dbField, categoryName] of Object.entries(CATEGORY_MAP)) {
			// Rzutowanie p[key] na number, aby TS nie krzyczał
			if ((portfolio[dbField as keyof Portfolio] as number) > 0) {
				active.push(categoryName);
			}
		}
		return active.length > 0 ? active : Object.values(Category);
	}, [selectedPortfolioId, portfolios]);
	console.log("🚀 ~ PlannerForm ~ availableCategories:", availableCategories);

	// EN: Robust category reset when switching portfolios
	// UI: Solidne resetowanie kategorii przy zmianie portfela
	const handlePortfolioChange = (
		val: string,
		onChange: (val: string) => void,
	) => {
		onChange(val);
		// EN: Use undefined to trigger the "Select Category" placeholder
		// UI: Używamy undefined, aby pokazać placeholder "Wybierz kategorię"
		form.setValue("category", undefined as any);
	};
	async function onSubmit(values: PlannerFormValues) {
		try {
			const result = await createInvestmentPlan(values);

			if (result?.success) {
				toast.success("Dodano do planu! 📅");
				form.reset({
					name: "",
					ticker: "",
					value: 0,
					rationale: "",
					portfolioId: values.portfolioId, // Zostawiamy wybrane portfolio
					plannedDate: values.plannedDate, // Zostawiamy wybraną datę
					category: undefined, // Reset kategorii
					isRecurring: false,
				});
				router.refresh();
			} else {
				toast.error(result?.error || "Nie udało się utworzyć planu");
			}
		} catch (error) {
			console.error("Błąd wysyłania:", error);
			toast.error("Wystąpił nieoczekiwany błąd");
		}
	}

	return (
		<Card className="border-none shadow-none bg-transparent">
			<CardContent className="p-0">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Sekcja Wyboru Portfela i Daty */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="portfolioId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Wybierz Portfel</FormLabel>
										<Select
											onValueChange={(val) =>
												handlePortfolioChange(val, field.onChange)
											}
											value={field.value || ""}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Wybierz portfel..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{portfolios.map((p) => (
													<SelectItem key={p.id} value={p.id}>
														{/* EN: Using the same consistent look as in other selects */}
														{/* UI: Używamy tego samego spójnego wyglądu co w innych selectach */}
														<div className="flex items-center gap-2">
															{/* <div className="h-2 w-2 rounded-full bg-blue-500/40 border border-blue-500/20" /> */}
															<span className="font-medium">{p.name}</span>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="plannedDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Planowana Data</FormLabel>
										<FormControl>
											<Input type="month" {...field} className={inputStyles} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Sekcja Danych Aktywa */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nazwa Aktywa</FormLabel>
										<FormControl>
											<Input
												placeholder="np. Złoto fizyczne"
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
								name="value"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Kwota (PLN)</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="0.00"
												// EN: Spread field but override value and onChange for type safety
												// UI: Rozpakowujemy field, ale nadpisujemy value i onChange dla bezpieczeństwa typów
												{...field}
												value={
													typeof field.value === "number" ? field.value : ""
												}
												onChange={(e) => {
													const val = e.target.valueAsNumber;
													field.onChange(isNaN(val) ? 0 : val);
												}}
												className={inputStyles}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Kategoria i Switch */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Kategoria</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={!selectedPortfolioId}
										>
											<FormControl>
												<SelectTrigger className={inputStyles}>
													<SelectValue placeholder="Wybierz kategorię" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{availableCategories.map((cat) => (
													<SelectItem key={cat} value={cat}>
														<div className="flex items-center gap-2">
															<div
																className="h-2 w-2 rounded-full border border-border2"
																style={{
																	backgroundColor: `var(--portfolio-${cat.toLowerCase()})`,
																}}
															/>
															{CATEGORY_LABELS[cat] || cat}
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="isRecurring"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-1 h-18">
										<div className="space-y-0.5">
											<FormLabel className="text-sm font-semibold">
												Cykliczne?
											</FormLabel>
											<FormDescription className="text-xs">
												Zaplanuj też na kolejne miesiące
											</FormDescription>
										</div>
										<FormControl>
											{/* <Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/> */}
											<SimpleSwitch
												checked={!!field.value}
												onChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="rationale"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Uzasadnienie (Opcjonalne)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Dlaczego decydujesz się na ten zakup?"
											className="resize-none min-h-20"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end pt-2">
							<SubmitButton
								label="Dodaj do Planu"
								isLoading={form.formState.isSubmitting}
								className="w-full md:w-auto"
							/>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

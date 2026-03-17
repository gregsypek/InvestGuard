"use client";

import * as z from "zod";

import { CATEGORY_LABELS, COLORS, inputStyles } from "@/lib/constants";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Landmark, PlusCircle } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // EN: Fixed missing import
import { PlannerSchema } from "@/lib/validations/planner";
import { SimpleSwitch } from "@/components/ui/SimpleSwitchProps";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createInvestmentPlan } from "@/lib/actions/planner.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

// EN: Infer values from schema for type safety
type PlannerFormValues = z.infer<typeof PlannerSchema>;

interface Props {
	portfolios: { id: string; name: string }[];
	defaultPortfolioId?: string;
}

export default function PlannerForm({ portfolios, defaultPortfolioId }: Props) {
	const router = useRouter();
	const [viewMode, setViewMode] = useState<"asset" | "bond">("asset");

	// EN: Restored generic type for useForm
	const form = useForm<PlannerFormValues>({
		resolver: zodResolver(PlannerSchema),
		defaultValues: {
			name: "",
			ticker: "",
			value: 0,
			plannedDate: new Date().toISOString().slice(0, 7),
			portfolioId: defaultPortfolioId || "",
			category: "" as any,
			rationale: "",
			isRecurring: false,
		},
	});

	const selectedCategory = useWatch({
		control: form.control,
		name: "category",
	});

	// EN: Now using isCash to dynamically change labels (fixes 'unused' error)
	const isCash = selectedCategory === "CASH";

	const filteredCategories = useMemo(() => {
		return Object.keys(CATEGORY_LABELS).filter((cat) => cat !== "BONDS");
	}, []);

	const handleModeChange = (mode: "asset" | "bond") => {
		setViewMode(mode);
		form.reset({
			...form.getValues(),
			category: mode === "bond" ? "BONDS" : ("" as any),
			ticker: mode === "bond" ? "EDO" : "",
			name: mode === "bond" ? "Obligacje EDO" : "",
		});
	};

	async function onSubmit(data: PlannerFormValues) {
		try {
			const result = await createInvestmentPlan(data);
			if (result.success) {
				toast.success("Dodano do planu");
				form.reset();
				router.refresh();
			}
		} catch {
			toast.error("Wystąpił błąd");
		}
	}

	return (
		<div className="space-y-6">
			{/* SELEKTOR TRYBÓW */}
			<div className="flex bg-muted/50 p-1 rounded-xl w-fit border border-border items-center">
				<button
					type="button"
					onClick={() => handleModeChange("asset")}
					className={cn(
						"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
						viewMode === "asset"
							? "bg-background shadow-sm text-primary"
							: "text-muted-foreground",
					)}
				>
					<PlusCircle size={14} /> Aktywo / Gotówka
				</button>

				<button
					type="button"
					onClick={() => handleModeChange("bond")}
					className={cn(
						"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ml-1",
						viewMode === "bond"
							? "bg-background shadow-sm text-primary"
							: "text-muted-foreground",
					)}
				>
					<Landmark size={14} /> Planuj Obligację
				</button>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							control={form.control}
							name="portfolioId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Portfel docelowy</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className={inputStyles}>
												<SelectValue placeholder="Wybierz portfel" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{portfolios.map((p) => (
												<SelectItem key={p.id} value={p.id}>
													{p.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{viewMode === "asset" ? (
							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Kategoria</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger className={inputStyles}>
													<SelectValue placeholder="Wybierz typ" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{filteredCategories.map((cat) => (
													<SelectItem key={cat} value={cat}>
														{
															CATEGORY_LABELS[
																cat as keyof typeof CATEGORY_LABELS
															]
														}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						) : (
							<div className="flex flex-col gap-2">
								<Label className="text-sm font-medium">Kategoria</Label>
								<div className="flex items-center gap-2 h-10 px-3 bg-muted/40 rounded-lg border text-xs font-bold text-primary">
									<Landmark size={14} /> OBLIGACJE SKARBOWE
								</div>
							</div>
						)}

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{isCash
											? "Opis wpłaty"
											: viewMode === "bond"
												? "Typ"
												: "Nazwa"}
									</FormLabel>
									<FormControl>
										{/* EN: Using ?? "" to prevent null-to-controlled-input error */}
										<Input
											className={inputStyles}
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="ticker"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{isCash ? "Identyfikator" : "Ticker"}</FormLabel>
									<FormControl>
										<Input
											className={inputStyles}
											{...field}
											value={field.value ?? ""}
											disabled={isCash}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* ... reszta pól (value, plannedDate, isRecurring) analogicznie ... */}
						<FormField
							control={form.control}
							name="value"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Kwota (PLN)</FormLabel>
									<FormControl>
										<Input
											type="number"
											className={inputStyles}
											// ROZWIĄZANIE:
											// Rozbijamy {...field}, aby nadpisać problematyczne właściwości
											{...field}
											// 1. Zabezpieczamy wartość przed null/undefined/unknown
											value={field.value ?? ""}
											// 2. Konwertujemy tekst z inputa na liczbę dla React Hook Form
											onChange={(e) => field.onChange(Number(e.target.value))}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="flex justify-end">
						<SubmitButton
							label="Zapisz plan"
							isLoading={form.formState.isSubmitting}
						/>
					</div>
				</form>
			</Form>
		</div>
	);
}

"use client";

import * as z from "zod";

import { BOND_CONFIG, CATEGORY_LABELS, inputStyles } from "@/lib/constants";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useForm, useWatch } from "react-hook-form";
import { useMemo, useState } from "react";

import { FilterBadge } from "../shared/FilterBadge";
import { Input } from "@/components/ui/input";
import { Landmark } from "lucide-react";
import { PlannerSchema } from "@/lib/validations/planner";
import { SimpleSwitch } from "@/components/ui/SimpleSwitchProps";
import { SubmitButton } from "@/components/ui/SubmitButton";
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

	const today = new Date();
	const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
	// EN: Restored generic type for useForm
	const form = useForm({
		resolver: zodResolver(PlannerSchema),
		defaultValues: {
			name: "",
			ticker: "",
			value: 0,
			plannedDate: currentMonth,
			portfolioId: defaultPortfolioId || "",
			category: undefined,
			rationale: "",
			isRecurring: false,
			conviction: null,
		},
	});

	const selectedCategory = useWatch({
		control: form.control,
		name: "category",
	}) as string | undefined; // Rzutujemy na string

	// EN: Now using isCash to dynamically change labels (fixes 'unused' error)
	// Zabezpieczone sprawdzanie
	const isCash = (selectedCategory as string) === "CASH";
	const isBooster = (selectedCategory as string) === "BOOSTER";
	const isBond = (selectedCategory as string) === "BONDS";

	const filteredCategories = useMemo(() => {
		return Object.keys(CATEGORY_LABELS).filter((cat) => cat !== "BONDS");
	}, []);

	const handleModeChange = (mode: "asset" | "bond") => {
		setViewMode(mode);
		form.reset({
			...form.getValues(),
			category: (mode === "bond" ? "BONDS" : "") as any,
			ticker: "", // 👈 Zostawiamy puste, seria zostanie wybrana przy realizacji
			name: mode === "bond" ? "Zakup: Obligacje Skarbowe" : "", // 👈 Ogólna nazwa planu zamiast sztywnego EDO
		});
	};

	async function onSubmit(data: PlannerFormValues) {
		try {
			// const result = await createInvestmentPlan(finalData);
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

	const currentMonthStr = new Date().toISOString().slice(0, 7);

	return (
		<div className="space-y-6 ">
			{/* EN: MODE SELECTOR - Updated to use deep panel styling */}

			{/* SELEKTOR TRYBÓW */}
			<div className="flex p-1.5 rounded-xl gap-1.5 items-center">
				{/* Przycisk 1: Aktywo / Gotówka (Niebieski po aktywacji) */}
				<FilterBadge
					id="asset"
					label="Aktywo / Gotówka"
					isSelected={viewMode === "asset"}
					onToggle={(id) => handleModeChange(id as "asset" | "bond")}
					// className={cn(
					// 	"flex-1 py-2.5 justify-center h-full",
					// 	viewMode === "asset"
					// 		? "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
					// 		: "bg-transparent border-black/10 dark:border-white/10 text-t-text-secondary",
					// )}
				/>

				{/* Przycisk 2: Planuj Obligację (Szmaragdowy po aktywacji) */}
				<FilterBadge
					id="bond"
					label="Planuj Obligację"
					isSelected={viewMode === "bond"}
					onToggle={(id) => handleModeChange(id as "asset" | "bond")}
					// className={cn(
					// 	"flex-1 py-2.5 justify-center h-full",
					// 	viewMode === "bond"
					// 		? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
					// 		: "bg-transparent border-black/10 dark:border-white/10 text-t-text-secondary",
					// )}
				/>
			</div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							control={form.control}
							name="portfolioId"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-t-text-primary">
										Portfel docelowy
									</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger
												className={cn(
													inputStyles,
													"bg-black/5  dark:bg-blue-500/5 border-t-border",
												)}
											>
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
									<FormMessage className="text-red-500 text-xs" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="plannedDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-t-text-primary">
										{viewMode === "bond"
											? "Dokładna data zakupu"
											: "Miesiąc realizacji"}
									</FormLabel>
									<FormControl>
										<Input
											type="month"
											min={currentMonthStr}
											className={cn(
												inputStyles,
												"bg-black/5  dark:bg-blue-500/5  border-t-border",
											)}
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage className="text-red-500 text-xs" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="isRecurring"
							render={({ field }) => (
								// EN: Upgraded container to match deep UI look
								<FormItem className="flex flex-row items-center justify-between rounded-xl border  p-4 shadow-sm h-auto bg-black/5  dark:bg-blue-500/5 border-t-border">
									<div className="space-y-0.5">
										<FormLabel className="text-sm font-bold text-t-text-primary">
											Cykliczne?
										</FormLabel>
										<FormDescription className="text-xs text-t-text-tertiary">
											Zaplanuj też na kolejne miesiące
										</FormDescription>
									</div>
									<FormControl>
										<SimpleSwitch
											checked={!!field.value}
											onChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{viewMode === "asset" ? (
							<>
								<FormField
									control={form.control}
									name="category"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm font-bold text-t-text-primary">
												Kategoria
											</FormLabel>
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													// EN: Auto-fill for CASH category
													if (value === "CASH") {
														form.setValue("name", "Gotówka");
														form.setValue("ticker", "CASH");
													} else if (value === "BONDS") {
														// EN: Clear ticker if switching from cash back to bonds
														form.setValue("ticker", "");
													}
												}}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger
														className={cn(
															inputStyles,
															"bg-black/5  dark:bg-blue-500/5  border-t-border",
														)}
													>
														<SelectValue placeholder="Wybierz typ" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{filteredCategories.map((cat) => (
														<SelectItem key={cat} value={cat}>
															<div className="flex items-center gap-2">
																<div
																	className="h-2 w-2 rounded-full border border-t-border-subtle bg-black/5  dark:bg-blue-500/2  border-t-border"
																	style={{
																		backgroundColor: `var(--portfolio-${cat.toLowerCase()})`,
																	}}
																/>
																{CATEGORY_LABELS[
																	cat as keyof typeof CATEGORY_LABELS
																] || cat}
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage className="text-red-500 text-xs" />
										</FormItem>
									)}
								/>
							</>
						) : (
							<div className="flex flex-col gap-2">
								<FormLabel className="text-sm font-bold text-t-text-primary">
									Kategoria
								</FormLabel>
								<div className="flex items-center gap-2 h-[42px] px-3 bg-black/5  dark:bg-blue-500/5  rounded-lg border border-t-border text-xs font-bold text-t-text-primary">
									<Landmark size={14} className="text-blue-500" /> OBLIGACJE
									SKARBOWE
								</div>
							</div>
						)}

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold uppercase tracking-widest text-t-text-secondary">
										{isCash
											? "Opis wpłaty"
											: selectedCategory === "BONDS"
												? "Wybierz typ obligacji"
												: "Nazwa aktywa"}
									</FormLabel>
									{selectedCategory === "BONDS" ? (
										<Select
											onValueChange={(value) => {
												field.onChange(
													BOND_CONFIG[value as keyof typeof BOND_CONFIG].label,
												);
												form.setValue("ticker", value);
											}}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger
													className={cn(
														inputStyles,
														"h-[42px] bg-black/5  dark:bg-blue-500/5  border-t-border",
													)}
												>
													<SelectValue placeholder="Wybierz serię..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.entries(BOND_CONFIG).map(([key, config]) => (
													<SelectItem
														key={key}
														value={key}
														className="cursor-pointer"
													>
														<div className="flex items-center gap-2">
															<div
																className={cn(
																	"w-2 h-2 rounded-full",
																	config.color,
																)}
															/>
															<span className="font-medium">
																{config.label}
															</span>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : (
										<FormControl>
											<Input
												placeholder="Np. iShares Physical Gold"
												className={cn(
													inputStyles,
													"bg-black/5  dark:bg-blue-500/5  border-t-border",
												)}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
									)}
									<FormMessage className="text-red-500 text-xs" />{" "}
								</FormItem>
							)}
						/>

						{/* EN: TICKER FIELD (DISABLED FOR BONDS/CASH) */}
						<FormField
							control={form.control}
							name="ticker"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary">
										Ticker / Symbol
									</FormLabel>
									<FormControl>
										<Input
											placeholder={
												selectedCategory === "BONDS"
													? "Automatyczny"
													: "Np. IGLN.L"
											}
											className={cn(
												inputStyles,
												"bg-black/5  dark:bg-blue-500/5  border-t-border",
												selectedCategory === "BONDS" &&
													"bg-black/5  dark:bg-blue-500/5  border-t-border opacity-70 cursor-not-allowed font-mono text-amber-600 dark:text-amber-500",
												selectedCategory === "CASH" &&
													"bg-black/5  dark:bg-blue-500/5  border-t-border opacity-70 cursor-not-allowed font-mono text-blue-600 dark:text-blue-500",
											)}
											{...field}
											value={field.value ?? ""}
											// EN: Lock field if category is CASH or BONDS
											readOnly={
												selectedCategory === "BONDS" ||
												selectedCategory === "CASH"
											}
										/>
									</FormControl>
									<FormMessage className="text-red-500 text-xs" />{" "}
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="value"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-bold text-t-text-primary">
										Kwota (PLN)
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											className={cn(
												inputStyles,
												"bg-black/5  dark:bg-blue-500/5  border-t-border font-mono",
											)}
											{...field}
											value={(field.value as number | string) ?? ""}
											onChange={(e) => field.onChange(Number(e.target.value))}
										/>
									</FormControl>
									<FormMessage className="text-red-500 text-xs" />
								</FormItem>
							)}
						/>
					</div>

					<div className="flex justify-end pt-4">
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

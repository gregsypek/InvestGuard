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
	}) as string | undefined;

	const isCash = (selectedCategory as string) === "CASH";

	const filteredCategories = useMemo(() => {
		return Object.keys(CATEGORY_LABELS).filter((cat) => cat !== "BONDS");
	}, []);

	const handleModeChange = (mode: "asset" | "bond") => {
		setViewMode(mode);
		form.reset({
			...form.getValues(),
			category: (mode === "bond" ? "BONDS" : "") as any,
			ticker: "",
			name: mode === "bond" ? "Zakup: Obligacje Skarbowe" : "",
		});
	};

	async function onSubmit(data: PlannerFormValues) {
		try {
			const result = await createInvestmentPlan(data);
			if (result.success) {
				toast.success("Dodano do planu");
				form.reset();
				// 🚀 ZMIANA: Powrót do planera zamiast twardego refreshu strony
				router.push(`/planner?portfolioId=${data.portfolioId}`);
			}
		} catch {
			toast.error("Wystąpił błąd podczas dodawania planu.");
		}
	}

	const currentMonthStr = new Date().toISOString().slice(0, 7);

	// 🚀 ZMIANA: Spójne style wejść (identyczne jak w AddAssetForm)
	const localInputStyles =
		"h-12 bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-blue-500 rounded-xl px-4 text-sm font-medium text-t-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			{/* SELEKTOR TRYBÓW - 🚀 NAPRAWA RESPONSYWNOŚCI (Pełna szerokość na mobile) */}
			<div className="flex flex-col sm:flex-row p-1.5 rounded-xl gap-1.5 items-stretch sm:items-center bg-t-bg-base/50 dark:bg-black/20 border border-t-border-subtle w-full sm:w-fit">
				<FilterBadge
					id="asset"
					label="Aktywo / Gotówka"
					isSelected={viewMode === "asset"}
					onToggle={(id) => handleModeChange(id as "asset" | "bond")}
					className={cn(
						"flex-1 justify-center transition-all px-4 py-2 text-xs font-bold rounded-lg border",
						viewMode === "asset"
							? "bg-theme-primary text-white border-transparent shadow-sm"
							: "bg-transparent text-t-text-tertiary border-transparent hover:text-t-text-primary",
					)}
				/>
				<FilterBadge
					id="bond"
					label="Planuj Obligację"
					isSelected={viewMode === "bond"}
					onToggle={(id) => handleModeChange(id as "asset" | "bond")}
					className={cn(
						"flex-1 justify-center transition-all px-4 py-2 text-xs font-bold rounded-lg border",
						viewMode === "bond"
							? "bg-emerald-500 text-white border-transparent shadow-sm"
							: "bg-transparent text-t-text-tertiary border-transparent hover:text-emerald-500",
					)}
				/>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
						<FormField
							control={form.control}
							name="portfolioId"
							render={({ field }) => (
								<FormItem className="col-span-1 md:col-span-2 lg:col-span-3">
									<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
										Portfel docelowy
									</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className={localInputStyles}>
												<SelectValue placeholder="Wybierz portfel" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{portfolios.map((p) => (
												<SelectItem key={p.id} value={p.id}>
													<div className="font-bold">{p.name}</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage className="text-red-500 text-xs" />
								</FormItem>
							)}
						/>

						{viewMode === "asset" ? (
							<>
								<FormField
									control={form.control}
									name="category"
									render={({ field }) => (
										<FormItem className="col-span-1">
											<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
												Kategoria
											</FormLabel>
											<Select
												onValueChange={(value) => {
													field.onChange(value);
													if (value === "CASH") {
														form.setValue("name", "Gotówka");
														form.setValue("ticker", "CASH");
													} else if (value === "BONDS") {
														form.setValue("ticker", "");
													}
												}}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger className={localInputStyles}>
														<SelectValue placeholder="Wybierz typ" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{filteredCategories.map((cat) => (
														<SelectItem key={cat} value={cat}>
															<div className="flex items-center gap-2">
																<div
																	className="h-2 w-2 rounded-full"
																	style={{
																		backgroundColor: `var(--portfolio-${cat.toLowerCase()})`,
																	}}
																/>
																<span className="text-xs font-bold text-t-text-secondary uppercase tracking-wider">
																	{CATEGORY_LABELS[
																		cat as keyof typeof CATEGORY_LABELS
																	] || cat}
																</span>
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
							<div className="flex flex-col gap-2 col-span-1">
								<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
									Kategoria
								</FormLabel>
								<div className="flex items-center gap-2 h-12 px-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs font-bold text-emerald-500">
									<Landmark size={14} className="text-emerald-500" /> OBLIGACJE
									SKARBOWE
								</div>
							</div>
						)}

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="col-span-1 md:col-span-2">
									<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
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
												<SelectTrigger className={localInputStyles}>
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
															<span className="font-bold text-xs uppercase tracking-wider">
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
												className={localInputStyles}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
									)}
									<FormMessage className="text-red-500 text-xs" />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="ticker"
							render={({ field }) => (
								<FormItem className="col-span-1">
									<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
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
												localInputStyles,
												"font-mono uppercase",
												selectedCategory === "BONDS" &&
													"opacity-70 cursor-not-allowed text-emerald-500 bg-emerald-500/5",
												selectedCategory === "CASH" &&
													"opacity-70 cursor-not-allowed text-blue-500 bg-blue-500/5",
											)}
											{...field}
											value={field.value ?? ""}
											readOnly={
												selectedCategory === "BONDS" ||
												selectedCategory === "CASH"
											}
										/>
									</FormControl>
									<FormMessage className="text-red-500 text-xs" />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="value"
							render={({ field }) => (
								<FormItem className="col-span-1">
									<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
										Szacowana Kwota
									</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												type="number"
												className={cn(localInputStyles, "font-mono pr-12")}
												{...field}
												value={(field.value as number | string) ?? ""}
												onChange={(e) => field.onChange(Number(e.target.value))}
											/>
											<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary pointer-events-none">
												PLN
											</span>
										</div>
									</FormControl>
									<FormMessage className="text-red-500 text-xs" />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="plannedDate"
							render={({ field }) => (
								<FormItem className="col-span-1">
									<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
										{viewMode === "bond"
											? "Miesiąc zakupu"
											: "Miesiąc realizacji"}
									</FormLabel>
									<FormControl>
										<Input
											type="month"
											min={currentMonthStr}
											className={cn(localInputStyles, "font-mono uppercase")}
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
								<FormItem className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-row items-center justify-between rounded-xl border border-t-border-subtle p-4 shadow-sm bg-t-bg-panel/50">
									<div className="space-y-0.5">
										<FormLabel className="text-sm font-bold text-t-text-primary">
											Zakup Cykliczny
										</FormLabel>
										<FormDescription className="text-[11px] text-t-text-tertiary">
											Skopiuj ten plan również na kolejne miesiące.
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
					</div>

					<div className="flex justify-end pt-4">
						<SubmitButton
							label="Zapisz plan"
							isLoading={form.formState.isSubmitting}
							className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px]"
						/>
					</div>
				</form>
			</Form>
		</div>
	);
}

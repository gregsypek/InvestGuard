"use client";

import * as z from "zod";

import { CATEGORY_LABELS, COLORS, inputStyles } from "@/lib/constants";
import { Coins, Landmark, PlusCircle, Recycle, TrendingUp } from "lucide-react";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import { AddAssetSchema } from "@/lib/validations/asset";
import AddBondForm from "./AddBondForm";
import { AssetCategory } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { SubmitButton } from "../SubmitButton";
import { Textarea } from "@/components/ui/textarea";
import { addAssetAction } from "@/lib/actions/asset-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";

type AddAssetFormValues = z.infer<typeof AddAssetSchema>;

export default function AddAssetForm({
	portfolioId,
	allowedCategories = [],
	existingAssets = [],
}: {
	portfolioId: string;
	allowedCategories?: AssetCategory[];
	existingAssets?: Array<{
		id: string;
		name: string;
		ticker: string | null;
		category: string;
	}>;
}) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);
	// NOWE: Stan dla daty transakcji (domyślnie dzisiaj w formacie YYYY-MM-DD)

	const [transactionDate, setTransactionDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	// --- 1. FILTROWANIE DANYCH ---
	const filteredCategories = useMemo(
		() => allowedCategories.filter((cat) => cat !== "BONDS"),
		[allowedCategories],
	);
	const filteredExistingAssets = useMemo(
		() => existingAssets.filter((a) => a.category !== "BONDS"),
		[existingAssets],
	);

	// --- 2. INTELIGENTNA KATEGORIA POCZĄTKOWA ---
	const initialCategory = useMemo(() => {
		const catFromUrl = searchParams.get("cat");
		console.log("🚀 ~ AddAssetForm ~ catFromUrl:", catFromUrl);
		if (
			catFromUrl &&
			allowedCategories.includes(catFromUrl as keyof typeof CATEGORY_LABELS)
		)
			return catFromUrl;
		if (filteredCategories.length === 1) return filteredCategories[0];
		// Jeśli jest wiele kategorii, domyślnie wybierz pierwszą z listy zamiast pustki
		return filteredCategories[0] || "";
	}, [searchParams, allowedCategories, filteredCategories]);

	// --- 3. INICJALIZACJA FORMULARZA ---
	const form = useForm({
		resolver: zodResolver(AddAssetSchema),
		defaultValues: {
			portfolioId,
			category: initialCategory,
			existingAssetId: "new",
			ticker: initialCategory === "CASH" ? "CASH" : "",
			name: initialCategory === "CASH" ? "Gotówka" : "",
			quantity: 0,
			investedCapital: 0,
			conviction: 50,
			rationale: "",
		},
	});

	const selectedCategory = useWatch({
		control: form.control,
		name: "category",
	});
	const selectedAssetId = useWatch({
		control: form.control,
		name: "existingAssetId",
	});
	const quantityValue = useWatch({
		control: form.control,
		name: "quantity",
	}) as number | undefined;

	const isAddingNew = selectedAssetId === "new";
	const isCash = selectedCategory === "CASH";
	const isBooster = selectedCategory === "BOOSTER";
	const isBondOnly =
		allowedCategories.includes("BONDS") && filteredCategories.length === 0;

	// // --- 4. OBSŁUGA ZMIANY WIDOKU (URL -> STATE) ---
	// useEffect(() => {
	// 	const view = searchParams.get("view");

	// 	if (view === "bond" || isBondOnly) {
	// 		setViewMode("bond");
	// 	} else {
	// 		setViewMode("asset");
	// 	}
	// }, [searchParams, allowedCategories, filteredCategories, isBondOnly]);

	// ✅ To jest teraz  "stan" - obliczany w locie przy każdym renderze
	const viewMode =
		searchParams.get("view") === "bond" || isBondOnly ? "bond" : "asset";

	// --- 5. EFEKTY SYNCHRONIZACJI ---
	useEffect(() => {
		if (isCash) {
			form.setValue("ticker", "CASH");
			form.setValue("name", "Gotówka");
			form.setValue("investedCapital", quantityValue || 0);
		}
	}, [isCash, quantityValue, form]);

	useEffect(() => {
		if (selectedAssetId !== "new") {
			const asset = existingAssets.find((a) => a.id === selectedAssetId);
			if (asset) {
				form.setValue("ticker", asset.ticker || "");
				form.setValue("name", asset.name);
				form.setValue("category", asset.category);
			}
		}
	}, [selectedAssetId, existingAssets, form]);

	const onSubmit = async (data: AddAssetFormValues) => {
		setIsPending(true);
		const formData = new FormData();
		Object.entries(data).forEach(([key, value]) => {
			if (value !== null && value !== undefined)
				formData.append(key, value.toString());
		});
		formData.append("currentValue", data.investedCapital.toString());
		formData.append("executedAt", transactionDate);
		const result = await addAssetAction(formData);
		if (result.success) {
			toast.success(result.message);
			form.reset({
				...data,
				quantity: 0,
				investedCapital: 0,
				existingAssetId: "new",
			});
			router.refresh();
		} else {
			toast.error(result.message);
		}
		setIsPending(false);
	};

	const inputStyles =
		"h-12 bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-blue-500 rounded-xl px-4 text-sm font-medium text-t-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

	return (
		<div className="space-y-8 animate-in fade-in duration-300">
			{/* ZAKŁADKI (Segmented Control) */}
			<div className="flex flex-wrap items-center gap-2 p-1.5 w-fit bg-t-bg-base/50 dark:bg-black/20 rounded-xl border border-t-border-subtle">
				{!isBondOnly && (
					<button
						type="button"
						onClick={() => {
							router.push(window.location.pathname);
							form.setValue("existingAssetId", "new");
						}}
						className={cn(
							"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
							viewMode === "asset" && isAddingNew
								? "bg-t-bg-panel shadow-sm text-t-text-primary border border-t-border" // Aktywny (Wypukły)
								: "text-t-text-tertiary border border-transparent hover:text-t-text-primary", // Nieaktywny
						)}
					>
						<PlusCircle size={14} /> Nowe Aktywo / Gotówka
					</button>
				)}
				{filteredExistingAssets.length > 0 && (
					<button
						type="button"
						onClick={() => {
							router.push(window.location.pathname);
							form.setValue("existingAssetId", filteredExistingAssets[0].id);
						}}
						className={cn(
							"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
							viewMode === "asset" && !isAddingNew
								? "bg-t-bg-panel shadow-sm text-t-text-primary border border-t-border"
								: "text-t-text-tertiary border border-transparent hover:text-t-text-primary",
						)}
					>
						<Recycle size={14} /> Dokup istniejące
					</button>
				)}

				{allowedCategories.includes("BONDS") && (
					<button
						type="button"
						onClick={() => router.push("?view=bond")}
						className={cn(
							"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
							viewMode === "bond"
								? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
								: "text-t-text-tertiary border border-transparent hover:text-emerald-500",
						)}
					>
						<Landmark className="h-4 w-4" /> Dodaj Obligację
					</button>
				)}
			</div>

			{/* DYNAMICZNA ZAWARTOŚĆ */}
			{viewMode === "bond" ? (
				<div className="animate-in slide-in-from-bottom-2 duration-300">
					<AddBondForm portfolioId={portfolioId} />
				</div>
			) : (
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
							{/* DOKUP: SELECTOR */}
							{!isAddingNew && (
								<FormField
									control={form.control}
									name="existingAssetId"
									render={({ field }) => (
										<FormItem className="flex flex-col col-span-1 md:col-span-2 lg:col-span-3">
											<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
												Zasoby w portfelu
											</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className={inputStyles}>
														<SelectValue placeholder="Wybierz aktywo do powiększenia..." />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{filteredExistingAssets.map((asset) => (
														<SelectItem key={asset.id} value={asset.id}>
															<div className="flex items-center gap-3">
																<div
																	className="h-2 w-2 rounded-full shrink-0"
																	style={{
																		backgroundColor:
																			COLORS[
																				asset.category as keyof typeof COLORS
																			],
																	}}
																/>
																<div className="flex flex-col items-start leading-tight">
																	<span className="text-xs font-bold text-t-text-primary">
																		{asset.name}{" "}
																		{asset.ticker &&
																			`(${asset.ticker.split("_")[0]})`}
																	</span>
																	<span className="text-[9px] uppercase tracking-widest text-t-text-tertiary mt-0.5">
																		{CATEGORY_LABELS[
																			asset.category as keyof typeof CATEGORY_LABELS
																		] || asset.category}
																	</span>
																</div>
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
							)}

							{/* KATEGORIA */}
							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem className="flex flex-col col-span-1">
										<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
											Kategoria
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={!isAddingNew || filteredCategories.length === 1}
										>
											<FormControl>
												<SelectTrigger className={inputStyles}>
													<SelectValue placeholder="Wybierz typ..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{filteredCategories.map((cat) => (
													<SelectItem key={cat} value={cat}>
														<div className="flex items-center gap-2">
															<div
																className="h-2 w-2 rounded-full"
																style={{
																	backgroundColor:
																		COLORS[cat as keyof typeof COLORS],
																}}
															/>
															<span className="text-xs font-bold text-t-text-secondary uppercase tracking-wider">
																{
																	CATEGORY_LABELS[
																		cat as keyof typeof CATEGORY_LABELS
																	]
																}
															</span>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormItem>
								)}
							/>

							{/* TICKER */}
							<FormField
								control={form.control}
								name="ticker"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
											Ticker
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												disabled={isCash || !isAddingNew}
												className={cn(inputStyles, "uppercase font-mono")}
												placeholder="np. AAPL"
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							{/* NAZWA */}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
											Nazwa
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												disabled={isCash || !isAddingNew}
												className={inputStyles}
												placeholder="Pełna nazwa aktywa"
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							{/* ILOŚĆ */}
							<FormField
								control={form.control}
								name="quantity"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
											{isCash ? "Kwota" : "Liczba jednostek"}
										</FormLabel>
										<FormControl>
											<div className="relative">
												<Input
													type="number"
													step="any"
													{...field}
													value={(field.value ?? "") as string | number}
													onChange={(e) => field.onChange(e.target.value)}
													className={cn(inputStyles, "pr-10 font-mono")}
												/>
												<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary pointer-events-none">
													{isCash ? "PLN" : "SZT"}
												</span>
											</div>
										</FormControl>
									</FormItem>
								)}
							/>

							{/* WKŁAD */}
							<FormField
								control={form.control}
								name="investedCapital"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
											Wkład własny
										</FormLabel>
										<FormControl>
											<div className="relative">
												<Input
													type="number"
													step="any"
													{...field}
													value={(field.value ?? "") as string | number}
													onChange={(e) => field.onChange(e.target.value)}
													disabled={isCash}
													className={cn(inputStyles, "pr-12 font-mono")}
												/>
												<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary pointer-events-none">
													PLN
												</span>
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
							{/* TODO: USE FORMFIELD AND CHANGE VALIDATION IN ZOD */}
							{/* NOWE: DATA TRANSAKCJI (Backdating) */}
							<div className="col-span-1">
								<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary block mb-3">
									Data operacji
								</label>
								<Input
									type="date"
									value={transactionDate}
									onChange={(e) => setTransactionDate(e.target.value)}
									className={cn(
										inputStyles,
										"w-full font-mono text-t-text-primary",
									)}
								/>
							</div>

							{/* PRZYCISK DODAJ */}
							<div className="col-span-1 md:col-span-2 lg:col-span-1 flex justify-end h-[48px]">
								<SubmitButton
									label={
										isCash
											? "Zaksięguj"
											: isAddingNew
												? "Zapisz Aktywo"
												: "Dokup Pozycję"
									}
									isLoading={isPending}
									disabled={(quantityValue ?? 0) <= 0}
									className="w-full h-full rounded-xl shadow-md font-bold uppercase tracking-widest text-[10px]"
								/>
							</div>

							{/* SEKCJA ALPHA / BOOSTER (Motyw Rubinowy) */}
							{isBooster && (
								<div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8 p-6 lg:p-8 mt-4 bg-rose-500/5 rounded-2xl border border-rose-500/20 animate-in slide-in-from-top duration-500 shadow-inner">
									<div className="md:col-span-2 flex items-center gap-2 mb-2 border-b border-rose-500/20 pb-4">
										<TrendingUp className="h-5 w-5 text-rose-500" />
										<h3 className="text-sm font-black uppercase tracking-widest text-rose-500">
											Analiza Tezy Inwestycyjnej (Booster)
										</h3>
									</div>

									<FormField
										control={form.control}
										name="conviction"
										render={({ field }) => (
											<FormItem className="space-y-4">
												<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary flex justify-between">
													<span>Przekonanie</span>
													<span className="text-rose-500">{field.value}%</span>
												</FormLabel>
												<FormControl>
													<Slider
														min={1}
														max={100}
														step={1}
														value={[field.value || 50]}
														onValueChange={(vals) => field.onChange(vals[0])}
														className="py-4"
													/>
												</FormControl>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="rationale"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
													Uzasadnienie
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														value={field.value || ""}
														className={cn(inputStyles, "h-24 resize-none py-3")}
														placeholder="Dlaczego ta spółka podbije Twój wynik? Wpisz krótką notatkę..."
													/>
												</FormControl>
											</FormItem>
										)}
									/>
								</div>
							)}
						</div>
					</form>
				</Form>
			)}
		</div>
	);
}

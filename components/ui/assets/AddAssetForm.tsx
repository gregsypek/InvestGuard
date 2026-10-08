"use client";

import * as z from "zod";

import { CATEGORY_LABELS, COLORS } from "@/lib/constants";
import {
	Coins,
	Landmark,
	Loader2,
	PlusCircle,
	Recycle,
	TrendingUp,
	Wand2,
} from "lucide-react";
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
import { fetchMagicFillData } from "@/lib/actions/magic-actions";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";

type AddAssetFormValues = z.infer<typeof AddAssetSchema>;

export default function AddAssetForm({
	portfolioId,
	allowedCategories = [],
	existingAssets = [],
	userRole,
}: {
	portfolioId: string;
	allowedCategories?: AssetCategory[];
	existingAssets?: Array<{
		id: string;
		name: string;
		ticker: string | null;
		category: string;
	}>;
	userRole: "ADMIN" | "SUBSCRIBER" | "REGULAR";
}) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);
	const [isMagicLoading, setIsMagicLoading] = useState(false);
	const [applySpread, setApplySpread] = useState(false);
	const [spreadValue, setSpreadValue] = useState(0.5);

	const [rawMagicValue, setRawMagicValue] = useState<number | null>(null);
	const [transactionDate, setTransactionDate] = useState(
		new Date().toISOString().split("T")[0],
	);

	const filteredCategories = useMemo(
		() => allowedCategories.filter((cat) => cat !== "BONDS"),
		[allowedCategories],
	);
	const filteredExistingAssets = useMemo(
		() => existingAssets.filter((a) => a.category !== "BONDS"),
		[existingAssets],
	);

	const initialCategory = useMemo(() => {
		const catFromUrl = searchParams.get("cat");
		if (
			catFromUrl &&
			allowedCategories.includes(catFromUrl as keyof typeof CATEGORY_LABELS)
		)
			return catFromUrl;
		if (filteredCategories.length === 1) return filteredCategories[0];
		return filteredCategories[0] || "";
	}, [searchParams, allowedCategories, filteredCategories]);

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

	const isManualAsset =
		selectedCategory === "REAL_ESTATE" || selectedCategory === "CUSTOM";

	const isBondOnly =
		allowedCategories.includes("BONDS") && filteredCategories.length === 0;

	const isBondSource =
		searchParams.get("source") === "bonds" ||
		searchParams.get("cat") === "BONDS";
	const viewMode =
		searchParams.get("view") === "bond" || isBondSource || isBondOnly
			? "bond"
			: "asset";

	useEffect(() => {
		if (isCash) {
			form.setValue("ticker", "CASH");
			form.setValue("name", "Gotówka");
			form.setValue("investedCapital", quantityValue || 0);
		}
	}, [isCash, quantityValue, form]);

	useEffect(() => {
		if (isManualAsset && isAddingNew) {
			const currentTicker = form.getValues("ticker");
			if (!currentTicker || !currentTicker.startsWith("MANUAL_")) {
				form.setValue("ticker", `MANUAL_${Date.now()}`);
			}
			if (form.getValues("quantity") === 0) {
				form.setValue("quantity", 1);
			}
		}
	}, [isManualAsset, isAddingNew, form]);

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

	useEffect(() => {
		if (rawMagicValue !== null) {
			const finalValue = applySpread
				? rawMagicValue * (1 + spreadValue / 100)
				: rawMagicValue;
			form.setValue("investedCapital", Number(finalValue.toFixed(2)));
		}
	}, [applySpread, spreadValue, rawMagicValue, form]);

	const handleMagicFill = async () => {
		const currentTicker = form.getValues("ticker");
		const currentQty = Number(form.getValues("quantity"));

		if (!currentTicker || currentQty <= 0) {
			toast.error("Wpisz Ticker i Ilość, aby użyć magii!");
			return;
		}

		setIsMagicLoading(true);
		try {
			const result = await fetchMagicFillData(
				currentTicker,
				transactionDate,
				currentQty,
			);

			if (result.success && result.data) {
				setRawMagicValue(Number(result.data.investedCapitalPln));
				toast.success(
					`Pobrano: ${result.data.originalPrice.toFixed(2)} ${result.data.originalCurrency} | NBP: ${result.data.exchangeRate.toFixed(4)}`,
				);
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error("Wystąpił błąd komunikacji z API.");
		} finally {
			setIsMagicLoading(false);
		}
	};

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

	// 🚀 ZMIANA: Zastosowano `focus:border-theme-primary` aby styl podążał za globalnym motywem!
	const inputStyles =
		"h-12 w-full bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-theme-primary rounded-xl px-4 text-sm font-medium text-t-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

	return (
		<div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
			{/* ZAKŁADKI (Segmented Control) - 🚀 ZMIANA: Responsywny kontener w-full na mobile */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 w-full sm:w-fit bg-t-bg-base/50 dark:bg-black/20 rounded-xl border border-t-border-subtle">
				{!isBondOnly && (
					<button
						type="button"
						onClick={() => {
							router.push(window.location.pathname);
							form.setValue("existingAssetId", "new");
						}}
						className={cn(
							"flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
							viewMode === "asset" && isAddingNew
								? "bg-t-bg-panel shadow-sm text-t-text-primary border border-t-border"
								: "text-t-text-tertiary border border-transparent hover:text-t-text-primary",
						)}
					>
						<PlusCircle size={14} /> Nowe Aktywo
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
							"flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
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
							"flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
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
						{/* 🚀 ZMIANA: gap-4 na mobile, gap-6 na desktopie dla lepszego dopasowania */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-end">
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
												<SelectContent className="bg-t-bg-panel border border-t-border shadow-xl">
													{filteredExistingAssets.map((asset) => (
														<SelectItem key={asset.id} value={asset.id}>
															<div className="flex items-center gap-3">
																<div
																	className="h-2 w-2 rounded-full shrink-0"
																	style={{
																		backgroundColor:
																			COLORS[
																				asset.category as keyof typeof COLORS
																			] || COLORS.UNKNOWN,
																	}}
																/>
																<div className="flex flex-col items-start leading-tight">
																	<span className="text-xs font-bold text-t-text-primary">
																		{asset.name}{" "}
																		{asset.ticker &&
																			!asset.ticker.startsWith("MANUAL_") &&
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
											<SelectContent className="bg-t-bg-panel border border-t-border shadow-xl">
												{filteredCategories.map((cat) => (
													<SelectItem key={cat} value={cat}>
														<div className="flex items-center gap-2">
															<div
																className="h-2 w-2 rounded-full"
																style={{
																	backgroundColor:
																		COLORS[cat as keyof typeof COLORS] ||
																		COLORS.UNKNOWN,
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
									</FormItem>
								)}
							/>

							{/* TICKER */}
							{!isManualAsset && (
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
							)}

							{/* NAZWA */}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem
										className={cn(
											"col-span-1",
											isManualAsset && "md:col-span-2",
										)}
									>
										<FormLabel className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary">
											{isManualAsset
												? "Nazwa (np. Rolex, Mieszkanie)"
												: "Nazwa"}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												disabled={isCash || !isAddingNew}
												className={inputStyles}
												placeholder={
													isManualAsset
														? "Wpisz nazwę własną..."
														: "Pełna nazwa aktywa"
												}
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
											{isCash
												? "Kwota"
												: isManualAsset
													? "Ilość"
													: "Liczba jednostek"}
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
											{isManualAsset ? "Wartość Początkowa" : "Wkład własny"}
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

							{/* MAGIC FILL & SPREAD PANEL - 🚀 ZMIANA: Responsywny układ w kolumnę na mobile */}
							{!isCash && !isManualAsset && (
								<div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end mt-2 md:mt-0 mb-2">
									<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 p-3 sm:p-2.5 bg-indigo-500/5 rounded-xl border border-indigo-500/20 shadow-inner w-full sm:w-auto">
										<label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
											<input
												type="checkbox"
												checked={applySpread}
												onChange={(e) => setApplySpread(e.target.checked)}
												className="rounded border-indigo-500/30 bg-t-bg-panel text-indigo-500 w-4 h-4 cursor-pointer accent-indigo-500"
											/>
											Dolicz spread
										</label>

										{applySpread && (
											<div className="flex items-center gap-2 animate-in slide-in-from-right-2 fade-in duration-200">
												<Input
													type="number"
													step="0.1"
													value={spreadValue}
													onChange={(e) =>
														setSpreadValue(Number(e.target.value))
													}
													className="w-full sm:w-16 h-9 text-xs text-center font-mono bg-black/20 border-indigo-500/30 text-indigo-300 focus:border-indigo-400 rounded-lg"
												/>
												<span className="text-[10px] font-black text-indigo-400/70">
													%
												</span>
											</div>
										)}

										<div className="w-full sm:w-px h-px sm:h-6 bg-indigo-500/20 sm:mx-1 my-1 sm:my-0"></div>

										<button
											type="button"
											onClick={handleMagicFill}
											disabled={isMagicLoading}
											className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto"
										>
											{isMagicLoading ? (
												<Loader2 className="w-4 h-4 animate-spin" />
											) : (
												<Wand2 className="w-4 h-4" />
											)}
											Auto-Kalkulator
										</button>
									</div>
								</div>
							)}

							{/* DATA TRANSAKCJI */}
							<div className="col-span-1">
								<label className="text-[10px] font-bold uppercase tracking-widest text-t-text-secondary block mb-3">
									Data operacji
								</label>
								<Input
									type="date"
									value={transactionDate}
									onChange={(e) => setTransactionDate(e.target.value)}
									className={cn(inputStyles, "font-mono text-t-text-primary")}
								/>
							</div>

							{/* PRZYCISK DODAJ */}
							<div className="col-span-1 md:col-span-2 flex justify-end h-12">
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

							{/* SEKCJA ALPHA / BOOSTER - 🚀 ZMIANA: Zastosowano globalne `card-padding` */}
							{isBooster && (
								<div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 card-padding mt-4 bg-rose-500/5 rounded-2xl border border-rose-500/20 animate-in slide-in-from-top duration-500 shadow-inner">
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

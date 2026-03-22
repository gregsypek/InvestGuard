"use client";

import * as z from "zod";

import { CATEGORY_LABELS, COLORS, inputStyles } from "@/lib/constants";
import {
	Coins,
	Landmark,
	Plus,
	PlusCircle,
	Recycle,
	TrendingUp,
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
import AddButton from "../AddButton";
import { Button } from "../button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
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
	allowedCategories?: string[];
	existingAssets?: any[];
}) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);
	const [viewMode, setViewMode] = useState<"asset" | "bond">("asset");

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
		if (catFromUrl && allowedCategories.includes(catFromUrl)) return catFromUrl;
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

	// --- 4. OBSŁUGA ZMIANY WIDOKU (URL -> STATE) ---
	useEffect(() => {
		const view = searchParams.get("view");

		if (view === "bond" || isBondOnly) {
			setViewMode("bond");
		} else {
			setViewMode("asset");
		}
	}, [searchParams, allowedCategories, filteredCategories, isBondOnly]);

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

	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			{/* NAWIGACJA ZAKŁADEK */}
			<div className="flex p-1 w-fit items-center gap-3">
				{!isBondOnly && (
					<button
						type="button"
						onClick={() => {
							// Najpierw czyścimy URL
							router.push(window.location.pathname);
							// Następnie ręcznie resetujemy tryb w formularzu
							form.setValue("existingAssetId", "new");
							setViewMode("asset");
						}}
						className={cn(
							"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
							viewMode === "asset" && isAddingNew
								? "bg-background shadow-md text-primary border border2" // Aktywny
								: "text-muted-foreground border hover:bg-muted/50", // Nieaktywny
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
							// Ustawiamy ID pierwszego dostępnego aktywa, co przełączy isAddingNew na false
							form.setValue("existingAssetId", filteredExistingAssets[0].id);
							setViewMode("asset");
						}}
						className={cn(
							"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
							viewMode === "asset" && !isAddingNew
								? "bg-background shadow-md text-primary border border2"
								: "text-muted-foreground border hover:bg-muted/50",
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
							"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ml-1",
							viewMode === "bond"
								? "bg-background shadow-md text-primary border border2"
								: "text-muted-foreground border hover:text-foreground",
						)}
					>
						<Landmark className="h-4 w-4" /> Dodaj Obligację
					</button>
				)}
			</div>
			{/* ✅ DYNAMICZNA ZAWARTOŚĆ - Tutaj decydujemy, co wyświetlić pod zakładkami */}
			{viewMode === "bond" ? (
				<div className="animate-in slide-in-from-bottom-2 duration-300">
					<AddBondForm portfolioId={portfolioId} />
				</div>
			) : (
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end p-4">
							{/* DOKUP: SELECTOR (Zawsze na górze w trybie dokupowania) */}
							{!isAddingNew && (
								<FormField
									control={form.control}
									name="existingAssetId"
									render={({ field }) => (
										<FormItem className="flex flex-col col-span-2 lg:col-span-3 mb-2">
											<FormLabel className="text-xs font-bold uppercase opacity-60">
												Zasoby w portfelu
											</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className={inputStyles}>
														<SelectValue placeholder="Wybierz aktywo do powiększenia" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{filteredExistingAssets.map((asset) => (
														<SelectItem key={asset.id} value={asset.id}>
															<div className="flex items-center gap-2">
																<Coins className="h-3.5 w-3.5 text-amber-500" />
																{asset.name} ({asset.ticker?.split("_")[0]})
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
							)}

							{/* KATEGORIA: Blokowana tylko w trybie dokupowania */}
							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem className="flex flex-col gap-1 col-span-1">
										<FormLabel className="text-xs font-bold uppercase opacity-60">
											Kategoria
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={!isAddingNew || filteredCategories.length === 1}
										>
											<FormControl>
												<SelectTrigger className={inputStyles}>
													<SelectValue placeholder="Typ" />
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
															<span className="text-xs font-medium">
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

							{/* TICKER & NAZWA: Blokowane dla Gotówki lub trybu dokupowania */}
							<FormField
								control={form.control}
								name="ticker"
								render={({ field }) => (
									<FormItem className="space-y-2 lg:col-span-1">
										<FormLabel className="text-xs font-bold uppercase opacity-60">
											Ticker
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												disabled={isCash || !isAddingNew}
												className={cn(
													inputStyles,
													(isCash || !isAddingNew) && "bg-muted opacity-80",
												)}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem className="space-y-2 lg:col-span-1">
										<FormLabel className="text-xs font-bold uppercase opacity-60">
											Nazwa
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												disabled={isCash || !isAddingNew}
												className={cn(
													inputStyles,
													(isCash || !isAddingNew) && "bg-muted opacity-80",
												)}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							{/* ILOŚĆ & WKŁAD: ZAWSZE AKTYWNE (Oprócz wkładu przy gotówce) */}
							<FormField
								control={form.control}
								name="quantity"
								render={({ field }) => (
									<FormItem className="space-y-2 lg:col-span-1">
										<FormLabel className="text-xs font-bold uppercase opacity-60">
											{isCash ? "Kwota (PLN)" : "Liczba jednostek"}
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="any"
												{...field}
												value={(field.value ?? "") as string | number}
												onChange={(e) => field.onChange(e.target.value)}
												className={inputStyles}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="investedCapital"
								render={({ field }) => (
									<FormItem className="space-y-2 lg:col-span-1">
										<FormLabel className="text-xs font-bold uppercase opacity-60">
											Wkład (PLN)
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="any"
												{...field}
												value={(field.value ?? "") as string | number}
												onChange={(e) => field.onChange(e.target.value)}
												disabled={isCash}
												className={cn(inputStyles, isCash && "bg-muted")}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<div className="lg:col-span-1 flex justify-end">
								<SubmitButton
									label={isCash ? "Zaksięguj" : isAddingNew ? "Dodaj" : "Dokup"}
									isLoading={isPending}
									// Przycisk będzie wyłączony jeśli trwa wysyłka LUB ilość <= 0
									disabled={(quantityValue ?? 0) <= 0}
									// Nadpisujemy szerokość na pełną, by wypełnił komórkę gridu
									className="w-full h-10 shadow-lg"
								/>
							</div>

							{/* SEKCJA ALPHA */}
							{isBooster && (
								<div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 mt-2 bg-blue-500/5 rounded-2xl border border-blue-500/20 animate-in slide-in-from-top duration-500">
									<div className="md:col-span-2 flex items-center gap-2 mb-2">
										<TrendingUp className="h-4 w-4 text-blue-500" />
										<h3 className="text-sm font-bold uppercase tracking-tight text-blue-500">
											Analiza Alpha / Booster
										</h3>
									</div>
									<FormField
										control={form.control}
										name="conviction"
										render={({ field }) => (
											<FormItem className="space-y-4">
												<FormLabel className="text-xs font-bold uppercase opacity-70">
													Pewność Tezy: {field.value}%
												</FormLabel>
												<FormControl>
													<Slider
														min={1}
														max={100}
														step={1}
														value={[field.value || 50]}
														onValueChange={(vals) => field.onChange(vals[0])}
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
												<FormLabel className="text-xs font-bold uppercase opacity-70">
													Uzasadnienie (Teza)
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														value={field.value || ""}
														className="resize-none h-20 bg-background/50 text-xs border-dashed"
														placeholder="Dlaczego ta spółka podbije Twój wynik?"
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

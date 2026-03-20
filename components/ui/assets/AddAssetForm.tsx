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

import { AddAssetSchema } from "@/lib/validations/asset";
import AddBondForm from "./AddBondForm";
import { Button } from "../button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { addAssetAction } from "@/lib/actions/asset-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

type AddAssetFormValues = z.infer<typeof AddAssetSchema>;

interface AddAssetFormProps {
	portfolioId: string;
	allowedCategories?: string[];
	existingAssets?: {
		id: string;
		name: string;
		ticker: string | null;
		category: string;
	}[];
}

export default function AddAssetForm({
	portfolioId,
	allowedCategories = [],
	existingAssets = [],
}: AddAssetFormProps) {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);
	const [viewMode, setViewMode] = useState<"asset" | "bond">("asset");

	// --- LOGIC HELPERS ---
	const filteredCategories = useMemo(
		() => allowedCategories.filter((cat) => cat !== "BONDS"),
		[allowedCategories],
	);
	const isBondHub =
		allowedCategories.includes("BONDS") && filteredCategories.length === 0;

	// --- FORM INITIALIZATION ---
	const form = useForm({
		resolver: zodResolver(AddAssetSchema),
		defaultValues: {
			portfolioId,
			category: "",
			existingAssetId: "new",
			ticker: "",
			name: "",
			quantity: 0,
			investedCapital: 0,
			conviction: 50,
			rationale: "",
		},
	});

	// --- WATCHING FIELDS ---
	const selectedCategory = useWatch({
		control: form.control,
		name: "category",
	});
	const selectedAssetId = useWatch({
		control: form.control,
		name: "existingAssetId",
	});
	const quantityValue = useWatch({ control: form.control, name: "quantity" });

	const isAddingNew = selectedAssetId === "new";
	const isCash = selectedCategory === "CASH";
	const isBooster = selectedCategory === "BOOSTER";

	// --- EFFECTS ---
	// EN: Sync name/ticker when category is CASH
	useEffect(() => {
		if (isCash) {
			form.setValue("ticker", "CASH");
			form.setValue("name", "Gotówka");
			// EN: For cash, quantity equals invested capital
			form.setValue("investedCapital", quantityValue);
		}
	}, [isCash, quantityValue, form]);

	// EN: Handle asset selection (New vs Existing)
	useEffect(() => {
		if (selectedAssetId !== "new") {
			const asset = existingAssets.find((a) => a.id === selectedAssetId);
			if (asset) {
				form.setValue("ticker", asset.ticker || "");
				form.setValue("name", asset.name);
				form.setValue("category", asset.category);
			}
		} else {
			// EN: Reset fields when switching back to 'New'
			form.setValue("ticker", "");
			form.setValue("name", "");
			form.setValue("category", "");
		}
	}, [selectedAssetId, existingAssets, form]);

	// EN: Master reset when portfolio changes
	useEffect(() => {
		form.reset({
			portfolioId,
			existingAssetId: "new",
			quantity: 0,
			investedCapital: 0,
		});
		if (isBondHub) setViewMode("bond");
		else setViewMode("asset");
	}, [portfolioId, isBondHub, form]);

	// --- SUBMIT HANDLER ---
	const onSubmit = async (data: AddAssetFormValues) => {
		setIsPending(true);
		const formData = new FormData();

		// EN: Map all fields to FormData
		Object.entries(data).forEach(([key, value]) => {
			if (value !== null && value !== undefined) {
				formData.append(key, value.toString());
			}
		});

		// EN: addAssetAction expects currentValue to be sent as well
		formData.append("currentValue", data.investedCapital.toString());

		try {
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
		} catch {
			toast.error("Wystąpił błąd");
		} finally {
			setIsPending(false);
		}
	};

	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			{/* --- NAVIGATION TABS --- */}
			<div className="flex p-1 w-fit items-center gap-3">
				<button
					type="button"
					onClick={() => {
						setViewMode("asset");
						form.setValue("existingAssetId", "new");
					}}
					className={cn(
						"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
						viewMode === "asset" && isAddingNew
							? "bg-background shadow-md text-primary border border2"
							: "text-muted-foreground hover:text-foreground border",
					)}
				>
					<PlusCircle size={14} /> Nowe Aktywo / Gotówka
				</button>

				{existingAssets.length > 0 && (
					<button
						type="button"
						onClick={() => {
							setViewMode("asset");
							form.setValue("existingAssetId", existingAssets[0].id);
						}}
						className={cn(
							"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
							viewMode === "asset" && !isAddingNew
								? "bg-background shadow-sm text-primary border border2"
								: "text-muted-foreground hover:text-foreground border",
						)}
					>
						<Recycle size={14} /> Dokup istniejące
					</button>
				)}

				<button
					type="button"
					onClick={() => setViewMode("bond")}
					className={cn(
						"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all  ml-1",
						viewMode === "bond"
							? "bg-background shadow-sm text-primary border border2"
							: "text-muted-foreground hover:text-foreground border",
					)}
				>
					<Landmark className="h-4 w-4" />
					Dodaj Obligację
				</button>
			</div>

			{viewMode === "bond" ? (
				<AddBondForm portfolioId={portfolioId} />
			) : (
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end  p-4 ">
							{/* FIELD: EXISTING ASSET SELECT */}
							{!isAddingNew && (
								<FormField
									control={form.control}
									name="existingAssetId"
									render={({ field }) => (
										<FormItem className="flex flex-col col-span-2">
											<FormLabel className="text-xs font-bold uppercase opacity-60">
												Wybierz z portfela
											</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className={inputStyles}>
														<SelectValue placeholder="Wybierz aktywo" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{existingAssets.map((asset) => (
														<SelectItem key={asset.id} value={asset.id}>
															<div className="flex items-center gap-2">
																<Coins className="h-4 w-4 text-amber-500" />
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

							{/* FIELD: CATEGORY */}
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
											disabled={!isAddingNew}
										>
											<FormControl>
												<SelectTrigger className={inputStyles}>
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

							{/* FIELDS: TICKER & NAME */}
							<FormField
								control={form.control}
								name="ticker"
								render={({ field }) => (
									<FormItem className="space-y-2 lg:col-span-1">
										<FormLabel className="text-xs font-bold uppercase opacity-60">
											{isCash ? "Identyfikator" : "Ticker"}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												disabled={isCash || !isAddingNew}
												className={cn(
													inputStyles,
													isCash && "bg-muted font-bold",
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
												className={inputStyles}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							{/* FIELDS: QUANTITY & CAPITAL */}
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
												onChange={(e) => field.onChange(Number(e.target.value))}
												className={inputStyles}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							{!isCash && (
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
													onChange={(e) =>
														field.onChange(Number(e.target.value))
													}
													className={inputStyles}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							)}

							{/* ACTION BUTTON */}
							<div className="lg:col-span-1 flex justify-end">
								<Button
									type="submit"
									disabled={isPending || quantityValue <= 0}
									className="w-full font-bold bg-blue-600 hover:bg-blue-700 h-10"
								>
									{isPending
										? "..."
										: isCash
											? "Zaksięguj"
											: isAddingNew
												? "Dodaj"
												: "Dokup"}
								</Button>
							</div>

							{/* ALPHA SECTION */}
							{isBooster && (
								<div className="md:col-span-2 lg:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 mt-2 bg-blue-500/5 rounded-2xl border border-blue-500/20 animate-in fade-in slide-in-from-top-2">
									<div className="md:col-span-2 flex items-center gap-2 mb-2">
										<TrendingUp className="h-4 w-4 text-blue-500" />
										<h3 className="text-sm font-bold uppercase tracking-tight text-blue-500">
											Analiza Alpha
										</h3>
									</div>

									<FormField
										control={form.control}
										name="conviction"
										render={({ field }) => (
											<FormItem className="space-y-4">
												<FormLabel className="text-xs font-bold uppercase opacity-70">
													Przekonanie: {field.value}%
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
													Teza
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														value={field.value || ""}
														className="resize-none h-20 bg-background/50 text-xs"
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

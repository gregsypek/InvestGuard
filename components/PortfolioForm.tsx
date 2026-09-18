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
import { Palette } from "lucide-react"; // Import new icon
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

// Map themes to their hex values for display in the picker
const THEME_OPTIONS = [
	{ id: "blue", color: "#3b82f6", label: "Niebieski" },
	{ id: "indigo", color: "#6366f1", label: "Indygo" },
	{ id: "violet", color: "#8b5cf6", label: "Fioletowy" },
	{ id: "purple", color: "#a855f7", label: "Purpurowy" },
	{ id: "fuchsia", color: "#d946ef", label: "Fuksja" },
	{ id: "pink", color: "#ec4899", label: "Różowy" },
	{ id: "emerald", color: "#10b981", label: "Szmaragdowy" },
	{ id: "teal", color: "#14b8a6", label: "Morski" },
	{ id: "cyan", color: "#06b6d4", label: "Cyjan" },
	{ id: "sky", color: "#0ea5e9", label: "Błękitny" },
	{ id: "amber", color: "#f59e0b", label: "Bursztynowy" },
	{ id: "orange", color: "#f97316", label: "Pomarańczowy" },
	{ id: "lime", color: "#84cc16", label: "Limonkowy" },
	{ id: "slate", color: "#64748b", label: "Stalowy" },
	// EN: Newly added matching Tailwind 500 colors
	{ id: "red", color: "#ef4444", label: "Czerwony" },
	{ id: "rose", color: "#f43f5e", label: "Różany" },
	{ id: "green", color: "#22c55e", label: "Zielony" },
	{ id: "yellow", color: "#eab308", label: "Żółty" },
	{ id: "zinc", color: "#71717a", label: "Cynkowy" },
	{ id: "stone", color: "#78716c", label: "Kamienny" },
];

export default function PortfolioForm({
	initialData,
	portfolioId: initialPortfolioId,
}: PortfolioFormProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const isEditMode = !!initialData?.id;

	const effectivePortfolioId =
		initialPortfolioId || Cookies.get("selectedPortfolioId");

	const form = useForm<z.input<typeof PortfolioSchema>>({
		resolver: zodResolver(PortfolioSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			goal: initialData?.goal ?? 0,

			// Initialize the new field
			colorTheme: (initialData as any)?.colorTheme ?? "blue",

			targetDeveloped: initialData?.targetDeveloped ?? 0,
			targetEmerging: initialData?.targetEmerging ?? 0,
			targetBonds: initialData?.targetBonds ?? 0,
			targetGold: initialData?.targetGold ?? 0,
			targetBooster: initialData?.targetBooster ?? 0,
			targetCash: initialData?.targetCash ?? 0,
			targetCrypto: initialData?.targetCrypto ?? 0,
			targetCommodities: initialData?.targetCommodities ?? 0,
			targetRealEstate: initialData?.targetRealEstate ?? 0,
			targetCustom: initialData?.targetCustom ?? 0,
		},
	});

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
			"targetRealEstate",
			"targetCustom",
		],
	});

	const totalAllocation = (targets as number[]).reduce(
		(acc: number, val) => acc + (Number(val) || 0),
		0,
	);

	useEffect(() => {
		if (isEditMode) return;

		if (effectivePortfolioId && !searchParams.get("portfolioId")) {
			const params = new URLSearchParams(searchParams.toString());
			params.set("portfolioId", effectivePortfolioId);
			router.replace(`${pathname}?${params.toString()}`);
		}
	}, [effectivePortfolioId, pathname, router, searchParams, isEditMode]);

	async function onSubmit(data: z.input<typeof PortfolioSchema>) {
		const validatedValues = PortfolioSchema.parse(data);

		const result = (
			initialData?.id
				? await updatePortfolio(initialData.id, validatedValues)
				: await createPortfolio(validatedValues)
		) as ActionResponse;

		if (result.success) {
			toast.success(isEditMode ? "Updated! ✏️" : "Created! 🚀");
			const targetId = result?.id || initialData?.id;

			if (targetId) {
				router.push(`/portfolios?portfolioId=${targetId}`);
				router.refresh();
			}
		} else {
			toast.error(result.error || "Błąd zapisu ❌");
		}
	}

	const inputStyles =
		"h-12 bg-black/5 dark:bg-white/5 border border-t-border-subtle hover:border-t-border focus:border-blue-500 rounded-xl px-4 text-sm font-medium text-t-text-primary transition-colors";

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
								className={cn(inputStyles, "pr-8 font-mono")}
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
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

					{/* NEW SECTION: COLOR THEME PICKER */}
					<div className="pt-4 space-y-4">
						<div className="flex items-center gap-2">
							<Palette className="w-4 h-4 text-t-text-secondary" />
							<h3 className="text-sm font-bold text-t-text-primary">
								Motyw Kolorystyczny
							</h3>
						</div>

						<FormField
							control={form.control}
							name="colorTheme"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<div className="flex flex-wrap gap-3">
											{THEME_OPTIONS.map((theme) => (
												<button
													key={theme.id}
													type="button"
													onClick={() => field.onChange(theme.id)}
													className={cn(
														"w-8 h-8 rounded-full transition-all duration-200 border-2",
														field.value === theme.id
															? "scale-110 shadow-md ring-2 ring-offset-2 ring-offset-t-bg-panel ring-t-text-primary/20 border-t-text-primary"
															: "border-transparent opacity-70 hover:opacity-100 hover:scale-105",
													)}
													style={{ backgroundColor: theme.color }}
													title={theme.label}
												/>
											))}
										</div>
									</FormControl>
									<FormMessage className="text-xs text-rose-500" />
								</FormItem>
							)}
						/>
					</div>

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

"use client";

import Cookies from "js-cookie";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation"; // Dodaj useSearchParams
import { SubmitButton } from "./ui/SubmitButton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
	createPortfolio,
	updatePortfolio,
} from "@/lib/actions/portfolio.actions";
import {
	PortfolioFormValues,
	PortfolioSchema,
} from "@/lib/validations/portfolio";
import { useEffect } from "react";
import { Portfolio } from "@/lib/types";

interface PortfolioFormProps {
	portfolioId?: string;
	initialData?: Omit<Portfolio, "assets">;
}
export type PortfolioActionResponse = {
	success: boolean;
	id?: string; // id jest opcjonalne, bo update może go nie zwracać
	error?: string;
};

export default function PortfolioForm({
	initialData,
	portfolioId: initialPortfolioId, // Zmieniamy nazwę, bo ID może przyjść z propa LUB z cookie
}: PortfolioFormProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const isEditMode = !!initialData?.id;

	// 1. Logika priorytetów: Prop (URL) -> Ciasteczko -> Pusto
	const effectivePortfolioId =
		initialPortfolioId || Cookies.get("selectedPortfolioId");

	const form = useForm({
		resolver: zodResolver(PortfolioSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			goal: initialData?.goal ?? "",
		},
	});

	// 2. Synchronizacja URL z effectivePortfolioId
	useEffect(() => {
		// Jeśli mamy ID (np. z ciasteczka), ale nie ma go w URL, to je tam wkładamy
		if (effectivePortfolioId && !searchParams.get("portfolioId")) {
			const params = new URLSearchParams(searchParams.toString());
			params.set("portfolioId", effectivePortfolioId);

			// Używamy router.replace zamiast window.history,
			// dzięki temu Header (który słucha useSearchParams) od razu "wyłapie" zmianę!
			router.replace(`${pathname}?${params.toString()}`);
		}
	}, [effectivePortfolioId, pathname, router, searchParams]);

	async function onSubmit(values: PortfolioFormValues) {
		// 1. Wybieramy odpowiednią akcję
		const result = initialData?.id
			? await updatePortfolio(initialData.id, values)
			: await createPortfolio(values);

		if (result.success) {
			toast.success(
				initialData?.id ? "Portfolio updated! ✏️" : "Portfolio created! 🚀",
			);

			// 2. Ustalamy ID do przekierowania
			// Jeśli to był nowy portfel, bierzemy ID z wyniku. Jeśli edycja - mamy je w initialData.
			const targetId =
				(result as PortfolioActionResponse).id || initialData?.id;

			if (targetId) {
				// Jeśli mamy ID, odświeżamy dane i kierujemy na dashboard
				router.push(`/portfolios?portfolioId=${targetId}`);
				router.refresh(); // Wymusza odświeżenie komponentów serwerowych jak Header
			} else {
				// Failsafe: jeśli coś poszło nie tak z ID, wracamy do listy
				router.push("/portfolios");
			}
		} else {
			toast.error(result.error || "Something went wrong ❌");
		}
	}
	return (
		<Card className="bg-card border-border2 shadow-sm rounded-xl py-6 mb-8">
			<CardHeader className="px-6 py-0 mb-2">
				<CardTitle className="leading-none font-bold">
					{isEditMode
						? `Edit ${initialData?.name} Portfolio`
						: "Add new Portfolio"}
				</CardTitle>
			</CardHeader>
			<CardContent className="px-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{/* <div className="hidden">{console.log("Form Context ID:", effectivePortfolioId)}</div> */}

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Portfolio Name</FormLabel>
										<FormControl>
											<Input
												placeholder="e.g. Retirement / Aggressive"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="goal"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Financial Goal (PLN)</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="Optional target amount"
												{...field}
												value={field.value?.toString() ?? ""}
												onChange={(e) => field.onChange(e.target.value)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Strategy Description (Optional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Describe your investment thesis..."
											{...field}
											value={field.value?.toString() ?? ""}
											onChange={(e) => field.onChange(e.target.value)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex-end">
							<SubmitButton
								label={`${isEditMode ? "Update Portfolio" : "Create Portfolio"}`}
								isLoading={form.formState.isSubmitting}
							/>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

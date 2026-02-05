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
import { createPortfolio } from "@/lib/actions/portfolio.actions";
import {
	PortfolioFormValues,
	PortfolioSchema,
} from "@/lib/validations/portfolio";
import { useEffect } from "react";

interface PortfolioFormProps {
	initialData?: any;
	portfolioId?: string;
}

export default function PortfolioForm({
	initialData,
	portfolioId: initialPortfolioId, // Zmieniamy nazwę, bo ID może przyjść z propa LUB z cookie
}: PortfolioFormProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// 1. Logika priorytetów: Prop (URL) -> Ciasteczko -> Pusto
	const effectivePortfolioId =
		initialPortfolioId || Cookies.get("selectedPortfolioId");

	const form = useForm({
		resolver: zodResolver(PortfolioSchema),
		defaultValues: {
			name: "",
			description: "",
			goal: "",
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
		const result = await createPortfolio(values);

		if (result.success && result.id) {
			toast.success("Portfolio created successfully! 🚀");
			// Aktualizujemy też ciasteczko na nowe ID przy okazji przekierowania
			Cookies.set("selectedPortfolioId", result.id);
			router.push(`/portfolios?portfolioId=${result.id}`);
		} else {
			toast.error(result.error || "Something went wrong ❌");
		}
	}

	return (
		<Card className="bg-card border-border2 shadow-sm rounded-xl py-6 mb-8">
			<CardHeader className="px-6 py-0 mb-2">
				<CardTitle className="leading-none font-bold">
					Add new Portfolio
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
								label="Create Portfolio"
								isLoading={form.formState.isSubmitting}
							/>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

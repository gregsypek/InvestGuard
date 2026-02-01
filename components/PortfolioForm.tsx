"use client";

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
import { useRouter } from "next/navigation";
import { SubmitButton } from "./ui/SubmitButton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

import { createPortfolio } from "@/lib/actions/portfolio.actions";
import {
	PortfolioFormValues,
	PortfolioSchema,
} from "@/lib/validations/portfolio";
/* Validation schema using the logic we discussed:
  Empty string for goal is transformed to undefined (null in DB)
*/

export default function PortfolioForm() {
	const router = useRouter();

	// Explicitly tell useForm to use PortfolioFormValues
	const form = useForm({
		resolver: zodResolver(PortfolioSchema),
		defaultValues: {
			name: "",
			description: "",
			goal: "", // Start with undefined for the preprocess to work
		},
	});

	async function onSubmit(values: PortfolioFormValues) {
		const result = await createPortfolio(values);
		if (result.success) {
			toast.success("Portfolio created successfully!");
			router.push("/portfolios"); // Go back to the list
		} else {
			toast.error(result.error || "Something went wrong");
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
							<SubmitButton label="Create Portfolio" />
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

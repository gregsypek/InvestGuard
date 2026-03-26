"use client";

import { BoosterSchema, TIME_HORIZONS } from "@/lib/validations/booster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
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

import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/textarea";
import { createBoosterAsset } from "@/lib/actions/booster.actions";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Tworzymy typ na podstawie schematu
type BoosterFormValues = z.infer<typeof BoosterSchema>;
export default function BoosterForm() {
	const form = useForm({
		resolver: zodResolver(BoosterSchema),
		defaultValues: {
			name: "",
			ticker: "", // lub null, zależnie od schematu
			value: 0,
			timeHorizon: "MEDIUM",
			rationale: "",
		},
	});

	const onSubmit = async (data: BoosterFormValues) => {
		const result = await createBoosterAsset(data);
		if (result.success) {
			toast.success("Dodano nową okazję! 🚀");
			form.reset();
		} else {
			toast.error(result.error || "Coś poszło nie tak");
		}
	};

	return (
		<Card className="bg-card border-border2 shadow-sm rounded-xl py-6 mb-8">
			<CardHeader className="px-6 py-0 mb-2">
				<CardTitle className="leading-none font-semibold">
					Dodaj nową okazję (Booster)
				</CardTitle>
			</CardHeader>
			<CardContent className="px-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						{/* Grid dla krótkich pól */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nazwa</FormLabel>
										<FormControl>
											<Input placeholder="np. Meta Platforms" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="ticker"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Ticker (opcjonalnie)</FormLabel>
										<FormControl>
											<Input
												placeholder="np. META"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="value"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Wartość</FormLabel>
										<FormControl>
											<Input
												type="number"
												{...field}
												value={field.value?.toString() ?? ""}
												onChange={(e) => field.onChange(e.target.value)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="timeHorizon"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Horyzont</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Wybierz czas" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{TIME_HORIZONS.map((h) => (
													<SelectItem key={h.value} value={h.value}>
														{h.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Uzasadnienie pod spodem */}
						<FormField
							control={form.control}
							name="rationale"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Uzasadnienie tezy inwestycyjnej</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Dlaczego ta spółka? Jakie widzisz ryzyka?"
											className="min-h-25"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex-end">
							<SubmitButton label="Save Opportunity" />
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

"use client";

import { addAssetAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_ASSETS } from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { SubmitButton } from "../SubmitButton";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddAssetForm() {
	const formRef = useRef<HTMLFormElement>(null);

	const [isPending, setIsPending] = useState(false);

	async function clientAction(formData: FormData) {
		setIsPending(true); // Zaczynamy wysyłkę ⏳
		const result = await addAssetAction(formData);
		setIsPending(false); // Kończymy wysyłkę ✅

		if (result?.success) {
			toast.success(result.message);
			formRef.current?.reset();
		} else {
			toast.error(result.message || "Something went wrong");
		}
	}
	const searchParams = useSearchParams();
	// Pobieramy ID z URL, a jeśli go nie ma - z ciasteczka (podobnie jak w Headerze)
	const portfolioId =
		searchParams.get("portfolioId") || Cookies.get("selectedPortfolioId");
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Add New Investment</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Using the action directly in the form */}
				<form
					ref={formRef}
					action={clientAction}
					className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
				>
					{/* Hidden field that will be sent with the formData */}
					<input type="hidden" name="portfolioId" value={portfolioId || ""} />
					<div className="space-y-2">
						<label className="text-sm font-medium">Name</label>
						<Input
							name="name"
							placeholder="e.g. iShares MSCI EM"
							required
							disabled={isPending}
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Ticker</label>
						<Input name="ticker" placeholder="EIMI.L" disabled={isPending} />
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Value (PLN)</label>
						<Input
							name="value"
							type="number"
							step="0.01"
							placeholder="5000"
							required
							disabled={isPending}
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Category</label>
						<select
							name="category"
							className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							{CATEGORY_ASSETS.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
					</div>

					<SubmitButton label="Save Asset" />
				</form>
			</CardContent>
		</Card>
	);
}

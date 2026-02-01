"use client";

import { addAssetAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_ASSETS } from "@/lib/constants";

export default function AddAssetForm() {
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Add New Investment</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Using the action directly in the form */}
				<form
					action={addAssetAction}
					className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
				>
					<div className="space-y-2">
						<label className="text-sm font-medium">Name</label>
						<Input name="name" placeholder="e.g. iShares MSCI EM" required />
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Ticker</label>
						<Input name="ticker" placeholder="EIMI.L" />
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Value (PLN)</label>
						<Input
							name="value"
							type="number"
							step="0.01"
							placeholder="5000"
							required
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
					<Button
						type="submit"
						className="w-full bg-portfolio-bonds hover:bg-portfolio-gold text-sidebar"
					>
						Save Asset
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

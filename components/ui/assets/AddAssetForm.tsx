"use client";

import { CATEGORY_LABELS, COLORS, inputStyles } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Plus, PlusCircle, Recycle } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useRef, useState } from "react";

import AddButton from "../AddButton";
import BulbTip from "@/components/shared/BulbTip";
import { Button } from "../button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { addAssetAction } from "@/lib/actions/asset-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// 1. Rozbudowujemy interfejs o istniejące aktywa
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
	const formRef = useRef<HTMLFormElement>(null);
	const [isPending, setIsPending] = useState(false);

	// 2. Nowy stan dla wyboru: "Nowe" vs "Istniejące"
	const [selectedExistingAsset, setSelectedExistingAsset] =
		useState<string>("new");

	// 3. Pola formularza uwzględniające datę, ilość i wycenę
	const [executionDate, setExecutionDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [quantity, setQuantity] = useState<number>(0);
	const [totalInvested, setTotalInvested] = useState<number>(0);

	const [selectedCategory, setSelectedCategory] = useState<string>(() =>
		allowedCategories.length === 1 ? allowedCategories[0] : "",
	);

	const hasNoCategories = allowedCategories.length === 0;

	// Automatyczne wypełnianie danych, gdy wybierzemy istniejące aktywo
	const handleExistingAssetChange = (assetId: string) => {
		setSelectedExistingAsset(assetId);
		if (assetId !== "new") {
			const asset = existingAssets.find((a) => a.id === assetId);
			if (asset) setSelectedCategory(asset.category);
		} else {
			setSelectedCategory(
				allowedCategories.length === 1 ? allowedCategories[0] : "",
			);
		}
	};

	async function clientAction(formData: FormData) {
		setIsPending(true);

		// Dodajemy nasze wyliczenia i datę do formularza
		formData.append("investedCapital", totalInvested.toString());
		formData.append("currentValue", totalInvested.toString());
		formData.append("executedAt", executionDate);
		formData.append("purchaseDate", executionDate);
		// Jeśli wybrano istniejące aktywo, wysyłamy jego ID
		if (selectedExistingAsset !== "new") {
			formData.append("existingAssetId", selectedExistingAsset);
			// Opcjonalnie: upewniamy się, że nazwa/ticker lecą z bazy
			const asset = existingAssets.find((a) => a.id === selectedExistingAsset);
			if (asset) {
				formData.set("name", asset.name);
				if (asset.ticker) formData.set("ticker", asset.ticker);
			}
		}

		const result = await addAssetAction(formData);
		setIsPending(false);

		if (result?.success) {
			toast.success("Aktywo zostało dodane! 📈");
			router.push(
				`/dashboard?portfolioId=${result.portfolioId}&newAssetId=${result.newAssetId}`,
			);
		} else {
			toast.error(result?.message || "Wystąpił błąd podczas zapisywania");
		}
	}

	const isAddingNew = selectedExistingAsset === "new";

	return (
		<div>
			<div className="flex justify-between py-6">
				<BulbTip
					title="Kupujesz obligacje skarbowe? Skorzystaj z kreatora obligacji →"
					content="Dzięki kreatorowi obligacji możesz łatwo dodawać swoje obligacje, a my automatycznie uwzględnimy je w analizie portfela i dashboardzie. Kliknij poniżej, aby przejść do kreatora skarbca i dodać swoje obligacje już teraz!"
				/>
				<AddButton className="gap-2 shadow-sm h-9">
					<Link href={"/bonds/new"} className="gap-2 flex items-center">
						<Plus className="h-4 w-4" />
						Dodaj Obligację
					</Link>
				</AddButton>
			</div>

			<Card className="w-full bg-card shadow-lg border-border2 py-8 mt-6">
				<CardHeader className="pb-4">
					<CardTitle className="text-xl font-bold flex items-center gap-2">
						Dodaj aktywo do portfela
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						ref={formRef}
						action={clientAction}
						/* Zmieniamy grid na auto-rows i dodajemy responsywne kolumny */
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-6 gap-x-4 items-end"
					>
						<input type="hidden" name="portfolioId" value={portfolioId} />
						<input type="hidden" name="category" value={selectedCategory} />

						{/* TYP OPERACJI - Dajemy mu trochę więcej miejsca */}
						<div className="flex flex-col gap-1">
							<Label className="text-xs font-semibold uppercase opacity-70">
								Typ operacji
							</Label>
							<Select
								value={selectedExistingAsset}
								onValueChange={handleExistingAssetChange}
								disabled={isPending}
							>
								<SelectTrigger className={cn(inputStyles, "w-full min-w-50")}>
									<SelectValue placeholder="Wybierz..." />
								</SelectTrigger>
								<SelectContent className="mb-0">
									<SelectItem value="new" className="font-bold text-primary">
										<div className="flex items-center gap-2">
											<PlusCircle className="h-4 w-4" />
											<span>Nowe aktywo</span>
										</div>
									</SelectItem>
									{existingAssets.map((asset) => (
										<SelectItem
											key={asset.id}
											value={asset.id}
											className="cursor-pointer hover:bg-alpha-purple"
										>
											<div className="flex items-center gap-2">
												<Coins className="h-4 w-4 text-amber-500" />
												<span>Dokup: {asset.name}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* DATA TRANSAKCJI */}
						<div className="space-y-2">
							<Label className="text-xs font-semibold uppercase opacity-70">
								Data Zakupu
							</Label>
							<Input
								type="date"
								value={executionDate}
								onChange={(e) => setExecutionDate(e.target.value)}
								required
								disabled={isPending}
								className={cn(inputStyles, "w-full")}
							/>
						</div>

						{/* NAZWA I TICKER - Pojawiają się dynamicznie */}
						{isAddingNew && (
							<>
								<div className="space-y-2">
									<Label
										htmlFor="name"
										className="text-xs font-semibold uppercase opacity-70"
									>
										Nazwa
									</Label>
									<Input
										id="name"
										name="name"
										placeholder="np. iShares MSCI EM"
										required
										className={inputStyles}
									/>
								</div>
								<div className="space-y-2">
									<Label
										htmlFor="ticker"
										className="text-xs font-semibold uppercase opacity-70"
									>
										Symbol
									</Label>
									<Input
										id="ticker"
										name="ticker"
										placeholder="EIMI.L"
										className={inputStyles}
									/>
								</div>
							</>
						)}

						{/* ILOŚĆ I WARTOŚĆ */}
						<div className="space-y-2">
							<Label className="text-xs font-semibold uppercase opacity-70">
								Liczba jednostek
							</Label>
							<Input
								type="number"
								step="0.0001"
								name="quantity"
								onChange={(e) => setQuantity(e.target.valueAsNumber || 0)}
								required
								className={inputStyles}
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-xs font-semibold uppercase opacity-70">
								Wartość (PLN)
							</Label>
							<Input
								type="number"
								step="0.01"
								onChange={(e) => setTotalInvested(e.target.valueAsNumber || 0)}
								placeholder="Suma wpłaty"
								required
								className={inputStyles}
							/>
						</div>

						{/* KATEGORIA */}
						<div className="flex flex-col gap-1">
							<Label className="text-[10px] font-bold uppercase opacity-60 ml-1">
								Kategoria
							</Label>
							<Select
								value={selectedCategory}
								onValueChange={setSelectedCategory}
								disabled={isPending || hasNoCategories || !isAddingNew}
								required
							>
								<SelectTrigger className={inputStyles}>
									<SelectValue placeholder="Kategoria" />
								</SelectTrigger>
								<SelectContent>
									{allowedCategories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											<div className="flex items-center gap-2">
												<div
													className="h-2.5 w-2.5 rounded-full border border-border2"
													style={{
														backgroundColor:
															COLORS[cat as keyof typeof COLORS] || "#ccc",
													}}
												/>
												<span className="font-medium text-xs">
													{CATEGORY_LABELS[
														cat as keyof typeof CATEGORY_LABELS
													] || cat}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* PRZYCISK - Na większych ekranach zawsze ląduje na końcu rzędu lub w nowym rzędzie */}
						<div className="md:col-span-2 lg:col-span-1 xl:col-start-4 2xl:col-start-5 flex justify-end">
							<Button
								type="submit"
								disabled={
									hasNoCategories ||
									!selectedCategory ||
									isPending ||
									quantity <= 0
								}
								className="w-full font-semibold bg-blue-500 hover:bg-blue-600 h-10 shadow-md transition-all active:scale-95"
							>
								{isPending ? "Zapisywanie..." : "Zapisz aktywo"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

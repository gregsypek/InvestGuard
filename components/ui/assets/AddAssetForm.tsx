"use client";

import { CATEGORY_LABELS, COLORS, inputStyles } from "@/lib/constants";
import { Coins, Landmark, PlusCircle, Recycle } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";

import AddBondForm from "./AddBondForm"; // EN: Import the bond form component
import BulbTip from "@/components/shared/BulbTip";
import { Button } from "../button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAssetAction } from "@/lib/actions/asset-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
	console.log("🚀 ~ AddAssetForm ~ portfolioId:", portfolioId);
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const [isPending, setIsPending] = useState(false);

	// --- STANY WIDOKU ---
	// EN: Added viewMode to switch between asset types and 'bond' mode
	const [viewMode, setViewMode] = useState<"asset" | "bond">("asset");
	const [isAddingNew, setIsAddingNew] = useState(true);

	// --- STANY FORMULARZA AKTYWÓW ---
	const [selectedAssetId, setSelectedAssetId] = useState<string>("new");
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [ticker, setTicker] = useState("");
	const [name, setName] = useState("");
	const [quantity, setQuantity] = useState<number>(0);
	const [investedCapital, setInvestedCapital] = useState<number>(0);

	const isCash = selectedCategory === "CASH";

	const handleExistingAssetChange = (assetId: string) => {
		setSelectedAssetId(assetId);
		if (assetId === "new") {
			setIsAddingNew(true);
			setTicker("");
			setName("");
			setSelectedCategory("");
		} else {
			const asset = existingAssets.find((a) => a.id === assetId);
			if (asset) {
				setIsAddingNew(false);
				setTicker(asset.ticker || "");
				setName(asset.name);
				setSelectedCategory(asset.category);
			}
		}
	};

	const handleSubmitAsset = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsPending(true);

		const formData = new FormData();
		formData.append("portfolioId", portfolioId);
		formData.append("category", selectedCategory);
		formData.append("ticker", isCash ? "CASH" : ticker);
		formData.append("name", isCash ? "Gotówka" : name);
		formData.append("quantity", quantity.toString());
		formData.append("investedCapital", investedCapital.toString());
		formData.append("currentValue", investedCapital.toString());

		try {
			const result = await addAssetAction(formData);
			if (result.success) {
				toast.success(isCash ? "Zaksięgowano gotówkę" : "Zapisano operację");
				formRef.current?.reset();
				setQuantity(0);
				setInvestedCapital(0);
				if (isAddingNew) {
					setTicker("");
					setName("");
					setSelectedCategory("");
				}
				router.refresh();
			} else {
				toast.error(result.message || "Wystąpił błąd");
			}
		} catch {
			toast.error("Błąd połączenia z serwerem");
		} finally {
			setIsPending(false);
		}
	};
	// --- LOGIKA POMOCNICZA (nad useEffect) ---
	const filteredCategories = allowedCategories.filter((cat) => cat !== "BONDS");

	// Sprawdzamy, czy portfel ma tylko jedną kategorię (Hub)
	const isCashHub =
		allowedCategories.includes("CASH") && filteredCategories.length === 1;
	const isBondHub =
		allowedCategories.includes("BONDS") && filteredCategories.length === 0;

	const defaultCat =
		filteredCategories.length === 1 ? filteredCategories[0] : "";

	useEffect(() => {
		// MASTER RESET: Czyścimy wszystko przy zmianie portfela
		setIsAddingNew(true);
		setSelectedAssetId("new");
		setQuantity(0);
		setInvestedCapital(0);
		setTicker("");
		setName("");

		if (isBondHub) {
			setViewMode("bond");
			setSelectedCategory("BONDS");
		} else if (isCashHub) {
			setViewMode("asset");
			setSelectedCategory("CASH");
			setTicker("CASH");
			setName("Gotówka");
		} else {
			setViewMode("asset");
			setSelectedCategory("");
		}
	}, [portfolioId, isCashHub, isBondHub]); // Reaguje na zmianę ID portfela

	return (
		<div className="space-y-6">
			{/* --- SELEKTOR TRYBÓW (Zintegrowany) --- */}
			<div className="flex bg-muted/50 p-1 rounded-xl w-fit border border-border items-center">
				<button
					type="button"
					onClick={() => {
						setViewMode("asset");
						handleExistingAssetChange("new");
					}}
					className={cn(
						"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
						viewMode === "asset" && isAddingNew
							? "bg-background shadow-sm text-primary"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<PlusCircle size={14} /> Nowe Aktywo / Gotówka
				</button>

				{existingAssets.length > 0 && (
					<button
						type="button"
						onClick={() => {
							setViewMode("asset");
							setIsAddingNew(false);
						}}
						className={cn(
							"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
							viewMode === "asset" && !isAddingNew
								? "bg-background shadow-sm text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<Recycle size={14} /> Dokup istniejące
					</button>
				)}

				{/* EN: Button instead of Link to stay on the same page */}
				<button
					type="button"
					onClick={() => setViewMode("bond")}
					className={cn(
						"flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border-l border-border/50 ml-1",
						viewMode === "bond"
							? "bg-background shadow-sm text-primary"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Landmark className="h-4 w-4" />
					Dodaj Obligację
				</button>
			</div>

			{/* --- RENDEROWANIE ODPOWIEDNIEGO FORMULARZA --- */}
			{viewMode === "bond" ? (
				<div className="animate-in fade-in slide-in-from-top-1 duration-200">
					<AddBondForm portfolioId={portfolioId} />
				</div>
			) : (
				<form
					ref={formRef}
					onSubmit={handleSubmitAsset}
					className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-200"
				>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
						{/* SELEKCJA ISTNIEJĄCEGO */}
						{!isAddingNew && (
							<div className="flex flex-col gap-1">
								<Label className="text-xs font-bold uppercase opacity-60">
									Wybierz z portfela
								</Label>

								<Select
									onValueChange={handleExistingAssetChange}
									// Jeśli selectedAssetId to "new", przesyłamy undefined, co aktywuje placeholder
									value={
										selectedAssetId === "new" ? undefined : selectedAssetId
									}
								>
									<SelectTrigger className={inputStyles}>
										<SelectValue placeholder="Wybierz aktywo" />
									</SelectTrigger>
									<SelectContent>
										{existingAssets.map((asset) => (
											<SelectItem
												key={asset.id}
												value={asset.id}
												className="cursor-pointer"
											>
												<div className="flex items-center gap-2">
													<Coins className="h-4 w-4 text-amber-500" />
													{asset.name} ({asset.ticker?.split("_")[0]})
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						{/* KATEGORIA */}
						<div className="flex flex-col gap-1">
							<Label className="text-xs font-bold uppercase opacity-60">
								Kategoria
							</Label>
							<Select
								onValueChange={(value) => {
									setSelectedCategory(value);
									if (value === "CASH") {
										setTicker("CASH");
										setName("Gotówka");
									}
								}}
								disabled={!isAddingNew}
								value={selectedCategory || defaultCat}
								required
							>
								<SelectTrigger className={inputStyles}>
									<SelectValue placeholder="Wybierz typ" />
								</SelectTrigger>
								<SelectContent>
									{filteredCategories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											<div className="flex items-center gap-2">
												<div
													className="h-2.5 w-2.5 rounded-full"
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

						{/* TICKER & NAZWA & ILOŚĆ & WKŁAD (Twoja istniejąca logika) */}
						<div className="space-y-2">
							<Label className="text-xs font-bold uppercase opacity-60">
								{isCash ? "Identyfikator" : "Ticker"}
							</Label>
							<Input
								value={isCash ? "CASH" : ticker.split("_")[0]}
								onChange={(e) => setTicker(e.target.value.toUpperCase())}
								disabled={isCash || !isAddingNew}
								className={cn(inputStyles, isCash && "bg-muted font-bold")}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-xs font-bold uppercase opacity-60">
								Nazwa
							</Label>
							<Input
								value={isCash ? "Gotówka" : name}
								onChange={(e) => setName(e.target.value)}
								disabled={isCash || !isAddingNew}
								className={inputStyles}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-xs font-bold uppercase opacity-60">
								{isCash ? "Kwota (PLN)" : "Liczba jednostek"}
							</Label>
							<Input
								type="number"
								step="any"
								value={quantity || ""}
								onChange={(e) => {
									const val = Number(e.target.value);
									setQuantity(val);
									if (isCash) setInvestedCapital(val);
								}}
								className={inputStyles}
								required
							/>
						</div>

						{!isCash && (
							<div className="space-y-2">
								<Label className="text-xs font-bold uppercase opacity-60">
									Wkład (PLN)
								</Label>
								<Input
									type="number"
									step="any"
									value={investedCapital || ""}
									onChange={(e) => setInvestedCapital(Number(e.target.value))}
									className={inputStyles}
									required
								/>
							</div>
						)}

						<div className="md:col-span-2 lg:col-span-1 lg:col-start-4 xl:col-start-5 flex justify-end">
							<Button
								type="submit"
								disabled={!selectedCategory || isPending || quantity <= 0}
								className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
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
					</div>
					{isCash && (
						<BulbTip
							title="Gotówka"
							content="System automatycznie przypisuje ticker CASH i przelicznik 1:1."
						/>
					)}
				</form>
			)}
		</div>
	);
}

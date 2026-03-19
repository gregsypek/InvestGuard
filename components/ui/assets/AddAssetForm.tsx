// components/AddAssetForm.tsx
"use client";

import { CATEGORY_LABELS, COLORS, inputStyles } from "@/lib/constants";
import { Coins, Landmark, PlusCircle, Recycle, TrendingUp } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useRef, useState } from "react";

import AddBondForm from "./AddBondForm";
import BulbTip from "@/components/shared/BulbTip";
import { Button } from "../button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
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
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const [isPending, setIsPending] = useState(false);

	const [viewMode, setViewMode] = useState<"asset" | "bond">("asset");
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [isAddingNew, setIsAddingNew] = useState(true);
	const [selectedAssetId, setSelectedAssetId] = useState<string>("new");

	const [name, setName] = useState("");
	const [ticker, setTicker] = useState("");
	const [quantity, setQuantity] = useState<number>(0);
	const [investedCapital, setInvestedCapital] = useState<number>(0);

	const [conviction, setConviction] = useState<number>(50);
	const [rationale, setRationale] = useState<string>("");

	// ✅ FIX: useMemo zapobiega błędom w useEffect ("missing dependency")
	const filteredCategories = useMemo(
		() => allowedCategories.filter((cat) => cat !== "BONDS"),
		[allowedCategories],
	);
	const isCashHub =
		allowedCategories.includes("CASH") && filteredCategories.length === 1;
	const isBondHub =
		allowedCategories.includes("BONDS") && filteredCategories.length === 0;

	const isCash = selectedCategory === "CASH";
	const isBooster = selectedCategory === "BOOSTER";

	useEffect(() => {
		if (isCashHub) {
			setSelectedCategory("CASH");
			setTicker("CASH");
			setName("Gotówka");
		} else if (filteredCategories.length === 1) {
			setSelectedCategory(filteredCategories[0]);
		}

		if (isBondHub) setViewMode("bond");
		else setViewMode("asset");
	}, [isCashHub, isBondHub, portfolioId, filteredCategories]);

	useEffect(() => {
		if (selectedAssetId === "new") {
			setIsAddingNew(true);
			if (isCashHub) {
				setTicker("CASH");
				setName("Gotówka");
				setSelectedCategory("CASH");
			} else {
				setTicker("");
				setName("");
				setSelectedCategory("");
			}
		} else {
			const asset = existingAssets.find((a) => a.id === selectedAssetId);
			if (asset) {
				setIsAddingNew(false);
				setTicker(asset.ticker || "");
				setName(asset.name);
				setSelectedCategory(asset.category);
			}
		}
	}, [selectedAssetId, existingAssets, isCashHub]);

	const handleSubmitAsset = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedCategory) {
			toast.error("Wybierz kategorię");
			return;
		}

		setIsPending(true);
		const formData = new FormData();
		formData.append("portfolioId", portfolioId);
		formData.append("category", selectedCategory);
		formData.append("existingAssetId", selectedAssetId);
		formData.append("name", name);
		formData.append("ticker", ticker);
		formData.append("quantity", quantity.toString());
		formData.append("investedCapital", investedCapital.toString());
		formData.append("currentValue", investedCapital.toString());

		if (isBooster) {
			formData.append("conviction", conviction.toString());
			formData.append("rationale", rationale);
		}

		try {
			const result = await addAssetAction(formData);
			if (result.success) {
				toast.success(result.message);
				formRef.current?.reset();
				setName("");
				setTicker("");
				setQuantity(0);
				setInvestedCapital(0);
				setRationale("");
				setConviction(50);
				setSelectedAssetId("new");
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
			<div className="flex p-1  w-fit  items-center gap-3">
				<button
					type="button"
					onClick={() => {
						setViewMode("asset");
						setSelectedAssetId("new");
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
							setIsAddingNew(false);
							setSelectedAssetId(existingAssets[0].id);
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

			{/* RENDEROWANIE ZAWARTOŚCI ZAKŁADKI */}
			{viewMode === "bond" ? (
				// Formularz Obligacji renderuje się PONIŻEJ zakładek
				<AddBondForm portfolioId={portfolioId} />
			) : (
				// Formularz Aktywów
				<form ref={formRef} onSubmit={handleSubmitAsset}>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end  p-4 ">
						{!isAddingNew && (
							<div className="flex flex-col col-span-2">
								<Label className="text-xs font-bold uppercase opacity-60">
									Wybierz z portfela
								</Label>
								<Select
									value={selectedAssetId}
									onValueChange={setSelectedAssetId}
								>
									<SelectTrigger className={inputStyles}>
										<SelectValue placeholder="Wybierz aktywo" />
									</SelectTrigger>
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
							</div>
						)}

						<div className="flex flex-col gap-1 col-span-2">
							<Label className="text-xs font-bold uppercase opacity-60">
								Kategoria
							</Label>
							<Select
								value={selectedCategory}
								onValueChange={(val) => {
									setSelectedCategory(val);
									if (val === "CASH") {
										setTicker("CASH");
										setName("Gotówka");
									}
								}}
								disabled={!isAddingNew}
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

						{/* TICKER & NAZWA & ILOŚĆ & WKŁAD  */}
						<div className="space-y-2">
							<Label className="text-xs font-bold uppercase opacity-60">
								{isCash ? "Identyfikator" : "Ticker"}
							</Label>
							<Input
								value={isCash ? "CASH" : ticker}
								onChange={(e) => setTicker(e.target.value.toUpperCase())}
								disabled={isCash || !isAddingNew}
								className={cn(inputStyles, isCash && "bg-muted font-bold")}
								required
							/>
						</div>

						<div className="space-y-2 lg:col-span-1">
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

						<div className="space-y-2 lg:col-span-1">
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
							<div className="space-y-2 lg:col-span-1">
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

						{isBooster && (
							<div className="md:col-span-2 lg:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 mt-2 bg-blue-500/5 rounded-2xl border border-blue-500/20 animate-in fade-in slide-in-from-top-2">
								<div className="md:col-span-2 flex items-center gap-2 mb-2">
									<TrendingUp className="h-4 w-4 text-blue-500" />
									<h3 className="text-sm font-bold uppercase tracking-tight text-blue-500">
										Parametry Strategiczne Alpha
									</h3>
								</div>

								<div className="space-y-4">
									<div className="flex justify-between items-center">
										<Label className="text-xs font-bold uppercase opacity-70">
											Przekonanie: {conviction}%
										</Label>
									</div>
									<Slider
										value={[conviction]}
										max={100}
										min={1}
										step={1}
										onValueChange={(vals) => setConviction(vals[0])}
										className="py-4"
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-xs font-bold uppercase opacity-70">
										Teza Inwestycyjna
									</Label>
									<Textarea
										placeholder="Dlaczego dodajesz tę spółkę do segmentu Alpha?"
										value={rationale}
										onChange={(e) => setRationale(e.target.value)}
										className="resize-none h-20 bg-background/50"
									/>
								</div>
							</div>
						)}

						<div className="md:col-span-2 lg:col-span-1 lg:col-start-4 xl:col-start-5 flex justify-end mt-4">
							<Button
								type="submit"
								disabled={!selectedCategory || isPending || quantity <= 0}
								className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-10"
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

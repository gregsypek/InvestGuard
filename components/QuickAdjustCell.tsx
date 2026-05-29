"use client";

import { CheckCheck, Loader2, X } from "lucide-react";

import { ActionResponse } from "@/lib/types";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

const QuickAdjustCell = ({
	currentValue,
	assetId,
	isDemo,
	onUpdate,
	label = "Koryguj wycenę",
}: {
	currentValue: number;
	assetId: string;
	isDemo?: boolean;
	onUpdate: (id: string, newValue: number) => Promise<ActionResponse>;
	label?: string;
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [isPending, setIsPending] = useState(false); // 🆕 Stan ładowania
	const [inputValue, setInputValue] = useState("");

	const newValue = parseFloat(inputValue);
	const isInvalid = isNaN(newValue) || newValue < 0;

	if (!isEditing) {
		return (
			<Button
				variant="outline"
				className="text-[10px] h-7 px-2 font-mono hover:bg-primary/10 border-dashed border-white/30"
				onClick={() => {
					setIsEditing(true);
					setInputValue(currentValue.toString());
				}}
			>
				{label}
			</Button>
		);
	}

	const handleSave = async () => {
		if (isDemo) {
			toast.info("Tryb Edukacyjny", {
				description:
					"W wersji demo korygowanie wyceny jest zablokowane. W prawdziwym portfelu ta funkcja pozwala ręcznie nadpisać wartość aktywa",
			});
			setIsEditing(false); // Zamykamy tryb edycji
			return;
		}
		setIsPending(true);
		try {
			const result = await onUpdate(assetId, newValue);

			if (result.success) {
				toast.success("Oprocentowanie zaktualizowane!");
				setIsEditing(false);
			} else {
				toast.error(result.error || "Błąd aktualizacji");
			}
		} catch {
			toast.error("Wystąpił nieoczekiwany błąd sieci.");
		} finally {
			setIsPending(false);
		}
	};

	return (
		<div className="flex flex-col gap-1 items-center">
			<div className="flex items-center gap-1">
				<input
					autoFocus
					type="number"
					step="0.01" // 🆕 To pozwala wpisać ułamek w trybie edycji!
					disabled={isPending}
					className={cn(
						"w-20 bg-background border rounded px-1.5 py-1 text-xs font-mono focus:outline-none",
						isInvalid ? "border-destructive" : "border-primary",
					)}
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !isInvalid) handleSave();
						if (e.key === "Escape") setIsEditing(false);
					}}
				/>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-green-600"
					disabled={isInvalid || isPending}
					onClick={handleSave}
				>
					{isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<CheckCheck className="h-4 w-4" />
					)}
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-muted-foreground"
					disabled={isPending}
					onClick={() => setIsEditing(false)}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};

export default QuickAdjustCell;
